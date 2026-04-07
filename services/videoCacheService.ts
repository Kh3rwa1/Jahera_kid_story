/**
 * Video Cache Service
 * 
 * Downloads the brand video from Appwrite on first app launch and caches it
 * locally in the device's file system. All subsequent uses read from the
 * local cache — zero network latency, instant playback.
 *
 * Usage:
 *   await videoCacheService.prefetch();          // Call once at app startup
 *   const uri = videoCacheService.getCachedUri(); // Get the local file URI
 */
import {
  cacheDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  downloadAsync,
  deleteAsync,
  moveAsync,
} from 'expo-file-system/legacy';
import { storage, STORAGE_BUCKETS, Query } from '@/lib/appwrite';

const CACHE_DIR = `${cacheDirectory}video/`;
const CACHED_VIDEO_PATH = `${CACHE_DIR}brand_video.mp4`;

class VideoCacheService {
  private _cachedUri: string | null = null;
  private _prefetchPromise: Promise<void> | null = null;
  private _isReady = false;

  /** Returns the cached local URI if available, or null. */
  getCachedUri(): string | null {
    return this._cachedUri;
  }

  /** Whether the video has been cached and is ready for playback. */
  get isReady(): boolean {
    return this._isReady;
  }

  /**
   * Prefetch the brand video from Appwrite and cache it locally.
   * Safe to call multiple times — deduplicates concurrent calls.
   * 
   * Strategy:
   * 1. Check if a local cached copy already exists → use it immediately
   * 2. Resolve the bundled fallback asset → use it as interim
   * 3. Download from Appwrite in the background → update local cache
   */
  async prefetch(): Promise<void> {
    if (this._prefetchPromise) return this._prefetchPromise;
    this._prefetchPromise = this._doPrefetch();
    return this._prefetchPromise;
  }

  private async _doPrefetch(): Promise<void> {
    try {
      // Ensure cache directory exists
      const dirInfo = await getInfoAsync(CACHE_DIR);
      if (!dirInfo.exists) {
        await makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      }

      // 1. Check if we already have a cached copy
      const fileInfo = await getInfoAsync(CACHED_VIDEO_PATH);
      if (fileInfo.exists && (fileInfo as any).size > 10000) {
        this._cachedUri = CACHED_VIDEO_PATH;
        this._isReady = true;
        console.log('[VideoCache] Using existing cached video');
        // Still try to refresh from Appwrite in background
        this._backgroundRefresh().catch(() => {});
        return;
      }

      // 2. Resolve bundled fallback asset for instant availability
      try {
        const { Asset } = require('expo-asset');
        const [asset] = await Asset.loadAsync(require('@/assets/jahera.mp4'));
        if (asset?.localUri) {
          this._cachedUri = asset.localUri;
          this._isReady = true;
          console.log('[VideoCache] Using bundled asset while downloading');
        }
      } catch (e) {
        console.log('[VideoCache] Bundled asset fallback failed:', e);
      }

      // 3. Download from Appwrite
      await this._downloadFromAppwrite();

    } catch (err) {
      console.log('[VideoCache] Prefetch error:', err);
      if (this._cachedUri) this._isReady = true;
    }
  }

  private async _downloadFromAppwrite(): Promise<void> {
    try {
      const res = await storage.listFiles(STORAGE_BUCKETS.APP_ASSETS, [Query.limit(10)]);
      const videoFile = res.files.find((f: any) => (f.mimeType ?? '').startsWith('video/'));
      
      if (!videoFile) {
        console.log('[VideoCache] No video file found in Appwrite');
        return;
      }

      const url = storage.getFileView(STORAGE_BUCKETS.APP_ASSETS, videoFile.$id).toString();
      console.log('[VideoCache] Downloading video from Appwrite...');

      const result = await downloadAsync(url, CACHED_VIDEO_PATH);
      
      if (result.status === 200) {
        this._cachedUri = CACHED_VIDEO_PATH;
        this._isReady = true;
        console.log('[VideoCache] ✅ Video cached successfully');
      } else {
        console.log('[VideoCache] Download failed with status:', result.status);
      }
    } catch (err) {
      console.log('[VideoCache] Appwrite download error:', err);
    }
  }

  /**
   * Background refresh — silently re-download if the remote file has changed.
   */
  private async _backgroundRefresh(): Promise<void> {
    try {
      const res = await storage.listFiles(STORAGE_BUCKETS.APP_ASSETS, [Query.limit(10)]);
      const videoFile = res.files.find((f: any) => (f.mimeType ?? '').startsWith('video/'));
      if (!videoFile) return;

      const localInfo = await getInfoAsync(CACHED_VIDEO_PATH);
      if (localInfo.exists && (localInfo as any).size === videoFile.sizeOriginal) {
        return; // Same size → same file, skip
      }

      const url = storage.getFileView(STORAGE_BUCKETS.APP_ASSETS, videoFile.$id).toString();
      const tempPath = `${CACHE_DIR}brand_video_temp.mp4`;
      
      const result = await downloadAsync(url, tempPath);
      if (result.status === 200) {
        try { await deleteAsync(CACHED_VIDEO_PATH, { idempotent: true }); } catch {}
        await moveAsync({ from: tempPath, to: CACHED_VIDEO_PATH });
        this._cachedUri = CACHED_VIDEO_PATH;
        console.log('[VideoCache] ✅ Background refresh complete');
      }
    } catch (err) {
      console.log('[VideoCache] Background refresh failed:', err);
    }
  }

  /** Clear the cached video. */
  async clearCache(): Promise<void> {
    try {
      await deleteAsync(CACHE_DIR, { idempotent: true });
      this._cachedUri = null;
      this._isReady = false;
    } catch {}
  }
}

export const videoCacheService = new VideoCacheService();
