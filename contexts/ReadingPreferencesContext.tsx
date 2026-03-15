import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { storage } from '@/utils/storage';

const STORAGE_KEY = 'reading_preferences';

export type LineSpacing = 'compact' | 'normal' | 'relaxed';
export type TextAlign = 'left' | 'justify';
export type FontFamily = 'nunito' | 'merriweather' | 'comic-neue' | 'atkinson';

export interface ReadingPreferences {
  fontSize: number;
  lineSpacing: LineSpacing;
  textAlign: TextAlign;
  fontFamily: FontFamily;
}

const DEFAULTS: ReadingPreferences = {
  fontSize: 17,
  lineSpacing: 'normal',
  textAlign: 'left',
  fontFamily: 'nunito',
};

export const LINE_SPACING_VALUES: Record<LineSpacing, number> = {
  compact: 1.4,
  normal: 1.65,
  relaxed: 1.9,
};

export const FONT_FAMILY_VALUES: Record<FontFamily, { regular: string; bold: string; label: string; sample: string }> = {
  nunito: {
    regular: 'Nunito-Regular',
    bold: 'Nunito-Bold',
    label: 'Nunito',
    sample: 'Friendly & modern',
  },
  merriweather: {
    regular: 'Merriweather-Regular',
    bold: 'Merriweather-Bold',
    label: 'Merriweather',
    sample: 'Classic & elegant',
  },
  'comic-neue': {
    regular: 'ComicNeue-Regular',
    bold: 'ComicNeue-Bold',
    label: 'Comic Neue',
    sample: 'Fun & playful',
  },
  atkinson: {
    regular: 'Atkinson-Regular',
    bold: 'Atkinson-Bold',
    label: 'Atkinson',
    sample: 'Clear & accessible',
  },
};

interface ReadingPreferencesContextValue {
  prefs: ReadingPreferences;
  setFontSize: (size: number) => void;
  setLineSpacing: (spacing: LineSpacing) => void;
  setTextAlign: (align: TextAlign) => void;
  setFontFamily: (family: FontFamily) => void;
  resetToDefaults: () => void;
}

const ReadingPreferencesContext = createContext<ReadingPreferencesContextValue | null>(null);

export function ReadingPreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<ReadingPreferences>(DEFAULTS);

  useEffect(() => {
    storage.getItem<ReadingPreferences>(STORAGE_KEY).then(saved => {
      if (saved) {
        setPrefs({ ...DEFAULTS, ...saved });
      }
    });
  }, []);

  const save = useCallback((updated: ReadingPreferences) => {
    setPrefs(updated);
    storage.setItem(STORAGE_KEY, updated).catch(() => {});
  }, []);

  const setFontSize = useCallback((size: number) => {
    setPrefs(prev => {
      const updated = { ...prev, fontSize: Math.min(26, Math.max(13, size)) };
      storage.setItem(STORAGE_KEY, updated).catch(() => {});
      return updated;
    });
  }, []);

  const setLineSpacing = useCallback((spacing: LineSpacing) => {
    setPrefs(prev => {
      const updated = { ...prev, lineSpacing: spacing };
      storage.setItem(STORAGE_KEY, updated).catch(() => {});
      return updated;
    });
  }, []);

  const setTextAlign = useCallback((align: TextAlign) => {
    setPrefs(prev => {
      const updated = { ...prev, textAlign: align };
      storage.setItem(STORAGE_KEY, updated).catch(() => {});
      return updated;
    });
  }, []);

  const setFontFamily = useCallback((family: FontFamily) => {
    setPrefs(prev => {
      const updated = { ...prev, fontFamily: family };
      storage.setItem(STORAGE_KEY, updated).catch(() => {});
      return updated;
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    save(DEFAULTS);
  }, [save]);

  return (
    <ReadingPreferencesContext.Provider
      value={{ prefs, setFontSize, setLineSpacing, setTextAlign, setFontFamily, resetToDefaults }}
    >
      {children}
    </ReadingPreferencesContext.Provider>
  );
}

export function useReadingPreferences() {
  const ctx = useContext(ReadingPreferencesContext);
  if (!ctx) throw new Error('useReadingPreferences must be used within ReadingPreferencesProvider');
  return ctx;
}
