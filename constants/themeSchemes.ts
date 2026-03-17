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
    primary: '#00C4B4',
    primaryDark: '#00A89A',
    primaryLight: '#4DD9D0',
    secondary: '#7BFFE8',
    secondaryDark: '#56F5DA',
    secondaryLight: '#AAFFF4',
    background: '#E8FFFE',
    backgroundGradient: ['#F5FFFE', '#E8FFFE', '#D0FAF8'],
    cardBackground: '#FFFFFF',
    cardGradient: ['#FFFFFF', '#F0FFFE'],
    text: {
      primary: '#0D2B29',
      secondary: '#4A7370',
      light: '#8BB8B5',
      inverse: '#FFFFFF',
      gradient: ['#00C4B4', '#4DD9D0'],
    },
    categoryColors: {
      green: '#52D98A',
      greenGradient: ['#CFFCE1', '#52D98A', '#29C470'],
      teal: '#00C4B4',
      tealGradient: ['#AAFFF4', '#00C4B4', '#00A89A'],
      peach: '#FF8C8F',
      peachGradient: ['#FFD0D2', '#FF8C8F', '#FF6B6F'],
      purple: '#AC8EFF',
      purpleGradient: ['#E5DCFF', '#AC8EFF', '#8B6BFF'],
      blue: '#4CB8FF',
      blueGradient: ['#C0E8FF', '#4CB8FF', '#22A3FF'],
    },
    accent: {
      gold: '#FFCC00',
      goldGradient: ['#FFF5B8', '#FFCC00', '#FFB300'],
      rose: '#FF3D82',
      roseGradient: ['#FFBBD4', '#FF3D82', '#FF1A6B'],
      mint: '#7BFFE8',
      mintGradient: ['#D0FAF8', '#7BFFE8', '#56F5DA'],
      lavender: '#C87FFF',
      lavenderGradient: ['#F0D9FF', '#C87FFF', '#B25FFF'],
    },
    success: '#00C853',
    successLight: '#69F0AE',
    error: '#FF1744',
    errorLight: '#FF8A80',
    warning: '#FF9500',
    warningLight: '#FFD180',
    info: '#2979FF',
    infoLight: '#82B1FF',
    gradients: {
      primary: ['#4DD9D0', '#00C4B4', '#00A89A'],
      secondary: ['#AAFFF4', '#7BFFE8', '#56F5DA'],
      sunset: ['#FF6FD8', '#00C4B4', '#7BFFE8'],
      sunrise: ['#7BFFE8', '#00C4B4', '#FFCC00'],
      ocean: ['#4CB8FF', '#00C4B4', '#00A89A'],
      forest: ['#69F0AE', '#00C853', '#00A844'],
      magic: ['#C87FFF', '#FF3D82', '#FF9500'],
      royal: ['#AC8EFF', '#7B5FFF', '#5A3FFF'],
      success: ['#69F0AE', '#00C853', '#00A844'],
      premium: ['#FFCC00', '#00C4B4', '#00A89A'],
      glassMorphism: ['rgba(255, 255, 255, 0.75)', 'rgba(255, 255, 255, 0.35)'],
      glassMorphismDark: ['rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 0.1)'],
    },
    shadow: {
      light: 'rgba(0, 196, 180, 0.06)',
      medium: 'rgba(0, 196, 180, 0.14)',
      dark: 'rgba(0, 0, 0, 0.18)',
      darker: 'rgba(0, 0, 0, 0.3)',
      colored: 'rgba(0, 196, 180, 0.35)',
      coloredLight: 'rgba(0, 196, 180, 0.2)',
      purple: 'rgba(172, 142, 255, 0.4)',
      blue: 'rgba(76, 184, 255, 0.4)',
      green: 'rgba(82, 217, 138, 0.4)',
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.75)',
      backgroundDark: 'rgba(255, 255, 255, 0.55)',
      border: 'rgba(255, 255, 255, 0.85)',
      borderDark: 'rgba(255, 255, 255, 0.35)',
      overlay: 'rgba(0, 196, 180, 0.05)',
    },
  },
};

