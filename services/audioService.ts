import { functions, databases, COLLECTIONS, DATABASE_ID } from '@/lib/appwrite';

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
  noStore: boolean = false
): Promise<string | null> {
  if (!text || text.trim().length < 5) {
    console.warn('[audioService] Skipping generation: Text too short or empty');
    return null;
  }

  try {
    console.log(`[audioService] Triggering audio generation. storyId: ${storyId}, lang: ${languageCode}, noStore: ${noStore}`);
    
    // Fire and forget — server will write audio_url to DB when done
    const execution = await functions.createExecution({
      functionId: 'generate-audio',
      body: JSON.stringify({ text, languageCode, storyId, noStore }),
      async: true
    });

    console.log(`[audioService] Execution triggered: ${execution.$id}, status: ${execution.status}`);

    // If we have a storyId, poll the story document for audio_url (the reliable path)
    if (storyId && !noStore) {
      console.log(`[audioService] Starting poll for story: ${storyId}`);
      const audioUrl = await pollStoryForAudioUrl(storyId, 75_000); // up to 75s
      if (audioUrl) return audioUrl;
    }

    // noStore mode: no storyId to poll — used only for previews/tests, return null gracefully
    return null;
  } catch (error) {
    console.error('[audioService] CRITICAL: Failed to trigger generate-audio:', error);
    return null;
  }
}

/**
 * Poll the story document every 3 seconds until audio_url is set.
 * Times out after maxWaitMs milliseconds.
 */
async function pollStoryForAudioUrl(storyId: string, maxWaitMs: number): Promise<string | null> {
  const pollInterval = 3000;
  const maxPolls = Math.floor(maxWaitMs / pollInterval);

  for (let i = 0; i < maxPolls; i++) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));
    try {
      const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.STORIES, storyId);
      const audioUrl = doc?.audio_url;
      if (audioUrl) {
        console.log(`[audioService] audio_url found after ${(i + 1) * pollInterval / 1000}s`);
        return audioUrl;
      }
    } catch (err) {
      console.warn(`[audioService] poll ${i + 1} error:`, err);
    }
  }

  console.warn(`[audioService] Timed out waiting for audio_url on story ${storyId}`);
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
