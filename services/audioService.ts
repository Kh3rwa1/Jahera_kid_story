const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export async function generateAudio(
  text: string,
  languageCode: string,
  storyId: string,
  elevenLabsApiKey?: string
): Promise<string | null> {
  try {
    const functionUrl = `${SUPABASE_URL}/functions/v1/generate-audio`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ text, languageCode, storyId, elevenLabsApiKey }),
    });

    if (!response.ok) {
      console.error('generate-audio function HTTP error:', response.status);
      return null;
    }

    let data: any = {};
    try {
      data = await response.json();
    } catch {
      return null;
    }

    if (data.audioUrl) return data.audioUrl;
    if (data.error) console.warn('generate-audio function error:', data.error, data.detail ?? '');

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