// Purple Dream Theme
export const PURPLE_THEME: ColorScheme = {
  id: 'purple',
  name: 'Purple Dream',
  emoji: '💜',
  colors: {
    primary: '#7C3AED',
    primaryDark: '#6D28D9',
    primaryLight: '#A78BFA',
    secondary: '#DDD6FE',
    secondaryDark: '#C4B5FD',
    secondaryLight: '#EDE9FE',
    background: '#F3EEFF',
    backgroundGradient: ['#FAF5FF', '#F3EEFF', '#EDE0FF'],
    cardBackground: '#FFFFFF',
    cardGradient: ['#FFFFFF', '#F9F5FF'],
    text: {
      primary: '#1E0A3C',
      secondary: '#5B4080',
      light: '#9D82C0',
      inverse: '#FFFFFF',
      gradient: ['#7C3AED', '#A78BFA'],
    },
    categoryColors: {
      green: '#52D98A',
      greenGradient: ['#CFFCE1', '#52D98A', '#29C470'],
      teal: '#00C4B4',
      tealGradient: ['#AAFFF4', '#00C4B4', '#00A89A'],
      peach: '#FF8C8F',
      peachGradient: ['#FFD0D2', '#FF8C8F', '#FF6B6F'],
      purple: '#7C3AED',
      purpleGradient: ['#EDE9FE', '#7C3AED', '#6D28D9'],
      blue: '#4CB8FF',
      blueGradient: ['#C0E8FF', '#4CB8FF', '#22A3FF'],
    },
    accent: {
      gold: '#FFCC00',
      goldGradient: ['#FFF5B8', '#FFCC00', '#FFB300'],
      rose: '#FF3D82',
      roseGradient: ['#FFBBD4', '#FF3D82', '#FF1A6B'],
      mint: '#7BFFE8',
      mintGradient: ['#D0FAF8', '#7BFFE8', '#56F5DA'],
      lavender: '#C87FFF',
      lavenderGradient: ['#F0D9FF', '#C87FFF', '#B25FFF'],
    },
    success: '#00C853',
    successLight: '#69F0AE',
    error: '#FF1744',
    errorLight: '#FF8A80',
    warning: '#FF9500',
    warningLight: '#FFD180',
    info: '#2979FF',
    infoLight: '#82B1FF',
    gradients: {
      primary: ['#A78BFA', '#7C3AED', '#6D28D9'],
      secondary: ['#EDE9FE', '#DDD6FE', '#C4B5FD'],
      sunset: ['#FF3D82', '#7C3AED', '#DDD6FE'],
      sunrise: ['#DDD6FE', '#9B5DE5', '#7C3AED'],
      ocean: ['#4CB8FF', '#2979FF', '#1A5FE0'],
      forest: ['#69F0AE', '#00C853', '#00A844'],
      magic: ['#FF3D82', '#7C3AED', '#FFCC00'],
      royal: ['#A78BFA', '#7C3AED', '#4C1D95'],
      success: ['#69F0AE', '#00C853', '#00A844'],
      premium: ['#FFCC00', '#7C3AED', '#6D28D9'],
      glassMorphism: ['rgba(255, 255, 255, 0.75)', 'rgba(255, 255, 255, 0.35)'],
      glassMorphismDark: ['rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 0.1)'],
    },
    shadow: {
      light: 'rgba(124, 58, 237, 0.06)',
      medium: 'rgba(124, 58, 237, 0.14)',
      dark: 'rgba(0, 0, 0, 0.18)',
      darker: 'rgba(0, 0, 0, 0.3)',
      colored: 'rgba(124, 58, 237, 0.35)',
      coloredLight: 'rgba(124, 58, 237, 0.2)',
      purple: 'rgba(172, 142, 255, 0.4)',
      blue: 'rgba(76, 184, 255, 0.4)',
      green: 'rgba(82, 217, 138, 0.4)',
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.75)',
      backgroundDark: 'rgba(255, 255, 255, 0.55)',
      border: 'rgba(255, 255, 255, 0.85)',
      borderDark: 'rgba(255, 255, 255, 0.35)',
      overlay: 'rgba(124, 58, 237, 0.05)',
    },
  },
};

