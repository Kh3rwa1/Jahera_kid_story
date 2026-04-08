export function sanitizeForPrompt(input: string): string {
  return input
    .replace(/[<>{}[\]\\/`]/g, '')
    .replace(/\b(ignore|instruction|system|prompt|override|forget|disregard)\b/gi, '')
    .trim()
    .slice(0, 100);
}
