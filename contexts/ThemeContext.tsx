import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { ColorScheme, COLOR_SCHEMES, DEFAULT_THEME, getThemeById } from '@/constants/themeSchemes';
import { storage } from '@/utils/storage';
import { handleError } from '@/utils/errorHandler';
import { generatePalette } from '@/components/ColorWheelPicker';

const THEME_STORAGE_KEY = 'app_theme_id';
const ICON_STORAGE_KEY = 'app_icon_id';
const CUSTOM_COLOR_KEY = 'app_custom_color';

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

function buildCustomTheme(baseTheme: ColorScheme, customColor: string): ColorScheme {
  const palette = generatePalette(customColor);
  return {
    ...baseTheme,
    id: 'custom',
    name: 'Custom',
    emoji: '🎨',
    colors: {
      ...baseTheme.colors,
      primary: palette.primary,
      primaryDark: palette.primaryDark,
      primaryLight: palette.primaryLight,
      secondary: palette.secondary,
      background: palette.background,
      backgroundGradient: [palette.background, palette.background, palette.background],
      gradients: {
        ...baseTheme.colors.gradients,
        primary: [palette.gradientStart, palette.gradientMid, palette.gradientEnd],
        secondary: [palette.primaryLight, palette.secondary, palette.secondary],
        sunset: [palette.gradientStart, palette.primary, palette.secondary],
        sunrise: [palette.secondary, palette.primaryLight, palette.primary],
        premium: ['#FFD700', palette.primary, palette.primaryDark],
      },
      shadow: {
        ...baseTheme.colors.shadow,
        colored: palette.primary + '40',
        coloredLight: palette.primary + '25',
      },
      text: {
        ...baseTheme.colors.text,
        gradient: [palette.primary, palette.primaryLight],
      },
    },
  };
}

interface ThemeContextType {
  currentTheme: ColorScheme;
  currentIcon: AppIcon;
  customColor: string | null;
  setTheme: (themeId: string) => Promise<void>;
  setIcon: (iconId: string) => Promise<void>;
  setCustomColor: (color: string) => Promise<void>;
  clearCustomColor: () => Promise<void>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [baseTheme, setBaseTheme] = useState<ColorScheme>(DEFAULT_THEME);
  const [customColor, setCustomColorState] = useState<string | null>(null);
  const [currentIcon, setCurrentIcon] = useState<AppIcon>(APP_ICONS[0]);
  const [isLoading, setIsLoading] = useState(true);

  const currentTheme = customColor ? buildCustomTheme(baseTheme, customColor) : baseTheme;

  useEffect(() => {
    loadThemeAndIcon();
  }, []);

  const loadThemeAndIcon = async () => {
    try {
      setIsLoading(true);

      const savedThemeId = await storage.getItem<string>(THEME_STORAGE_KEY);
      const isFirstNewVersionLaunch = await storage.getItem<string>('branding_migrated_v1');

      if (!isFirstNewVersionLaunch) {
        // One-time migration to the new Red branding for everyone
        setBaseTheme(DEFAULT_THEME);
        await storage.setItem(THEME_STORAGE_KEY, DEFAULT_THEME.id);
        await storage.setItem('branding_migrated_v1', 'true');
      } else if (savedThemeId) {
        const theme = getThemeById(savedThemeId);
        setBaseTheme(theme);
      }

      const savedCustomColor = await storage.getItem<string>(CUSTOM_COLOR_KEY);
      if (savedCustomColor) {
        setCustomColorState(savedCustomColor);
      }

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
      setBaseTheme(theme);
      setCustomColorState(null);
      await storage.setItem(THEME_STORAGE_KEY, themeId);
      await storage.removeItem(CUSTOM_COLOR_KEY);
    } catch (error) {
      const appError = handleError(error, 'ThemeContext.setTheme');
      throw new Error(appError.message);
    }
  };

  const setCustomColor = async (color: string) => {
    try {
      setCustomColorState(color);
      await storage.setItem(CUSTOM_COLOR_KEY, color);
    } catch (error) {
      const appError = handleError(error, 'ThemeContext.setCustomColor');
      throw new Error(appError.message);
    }
  };

  const clearCustomColor = async () => {
    try {
      setCustomColorState(null);
      await storage.removeItem(CUSTOM_COLOR_KEY);
    } catch (error) {
      const appError = handleError(error, 'ThemeContext.clearCustomColor');
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

  const value: ThemeContextType = useMemo(() => ({
    currentTheme,
    currentIcon,
    customColor,
    setTheme,
    setIcon,
    setCustomColor,
    clearCustomColor,
    isLoading,
  }), [currentTheme, currentIcon, customColor, isLoading]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
