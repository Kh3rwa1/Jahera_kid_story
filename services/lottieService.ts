import { Platform } from 'react-native';
import * as ExpoFileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';
import { logger } from '@/utils/logger';

const LOTTIE_CACHE_DIR = Platform.OS !== 'web' ? ExpoFileSystem.cacheDirectory + 'lottie_assets/' : '';
const IS_EXPO_GO = Constants.appOwnership === 'expo';

const memoryCache = new Map<string, any>();

export function getAppwriteLottieUrl(behaviorId: string): string {
  const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const project = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
  const bucketId = 'behavior_assets';
  const cacheBuster = '&t=' + new Date().getTime();
  return endpoint + '/storage/buckets/' + bucketId + '/files/' + behaviorId + '/view?project=' + project + cacheBuster;
}

async function fetchJsonFallback(sourceUrl: string, behaviorId: string): Promise<any | null> {
  try {
    logger.debug('[LottieService] Fetch fallback for ' + behaviorId);
    const response = await fetch(sourceUrl);
    logger.debug('[LottieService] Fetch status ' + behaviorId + ': ' + response.status);
    const text = await response.text();
    logger.debug('[LottieService] Response ' + behaviorId + ' len=' + text.length + ' first50=' + text.substring(0, 50));
    if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
      logger.debug('[LottieService] Valid JSON for ' + behaviorId);
      const parsed = JSON.parse(text);
      memoryCache.set(behaviorId, parsed);
      return parsed;
    }
    logger.warn('[LottieService] Non-JSON for ' + behaviorId + ' first80=' + text.substring(0, 80));
    return null;
  } catch (err: any) {
    logger.warn('[LottieService] Fetch failed for ' + behaviorId + ': ' + (err?.message || err));
    return null;
  }
}

export async function ensureLottieAsset(
  sourceUrl: string,
  behaviorId: string,
  forceRefresh = false
): Promise<any | null> {
  try {
    const cached = memoryCache.get(behaviorId);
    if (cached && !forceRefresh) {
      return cached;
    }

    if (Platform.OS === 'web') {
      return await fetchJsonFallback(sourceUrl, behaviorId);
    }

    if (IS_EXPO_GO) {
      logger.debug('[LottieService] Expo Go detected, using fetch for ' + behaviorId);
      return await fetchJsonFallback(sourceUrl, behaviorId);
    }

    try {
      const dirInfo = await ExpoFileSystem.getInfoAsync(LOTTIE_CACHE_DIR);
      if (!dirInfo.exists) {
        await ExpoFileSystem.makeDirectoryAsync(LOTTIE_CACHE_DIR, { intermediates: true });
      }
      const filename = behaviorId + '.json';
      const localUri = LOTTIE_CACHE_DIR + filename;
      const fileInfo = await ExpoFileSystem.getInfoAsync(localUri);
      if (fileInfo.exists && !forceRefresh) {
        return { uri: localUri };
      }
      logger.debug('[LottieService] Downloading ' + behaviorId);
      const result = await ExpoFileSystem.downloadAsync(sourceUrl, localUri);
      if (result.status !== 200) {
        throw new Error('Download status ' + result.status);
      }
      return { uri: result.uri };
    } catch (fsError: any) {
      logger.warn('[LottieService] FS error ' + behaviorId + ': ' + (fsError?.message || fsError));
      return await fetchJsonFallback(sourceUrl, behaviorId);
    }
  } catch (error: any) {
    logger.error('[LottieService] Fatal error ' + behaviorId + ': ' + (error?.message || error));
    if (Platform.OS !== 'web') {
      try {
        const localUri = LOTTIE_CACHE_DIR + behaviorId + '.json';
        const fileInfo = await ExpoFileSystem.getInfoAsync(localUri);
        if (fileInfo.exists) return { uri: localUri };
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
