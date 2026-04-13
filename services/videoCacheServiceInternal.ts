import { Platform } from 'react-native';
import { Query, storage, STORAGE_BUCKETS } from '@/lib/appwrite';
import { logger } from '@/utils/logger';

// Dynamic require to bypass type-system mismatch in this environment
// while still using the modern FileSystem API for stability.
const FileSystem = Platform.OS !== 'web' ? require('expo-file-system/legacy') : null;
const { Asset } = require('expo-asset');

// Normalize cache property across Expo versions
const getCacheDir = () => {
  if (Platform.OS === 'web' || !FileSystem) return '';
  const base = FileSystem.cacheDirectory || FileSystem.CacheDirectory || '';
  return base.endsWith('/') ? base : `${base}/`;
};

const CACHE_DIR = Platform.OS !== 'web' ? `${getCacheDir()}video/` : '';
const CACHED_VIDEO_PATH = Platform.OS !== 'web' ? `${CACHE_DIR}brand_video.mp4` : '';

class VideoCacheService {
  private _cachedUri: string | null = null;
  private _prefetchPromise: Promise<void> | null = null;
  private _isReady = false;

  getCachedUri(): string | null {
    return this._cachedUri;
  }

  get isReady(): boolean {
    return this._isReady;
  }

  async prefetch(): Promise<void> {
    if (Platform.OS === 'web') return; // Skip prefetch on web
    if (this._prefetchPromise) return this._prefetchPromise;
    this._prefetchPromise = this._doPrefetch();
    return this._prefetchPromise;
  }

  private async _doPrefetch(): Promise<void> {
    try {
      if (Platform.OS === 'web' || !FileSystem) return;

      if (!FileSystem.cacheDirectory && !FileSystem.CacheDirectory) {
        logger.warn('[VideoCache] FileSystem not initialized properly');
        return;
      }

      const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      }

      const fileInfo = await FileSystem.getInfoAsync(CACHED_VIDEO_PATH);
      if (fileInfo.exists && (fileInfo as any).size > 10000) {
        this._cachedUri = CACHED_VIDEO_PATH;
        this._isReady = true;
        logger.info('[VideoCache] Using existing cached video');
        this._backgroundRefresh().catch(() => {});
        return;
      }

      try {
        const [asset] = await Asset.loadAsync(require('@/assets/jahera.mp4'));
        if (asset?.localUri) {
          this._cachedUri = asset.localUri;
          this._isReady = true;
          logger.info('[VideoCache] Using bundled asset while downloading');
        }
      } catch (e) {
        logger.warn('[VideoCache] Bundled asset fallback failed');
      }

      await this._downloadFromAppwrite();

    } catch (err) {
      logger.error('[VideoCache] Prefetch error:', err);
      if (this._cachedUri) this._isReady = true;
    }
  }

  private async _downloadFromAppwrite(): Promise<void> {
    try {
      const res = await storage.listFiles(STORAGE_BUCKETS.APP_ASSETS, [Query.limit(10)]);
      const videoFile = res.files.find((f: any) => (f.mimeType ?? '').startsWith('video/'));
      
      if (!videoFile) return;

      const url = storage.getFileView(STORAGE_BUCKETS.APP_ASSETS, videoFile.$id).toString();
      logger.info('[VideoCache] Downloading video from Appwrite...');

      // sessionType: 1 corresponds to BACKGROUND in most versions
      const result = await FileSystem.downloadAsync(url, CACHED_VIDEO_PATH, {
        sessionType: 1 
      });
      
      if (result.status === 200) {
        this._cachedUri = CACHED_VIDEO_PATH;
        this._isReady = true;
        logger.info('[VideoCache] ✅ Video cached successfully');
      }
    } catch (err) {
      // Expected failure in Expo Go due to sandbox limitations with Appwrite storage
      logger.warn('[VideoCache] Appwrite download skipped (expected in Expo Go):', (err as Error)?.message || err);
    }
  }

  private async _backgroundRefresh(): Promise<void> {
    try {
      const res = await storage.listFiles(STORAGE_BUCKETS.APP_ASSETS, [Query.limit(10)]);
      const videoFile = res.files.find((f: any) => (f.mimeType ?? '').startsWith('video/'));
      if (!videoFile) return;

      const url = storage.getFileView(STORAGE_BUCKETS.APP_ASSETS, videoFile.$id).toString();
      const tempPath = `${CACHE_DIR}brand_video_refresh.mp4`;
      
      const localInfo = await FileSystem.getInfoAsync(CACHED_VIDEO_PATH);
      if (localInfo.exists && (localInfo as any).size === videoFile.sizeOriginal) {
        return;
      }

      const result = await FileSystem.downloadAsync(url, tempPath, { sessionType: 1 });
      if (result.status === 200) {
        try { await FileSystem.deleteAsync(CACHED_VIDEO_PATH, { idempotent: true }); } catch {}
        await FileSystem.moveAsync({ from: tempPath, to: CACHED_VIDEO_PATH });
        this._cachedUri = CACHED_VIDEO_PATH;
        logger.info('[VideoCache] ✅ Background refresh complete');
      }
    } catch (err) {
      logger.warn('[VideoCache] Background refresh failed');
    }
  }

  async clearCache(): Promise<void> {
    try {
      await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
      this._cachedUri = null;
      this._isReady = false;
    } catch {}
  }
}

export const videoCacheService = new VideoCacheService();
