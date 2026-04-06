import { useCallback, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { generateAudio } from '@/services/audioService';

export function useNarrationAudio(screenTag: string) {
  const soundRef = useRef<Audio.Sound | null>(null);

  const stopCurrent = useCallback(async () => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.stopAsync();
    } catch {
      // Ignore stop errors and continue to unload.
    }

    try {
      await soundRef.current.unloadAsync();
    } catch {
      // Ignore unload errors.
    }

    soundRef.current = null;
  }, []);

  const speak = useCallback(
    async (text: string, lang: string) => {
      try {
        await stopCurrent();
        const url = await generateAudio(text, lang);
        if (!url) return;

        const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
        soundRef.current = sound;
      } catch (err) {
        console.error(`TTS Error (${screenTag}):`, err);
      }
    },
    [screenTag, stopCurrent]
  );

  useEffect(() => {
    return () => {
      void stopCurrent();
    };
  }, [stopCurrent]);

  return { speak, stopCurrent };
}
