import React from 'react';
import { StyleSheet, ViewStyle, Pressable, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  intensity?: number; // Blur intensity (0-100)
  tint?: 'light' | 'dark' | 'default';
  gradient?: boolean;
  gradientColors?: string[];
  shadow?: keyof typeof SHADOWS;
  borderWidth?: number;
  borderColor?: string;
  padding?: keyof typeof SPACING;
  borderRadius?: keyof typeof BORDER_RADIUS;
  hapticFeedback?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  onPress,
  intensity = 30,
  tint = 'light',
  gradient = false,
  gradientColors = COLORS.gradients.glassMorphism,
  shadow = 'md',
  borderWidth = 1,
  borderColor = COLORS.glass.border,
  padding = 'lg',
  borderRadius = 'xl',
  hapticFeedback = true,
}) => {
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: scale.value }],
      opacity: interpolate(pressed.value, [0, 1], [1, 0.95]),
    };
  });

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
      pressed.value = withSpring(1);
      if (hapticFeedback) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      pressed.value = withSpring(0);
    }
  };

  const cardContent = (
    <View
      style={[
        styles.container,
        {
          padding: SPACING[padding],
          borderRadius: BORDER_RADIUS[borderRadius],
          borderWidth,
          borderColor,
        },
        SHADOWS[shadow],
        style,
      ]}
    >
      <BlurView
        intensity={intensity}
        tint={tint}
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: BORDER_RADIUS[borderRadius] },
        ]}
      />
      {gradient && (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: BORDER_RADIUS[borderRadius] },
          ]}
        />
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={animatedStyle}
      >
        {cardContent}
      </AnimatedPressable>
    );
  }

  return <View>{cardContent}</View>;
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});
