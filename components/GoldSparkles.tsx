import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Star, Sparkles } from 'lucide-react-native';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  type: 'star' | 'sparkle';
}

const AnimatedSparkle: React.FC<{ sparkle: Sparkle }> = ({ sparkle }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Twinkle animation
    scale.value = withDelay(
      sparkle.delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }),
          withTiming(0.7, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 400, easing: Easing.in(Easing.ease) })
        ),
        -1,
        false
      )
    );

    opacity.value = withDelay(
      sparkle.delay,
      withRepeat(
        withSequence(
          withTiming(0.9, { duration: 600, easing: Easing.out(Easing.ease) }),
          withTiming(0.6, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.9, { duration: 600, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 400, easing: Easing.in(Easing.ease) })
        ),
        -1,
        false
      )
    );

    // Gentle rotation
    rotation.value = withDelay(
      sparkle.delay,
      withRepeat(
        withTiming(360, {
          duration: 4000,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: scale.value }, { rotateZ: `${rotation.value}deg` }],
      opacity: opacity.value,
    };
  });

  const Icon = sparkle.type === 'star' ? Star : Sparkles;

  return (
    <Animated.View
      style={[
        styles.sparkle,
        {
          left: sparkle.x,
          top: sparkle.y,
        },
        animatedStyle,
      ]}
    >
      <Icon size={sparkle.size} color="#FFD700" fill="#FFD700" strokeWidth={0} />
    </Animated.View>
  );
};

interface GoldSparklesProps {
  count?: number;
  width?: number;
  height?: number;
}

export const GoldSparkles: React.FC<GoldSparklesProps> = ({
  count = 8,
  width = 400,
  height = 400,
}) => {
  const sparkles: Sparkle[] = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * (width - 30),
    y: Math.random() * (height - 30),
    size: Math.random() * 12 + 12, // 12-24px
    delay: Math.random() * 2000,
    type: Math.random() > 0.5 ? 'star' : 'sparkle',
  }));

  return (
    <View style={[styles.container, { width, height }]} pointerEvents="none">
      {sparkles.map((sparkle) => (
        <AnimatedSparkle key={sparkle.id} sparkle={sparkle} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
  sparkle: {
    position: 'absolute',
  },
});
