import { Platform } from 'react-native';
import * as ExpoFileSystem from 'expo-file-system/legacy';
import { logger } from '@/utils/logger';

const LOTTIE_CACHE_DIR = Platform.OS !== 'web' ? `${ExpoFileSystem.cacheDirectory}lottie_assets/` : '';

/**
 * Builds a public Appwrite file view URL for a given behavior ID.
 * This assumes the user uploads the Lottie JSON to Appwrite with the behavior ID as the File ID.
 */
export function getAppwriteLottieUrl(behaviorId: string): string {
  const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const project = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
  const bucketId = 'behavior_assets';
  // Add a cache-busting timestamp to ensure the app sees the latest version from Storage
  const cacheBuster = `&t=${new Date().getTime()}`;
  return `${endpoint}/storage/buckets/${bucketId}/files/${behaviorId}/view?project=${project}${cacheBuster}`;
}

/**
 * Fetches and validates a Lottie JSON asset.
 * Returns the JSON object or the local file URI.
 */
export async function ensureLottieAsset(sourceUrl: string, behaviorId: string, forceRefresh = false): Promise<any | null> {
  try {
    // 1. On Web, we fetch the JSON object directly for maximum reliability
    if (Platform.OS === 'web') {
      let response = await fetch(sourceUrl);
      let text = await response.text();
      
      // Safety check: Is it actually JSON?
      if (!text.trim().startsWith('{') && !text.trim().startsWith('[')) {
        // SMART FALLBACK: Try with .json extension in the ID
        logger.debug(`[LottieService] Initial fetch failed for ${behaviorId}, trying .json fallback...`);
        const fallbackUrl = sourceUrl.replace(`/files/${behaviorId}/view`, `/files/${behaviorId}.json/view`);
        response = await fetch(fallbackUrl);
        text = await response.text();
      }

      if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
        return JSON.parse(text);
      }
      
      logger.warn(`[LottieService] Appwrite returned non-JSON for ${behaviorId}. Check File ID in console.`);
      return null;
    }

    // 2. On Native, we use FileSystem for persistent caching
    const dirInfo = await ExpoFileSystem.getInfoAsync(LOTTIE_CACHE_DIR);
    if (!dirInfo.exists) {
      await ExpoFileSystem.makeDirectoryAsync(LOTTIE_CACHE_DIR, { intermediates: true });
    }

    const filename = `${behaviorId}.json`;
    const localUri = `${LOTTIE_CACHE_DIR}${filename}`;

    const fileInfo = await ExpoFileSystem.getInfoAsync(localUri);
    if (fileInfo.exists && !forceRefresh) {
      return { uri: localUri };
    }

    logger.debug(`[LottieService] ${forceRefresh ? 'Refreshing' : 'Fetching'} asset for ${behaviorId}: ${sourceUrl}`);
    
    // Download and verify
    const { uri, status } = await ExpoFileSystem.downloadAsync(sourceUrl, localUri);
    
    if (status !== 200) {
      throw new Error(`Download failed with status ${status}`);
    }

    return { uri };
  } catch (error) {
    logger.error(`[LottieService] Failed to ensure asset for ${behaviorId}:`, error);
    
    if (Platform.OS !== 'web') {
      const localUri = `${LOTTIE_CACHE_DIR}${behaviorId}.json`;
      const fileInfo = await ExpoFileSystem.getInfoAsync(localUri);
      return fileInfo.exists ? { uri: localUri } : null;
    }
    
    return null;
  }
}

/**
 * Clears the Lottie cache.
 */
export async function clearLottieCache(): Promise<void> {
  try {
    await ExpoFileSystem.deleteAsync(LOTTIE_CACHE_DIR, { idempotent: true });
    logger.info('[LottieService] Cache cleared');
  } catch (error) {
    logger.error('[LottieService] Clear cache error:', error);
  }
}
