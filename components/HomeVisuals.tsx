import { useEffect, ReactNode } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
  interpolate,
  withSpring,
} from 'react-native-reanimated';
import { useFloat, usePulse } from '@/utils/animations';

export function FloatAnim({ children, delay = 0 }: Readonly<{ children: ReactNode; delay?: number }>) {
  const floatStyle = useFloat(7, 2800, delay);
  return <Animated.View style={floatStyle}>{children}</Animated.View>;
}

export function HeroShimmer({ styles }: Readonly<{ styles: { shimmerOverlay: StyleProp<ViewStyle> } }>) {
  const x = useSharedValue(-1);
  useEffect(() => {
    x.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(x);
  }, [x]);
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(x.value, [-1, 1], [-400, 400]) }],
  }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
      <Animated.View style={[styles.shimmerOverlay, shimmerStyle]} />
    </Animated.View>
  );
}

export function AnimatedStreakChip({ count, styles }: Readonly<{ count: number; styles: { streakChip: StyleProp<ViewStyle>; streakChipText: StyleProp<TextStyle> } }>) {
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);
  const pulseStyle = usePulse(0.95, 1.05);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 120 });
    opacity.value = withTiming(1, { duration: 300 });
  }, [opacity, scale]);
  
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  
  return (
    <Animated.View style={[styles.streakChip, { backgroundColor: '#FFF3E0' }, style, pulseStyle]}>
      <Animated.Text style={styles.streakChipText}>🔥 {count}</Animated.Text>
    </Animated.View>
  );
}
