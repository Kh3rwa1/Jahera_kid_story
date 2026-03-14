/**
 * Theme Schemes - Multiple color palettes for app customization
 * Each scheme contains all color definitions needed throughout the app
 */

type GradientColors = readonly [string, string, ...string[]];

export interface ColorScheme {
  id: string;
  name: string;
  emoji: string;
  colors: {
    primary: string;
    primaryDark: string;
    primaryLight: string;
    secondary: string;
    secondaryDark: string;
    secondaryLight: string;
    background: string;
    backgroundGradient: GradientColors;
    cardBackground: string;
    cardGradient: GradientColors;
    text: {
      primary: string;
      secondary: string;
      light: string;
      inverse: string;
      gradient: GradientColors;
    };
    categoryColors: {
      green: string;
      greenGradient: GradientColors;
      teal: string;
      tealGradient: GradientColors;
      peach: string;
      peachGradient: GradientColors;
      purple: string;
      purpleGradient: GradientColors;
      blue: string;
      blueGradient: GradientColors;
    };
    accent: {
      gold: string;
      goldGradient: GradientColors;
      rose: string;
      roseGradient: GradientColors;
      mint: string;
      mintGradient: GradientColors;
      lavender: string;
      lavenderGradient: GradientColors;
    };
    success: string;
    successLight: string;
    error: string;
    errorLight: string;
    warning: string;
    warningLight: string;
    info: string;
    infoLight: string;
    gradients: {
      primary: GradientColors;
      secondary: GradientColors;
      sunset: GradientColors;
      sunrise: GradientColors;
      ocean: GradientColors;
      forest: GradientColors;
      magic: GradientColors;
      royal: GradientColors;
      success: GradientColors;
      premium: GradientColors;
      glassMorphism: GradientColors;
      glassMorphismDark: GradientColors;
    };
    shadow: {
      light: string;
      medium: string;
      dark: string;
      darker: string;
      colored: string;
      coloredLight: string;
      purple: string;
      blue: string;
      green: string;
    };
    glass: {
      background: string;
      backgroundDark: string;
      border: string;
      borderDark: string;
      overlay: string;
    };
  };
}

// Mint/Teal Theme (Current Default)
export const MINT_THEME: ColorScheme = {
  id: 'mint',
  name: 'Mint Fresh',
  emoji: '🌿',
  colors: {
    primary: '#4ECDC4',
    primaryDark: '#3BB5AC',
    primaryLight: '#7FD8D3',
    secondary: '#98FFE0',
    secondaryDark: '#7BFFD3',
    secondaryLight: '#B8FFE8',
    background: '#F0FFFE',
    backgroundGradient: ['#F9FFFE', '#F0FFFE', '#E8FDFC'],
    cardBackground: '#FFFFFF',
    cardGradient: ['#FFFFFF', '#F9FFFE'],
    text: {
      primary: '#1A1F36',
      secondary: '#6C7A89',
      light: '#ADB5BD',
      inverse: '#FFFFFF',
      gradient: ['#4ECDC4', '#7FD8D3'],
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
    gradients: {
      primary: ['#7FD8D3', '#4ECDC4', '#3BB5AC'],
      secondary: ['#B8FFE8', '#98FFE0', '#7BFFD3'],
      sunset: ['#7FD8D3', '#4ECDC4', '#98FFE0'],
      sunrise: ['#98FFE0', '#6FE6D6', '#4ECDC4'],
      ocean: ['#A5E8F3', '#85C1E2', '#6BAFD8'],
      forest: ['#D4F1E8', '#7FD8BE', '#66C3A8'],
      magic: ['#E5E8F5', '#C7CEEA', '#FFB6B9'],
      royal: ['#9D84FF', '#7B68EE', '#6A5ACD'],
      success: ['#6EE7B7', '#10B981', '#059669'],
      premium: ['#FFD700', '#4ECDC4', '#3BB5AC'],
      glassMorphism: ['rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0.3)'],
      glassMorphismDark: ['rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 0.1)'],
    },
    shadow: {
      light: 'rgba(0, 0, 0, 0.03)',
      medium: 'rgba(0, 0, 0, 0.08)',
      dark: 'rgba(0, 0, 0, 0.15)',
      darker: 'rgba(0, 0, 0, 0.25)',
      colored: 'rgba(78, 205, 196, 0.25)',
      coloredLight: 'rgba(78, 205, 196, 0.15)',
      purple: 'rgba(199, 206, 234, 0.4)',
      blue: 'rgba(133, 193, 226, 0.4)',
      green: 'rgba(168, 230, 207, 0.4)',
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.7)',
      backgroundDark: 'rgba(255, 255, 255, 0.5)',
      border: 'rgba(255, 255, 255, 0.8)',
      borderDark: 'rgba(255, 255, 255, 0.3)',
      overlay: 'rgba(0, 0, 0, 0.05)',
    },
  },
};

