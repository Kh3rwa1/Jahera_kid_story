import * as Speech from 'expo-speech';

export const DEVICE_TTS_AUDIO_URL = 'device-tts://template-story';

const WORDS_PER_MINUTE = 145;

export function isDeviceTtsAudioUrl(audioUrl?: string | null): boolean {
  return audioUrl === DEVICE_TTS_AUDIO_URL;
}

export function estimateSpeechDurationMillis(text: string): number {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(10_000, Math.round((wordCount / WORDS_PER_MINUTE) * 60_000));
}

export const deviceTTSService = {
  async speak(
    text: string,
    languageCode: string,
    callbacks?: {
      onStart?: () => void;
      onDone?: () => void;
      onStopped?: () => void;
      onError?: (error: unknown) => void;
    },
  ): Promise<void> {
    await Speech.stop();
    Speech.speak(text, {
      language: languageCode,
      rate: 0.85,
      pitch: 1.05,
      onStart: callbacks?.onStart,
      onDone: callbacks?.onDone,
      onStopped: callbacks?.onStopped,
      onError: callbacks?.onError,
    });
  },

  async pause(): Promise<void> {
    // Speech.pause() is iOS-only; on Android, stop instead
    if (require('react-native').Platform.OS === 'ios') {
      await Speech.pause();
    } else {
      await Speech.stop();
    }
  },

  async resume(): Promise<void> {
    // Speech.resume() is iOS-only; on Android this is a no-op
    if (require('react-native').Platform.OS === 'ios') {
      await Speech.resume();
    }
  },

  async stop(): Promise<void> {
    await Speech.stop();
  },
};
