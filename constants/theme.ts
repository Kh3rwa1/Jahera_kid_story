export const COLORS = {
  primary: '#FF6634',
  primaryDark: '#E54D1F',
  primaryLight: '#FF8866',
  secondary: '#FFD93D',
  secondaryDark: '#FFB700',
  secondaryLight: '#FFEB99',
  background: '#FFF8E7',
  backgroundGradient: ['#FFF8E7', '#FFE8CC'],
  cardBackground: '#FFFFFF',
  cardGradient: ['#FFFFFF', '#FFFBF5'],
  text: {
    primary: '#2C3E50',
    secondary: '#6C757D',
    light: '#ADB5BD',
    inverse: '#FFFFFF',
  },
  categoryColors: {
    green: '#A8E6CF',
    greenGradient: ['#A8E6CF', '#7FD8BE'],
    teal: '#7FD8BE',
    tealGradient: ['#7FD8BE', '#66C3A8'],
    peach: '#FFB6B9',
    peachGradient: ['#FFB6B9', '#FF9BA0'],
    purple: '#C7CEEA',
    purpleGradient: ['#C7CEEA', '#A8B3E0'],
    blue: '#85C1E2',
    blueGradient: ['#85C1E2', '#6BAFD8'],
  },
  accent: {
    gold: '#FFD700',
    rose: '#FF6B9D',
    mint: '#98FFE0',
    lavender: '#E0B0FF',
  },
  success: '#4CAF50',
  successLight: '#81C784',
  error: '#F44336',
  errorLight: '#E57373',
  warning: '#FFB74D',
  warningLight: '#FFD54F',
  info: '#29B6F6',
  // Premium gradients
  gradients: {
    primary: ['#FF6634', '#FF8866'],
    secondary: ['#FFD93D', '#FFE875'],
    sunset: ['#FF6634', '#FFD93D'],
    ocean: ['#85C1E2', '#7FD8BE'],
    magic: ['#C7CEEA', '#FFB6B9'],
    success: ['#4CAF50', '#81C784'],
  },
  // Shadow colors
  shadow: {
    light: 'rgba(0, 0, 0, 0.05)',
    medium: 'rgba(0, 0, 0, 0.1)',
    dark: 'rgba(0, 0, 0, 0.2)',
    colored: 'rgba(255, 102, 52, 0.3)',
  },
};

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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  round: 50,
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

// Premium shadows for iOS/Android
export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  colored: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
};

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
