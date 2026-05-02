import { Platform } from 'react-native';
import * as ExpoFileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';
import { logger } from '@/utils/logger';
import type { AnimationObject } from 'lottie-react-native';

const LOTTIE_CACHE_DIR =
  Platform.OS !== 'web' ? ExpoFileSystem.cacheDirectory + 'lottie_assets/' : '';
const IS_EXPO_GO = Constants.appOwnership === 'expo';

export type LottieJson = AnimationObject;

const memoryCache = new Map<string, LottieJson>();
const pendingCache = new Map<string, Promise<LottieJson | null>>();

const failedCache = new Map<string, number>();
const FAIL_COOLDOWN_MS = 5 * 60 * 1000;

export function getAppwriteLottieUrl(behaviorId: string): string {
  const endpoint =
    process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const project = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '';
  const bucketId = 'behavior_assets';

  return (
    endpoint +
    '/storage/buckets/' +
    bucketId +
    '/files/' +
    behaviorId +
    '/view?project=' +
    encodeURIComponent(project)
  );
}

function markFailed(behaviorId: string): void {
  failedCache.set(behaviorId, Date.now());
}

function isFailCooldownActive(behaviorId: string): boolean {
  const failedAt = failedCache.get(behaviorId);
  if (!failedAt) return false;

  if (Date.now() - failedAt > FAIL_COOLDOWN_MS) {
    failedCache.delete(behaviorId);
    return false;
  }

  return true;
}

async function fetchJsonFallback(
  sourceUrl: string,
  behaviorId: string,
): Promise<LottieJson | null> {
  try {
    const response = await fetch(sourceUrl);

    if (response.status !== 200) {
      logger.warn(
        '[LottieService] HTTP ' + response.status + ' for ' + behaviorId,
      );
      markFailed(behaviorId);
      return null;
    }

    const text = await response.text();
    const trimmed = text.trim();

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      const parsed = JSON.parse(text);
      memoryCache.set(behaviorId, parsed);
      failedCache.delete(behaviorId);
      return parsed;
    }

    logger.warn('[LottieService] Non-JSON response for ' + behaviorId);
    markFailed(behaviorId);
    return null;
  } catch (err: unknown) {
    logger.warn(
      '[LottieService] Fetch failed for ' +
        behaviorId +
        ': ' +
        (err instanceof Error ? err.message : String(err)),
    );
    markFailed(behaviorId);
    return null;
  }
}

async function resolveLottieAsset(
  sourceUrl: string,
  behaviorId: string,
  forceRefresh: boolean,
): Promise<LottieJson | null> {
  if (Platform.OS === 'web' || IS_EXPO_GO) {
    return await fetchJsonFallback(sourceUrl, behaviorId);
  }

  try {
    const dirInfo = await ExpoFileSystem.getInfoAsync(LOTTIE_CACHE_DIR);
    if (!dirInfo.exists) {
      await ExpoFileSystem.makeDirectoryAsync(LOTTIE_CACHE_DIR, {
        intermediates: true,
      });
    }

    const localUri = LOTTIE_CACHE_DIR + behaviorId + '.json';
    const fileInfo = await ExpoFileSystem.getInfoAsync(localUri);

    if (fileInfo.exists && !forceRefresh) {
      try {
        const content = await ExpoFileSystem.readAsStringAsync(localUri);
        const parsed = JSON.parse(content);
        memoryCache.set(behaviorId, parsed);
        failedCache.delete(behaviorId);
        return parsed;
      } catch {
        logger.warn(
          '[LottieService] Corrupt cache for ' +
            behaviorId +
            ', re-downloading',
        );
        await ExpoFileSystem.deleteAsync(localUri, { idempotent: true }).catch(
          () => {},
        );
      }
    }

    logger.debug('[LottieService] Downloading ' + behaviorId);
    const result = await ExpoFileSystem.downloadAsync(sourceUrl, localUri);

    if (result.status !== 200) {
      throw new Error('Download status ' + result.status);
    }

    const content = await ExpoFileSystem.readAsStringAsync(result.uri);
    const parsed = JSON.parse(content);
    memoryCache.set(behaviorId, parsed);
    failedCache.delete(behaviorId);
    return parsed;
  } catch (fsError: unknown) {
    logger.warn(
      '[LottieService] FS error ' +
        behaviorId +
        ': ' +
        (fsError instanceof Error ? fsError.message : String(fsError)),
    );
    return await fetchJsonFallback(sourceUrl, behaviorId);
  }
}

export async function ensureLottieAsset(
  sourceUrl: string,
  behaviorId: string,
  forceRefresh = false,
): Promise<LottieJson | null> {
  try {
    const cached = memoryCache.get(behaviorId);
    if (cached && !forceRefresh) {
      return cached;
    }

    if (!forceRefresh && isFailCooldownActive(behaviorId)) {
      return null;
    }

    const pending = pendingCache.get(behaviorId);
    if (pending && !forceRefresh) {
      return await pending;
    }

    const request = resolveLottieAsset(sourceUrl, behaviorId, forceRefresh);
    pendingCache.set(behaviorId, request);

    try {
      return await request;
    } finally {
      pendingCache.delete(behaviorId);
    }
  } catch (error: unknown) {
    logger.error(
      '[LottieService] Fatal error ' +
        behaviorId +
        ': ' +
        (error instanceof Error ? error.message : String(error)),
    );
    markFailed(behaviorId);

    if (Platform.OS !== 'web') {
      try {
        const localUri = LOTTIE_CACHE_DIR + behaviorId + '.json';
        const fileInfo = await ExpoFileSystem.getInfoAsync(localUri);

        if (fileInfo.exists) {
          const content = await ExpoFileSystem.readAsStringAsync(localUri);
          const parsed = JSON.parse(content);
          memoryCache.set(behaviorId, parsed);
          return parsed;
        }
      } catch {}
    }

    return null;
  }
}

export async function clearLottieCache(): Promise<void> {
  try {
    await ExpoFileSystem.deleteAsync(LOTTIE_CACHE_DIR, { idempotent: true });
    memoryCache.clear();
    pendingCache.clear();
    failedCache.clear();
    logger.info('[LottieService] Cache cleared');
  } catch (error) {
    logger.error('[LottieService] Clear cache error:', error);
  }
}
