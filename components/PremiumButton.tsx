import { BORDER_RADIUS,COLORS,FONT_SIZES,FONT_WEIGHTS,SHADOWS,SPACING } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import Animated,{
useAnimatedStyle,
useSharedValue,
withSpring,
withTiming
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PremiumButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  gradient?: readonly [string, string, ...string[]];
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
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const shadowScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const shadowStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: shadowScale.value }],
    };
  });

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
      opacity.value = withTiming(0.9, { duration: 100 });
      shadowScale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      opacity.value = withTiming(1, { duration: 150 });
      shadowScale.value = withSpring(1, { damping: 15, stiffness: 400 });
    }
  };

  const handlePress = () => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: BORDER_RADIUS.xl,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: SPACING.sm,
    };

    // Size styles with premium spacing
    const sizeStyles = {
      small: {
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.md,
        minHeight: 40,
      },
      medium: {
        paddingHorizontal: SPACING.xxl,
        paddingVertical: SPACING.lg,
        minHeight: 52,
      },
      large: {
        paddingHorizontal: SPACING.xxxl,
        paddingVertical: SPACING.xl,
        minHeight: 60,
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
        return ['transparent', 'transparent'] as const;
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
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: disabled || loading }}
        style={[animatedStyle, shadowStyle, style]}
      >
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            containerStyle,
            variant === 'primary' ? SHADOWS.lg : SHADOWS.md,
          ]}
        >
          {renderContent()}
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  // Outline and ghost variants
  const outlineStyle: ViewStyle = {
    borderWidth: variant === 'outline' ? 2 : 0,
    borderColor: COLORS.primary,
    backgroundColor: variant === 'ghost' ? 'transparent' : COLORS.cardBackground,
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading }}
      style={[
        containerStyle,
        outlineStyle,
        variant === 'outline' && SHADOWS.sm,
        animatedStyle,
        style,
      ]}
    >
      {renderContent()}
    </AnimatedPressable>
  );
};