// Purple Dream Theme
export const PURPLE_THEME: ColorScheme = {
  id: 'purple',
  name: 'Purple Dream',
  emoji: '💜',
  colors: {
    primary: '#9D84FF',
    primaryDark: '#7B68EE',
    primaryLight: '#B8A6FF',
    secondary: '#E0B0FF',
    secondaryDark: '#D19EFF',
    secondaryLight: '#EDD5FF',
    background: '#F9F7FF',
    backgroundGradient: ['#FDFCFF', '#F9F7FF', '#F5F2FF'],
    cardBackground: '#FFFFFF',
    cardGradient: ['#FFFFFF', '#FDFCFF'],
    text: {
      primary: '#1A1F36',
      secondary: '#6C7A89',
      light: '#ADB5BD',
      inverse: '#FFFFFF',
      gradient: ['#9D84FF', '#B8A6FF'],
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
    gradients: {
      primary: ['#B8A6FF', '#9D84FF', '#7B68EE'],
      secondary: ['#EDD5FF', '#E0B0FF', '#D19EFF'],
      sunset: ['#B8A6FF', '#9D84FF', '#E0B0FF'],
      sunrise: ['#E0B0FF', '#BB95FF', '#9D84FF'],
      ocean: ['#A5E8F3', '#85C1E2', '#6BAFD8'],
      forest: ['#D4F1E8', '#7FD8BE', '#66C3A8'],
      magic: ['#E5E8F5', '#C7CEEA', '#FFB6B9'],
      royal: ['#9D84FF', '#7B68EE', '#6A5ACD'],
      success: ['#6EE7B7', '#10B981', '#059669'],
      premium: ['#FFD700', '#9D84FF', '#7B68EE'],
      glassMorphism: ['rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0.3)'],
      glassMorphismDark: ['rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 0.1)'],
    },
    shadow: {
      light: 'rgba(0, 0, 0, 0.03)',
      medium: 'rgba(0, 0, 0, 0.08)',
      dark: 'rgba(0, 0, 0, 0.15)',
      darker: 'rgba(0, 0, 0, 0.25)',
      colored: 'rgba(157, 132, 255, 0.25)',
      coloredLight: 'rgba(157, 132, 255, 0.15)',
      purple: 'rgba(199, 206, 234, 0.4)',
      blue: 'rgba(133, 193, 226, 0.4)',
      green: 'rgba(168, 230, 207, 0.4)',
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.7)',
      backgroundDark: 'rgba(255, 255, 255, 0.5)',
      border: 'rgba(255, 255, 255, 0.8)',
      borderDark: 'rgba(255, 255, 255, 0.3)',
      overlay: 'rgba(0, 0, 0, 0.05)',
    },
  },
};

