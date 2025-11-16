import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '@/constants/theme';
import { hapticFeedback } from '@/utils/haptics';
import { createPressAnimation } from '@/utils/animations';

interface PremiumButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  gradient?: string[];
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  gradient,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const pressAnimation = createPressAnimation(scale, hapticFeedback.light);

  const handlePress = () => {
    if (!disabled && !loading) {
      hapticFeedback.medium();
      onPress();
    }
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: BORDER_RADIUS.lg,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: SPACING.sm,
    };

    // Size styles
    const sizeStyles = {
      small: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        minHeight: 36,
      },
      medium: {
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.md,
        minHeight: 48,
      },
      large: {
        paddingHorizontal: SPACING.xxl,
        paddingVertical: SPACING.lg,
        minHeight: 56,
      },
    };

    return { ...baseStyle, ...sizeStyles[size] };
  };

  const getTextStyle = (): TextStyle => {
    const sizeStyles = {
      small: { fontSize: FONT_SIZES.sm },
      medium: { fontSize: FONT_SIZES.md },
      large: { fontSize: FONT_SIZES.lg },
    };

    const variantStyles = {
      primary: { color: COLORS.text.inverse },
      secondary: { color: COLORS.text.primary },
      outline: { color: COLORS.primary },
      ghost: { color: COLORS.primary },
    };

    return {
      ...sizeStyles[size],
      ...variantStyles[variant],
      fontWeight: FONT_WEIGHTS.semibold,
    };
  };

  const getGradientColors = () => {
    if (gradient) return gradient;

    switch (variant) {
      case 'primary':
        return COLORS.gradients.primary;
      case 'secondary':
        return COLORS.gradients.secondary;
      default:
        return ['transparent', 'transparent'];
    }
  };

  const containerStyle: ViewStyle = {
    ...getButtonStyle(),
    ...(fullWidth && { width: '100%' }),
    opacity: disabled ? 0.5 : 1,
  };

  const renderContent = () => (
    <>
      {loading && <ActivityIndicator color={variant === 'primary' ? COLORS.text.inverse : COLORS.primary} />}
      {!loading && icon}
      {!loading && <Text style={[getTextStyle(), textStyle]}>{title}</Text>}
    </>
  );

  if (variant === 'primary' || variant === 'secondary') {
    return (
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        <TouchableOpacity
          onPress={handlePress}
          disabled={disabled || loading}
          activeOpacity={0.8}
          {...pressAnimation}
        >
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[containerStyle, variant === 'primary' ? SHADOWS.md : SHADOWS.sm]}
          >
            {renderContent()}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Outline and ghost variants
  const outlineStyle: ViewStyle = {
    borderWidth: variant === 'outline' ? 2 : 0,
    borderColor: COLORS.primary,
    backgroundColor: variant === 'ghost' ? 'transparent' : COLORS.cardBackground,
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[containerStyle, outlineStyle, variant === 'outline' && SHADOWS.sm]}
        {...pressAnimation}
      >
        {renderContent()}
      </TouchableOpacity>
    </Animated.View>
  );
};
