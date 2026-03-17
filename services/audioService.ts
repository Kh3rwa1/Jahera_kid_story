import { apiKeysService } from './apiKeysService';

const APPWRITE_ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!;
const APPWRITE_PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!;

export async function generateAudio(
  text: string,
  languageCode: string,
  storyId: string
): Promise<string | null> {
  try {
    const elevenLabsApiKey = await apiKeysService.getElevenLabsKey();

    const functionUrl = `${APPWRITE_ENDPOINT}/functions/generate-audio/executions`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': APPWRITE_PROJECT_ID,
      },
      body: JSON.stringify({
        async: false,
        body: JSON.stringify({
          text,
          languageCode,
          storyId,
          elevenLabsApiKey: elevenLabsApiKey || null,
        }),
      }),
    });

    if (!response.ok) {
      console.error('generate-audio function HTTP error:', response.status);
      return null;
    }

    const execution = await response.json();
    const responseBody = execution.responseBody || execution.response || '';

    let data: any = {};
    try {
      data = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
    } catch {
      return null;
    }

    if (data.audioUrl) {
      return data.audioUrl;
    }

    if (data.error) {
      console.warn('generate-audio function error:', data.error);
    }

    return null;
  } catch (error) {
    console.error('Error generating audio:', error);
    return null;
  }
}

export async function deleteAudio(audioPath: string): Promise<boolean> {
  try {
    if (audioPath.startsWith('blob:')) {
      URL.revokeObjectURL(audioPath);
      return true;
    }
    return true;
  } catch (error) {
    console.error('Error deleting audio:', error);
    return false;
  }
}
