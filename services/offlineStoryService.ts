import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Story, StoryWithQuiz } from '@/types/database';
import { logger } from '@/utils/logger';

const FileSystem =
  Platform.OS !== 'web' ? require('expo-file-system/legacy') : null;

// ─── Constants ───────────────────────────────────────────────
const OFFLINE_STORIES_KEY = 'offline_stories_index';
const SYNC_QUEUE_KEY = 'offline_sync_queue';
const AUDIO_CACHE_DIR =
  Platform.OS !== 'web' && FileSystem
    ? `${FileSystem.cacheDirectory || ''}offline_audio/`
    : '';

// ─── Types ───────────────────────────────────────────────────
export interface OfflineStory {
  story: Story;
  quizQuestions: StoryWithQuiz['quiz_questions'] | null;
  audioLocalUri: string | null;
  downloadedAt: number;
  fileSize: number;
}

interface SyncQueueItem {
  type: 'quiz_answer' | 'story_progress' | 'like';
  payload: Record<string, unknown>;
  createdAt: number;
  retries: number;
}

type ConnectionListener = (isConnected: boolean) => void;

// ─── Service ─────────────────────────────────────────────────
class OfflineStoryService {
  private _isOnline = true;
  private _listeners: ConnectionListener[] = [];
  private _unsubscribeNetInfo: (() => void) | null = null;
  /** Tracks story IDs currently being saved to prevent concurrent duplicate writes */
  private _savingIds = new Set<string>();

  // ── Network monitoring ──────────────────────────────────────

  get isOnline(): boolean {
    return this._isOnline;
  }