// Ocean Blue Theme
export const BLUE_THEME: ColorScheme = {
  id: 'blue',
  name: 'Ocean Blue',
  emoji: '🌊',
  colors: {
    primary: '#0066FF',
    primaryDark: '#0050CC',
    primaryLight: '#4D9FFF',
    secondary: '#66CFFF',
    secondaryDark: '#3ABFFF',
    secondaryLight: '#99DFFF',
    background: '#E8F4FF',
    backgroundGradient: ['#F0F8FF', '#E8F4FF', '#D0EBFF'],
    cardBackground: '#FFFFFF',
    cardGradient: ['#FFFFFF', '#F0F8FF'],
    text: {
      primary: '#001A4D',
      secondary: '#2A5080',
      light: '#6A96C0',
      inverse: '#FFFFFF',
      gradient: ['#0066FF', '#4D9FFF'],
    },
    categoryColors: {
      green: '#52D98A',
      greenGradient: ['#CFFCE1', '#52D98A', '#29C470'],
      teal: '#00C4B4',
      tealGradient: ['#AAFFF4', '#00C4B4', '#00A89A'],
      peach: '#FF8C8F',
      peachGradient: ['#FFD0D2', '#FF8C8F', '#FF6B6F'],
      purple: '#AC8EFF',
      purpleGradient: ['#E5DCFF', '#AC8EFF', '#8B6BFF'],
      blue: '#0066FF',
      blueGradient: ['#C0DCFF', '#0066FF', '#0050CC'],
    },
    accent: {
      gold: '#FFCC00',
      goldGradient: ['#FFF5B8', '#FFCC00', '#FFB300'],
      rose: '#FF3D82',
      roseGradient: ['#FFBBD4', '#FF3D82', '#FF1A6B'],
      mint: '#7BFFE8',
      mintGradient: ['#D0FAF8', '#7BFFE8', '#56F5DA'],
      lavender: '#C87FFF',
      lavenderGradient: ['#F0D9FF', '#C87FFF', '#B25FFF'],
    },
    success: '#00C853',
    successLight: '#69F0AE',
    error: '#FF1744',
    errorLight: '#FF8A80',
    warning: '#FF9500',
    warningLight: '#FFD180',
    info: '#0066FF',
    infoLight: '#82B1FF',
    gradients: {
      primary: ['#4D9FFF', '#0066FF', '#0050CC'],
      secondary: ['#99DFFF', '#66CFFF', '#3ABFFF'],
      sunset: ['#66CFFF', '#0066FF', '#FF3D82'],
      sunrise: ['#66CFFF', '#4D9FFF', '#0066FF'],
      ocean: ['#66CFFF', '#0066FF', '#0050CC'],
      forest: ['#69F0AE', '#00C853', '#00A844'],
      magic: ['#C87FFF', '#0066FF', '#00C4B4'],
      royal: ['#4D9FFF', '#0066FF', '#003D99'],
      success: ['#69F0AE', '#00C853', '#00A844'],
      premium: ['#FFCC00', '#0066FF', '#0050CC'],
      glassMorphism: ['rgba(255, 255, 255, 0.75)', 'rgba(255, 255, 255, 0.35)'],
      glassMorphismDark: ['rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 0.1)'],
    },
    shadow: {
      light: 'rgba(0, 102, 255, 0.06)',
      medium: 'rgba(0, 102, 255, 0.14)',
      dark: 'rgba(0, 0, 0, 0.18)',
      darker: 'rgba(0, 0, 0, 0.3)',
      colored: 'rgba(0, 102, 255, 0.35)',
      coloredLight: 'rgba(0, 102, 255, 0.2)',
      purple: 'rgba(172, 142, 255, 0.4)',
      blue: 'rgba(76, 184, 255, 0.4)',
      green: 'rgba(82, 217, 138, 0.4)',
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.75)',
      backgroundDark: 'rgba(255, 255, 255, 0.55)',
      border: 'rgba(255, 255, 255, 0.85)',
      borderDark: 'rgba(255, 255, 255, 0.35)',
      overlay: 'rgba(0, 102, 255, 0.05)',
    },
  },
};

