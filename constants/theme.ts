export const COLORS = {
  primary: '#FF6634',
  primaryDark: '#E54D1F',
  primaryLight: '#FF8866',
  secondary: '#FFD93D',
  secondaryDark: '#FFB700',
  secondaryLight: '#FFEB99',
  background: '#FFF8F0',
  backgroundGradient: ['#FFFBF5', '#FFF0E5', '#FFE8D8'],
  cardBackground: '#FFFFFF',
  cardGradient: ['#FFFFFF', '#FFFBF8'],
  text: {
    primary: '#1A1F36',
    secondary: '#6C7A89',
    light: '#ADB5BD',
    inverse: '#FFFFFF',
    gradient: ['#FF6634', '#FF8866'],
  },
  categoryColors: {
    green: '#A8E6CF',
    greenGradient: ['#D4F1E8', '#A8E6CF', '#7FD8BE'],
    teal: '#7FD8BE',
    tealGradient: ['#B8EAE0', '#7FD8BE', '#66C3A8'],
    peach: '#FFB6B9',
    peachGradient: ['#FFDFE0', '#FFB6B9', '#FF9BA0'],
    purple: '#C7CEEA',
    purpleGradient: ['#E5E8F5', '#C7CEEA', '#A8B3E0'],
    blue: '#85C1E2',
    blueGradient: ['#C4E4F3', '#85C1E2', '#6BAFD8'],
  },
  accent: {
    gold: '#FFD700',
    goldGradient: ['#FFF9D6', '#FFD700', '#FFC300'],
    rose: '#FF6B9D',
    roseGradient: ['#FFD4E4', '#FF6B9D', '#FF5089'],
    mint: '#98FFE0',
    mintGradient: ['#D9FFF5', '#98FFE0', '#7BFFD3'],
    lavender: '#E0B0FF',
    lavenderGradient: ['#F5E8FF', '#E0B0FF', '#D19EFF'],
  },
  success: '#10B981',
  successLight: '#6EE7B7',
  error: '#EF4444',
  errorLight: '#FCA5A5',
  warning: '#F59E0B',
  warningLight: '#FCD34D',
  info: '#3B82F6',
  infoLight: '#93C5FD',
  // Premium gradients with 3-color stops
  gradients: {
    primary: ['#FF8866', '#FF6634', '#E54D1F'],
    secondary: ['#FFEB99', '#FFD93D', '#FFB700'],
    sunset: ['#FF8866', '#FF6634', '#FFD93D'],
    sunrise: ['#FFD93D', '#FF9F66', '#FF6634'],
    ocean: ['#A5E8F3', '#85C1E2', '#6BAFD8'],
    forest: ['#D4F1E8', '#7FD8BE', '#66C3A8'],
    magic: ['#E5E8F5', '#C7CEEA', '#FFB6B9'],
    royal: ['#9D84FF', '#7B68EE', '#6A5ACD'],
    success: ['#6EE7B7', '#10B981', '#059669'],
    premium: ['#FFD700', '#FF6634', '#E54D1F'],
    glassMorphism: ['rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0.3)'],
    glassMorphismDark: ['rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 0.1)'],
  },
  // Shadow colors with more variety
  shadow: {
    light: 'rgba(0, 0, 0, 0.03)',
    medium: 'rgba(0, 0, 0, 0.08)',
    dark: 'rgba(0, 0, 0, 0.15)',
    darker: 'rgba(0, 0, 0, 0.25)',
    colored: 'rgba(255, 102, 52, 0.25)',
    coloredLight: 'rgba(255, 102, 52, 0.15)',
    purple: 'rgba(199, 206, 234, 0.4)',
    blue: 'rgba(133, 193, 226, 0.4)',
    green: 'rgba(168, 230, 207, 0.4)',
  },
  // Glassmorphism support
  glass: {
    background: 'rgba(255, 255, 255, 0.7)',
    backgroundDark: 'rgba(255, 255, 255, 0.5)',
    border: 'rgba(255, 255, 255, 0.8)',
    borderDark: 'rgba(255, 255, 255, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.05)',
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

// Premium shadows for iOS/Android (ultra-smooth, layered shadows)
export const SHADOWS = {
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
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  coloredLight: {
    shadowColor: COLORS.primary,
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