  startMonitoring(): void {
    this._unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      const wasOnline = this._isOnline;
      this._isOnline = !!(
        state.isConnected && state.isInternetReachable !== false
      );

      if (!wasOnline && this._isOnline) {
        logger.info('[Offline] Back online — flushing sync queue');
        this.flushSyncQueue().catch(() => {});
      }

      this._listeners.forEach((fn) => fn(this._isOnline));
    });
  }

  stopMonitoring(): void {
    this._unsubscribeNetInfo?.();
    this._unsubscribeNetInfo = null;
  }

  onConnectionChange(fn: ConnectionListener): () => void {
    this._listeners.push(fn);
    return () => {
      this._listeners = this._listeners.filter((l) => l !== fn);
    };
  }

  // ── Audio file caching ──────────────────────────────────────

  private async ensureAudioDir(): Promise<void> {
    if (Platform.OS === 'web' || !FileSystem) return;
    const dirInfo = await FileSystem.getInfoAsync(AUDIO_CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(AUDIO_CACHE_DIR, {
        intermediates: true,
      });
    }
  }

  private audioFilePath(storyId: string): string {
    return `${AUDIO_CACHE_DIR}${storyId}.mp3`;
  }

  private async downloadAudioFile(
    audioUrl: string,
    storyId: string,
  ): Promise<{ uri: string; size: number } | null> {
    if (Platform.OS === 'web' || !FileSystem) return null;

    try {
      await this.ensureAudioDir();
      const destPath = this.audioFilePath(storyId);

      // Check if already cached
      const existing = await FileSystem.getInfoAsync(destPath);
      if (existing.exists && (existing as any).size > 1000) {
        return { uri: destPath, size: (existing as any).size || 0 };
      }

      const result = await FileSystem.downloadAsync(audioUrl, destPath, {
        sessionType: 1, // background download
      });

      if (result.status === 200) {
        const info = await FileSystem.getInfoAsync(destPath);
        return { uri: destPath, size: (info as any).size || 0 };
      }

      return null;
    } catch (err) {
      logger.warn('[Offline] Audio download failed:', (err as Error)?.message);
      return null;
    }
  }

  // ── Save story for offline ──────────────────────────────────

  async saveStoryOffline(
    story: Story,
    quizQuestions?: StoryWithQuiz['quiz_questions'] | null,
  ): Promise<boolean> {
    // Prevent concurrent saves for the same story
    if (this._savingIds.has(story.id)) return true;
    this._savingIds.add(story.id);

    try {
      const index = await this.getIndex();

      // Skip if story is already cached with the same audio URL
      const existing = index[story.id];
      if (existing && existing.story.audio_url === story.audio_url) {
        return true;
      }

      // Download audio if available
      let audioLocalUri: string | null = null;
      let fileSize = 0;

      if (story.audio_url && !story.audio_url.startsWith('device-tts://')) {
        const result = await this.downloadAudioFile(story.audio_url, story.id);
        if (result) {
          audioLocalUri = result.uri;
          fileSize = result.size;
        }
      }

      const offlineStory: OfflineStory = {
        story,
        quizQuestions: quizQuestions ?? null,
        audioLocalUri,
        downloadedAt: Date.now(),
        fileSize,
      };

      index[story.id] = offlineStory;
      await this.saveIndex(index);

      logger.info(
        `[Offline] Saved story "${story.title}" (${(fileSize / 1024 / 1024).toFixed(1)}MB audio)`,
      );
      return true;
    } catch (err) {
      logger.error('[Offline] Failed to save story:', err);
      return false;
    } finally {
      this._savingIds.delete(story.id);
    }
  }

  // ── Auto-save after generation ──────────────────────────────

  async autoSaveIfOnline(
    story: Story,
    quizQuestions?: StoryWithQuiz['quiz_questions'] | null,
  ): Promise<void> {
    if (!this._isOnline) return;
    try {
      await this.saveStoryOffline(story, quizQuestions);
    } catch {
      // Silent fail — auto-save is best-effort
    }
  }

  // ── Retrieve offline stories ────────────────────────────────

  async getOfflineStory(storyId: string): Promise<OfflineStory | null> {
    const index = await this.getIndex();
    const entry = index[storyId];
    if (!entry) return null;

    // Verify audio file still exists on disk
    if (entry.audioLocalUri && FileSystem) {
      try {
        const info = await FileSystem.getInfoAsync(entry.audioLocalUri);
        if (!info.exists) {
          entry.audioLocalUri = null;
        }
      } catch {
        entry.audioLocalUri = null;
      }
    }

    return entry;
  }

  async getAllOfflineStories(): Promise<OfflineStory[]> {
    const index = await this.getIndex();
    return Object.values(index).sort((a, b) => b.downloadedAt - a.downloadedAt);
  }

  async getOfflineStoryCount(): Promise<number> {
    const index = await this.getIndex();
    return Object.keys(index).length;
  }

  async getTotalCacheSize(): Promise<number> {
    const index = await this.getIndex();
    return Object.values(index).reduce((sum, s) => sum + s.fileSize, 0);
  }

  async isStoryAvailableOffline(storyId: string): Promise<boolean> {
    const index = await this.getIndex();
    return storyId in index;
  }

  // ── Remove offline stories ──────────────────────────────────

  async removeOfflineStory(storyId: string): Promise<void> {
    const index = await this.getIndex();
    const entry = index[storyId];

    if (entry?.audioLocalUri && FileSystem) {
      try {
        await FileSystem.deleteAsync(entry.audioLocalUri, { idempotent: true });
      } catch {}
    }

    delete index[storyId];
    await this.saveIndex(index);
    logger.info(`[Offline] Removed story ${storyId}`);
  }

  async clearAllOfflineStories(): Promise<void> {
    if (FileSystem) {
      try {
        await FileSystem.deleteAsync(AUDIO_CACHE_DIR, { idempotent: true });
      } catch {}
    }
    await AsyncStorage.removeItem(OFFLINE_STORIES_KEY);
    logger.info('[Offline] Cleared all offline stories');
  }

  // ── Sync queue (queue actions while offline) ────────────────

  async addToSyncQueue(
    item: Omit<SyncQueueItem, 'createdAt' | 'retries'>,
  ): Promise<void> {
    const queue = await this.getSyncQueue();
    queue.push({ ...item, createdAt: Date.now(), retries: 0 });
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  }

  async flushSyncQueue(): Promise<void> {
    if (!this._isOnline) return;

    const queue = await this.getSyncQueue();
    if (queue.length === 0) return;

    logger.info(`[Offline] Flushing ${queue.length} queued actions`);
    const failed: SyncQueueItem[] = [];

    for (const item of queue) {
      try {
        await this.processSyncItem(item);
      } catch (err) {
        if (item.retries < 3) {
          failed.push({ ...item, retries: item.retries + 1 });
        } else {
          logger.warn(
            '[Offline] Dropping sync item after 3 retries:',
            item.type,
          );
        }
      }
    }

    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(failed));
  }

  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    // Import dynamically to avoid circular deps
    const { quizService, storyService } = require('@/services/database');

    switch (item.type) {
      case 'quiz_answer':
        await quizService.submitAnswer(
          item.payload.questionId as string,
          item.payload.answerId as string,
          item.payload.attemptId as string,
        );
        break;
      case 'story_progress':
        // Future: track story completion progress
        break;
      case 'like':
        await storyService.toggleLike(item.payload.storyId as string);
        break;
    }
  }

  private async getSyncQueue(): Promise<SyncQueueItem[]> {
    try {
      const raw = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  // ── Index persistence ───────────────────────────────────────

  private async getIndex(): Promise<Record<string, OfflineStory>> {
    try {
      const raw = await AsyncStorage.getItem(OFFLINE_STORIES_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private async saveIndex(index: Record<string, OfflineStory>): Promise<void> {
    await AsyncStorage.setItem(OFFLINE_STORIES_KEY, JSON.stringify(index));
  }
}

export const offlineStoryService = new OfflineStoryService();
