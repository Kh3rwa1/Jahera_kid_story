import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { storage } from '@/utils/storage';

const STORAGE_KEY = 'reading_preferences';

export type LineSpacing = 'compact' | 'normal' | 'relaxed';
export type TextAlign = 'left' | 'justify';

export interface ReadingPreferences {
  fontSize: number;
  lineSpacing: LineSpacing;
  textAlign: TextAlign;
}

const DEFAULTS: ReadingPreferences = {
  fontSize: 17,
  lineSpacing: 'normal',
  textAlign: 'left',
};

export const LINE_SPACING_VALUES: Record<LineSpacing, number> = {
  compact: 1.4,
  normal: 1.65,
  relaxed: 1.9,
};

interface ReadingPreferencesContextValue {
  prefs: ReadingPreferences;
  setFontSize: (size: number) => void;
  setLineSpacing: (spacing: LineSpacing) => void;
  setTextAlign: (align: TextAlign) => void;
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

  const resetToDefaults = useCallback(() => {
    save(DEFAULTS);
  }, [save]);

  return (
    <ReadingPreferencesContext.Provider
      value={{ prefs, setFontSize, setLineSpacing, setTextAlign, resetToDefaults }}
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
