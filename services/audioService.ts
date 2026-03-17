import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from '@/lib/appwrite';

export async function generateAudio(
  text: string,
  languageCode: string,
  storyId: string
): Promise<string | null> {
  try {
    const functionUrl = `${APPWRITE_ENDPOINT}/functions/generate-audio/executions`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': APPWRITE_PROJECT_ID,
      },
      body: JSON.stringify({
        async: false,
        body: JSON.stringify({ text, languageCode, storyId }),
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

    if (data.audioUrl) return data.audioUrl;

    if (data.error) console.warn('generate-audio function error:', data.error);

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
    }
    return true;
  } catch (error) {
    console.error('Error deleting audio:', error);
    return false;
  }
}
