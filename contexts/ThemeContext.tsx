import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ColorScheme, COLOR_SCHEMES, DEFAULT_THEME, getThemeById } from '@/constants/themeSchemes';
import { storage } from '@/utils/storage';
import { handleError } from '@/utils/errorHandler';

const THEME_STORAGE_KEY = 'app_theme_id';
const ICON_STORAGE_KEY = 'app_icon_id';

export interface AppIcon {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

export const APP_ICONS: AppIcon[] = [
  { id: 'default', name: 'Classic', emoji: '📚', description: 'Original Jahera icon' },
  { id: 'rocket', name: 'Rocket', emoji: '🚀', description: 'Adventure awaits!' },
  { id: 'star', name: 'Star', emoji: '⭐', description: 'Shining bright' },
  { id: 'rainbow', name: 'Rainbow', emoji: '🌈', description: 'Colorful stories' },
  { id: 'magic', name: 'Magic', emoji: '✨', description: 'Magical tales' },
  { id: 'book', name: 'Book', emoji: '📖', description: 'Classic reading' },
  { id: 'sparkles', name: 'Sparkles', emoji: '💫', description: 'Sparkly stories' },
  { id: 'heart', name: 'Heart', emoji: '💝', description: 'Made with love' },
];

interface ThemeContextType {
  currentTheme: ColorScheme;
  currentIcon: AppIcon;
  setTheme: (themeId: string) => Promise<void>;
  setIcon: (iconId: string) => Promise<void>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [currentTheme, setCurrentTheme] = useState<ColorScheme>(DEFAULT_THEME);
  const [currentIcon, setCurrentIcon] = useState<AppIcon>(APP_ICONS[0]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThemeAndIcon();
  }, []);

  const loadThemeAndIcon = async () => {
    try {
      setIsLoading(true);

      // Load theme
      const savedThemeId = await storage.getItem<string>(THEME_STORAGE_KEY);
      if (savedThemeId) {
        const theme = getThemeById(savedThemeId);
        setCurrentTheme(theme);
      }

      // Load icon
      const savedIconId = await storage.getItem<string>(ICON_STORAGE_KEY);
      if (savedIconId) {
        const icon = APP_ICONS.find(i => i.id === savedIconId) || APP_ICONS[0];
        setCurrentIcon(icon);
      }
    } catch (error) {
      handleError(error, 'ThemeContext.loadThemeAndIcon');
    } finally {
      setIsLoading(false);
    }
  };

  const setTheme = async (themeId: string) => {
    try {
      const theme = getThemeById(themeId);
      setCurrentTheme(theme);
      await storage.setItem(THEME_STORAGE_KEY, themeId);
    } catch (error) {
      const appError = handleError(error, 'ThemeContext.setTheme');
      throw new Error(appError.message);
    }
  };

  const setIcon = async (iconId: string) => {
    try {
      const icon = APP_ICONS.find(i => i.id === iconId) || APP_ICONS[0];
      setCurrentIcon(icon);
      await storage.setItem(ICON_STORAGE_KEY, iconId);
    } catch (error) {
      const appError = handleError(error, 'ThemeContext.setIcon');
      throw new Error(appError.message);
    }
  };

  const value: ThemeContextType = {
    currentTheme,
    currentIcon,
    setTheme,
    setIcon,
    isLoading,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