// Rose Pink Theme
export const PINK_THEME: ColorScheme = {
  id: 'pink',
  name: 'Rose Garden',
  emoji: '🌸',
  colors: {
    primary: '#FF1A6B',
    primaryDark: '#E0005A',
    primaryLight: '#FF6699',
    secondary: '#FF8FBE',
    secondaryDark: '#FF6699',
    secondaryLight: '#FFB8D5',
    background: '#FFF0F5',
    backgroundGradient: ['#FFF8FB', '#FFF0F5', '#FFE0ED'],
    cardBackground: '#FFFFFF',
    cardGradient: ['#FFFFFF', '#FFF8FB'],
    text: {
      primary: '#330015',
      secondary: '#7A2248',
      light: '#C07090',
      inverse: '#FFFFFF',
      gradient: ['#FF1A6B', '#FF6699'],
    },
    categoryColors: {
      green: '#52D98A',
      greenGradient: ['#CFFCE1', '#52D98A', '#29C470'],
      teal: '#00C4B4',
      tealGradient: ['#AAFFF4', '#00C4B4', '#00A89A'],
      peach: '#FF8C8F',
      peachGradient: ['#FFD0D2', '#FF8C8F', '#FF6B6F'],
      purple: '#AC8EFF',
      purpleGradient: ['#E5DCFF', '#AC8EFF', '#8B6BFF'],
      blue: '#4CB8FF',
      blueGradient: ['#C0E8FF', '#4CB8FF', '#22A3FF'],
    },
    accent: {
      gold: '#FFCC00',
      goldGradient: ['#FFF5B8', '#FFCC00', '#FFB300'],
      rose: '#FF1A6B',
      roseGradient: ['#FFBBD4', '#FF1A6B', '#E0005A'],
      mint: '#7BFFE8',
      mintGradient: ['#D0FAF8', '#7BFFE8', '#56F5DA'],
      lavender: '#C87FFF',
      lavenderGradient: ['#F0D9FF', '#C87FFF', '#B25FFF'],
    },
    success: '#00C853',
    successLight: '#69F0AE',
    error: '#FF1744',
    errorLight: '#FF8A80',
    warning: '#FF9500',
    warningLight: '#FFD180',
    info: '#2979FF',
    infoLight: '#82B1FF',
    gradients: {
      primary: ['#FF6699', '#FF1A6B', '#E0005A'],
      secondary: ['#FFB8D5', '#FF8FBE', '#FF6699'],
      sunset: ['#FF6699', '#FF1A6B', '#FF9500'],
      sunrise: ['#FF8FBE', '#FF4D90', '#FF1A6B'],
      ocean: ['#4CB8FF', '#2979FF', '#1A5FE0'],
      forest: ['#69F0AE', '#00C853', '#00A844'],
      magic: ['#C87FFF', '#FF1A6B', '#FFCC00'],
      royal: ['#FF6699', '#FF1A6B', '#99003B'],
      success: ['#69F0AE', '#00C853', '#00A844'],
      premium: ['#FFCC00', '#FF1A6B', '#E0005A'],
      glassMorphism: ['rgba(255, 255, 255, 0.75)', 'rgba(255, 255, 255, 0.35)'],
      glassMorphismDark: ['rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 0.1)'],
    },
    shadow: {
      light: 'rgba(255, 26, 107, 0.06)',
      medium: 'rgba(255, 26, 107, 0.14)',
      dark: 'rgba(0, 0, 0, 0.18)',
      darker: 'rgba(0, 0, 0, 0.3)',
      colored: 'rgba(255, 26, 107, 0.35)',
      coloredLight: 'rgba(255, 26, 107, 0.2)',
      purple: 'rgba(172, 142, 255, 0.4)',
      blue: 'rgba(76, 184, 255, 0.4)',
      green: 'rgba(82, 217, 138, 0.4)',
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.75)',
      backgroundDark: 'rgba(255, 255, 255, 0.55)',
      border: 'rgba(255, 255, 255, 0.85)',
      borderDark: 'rgba(255, 255, 255, 0.35)',
      overlay: 'rgba(255, 26, 107, 0.05)',
    },
  },
};

