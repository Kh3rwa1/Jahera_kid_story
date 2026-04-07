import type { EdgeInsets } from 'react-native-safe-area-context';

/** Re-export EdgeInsets so consumers don't need the extra import */
export type { EdgeInsets };

export interface ThemeTextColors {
  primary: string;
  secondary: string;
  light: string;
}

export interface ThemeGradients {
  primary: readonly [string, string, ...string[]];
  sunset: readonly [string, string, ...string[]];
  ocean: readonly [string, string, ...string[]];
  forest: readonly [string, string, ...string[]];
}

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  background: string;
  backgroundGradient: readonly [string, string, ...string[]];
  cardBackground: string;
  error: string;
  success: string;
  info: string;
  text: ThemeTextColors;
  gradients: ThemeGradients;
  [key: string]: unknown; // allow extra keys from theme schemes
}

export interface AppTheme {
  id: string;
  name: string;
  colors: ThemeColors;
}
