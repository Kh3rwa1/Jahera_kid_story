/**
 * Theme Helpers
 *
 * This file provides utilities to safely use theme values in React Native components
 * and prevents the common "COLORS is not defined" error.
 */

import { BORDER_RADIUS,COLORS,FONT_SIZES,FONT_WEIGHTS,SHADOWS,SPACING } from '@/constants/theme';
import { StyleSheet } from 'react-native';

/**
 * Creates a function that generates dynamic styles based on theme
 *
 * @example
 * const useStyles = createThemedStyles((theme) => ({
 *   container: {
 *     backgroundColor: theme.colors.background,
 *     padding: SPACING.md,
 *   },
 * }));
 *
 * // In component:
 * const { currentTheme } = useTheme();
 * const styles = useStyles(currentTheme);
 */
export function createThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  styleFactory: (theme: any) => T
): (theme: any) => T {
  return (theme: any) => StyleSheet.create(styleFactory(theme));
}

/**
 * Safe theme constants export
 * Use these in StyleSheet.create() calls to avoid undefined errors
 */
export const themeConstants = {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SHADOWS,
} as const;

/**
 * Best Practices:
 *
 * WRONG - This causes "COLORS is not defined" error:
 * When you define const COLORS = currentTheme.colors inside a component
 * but use COLORS in StyleSheet.create() at module level,
 * COLORS will be undefined when StyleSheet runs.
 *
 * CORRECT - Import COLORS at module level for StyleSheet:
 * Always import { COLORS } from '@/constants/theme' at the top of your file
 * when using theme constants in StyleSheet.create()
 *
 * ALSO CORRECT - Use createThemedStyles for fully dynamic theming:
 * Use the createThemedStyles helper to create styles that update
 * when the theme changes at runtime.
 */