// Ocean Blue Theme
export const BLUE_THEME: ColorScheme = {
  id: 'blue',
  name: 'Ocean Blue',
  emoji: '🌊',
  colors: {
    primary: '#3B82F6',
    primaryDark: '#2563EB',
    primaryLight: '#60A5FA',
    secondary: '#85C1E2',
    secondaryDark: '#6BAFD8',
    secondaryLight: '#A5D8EF',
    background: '#F0F9FF',
    backgroundGradient: ['#F9FCFF', '#F0F9FF', '#E5F4FF'],
    cardBackground: '#FFFFFF',
    cardGradient: ['#FFFFFF', '#F9FCFF'],
    text: {
      primary: '#1A1F36',
      secondary: '#6C7A89',
      light: '#ADB5BD',
      inverse: '#FFFFFF',
      gradient: ['#3B82F6', '#60A5FA'],
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
    gradients: {
      primary: ['#60A5FA', '#3B82F6', '#2563EB'],
      secondary: ['#A5D8EF', '#85C1E2', '#6BAFD8'],
      sunset: ['#60A5FA', '#3B82F6', '#85C1E2'],
      sunrise: ['#85C1E2', '#5BA3EC', '#3B82F6'],
      ocean: ['#A5E8F3', '#85C1E2', '#6BAFD8'],
      forest: ['#D4F1E8', '#7FD8BE', '#66C3A8'],
      magic: ['#E5E8F5', '#C7CEEA', '#FFB6B9'],
      royal: ['#9D84FF', '#7B68EE', '#6A5ACD'],
      success: ['#6EE7B7', '#10B981', '#059669'],
      premium: ['#FFD700', '#3B82F6', '#2563EB'],
      glassMorphism: ['rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0.3)'],
      glassMorphismDark: ['rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 0.1)'],
    },
    shadow: {
      light: 'rgba(0, 0, 0, 0.03)',
      medium: 'rgba(0, 0, 0, 0.08)',
      dark: 'rgba(0, 0, 0, 0.15)',
      darker: 'rgba(0, 0, 0, 0.25)',
      colored: 'rgba(59, 130, 246, 0.25)',
      coloredLight: 'rgba(59, 130, 246, 0.15)',
      purple: 'rgba(199, 206, 234, 0.4)',
      blue: 'rgba(133, 193, 226, 0.4)',
      green: 'rgba(168, 230, 207, 0.4)',
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.7)',
      backgroundDark: 'rgba(255, 255, 255, 0.5)',
      border: 'rgba(255, 255, 255, 0.8)',
      borderDark: 'rgba(255, 255, 255, 0.3)',
      overlay: 'rgba(0, 0, 0, 0.05)',
    },
  },
};

// Rose Pink Theme
export const PINK_THEME: ColorScheme = {
  id: 'pink',
  name: 'Rose Garden',
  emoji: '🌸',
  colors: {
    primary: '#FF6B9D',
    primaryDark: '#FF5089',
    primaryLight: '#FF8FB3',
    secondary: '#FFB6B9',
    secondaryDark: '#FF9BA0',
    secondaryLight: '#FFD4D8',
    background: '#FFF5F7',
    backgroundGradient: ['#FFFAFC', '#FFF5F7', '#FFEFF2'],
    cardBackground: '#FFFFFF',
    cardGradient: ['#FFFFFF', '#FFFAFC'],
    text: {
      primary: '#1A1F36',
      secondary: '#6C7A89',
      light: '#ADB5BD',
      inverse: '#FFFFFF',
      gradient: ['#FF6B9D', '#FF8FB3'],
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
    gradients: {
      primary: ['#FF8FB3', '#FF6B9D', '#FF5089'],
      secondary: ['#FFD4D8', '#FFB6B9', '#FF9BA0'],
      sunset: ['#FF8FB3', '#FF6B9D', '#FFB6B9'],
      sunrise: ['#FFB6B9', '#FF93A8', '#FF6B9D'],
      ocean: ['#A5E8F3', '#85C1E2', '#6BAFD8'],
      forest: ['#D4F1E8', '#7FD8BE', '#66C3A8'],
      magic: ['#E5E8F5', '#C7CEEA', '#FFB6B9'],
      royal: ['#9D84FF', '#7B68EE', '#6A5ACD'],
      success: ['#6EE7B7', '#10B981', '#059669'],
      premium: ['#FFD700', '#FF6B9D', '#FF5089'],
      glassMorphism: ['rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0.3)'],
      glassMorphismDark: ['rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 0.1)'],
    },
    shadow: {
      light: 'rgba(0, 0, 0, 0.03)',
      medium: 'rgba(0, 0, 0, 0.08)',
      dark: 'rgba(0, 0, 0, 0.15)',
      darker: 'rgba(0, 0, 0, 0.25)',
      colored: 'rgba(255, 107, 157, 0.25)',
      coloredLight: 'rgba(255, 107, 157, 0.15)',
      purple: 'rgba(199, 206, 234, 0.4)',
      blue: 'rgba(133, 193, 226, 0.4)',
      green: 'rgba(168, 230, 207, 0.4)',
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.7)',
      backgroundDark: 'rgba(255, 255, 255, 0.5)',
      border: 'rgba(255, 255, 255, 0.8)',
      borderDark: 'rgba(255, 255, 255, 0.3)',
      overlay: 'rgba(0, 0, 0, 0.05)',
    },
  },
};

