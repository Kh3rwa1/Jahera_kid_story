import { COLORS,TYPOGRAPHY } from '@/constants/theme';
import React from 'react';
import { Text,TextStyle } from 'react-native';

type TypographyVariant =
  | 'displayLarge'
  | 'displayMedium'
  | 'displaySmall'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'bodyLarge'
  | 'bodyMedium'
  | 'bodySmall'
  | 'caption'
  | 'captionBold'
  | 'label'
  | 'labelLarge';

type ColorVariant = 'primary' | 'secondary' | 'light' | 'inverse' | 'error' | 'success' | 'warning';

interface TypographyProps {
  variant?: TypographyVariant;
  color?: ColorVariant | string;
  align?: 'left' | 'center' | 'right' | 'justify';
  children: React.ReactNode;
  style?: TextStyle;
  numberOfLines?: number;
  accessibilityLabel?: string;
  accessibilityRole?: 'header' | 'text' | 'none';
  testID?: string;
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'bodyMedium',
  color = 'primary',
  align = 'left',
  children,
  style,
  numberOfLines,
  accessibilityLabel,
  accessibilityRole = 'text',
  testID,
}) => {
  const getColorValue = (colorProp: string): string => {
    const colorMap: Record<string, string> = {
      primary: COLORS.text.primary,
      secondary: COLORS.text.secondary,
      light: COLORS.text.light,
      inverse: COLORS.text.inverse,
      error: COLORS.error,
      success: COLORS.success,
      warning: COLORS.warning,
    };

    return colorMap[colorProp] || colorProp;
  };

  const textStyle: TextStyle = {
    ...TYPOGRAPHY[variant],
    color: getColorValue(color),
    textAlign: align,
  };

  // Determine accessibility role based on variant
  let accessRole = accessibilityRole;
  if (accessibilityRole === 'text') {
    if (variant.startsWith('h') || variant.startsWith('display')) {
      accessRole = 'header';
    }
  }

  return (
    <Text
      style={[textStyle, style]}
      numberOfLines={numberOfLines}
      accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : undefined)}
      accessibilityRole={accessRole}
      testID={testID}
    >
      {children}
    </Text>
  );
};
