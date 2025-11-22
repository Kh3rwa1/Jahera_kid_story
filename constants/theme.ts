import { DEFAULT_THEME } from './themeSchemes';

// Export colors from the default theme (Mint)
// Components can use these for static imports or use useTheme() hook for dynamic theming
export const COLORS = DEFAULT_THEME.colors;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BORDER_RADIUS = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 28,
  round: 100,
  pill: 999,
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  huge: 32,
};

export const FONT_WEIGHTS = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

// Helper function to create dynamic shadows based on theme colors
export function createShadows(primaryColor: string) {
  return {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    xs: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
      elevation: 1,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.12,
      shadowRadius: 32,
      elevation: 12,
    },
    xxl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 24 },
      shadowOpacity: 0.15,
      shadowRadius: 48,
      elevation: 16,
    },
    // Colored shadows for premium effect
    colored: {
      shadowColor: primaryColor,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 8,
    },
    coloredLight: {
      shadowColor: primaryColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 4,
    },
    purple: {
      shadowColor: '#C7CEEA',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 14,
      elevation: 6,
    },
    blue: {
      shadowColor: '#85C1E2',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 14,
      elevation: 6,
    },
    green: {
      shadowColor: '#7FD8BE',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 14,
      elevation: 6,
    },
    // Inner shadow effect (simulated with opacity)
    inner: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 0,
    },
  };
}

// Premium shadows for iOS/Android (ultra-smooth, layered shadows)
export const SHADOWS = createShadows(COLORS.primary);

// Animation durations
export const ANIMATION = {
  fast: 200,
  normal: 300,
  slow: 500,
  verySlow: 800,
};

// Premium spacing for layouts
export const LAYOUT = {
  screenPadding: SPACING.xl,
  cardPadding: SPACING.lg,
  sectionSpacing: SPACING.xxxl,
  maxWidth: 1200, // Max width for large screens
};

// Responsive breakpoints
export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
};

// Typography system
export const TYPOGRAPHY = {
  // Display styles (for hero sections)
  displayLarge: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: -0.5,
  },
  displayMedium: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: -0.25,
  },
  displaySmall: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: FONT_WEIGHTS.bold,
  },

  // Heading styles
  h1: {
    fontSize: FONT_SIZES.xxxl,
    lineHeight: 36,
    fontWeight: FONT_WEIGHTS.bold,
  },
  h2: {
    fontSize: FONT_SIZES.xxl,
    lineHeight: 32,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  h3: {
    fontSize: FONT_SIZES.xl,
    lineHeight: 28,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  h4: {
    fontSize: FONT_SIZES.lg,
    lineHeight: 24,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  h5: {
    fontSize: FONT_SIZES.md,
    lineHeight: 22,
    fontWeight: FONT_WEIGHTS.semibold,
  },

  // Body styles
  bodyLarge: {
    fontSize: FONT_SIZES.lg,
    lineHeight: 26,
    fontWeight: FONT_WEIGHTS.normal,
  },
  bodyMedium: {
    fontSize: FONT_SIZES.md,
    lineHeight: 24,
    fontWeight: FONT_WEIGHTS.normal,
  },
  bodySmall: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
    fontWeight: FONT_WEIGHTS.normal,
  },

  // Caption styles
  caption: {
    fontSize: FONT_SIZES.xs,
    lineHeight: 16,
    fontWeight: FONT_WEIGHTS.normal,
  },
  captionBold: {
    fontSize: FONT_SIZES.xs,
    lineHeight: 16,
    fontWeight: FONT_WEIGHTS.semibold,
  },

  // Label styles
  label: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
    fontWeight: FONT_WEIGHTS.medium,
    letterSpacing: 0.5,
  },
  labelLarge: {
    fontSize: FONT_SIZES.md,
    lineHeight: 22,
    fontWeight: FONT_WEIGHTS.medium,
    letterSpacing: 0.5,
  },
};

// Z-index scale for consistent layering
export const Z_INDEX = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  notification: 1080,
};

// Safe area insets (defaults, will be overridden by actual device values)
export const SAFE_AREA = {
  top: 44,
  bottom: 34,
  left: 0,
  right: 0,
};
