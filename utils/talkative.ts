import * as Speech from 'expo-speech';

/**
 * Talkative Utility for Jahera
 * Provides lightweight, immediate TTS for UI feedback and child-friendly interactions.
 */

export const talkative = {
  /**
   * Speak a short phrase immediately using system TTS (expo-speech).
   * Ideal for rewards, errors, or simple UI directions.
   */
  speak: async (text: string, languageCode: string = 'en') => {
    try {
      // Clean up the text for better speech
      const cleanText = text.trim();
      if (!cleanText) return;

      // Stop any current speech to prioritize the new one
      await Speech.stop();

      // Start speaking
      Speech.speak(cleanText, {
        language: languageCode,
        pitch: 1.15, // Slightly higher pitch for a kid-friendly vibe
        rate: 0.95, // Slightly slower for better comprehension
      });
    } catch (err) {
      console.warn('[talkative] Speech failed:', err);
    }
  },

  /**
   * Stop all current speech.
   */
  stop: async () => {
    try {
      await Speech.stop();
    } catch (err) {
      console.warn('[talkative] Stop failed:', err);
    }
  },

  /**
   * Child-friendly reaction phrases
   */
  reactions: {
    correct: (name: string) =>
      [
        `Yeah! Correct! Great job, ${name}!`,
        `Awesome! You got it right!`,
        `Perfect score on that one, ${name}!`,
        `Bingo! You're so smart!`,
      ][Math.floor(Math.random() * 4)],

    incorrect: (name: string) =>
      [
        `Not quite, ${name}. But keep trying!`,
        `Oops! Let's try another one.`,
        `Almost! You'll get it next time, ${name}!`,
        `A good try! Learning is fun, let's go again!`,
      ][Math.floor(Math.random() * 4)],

    welcome: (name: string) =>
      `Welcome back, ${name}! Ready for a new adventure?`,

    finished: (score: number, total: number) =>
      `All done! You got ${score} out of ${total} right. I'm so proud of you!`,
  },
};
