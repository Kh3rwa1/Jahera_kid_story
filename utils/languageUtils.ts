import { SUPPORTED_LANGUAGES, Language } from '@/constants/languages';

export function getLanguageByCode(code: string): Language | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
}

export function getLanguageName(code: string): string {
  const language = getLanguageByCode(code);
  return language ? language.name : code;
}

export function getLanguageNativeName(code: string): string {
  const language = getLanguageByCode(code);
  return language ? language.nativeName : code;
}

export function getLanguageFlag(code: string): string {
  const language = getLanguageByCode(code);
  return language ? language.flag : '🌐';
}

export function validateLanguageCode(code: string): boolean {
  return SUPPORTED_LANGUAGES.some(lang => lang.code === code);
}