// Emerald Green Theme
export const GREEN_THEME: ColorScheme = {
  id: 'green',
  name: 'Emerald Forest',
  emoji: '🌲',
  colors: {
    primary: '#10B981',
    primaryDark: '#059669',
    primaryLight: '#34D399',
    secondary: '#7FD8BE',
    secondaryDark: '#66C3A8',
    secondaryLight: '#A8E6CF',
    background: '#F0FDF4',
    backgroundGradient: ['#F9FFF9', '#F0FDF4', '#E8FBF0'],
    cardBackground: '#FFFFFF',
    cardGradient: ['#FFFFFF', '#F9FFF9'],
    text: {
      primary: '#1A1F36',
      secondary: '#6C7A89',
      light: '#ADB5BD',
      inverse: '#FFFFFF',
      gradient: ['#10B981', '#34D399'],
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
    gradients: {
      primary: ['#34D399', '#10B981', '#059669'],
      secondary: ['#A8E6CF', '#7FD8BE', '#66C3A8'],
      sunset: ['#34D399', '#10B981', '#7FD8BE'],
      sunrise: ['#7FD8BE', '#22C593', '#10B981'],
      ocean: ['#A5E8F3', '#85C1E2', '#6BAFD8'],
      forest: ['#D4F1E8', '#7FD8BE', '#66C3A8'],
      magic: ['#E5E8F5', '#C7CEEA', '#FFB6B9'],
      royal: ['#9D84FF', '#7B68EE', '#6A5ACD'],
      success: ['#6EE7B7', '#10B981', '#059669'],
      premium: ['#FFD700', '#10B981', '#059669'],
      glassMorphism: ['rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0.3)'],
      glassMorphismDark: ['rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 0.1)'],
    },
    shadow: {
      light: 'rgba(0, 0, 0, 0.03)',
      medium: 'rgba(0, 0, 0, 0.08)',
      dark: 'rgba(0, 0, 0, 0.15)',
      darker: 'rgba(0, 0, 0, 0.25)',
      colored: 'rgba(16, 185, 129, 0.25)',
      coloredLight: 'rgba(16, 185, 129, 0.15)',
      purple: 'rgba(199, 206, 234, 0.4)',
      blue: 'rgba(133, 193, 226, 0.4)',
      green: 'rgba(168, 230, 207, 0.4)',
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.7)',
      backgroundDark: 'rgba(255, 255, 255, 0.5)',
      border: 'rgba(255, 255, 255, 0.8)',
      borderDark: 'rgba(255, 255, 255, 0.3)',
      overlay: 'rgba(0, 0, 0, 0.05)',
    },
  },
};

// Sunset Orange Theme
export const ORANGE_THEME: ColorScheme = {
  id: 'orange',
  name: 'Sunset Orange',
  emoji: '🌅',
  colors: {
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
    glass: {
      background: 'rgba(255, 255, 255, 0.7)',
      backgroundDark: 'rgba(255, 255, 255, 0.5)',
      border: 'rgba(255, 255, 255, 0.8)',
      borderDark: 'rgba(255, 255, 255, 0.3)',
      overlay: 'rgba(0, 0, 0, 0.05)',
    },
  },
};

// All available themes
export const COLOR_SCHEMES: ColorScheme[] = [
  MINT_THEME,
  PURPLE_THEME,
  BLUE_THEME,
  PINK_THEME,
  GREEN_THEME,
  ORANGE_THEME,
];

// Default theme
export const DEFAULT_THEME = MINT_THEME;

// Helper function to get theme by ID
export function getThemeById(id: string): ColorScheme {
  return COLOR_SCHEMES.find(scheme => scheme.id === id) || DEFAULT_THEME;
}
