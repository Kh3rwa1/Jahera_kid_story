import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  withSequence,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Particle {
  id: number;
  size: number;
  startX: number;
  startY: number;
  delay: number;
  duration: number;
  colors: string[];
}

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const FloatingParticle: React.FC<{ particle: Particle }> = ({ particle }) => {
  const translateY = useSharedValue(particle.startY);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    // Fade in and scale up
    opacity.value = withDelay(
      particle.delay,
      withTiming(0.6, { duration: 800, easing: Easing.out(Easing.ease) })
    );
    scale.value = withDelay(
      particle.delay,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.back(1.2)) })
    );

    // Float up
    translateY.value = withDelay(
      particle.delay,
      withRepeat(
        withTiming(-SCREEN_HEIGHT - 100, {
          duration: particle.duration,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );

    // Gentle horizontal sway
    translateX.value = withDelay(
      particle.delay,
      withRepeat(
        withSequence(
          withTiming(20, { duration: particle.duration / 4, easing: Easing.inOut(Easing.ease) }),
          withTiming(-20, { duration: particle.duration / 2, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: particle.duration / 4, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <AnimatedLinearGradient
      colors={particle.colors}
      style={[
        styles.particle,
        {
          width: particle.size,
          height: particle.size,
          left: particle.startX,
          top: particle.startY,
        },
        animatedStyle,
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    />
  );
};

interface FloatingParticlesProps {
  count?: number;
  colors?: string[][];
}

export const FloatingParticles: React.FC<FloatingParticlesProps> = ({
  count = 15,
  colors = [
    ['rgba(255, 215, 0, 0.3)', 'rgba(255, 215, 0, 0)'],
    ['rgba(78, 205, 196, 0.25)', 'rgba(78, 205, 196, 0)'],
    ['rgba(199, 206, 234, 0.3)', 'rgba(199, 206, 234, 0)'],
    ['rgba(255, 182, 185, 0.25)', 'rgba(255, 182, 185, 0)'],
    ['rgba(152, 255, 224, 0.3)', 'rgba(152, 255, 224, 0)'],
  ],
}) => {
  const particles: Particle[] = Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.random() * 40 + 20, // 20-60px
    startX: Math.random() * SCREEN_WIDTH,
    startY: SCREEN_HEIGHT + Math.random() * 200,
    delay: Math.random() * 3000,
    duration: Math.random() * 8000 + 12000, // 12-20 seconds
    colors: colors[Math.floor(Math.random() * colors.length)],
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle) => (
        <FloatingParticle key={particle.id} particle={particle} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    borderRadius: 999,
  },
});
