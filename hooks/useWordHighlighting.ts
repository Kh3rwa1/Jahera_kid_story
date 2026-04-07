import { useMemo, useRef, useEffect } from 'react';
import { Platform } from 'react-native';

export function splitIntoParagraphs(content: string): string[] {
  return content.split(/\n+/).map(p => p.trim()).filter(p => p.length > 0);
}

export function splitIntoTokens(text: string): Array<{ word: string; isSpace: boolean }> {
  return text.split(/(\s+)/).filter(t => t.length > 0).map(t => ({
    word: t,
    isSpace: /^\s+$/.test(t),
  }));
}

function buildWordIndex(paragraphs: string[]): string[] {
  const words: string[] = [];
  for (const para of paragraphs) {
    for (const tok of splitIntoTokens(para)) {
      if (!tok.isSpace && tok.word.trim().length > 0) words.push(tok.word);
    }
  }
  return words;
}

function buildWordTimings(words: string[], totalChars: number): number[] {
  let cumulative = 0;
  const timings: number[] = [];
  for (const word of words) {
    timings.push(cumulative / Math.max(totalChars, 1));
    cumulative += word.length + 1;
  }
  return timings;
}

function countTotalChars(words: string[]): number {
  return words.reduce((sum, w) => sum + w.length + 1, 0);
}

function buildSentences(words: string[]): Array<{ start: number; end: number; text: string }> {
  const sentences: Array<{ start: number; end: number; text: string }> = [];
  let start = 0;
  let current: string[] = [];
  for (let i = 0; i < words.length; i++) {
    current.push(words[i]);
    if (/[.!?]["']?$/.test(words[i]) || i === words.length - 1) {
      sentences.push({ start, end: i, text: current.join(' ') });
      start = i + 1;
      current = [];
    }
  }
  return sentences;
}

const FALLBACK_SCRIPT_LANG_CODES = new Set(['bn', 'sat']);

export function getScriptFontOverride(languageCode?: string) {
  if (!languageCode || !FALLBACK_SCRIPT_LANG_CODES.has(languageCode.toLowerCase())) {
    return null;
  }
  return Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: undefined,
  });
}

export function useWordHighlighting(content: string, position: number, duration: number) {
  const paragraphs = useMemo(() => splitIntoParagraphs(content), [content]);
  const allWords = useMemo(() => buildWordIndex(paragraphs), [paragraphs]);
  const totalChars = useMemo(() => countTotalChars(allWords), [allWords]);
  const wordTimings = useMemo(() => buildWordTimings(allWords, totalChars), [allWords, totalChars]);
  const sentences = useMemo(() => buildSentences(allWords), [allWords]);

  const paragraphWordRanges = useMemo(() => {
    const ranges: Array<{ start: number; end: number }> = [];
    let count = 0;
    for (const para of paragraphs) {
      const wordCount = splitIntoTokens(para).reduce((acc, tok) => (
        !tok.isSpace && tok.word.trim().length > 0 ? acc + 1 : acc
      ), 0);
      ranges.push({ start: count, end: count + wordCount - 1 });
      count += wordCount;
    }
    return ranges;
  }, [paragraphs]);

  const activeWordIndex = useMemo(() => {
    if (duration <= 0 || allWords.length === 0 || position === 0) return -1;
    const progress = Math.min(position / duration, 1);
    let lo = 0, hi = wordTimings.length - 1, best = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (wordTimings[mid] <= progress) { best = mid; lo = mid + 1; }
      else hi = mid - 1;
    }
    return best;
  }, [position, duration, wordTimings, allWords.length]);

  const activeSentenceIndex = useMemo(() => {
    if (activeWordIndex < 0) return -1;
    for (let i = 0; i < sentences.length; i++) {
      if (activeWordIndex >= sentences[i].start && activeWordIndex <= sentences[i].end) return i;
    }
    return -1;
  }, [activeWordIndex, sentences]);

  const activeParaIndex = useMemo(() => {
    if (activeWordIndex < 0) return -1;
    for (let pi = 0; pi < paragraphWordRanges.length; pi++) {
      const { start, end } = paragraphWordRanges[pi];
      if (activeWordIndex >= start && activeWordIndex <= end) return pi;
    }
    return -1;
  }, [activeWordIndex, paragraphWordRanges]);

  return {
    paragraphs,
    allWords,
    sentences,
    activeWordIndex,
    activeSentenceIndex,
    activeParaIndex,
    paragraphWordRanges
  };
}
