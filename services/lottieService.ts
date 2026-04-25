import { Platform } from 'react-native';
import * as ExpoFileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';
import { logger } from '@/utils/logger';

const LOTTIE_CACHE_DIR =
  Platform.OS !== 'web' ? ExpoFileSystem.cacheDirectory + 'lottie_assets/' : '';
const IS_EXPO_GO = Constants.appOwnership === 'expo';

const memoryCache = new Map<string, any>();

/** Tracks URLs that recently failed so we don't retry them every render */
const failedCache = new Map<string, number>();
const FAIL_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

export function getAppwriteLottieUrl(behaviorId: string): string {
  const endpoint =
    process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const project = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
  const bucketId = 'behavior_assets';
  const cacheBuster = '&t=' + new Date().getTime();
  return (
    endpoint +
    '/storage/buckets/' +
    bucketId +
    '/files/' +
    behaviorId +
    '/view?project=' +
    project +
    cacheBuster
  );
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
): Promise<any | null> {
  try {
    const response = await fetch(sourceUrl);
    if (response.status !== 200) {
      logger.warn(
        '[LottieService] HTTP ' + response.status + ' for ' + behaviorId,
      );
      failedCache.set(behaviorId, Date.now());
      return null;
    }
    const text = await response.text();
    if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
      const parsed = JSON.parse(text);
      memoryCache.set(behaviorId, parsed);
      return parsed;
    }
    logger.warn('[LottieService] Non-JSON response for ' + behaviorId);
    failedCache.set(behaviorId, Date.now());
    return null;
  } catch (err: any) {
    logger.warn(
      '[LottieService] Fetch failed for ' +
        behaviorId +
        ': ' +
        (err?.message || err),
    );
    failedCache.set(behaviorId, Date.now());
    return null;
  }
}

export async function ensureLottieAsset(
  sourceUrl: string,
  behaviorId: string,
  forceRefresh = false,
): Promise<any | null> {
  try {
    const cached = memoryCache.get(behaviorId);
    if (cached && !forceRefresh) {
      return cached;
    }

    // Skip if this URL recently failed (prevents retry storms)
    if (isFailCooldownActive(behaviorId)) {
      return null;
    }

    if (Platform.OS === 'web') {
      return await fetchJsonFallback(sourceUrl, behaviorId);
    }

    if (IS_EXPO_GO) {
      return await fetchJsonFallback(sourceUrl, behaviorId);
    }

    try {
      const dirInfo = await ExpoFileSystem.getInfoAsync(LOTTIE_CACHE_DIR);
      if (!dirInfo.exists) {
        await ExpoFileSystem.makeDirectoryAsync(LOTTIE_CACHE_DIR, {
          intermediates: true,
        });
      }
      const filename = behaviorId + '.json';
      const localUri = LOTTIE_CACHE_DIR + filename;
      const fileInfo = await ExpoFileSystem.getInfoAsync(localUri);

      if (fileInfo.exists && !forceRefresh) {
        // Read cached file and return parsed JSON (not file URI).
        // LottieView on Android release builds does NOT reliably
        // resolve { uri: filePath } sources, but always works
        // with a parsed JSON object.
        try {
          const content = await ExpoFileSystem.readAsStringAsync(localUri);
          const parsed = JSON.parse(content);
          memoryCache.set(behaviorId, parsed);
          return parsed;
        } catch (parseErr) {
          // Cached file is corrupt — delete and re-download
          logger.warn('[LottieService] Corrupt cache for ' + behaviorId + ', re-downloading');
          await ExpoFileSystem.deleteAsync(localUri, { idempotent: true }).catch(() => {});
        }
      }

      logger.debug('[LottieService] Downloading ' + behaviorId);
      const result = await ExpoFileSystem.downloadAsync(sourceUrl, localUri);
      if (result.status !== 200) {
        throw new Error('Download status ' + result.status);
      }
      // Read the downloaded file and return parsed JSON
      const content = await ExpoFileSystem.readAsStringAsync(result.uri);
      const parsed = JSON.parse(content);
      memoryCache.set(behaviorId, parsed);
      return parsed;
    } catch (fsError: any) {
      logger.warn(
        '[LottieService] FS error ' +
          behaviorId +
          ': ' +
          (fsError?.message || fsError),
      );
      return await fetchJsonFallback(sourceUrl, behaviorId);
    }
  } catch (error: any) {
    logger.error(
      '[LottieService] Fatal error ' +
        behaviorId +
        ': ' +
        (error?.message || error),
    );
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
      } catch (_e) {}
    }
    return null;
  }
}

export async function clearLottieCache(): Promise<void> {
  try {
    await ExpoFileSystem.deleteAsync(LOTTIE_CACHE_DIR, { idempotent: true });
    logger.info('[LottieService] Cache cleared');
  } catch (error) {
    logger.error('[LottieService] Clear cache error:', error);
  }
}
