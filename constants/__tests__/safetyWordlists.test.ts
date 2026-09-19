/**
 * Tests for the safety wordlist shared constants.
 * Guards the single source of truth consumed by both the client filter
 * (utils/storySafetyFilter.ts) and the server function
 * (appwrite/functions/generate-story/index.js).
 */
import { BLOCKED_PHRASES, BLOCKED_WORDS } from '@/constants/safetyWordlists';

describe('BLOCKED_WORDS', () => {
  it('is non-empty and contains core violence terms', () => {
    expect(BLOCKED_WORDS.length).toBeGreaterThan(50);
    for (const word of ['kill', 'murder', 'suicide', 'rape', 'nazi']) {
      expect(BLOCKED_WORDS).toContain(word);
    }
  });

  it('contains weapons, substances, self-harm and horror categories', () => {
    for (const word of [
      'shotgun',
      'cocaine',
      'self-harm',
      'demonic',
      'trafficking',
      'genocide',
    ]) {
      expect(BLOCKED_WORDS).toContain(word);
    }
  });

  it('all entries are lowercase strings without leading/trailing whitespace', () => {
    for (const word of BLOCKED_WORDS) {
      expect(typeof word).toBe('string');
      expect(word).toBe(word.toLowerCase());
      expect(word).toBe(word.trim());
      expect(word.length).toBeGreaterThan(1);
    }
  });

  it('has no duplicates (case-insensitive)', () => {
    const seen = new Set<string>();
    for (const word of BLOCKED_WORDS) {
      const key = word.toLowerCase();
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });
});

describe('BLOCKED_PHRASES', () => {
  it('is non-empty and contains core dark-theme phrases', () => {
    expect(BLOCKED_PHRASES.length).toBeGreaterThan(10);
    for (const phrase of [
      'everyone died',
      'burned alive',
      'secret between us',
    ]) {
      expect(BLOCKED_PHRASES).toContain(phrase);
    }
  });

  it('all entries are lowercase strings without leading/trailing whitespace', () => {
    for (const phrase of BLOCKED_PHRASES) {
      expect(typeof phrase).toBe('string');
      expect(phrase).toBe(phrase.toLowerCase());
      expect(phrase).toBe(phrase.trim());
    }
  });

  it('has no duplicates (case-insensitive)', () => {
    const seen = new Set<string>();
    for (const phrase of BLOCKED_PHRASES) {
      const key = phrase.toLowerCase();
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it('does not overlap with BLOCKED_WORDS (phrases are multi-word)', () => {
    const words = new Set(BLOCKED_WORDS);
    for (const phrase of BLOCKED_PHRASES) {
      expect(words.has(phrase)).toBe(false);
    }
  });
});
