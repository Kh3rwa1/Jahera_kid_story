import {
  getLanguageByCode,
  getLanguageFlag,
  getLanguageName,
  getLanguageNativeName,
  validateLanguageCode,
} from '../languageUtils';

jest.mock('@/constants/languages', () => ({
  SUPPORTED_LANGUAGES: [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  ],
}));

describe('getLanguageByCode', () => {
  it('returns the language object for a valid code', () => {
    const lang = getLanguageByCode('en');
    expect(lang).toBeDefined();
    expect(lang!.name).toBe('English');
  });

  it('returns undefined for an invalid code', () => {
    expect(getLanguageByCode('zz')).toBeUndefined();
  });
});

describe('getLanguageName', () => {
  it('returns the language name for a valid code', () => {
    expect(getLanguageName('hi')).toBe('Hindi');
  });

  it('returns the code itself for an unknown code', () => {
    expect(getLanguageName('xx')).toBe('xx');
  });
});

describe('getLanguageNativeName', () => {
  it('returns the native name for a valid code', () => {
    expect(getLanguageNativeName('hi')).toBe('हिन्दी');
  });

  it('returns the code itself for an unknown code', () => {
    expect(getLanguageNativeName('xx')).toBe('xx');
  });
});

describe('getLanguageFlag', () => {
  it('returns the flag emoji for a valid code', () => {
    expect(getLanguageFlag('es')).toBe('🇪🇸');
  });

  it('returns globe emoji for an unknown code', () => {
    expect(getLanguageFlag('xx')).toBe('🌐');
  });
});

describe('validateLanguageCode', () => {
  it('returns true for a supported language code', () => {
    expect(validateLanguageCode('en')).toBe(true);
  });

  it('returns false for an unsupported language code', () => {
    expect(validateLanguageCode('klingon')).toBe(false);
  });

  it('is case-sensitive', () => {
    expect(validateLanguageCode('EN')).toBe(false);
  });
});
