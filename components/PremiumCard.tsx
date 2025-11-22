import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PremiumCardProps {
  children: React.ReactNode;
  gradient?: string[];
  onPress?: () => void;
  style?: ViewStyle;
  shadow?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'colored' | 'coloredLight' | 'purple' | 'blue' | 'green';
  padding?: number;
  animated?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link' | 'none';
}

export const PremiumCard: React.FC<PremiumCardProps> = ({
  children,
  gradient,
  onPress,
  style,
  shadow = 'md',
  padding = SPACING.lg,
  animated = true,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    if (onPress && animated) {
      scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
      opacity.value = withTiming(0.92, { duration: 100 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    if (onPress && animated) {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      opacity.value = withTiming(1, { duration: 150 });
    }
  };

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const shadowStyle = SHADOWS[shadow];
  const cardStyle: ViewStyle = {
    borderRadius: BORDER_RADIUS.xl,
    padding,
    ...shadowStyle,
  };

  if (gradient) {
    if (onPress) {
      return (
        <AnimatedPressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[animatedStyle, style]}
        >
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={cardStyle}
          >
            {children}
          </LinearGradient>
        </AnimatedPressable>
      );
    }

    return (
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[cardStyle, style]}
      >
        {children}
      </LinearGradient>
    );
  }

  // Non-gradient card
  const baseCardStyle: ViewStyle = {
    ...cardStyle,
    backgroundColor: COLORS.cardBackground,
  };

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[baseCardStyle, animatedStyle, style]}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return <View style={[baseCardStyle, style]}>{children}</View>;
};