// Emerald Green Theme
export const GREEN_THEME: ColorScheme = {
  id: 'green',
  name: 'Emerald Forest',
  emoji: '🌲',
  colors: {
    primary: '#00C853',
    primaryDark: '#009624',
    primaryLight: '#69F0AE',
    secondary: '#CCFF90',
    secondaryDark: '#AEEA00',
    secondaryLight: '#E6FFD0',
    background: '#E8FFEE',
    backgroundGradient: ['#F5FFF8', '#E8FFEE', '#D0FFE0'],
    cardBackground: '#FFFFFF',
    cardGradient: ['#FFFFFF', '#F2FFF5'],
    text: {
      primary: '#001A0D',
      secondary: '#1A5C30',
      light: '#5A9C70',
      inverse: '#FFFFFF',
      gradient: ['#00C853', '#69F0AE'],
    },
    categoryColors: {
      green: '#00C853',
      greenGradient: ['#CFFCE1', '#00C853', '#009624'],
      teal: '#00C4B4',
      tealGradient: ['#AAFFF4', '#00C4B4', '#00A89A'],
      peach: '#FF8C8F',
      peachGradient: ['#FFD0D2', '#FF8C8F', '#FF6B6F'],
      purple: '#AC8EFF',
      purpleGradient: ['#E5DCFF', '#AC8EFF', '#8B6BFF'],
      blue: '#4CB8FF',
      blueGradient: ['#C0E8FF', '#4CB8FF', '#22A3FF'],
    },
    accent: {
      gold: '#FFCC00',
      goldGradient: ['#FFF5B8', '#FFCC00', '#FFB300'],
      rose: '#FF3D82',
      roseGradient: ['#FFBBD4', '#FF3D82', '#FF1A6B'],
      mint: '#69F0AE',
      mintGradient: ['#D0FAF0', '#69F0AE', '#00C853'],
      lavender: '#C87FFF',
      lavenderGradient: ['#F0D9FF', '#C87FFF', '#B25FFF'],
    },
    success: '#00C853',
    successLight: '#69F0AE',
    error: '#FF1744',
    errorLight: '#FF8A80',
    warning: '#FF9500',
    warningLight: '#FFD180',
    info: '#2979FF',
    infoLight: '#82B1FF',
    gradients: {
      primary: ['#69F0AE', '#00C853', '#009624'],
      secondary: ['#E6FFD0', '#CCFF90', '#AEEA00'],
      sunset: ['#69F0AE', '#00C853', '#FFCC00'],
      sunrise: ['#CCFF90', '#52D98A', '#00C853'],
      ocean: ['#4CB8FF', '#2979FF', '#1A5FE0'],
      forest: ['#CCFF90', '#00C853', '#009624'],
      magic: ['#C87FFF', '#00C853', '#FFCC00'],
      royal: ['#69F0AE', '#00C853', '#005C22'],
      success: ['#69F0AE', '#00C853', '#009624'],
      premium: ['#FFCC00', '#00C853', '#009624'],
      glassMorphism: ['rgba(255, 255, 255, 0.75)', 'rgba(255, 255, 255, 0.35)'],
      glassMorphismDark: ['rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 0.1)'],
    },
    shadow: {
      light: 'rgba(0, 200, 83, 0.06)',
      medium: 'rgba(0, 200, 83, 0.14)',
      dark: 'rgba(0, 0, 0, 0.18)',
      darker: 'rgba(0, 0, 0, 0.3)',
      colored: 'rgba(0, 200, 83, 0.35)',
      coloredLight: 'rgba(0, 200, 83, 0.2)',
      purple: 'rgba(172, 142, 255, 0.4)',
      blue: 'rgba(76, 184, 255, 0.4)',
      green: 'rgba(82, 217, 138, 0.4)',
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.75)',
      backgroundDark: 'rgba(255, 255, 255, 0.55)',
      border: 'rgba(255, 255, 255, 0.85)',
      borderDark: 'rgba(255, 255, 255, 0.35)',
      overlay: 'rgba(0, 200, 83, 0.05)',
    },
  },
};

