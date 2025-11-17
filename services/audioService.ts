import * as FileSystem from 'expo-file-system';
import { apiKeysService } from './apiKeysService';

const ELEVENLABS_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

const LANGUAGE_VOICE_MAP: Record<string, string> = {
  en: 'pNInz6obpgDQGcFmaJgB',
  es: 'VR6AewLTigWG4xSOukaG',
  fr: 'TxGEqnHWrfWFTfGW9XjX',
  de: 'nPczCjzI2devNBz1zQrb',
  it: 'XB0fDUnXU5powFXDhCwa',
  pt: 'yoZ06aMxZJJ28mfd3POQ',
  ru: 'bIHbv24MWmeRgasZH58o',
  zh: 'Xb7hH8MSUJpSbSDYk0k2',
  ja: 'jsCqWAovK2LkecY7zXl4',
  ko: 'bVMeCyTHy58xNoL34h3p',
  ar: 'pqHfZKP75CvOlQylNhV4',
  hi: 'ZQe5CZNOzWyzPSCn5a3c',
  tr: 'flq6f7yk4E4fJM5XTYuZ',
  pl: 'ThT5KcBeYPX3keUQqHPh',
  nl: 'D38z5RcWu1voky8WS1ja',
  sv: 'N2lVS1w4EtoT3dr4eOWO',
  no: 'SOYHLrjzK2X1ezoPC6cr',
  da: 'EXAVITQu4vr4xnSDxMaL',
  fi: 'JBFqnCBsd6RMkjVDRZzb',
  el: 'iP95p4xoKVk53GoZ742B',
};

const DEFAULT_VOICE_ID = 'pNInz6obpgDQGcFmaJgB';

function getVoiceForLanguage(languageCode: string): string {
  return LANGUAGE_VOICE_MAP[languageCode] || DEFAULT_VOICE_ID;
}

export async function generateAudio(
  text: string,
  languageCode: string,
  storyId: string
): Promise<string | null> {
  try {
    const elevenLabsApiKey = await apiKeysService.getElevenLabsKey();

    if (!elevenLabsApiKey || elevenLabsApiKey === 'your-api-key-here') {
      throw new Error('ElevenLabs API key not configured. Please add it in Settings > API Keys.');
    }

    const voiceId = getVoiceForLanguage(languageCode);
    const url = `${ELEVENLABS_URL}/${voiceId}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsApiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioDir = `${FileSystem.documentDirectory}audio/`;
    const audioPath = `${audioDir}${storyId}.mp3`;

    const dirInfo = await FileSystem.getInfoAsync(audioDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(audioDir, { intermediates: true });
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    await FileSystem.writeAsStringAsync(audioPath, base64Audio, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return audioPath;
  } catch (error) {
    console.error('Error generating audio:', error);
    return null;
  }
}

export async function deleteAudio(audioPath: string): Promise<boolean> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(audioPath);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(audioPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting audio:', error);
    return false;
  }
}
