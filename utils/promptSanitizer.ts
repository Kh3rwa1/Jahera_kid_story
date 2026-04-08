/**
 * Sanitizes user-provided strings before injecting them into AI prompts.
 * Prevents prompt injection, inappropriate content, and excessive length.
 */

const UNSAFE_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts|rules)/gi,
  /you\s+are\s+now/gi,
  /act\s+as\s+(if|a|an)/gi,
  /pretend\s+(you|to\s+be)/gi,
  /system\s*:\s*/gi,
  /assistant\s*:\s*/gi,
  /user\s*:\s*/gi,
  /\[INST\]/gi,
  /\[\/INST\]/gi,
  /<\|im_start\|>/gi,
  /<\|im_end\|>/gi,
  /<<SYS>>/gi,
  /<\/SYS>/gi,
  /\bkill\b/gi,
  /\bdie\b/gi,
  /\bdeath\b/gi,
  /\bviolence\b/gi,
  /\bviolent\b/gi,
  /\bweapon\b/gi,
  /\bgun\b/gi,
  /\bblood\b/gi,
  /\bhate\b/gi,
  /\bnaked\b/gi,
  /\bsex\b/gi,
  /\bdrug\b/gi,
  /\balcohol\b/gi,
  /\bsuicide\b/gi,
  /\bterror\b/gi,
  /\bbomb\b/gi,
];

const SPECIAL_CHARS_PATTERN = /[{}[\]<>|\\^~`]/g;

export function sanitizeForPrompt(input: string, maxLength: number = 100): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input.trim();

  // Remove special characters that could break prompt structure
  sanitized = sanitized.replace(SPECIAL_CHARS_PATTERN, '');

  // Remove unsafe patterns
  for (const pattern of UNSAFE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  // Collapse multiple spaces
  sanitized = sanitized.replace(/\s{2,}/g, ' ').trim();

  // Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength).trim();
  }

  // Final safety: if the result is empty or too short after sanitization, return a safe fallback
  if (sanitized.length < 1) {
    return '';
  }

  return sanitized;
}

export function sanitizeName(name: string): string {
  return sanitizeForPrompt(name, 50);
}

export function sanitizeCity(city: string): string {
  return sanitizeForPrompt(city, 60);
}

export function sanitizeFreeText(text: string): string {
  return sanitizeForPrompt(text, 200);
}
