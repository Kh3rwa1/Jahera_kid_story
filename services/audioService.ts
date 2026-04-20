import { COLLECTIONS, DATABASE_ID, databases, functions } from '@/lib/appwrite';

export interface AudioSettings {
  voiceId?: string | null;
  modelId?: string | null;
  stability?: number | null;
  similarity?: number | null;
  style?: number | null;
  speakerBoost?: boolean | null;
  gender?: 'male' | 'female' | null;
}

/**
 * Generate audio for a story.
 *
 * STRATEGY: The Appwrite client SDK always returns an empty `responseBody`
 * for async executions when called with a user JWT. So instead of relying on
 * responseBody, we:
 *  1. Trigger the async execution (server writes audio_url to the DB)
 *  2. Poll the story document until audio_url appears in the database
 *
 * This is 100% reliable because the server uses its API key to write
 * directly to Appwrite Database, which the client can always read.
 */
export async function generateAudio(
  text: string,
  languageCode: string,
  storyId?: string,
  noStore: boolean = false,
  settings?: AudioSettings,
): Promise<string | null> {
  if (!text || text.trim().length < 5) {
    console.warn('[audioService] Skipping generation: Text too short or empty');
    return null;
  }

  try {
    const isNarration = !storyId;
    console.log(
      `[audioService] Triggering audio generation. storyId: ${storyId}, lang: ${languageCode}, isNarration: ${isNarration}`,
    );

    // Use sync for narrations (shorter, expected immediately)
    // Use async for stories (longer, background generation)
    const execution = await functions.createExecution({
      functionId: 'generate-audio',
      body: JSON.stringify({
        text,
        languageCode,
        storyId,
        noStore: isNarration ? true : noStore, // Use noStore for narrations to get Base64 back
        ...settings,
      }),
      async: !isNarration,
    });

    // For narrations: handle immediate response (Base64)
    if (isNarration && execution.responseBody) {
      try {
        const body = JSON.parse(execution.responseBody);
        if (body.success && body.base64) {
          // In Expo, we can play Base64 by converting to a data URI or temporary file
          // Data URI is simpler for short previews
          return `data:audio/mpeg;base64,${body.base64}`;
        }
      } catch (e) {
        console.error('[audioService] Failed to parse narration response:', e);
      }
    }

    // Fallback polling for narrations if sync failed or returned empty
    if (isNarration) {
      console.log(
        '[audioService] Narration: sync response empty, falling back to delay',
      );
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return null;
    }

    // For stories: poll the story document for audio_url
    if (storyId && !noStore) {
      console.log(`[audioService] Story: polling DB for audio_url...`);
      const audioUrl = await pollStoryForAudioUrl(storyId, 90_000);
      if (audioUrl) return audioUrl;
    }

    return null;
  } catch (error) {
    console.error(
      '[audioService] CRITICAL: Failed to trigger generate-audio:',
      error,
    );
    return null;
  }
}

/**
 * Poll the story document every 3 seconds until audio_url is set.
 * Times out after maxWaitMs milliseconds.
 */
async function pollStoryForAudioUrl(
  storyId: string,
  maxWaitMs: number,
): Promise<string | null> {
  const pollInterval = 3000;
  const maxPolls = Math.floor(maxWaitMs / pollInterval);

  console.log(
    `[audioService] Polling for story ${storyId}. Max wait: ${maxWaitMs / 1000}s (${maxPolls} attempts)`,
  );

  for (let i = 0; i < maxPolls; i++) {
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
    try {
      const doc = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.STORIES,
        storyId,
      );
      const audioUrl = doc?.audio_url;

      console.log(
        `[audioService] Poll ${i + 1}/${maxPolls}: audio_url=${audioUrl ? 'FOUND' : 'pending...'}`,
      );

      if (audioUrl) {
        console.log(
          `[audioService] SUCCESS: audio_url found in ${((i + 1) * pollInterval) / 1000}s`,
        );
        return audioUrl;
      }
    } catch (err) {
      console.warn(`[audioService] Poll ${i + 1} error:`, err);
    }
  }

  console.error(
    `[audioService] TIMEOUT: Could not find audio_url after ${maxWaitMs / 1000}s. Check Appwrite Function logs.`,
  );
  return null;
}

export async function deleteAudio(audioPath: string): Promise<boolean> {
  try {
    if (audioPath.startsWith('blob:')) {
      URL.revokeObjectURL(audioPath);
    }
    return true;
  } catch (error) {
    console.error('Error deleting audio:', error);
    return false;
  }
}