// Sunset Orange Theme
export const ORANGE_THEME: ColorScheme = {
  id: 'orange',
  name: 'Sunset Orange',
  emoji: '🌅',
  colors: {
    primary: '#FF5500',
    primaryDark: '#CC4400',
    primaryLight: '#FF8040',
    secondary: '#FFD000',
    secondaryDark: '#FFB300',
    secondaryLight: '#FFE566',
    background: '#FFF3E8',
    backgroundGradient: ['#FFF8F2', '#FFF3E8', '#FFE8D0'],
    cardBackground: '#FFFFFF',
    cardGradient: ['#FFFFFF', '#FFF8F4'],
    text: {
      primary: '#2B0D00',
      secondary: '#7A3010',
      light: '#C07050',
      inverse: '#FFFFFF',
      gradient: ['#FF5500', '#FF8040'],
    },
    categoryColors: {
      green: '#52D98A',
      greenGradient: ['#CFFCE1', '#52D98A', '#29C470'],
      teal: '#00C4B4',
      tealGradient: ['#AAFFF4', '#00C4B4', '#00A89A'],
      peach: '#FF8C8F',
      peachGradient: ['#FFD0D2', '#FF8C8F', '#FF6B6F'],
      purple: '#AC8EFF',
      purpleGradient: ['#E5DCFF', '#AC8EFF', '#8B6BFF'],
      blue: '#4CB8FF',
      blueGradient: ['#C0E8FF', '#4CB8FF', '#22A3FF'],
    },
    accent: {
      gold: '#FFD000',
      goldGradient: ['#FFF5B8', '#FFD000', '#FFB300'],
      rose: '#FF3D82',
      roseGradient: ['#FFBBD4', '#FF3D82', '#FF1A6B'],
      mint: '#7BFFE8',
      mintGradient: ['#D0FAF8', '#7BFFE8', '#56F5DA'],
      lavender: '#C87FFF',
      lavenderGradient: ['#F0D9FF', '#C87FFF', '#B25FFF'],
    },
    success: '#00C853',
    successLight: '#69F0AE',
    error: '#FF1744',
    errorLight: '#FF8A80',
    warning: '#FF9500',
    warningLight: '#FFD180',
    info: '#2979FF',
    infoLight: '#82B1FF',
    gradients: {
      primary: ['#FF8040', '#FF5500', '#CC4400'],
      secondary: ['#FFE566', '#FFD000', '#FFB300'],
      sunset: ['#FF1A6B', '#FF5500', '#FFD000'],
      sunrise: ['#FFD000', '#FF8040', '#FF5500'],
      ocean: ['#4CB8FF', '#2979FF', '#1A5FE0'],
      forest: ['#69F0AE', '#00C853', '#00A844'],
      magic: ['#C87FFF', '#FF5500', '#FFD000'],
      royal: ['#FF8040', '#FF5500', '#993300'],
      success: ['#69F0AE', '#00C853', '#00A844'],
      premium: ['#FFD000', '#FF5500', '#CC4400'],
      glassMorphism: ['rgba(255, 255, 255, 0.75)', 'rgba(255, 255, 255, 0.35)'],
      glassMorphismDark: ['rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 0.1)'],
    },
    shadow: {
      light: 'rgba(255, 85, 0, 0.06)',
      medium: 'rgba(255, 85, 0, 0.14)',
      dark: 'rgba(0, 0, 0, 0.18)',
      darker: 'rgba(0, 0, 0, 0.3)',
      colored: 'rgba(255, 85, 0, 0.35)',
      coloredLight: 'rgba(255, 85, 0, 0.2)',
      purple: 'rgba(172, 142, 255, 0.4)',
      blue: 'rgba(76, 184, 255, 0.4)',
      green: 'rgba(82, 217, 138, 0.4)',
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.75)',
      backgroundDark: 'rgba(255, 255, 255, 0.55)',
      border: 'rgba(255, 255, 255, 0.85)',
      borderDark: 'rgba(255, 255, 255, 0.35)',
      overlay: 'rgba(255, 85, 0, 0.05)',
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
