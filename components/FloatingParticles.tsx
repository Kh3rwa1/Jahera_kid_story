import { randomChoice, randomFloat } from '@/utils/secureRandom';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useIsFocused } from '@react-navigation/native';

interface Particle {
  id: number;
  size: number;
  startX: number;
  startY: number;
  delay: number;
  duration: number;
  colors: readonly [string, string, ...string[]];
}

const FloatingParticle: React.FC<{ particle: Particle; winHeight: number; isFocused: boolean }> = React.memo(({ particle, winHeight, isFocused }) => {
  const translateY = useSharedValue(particle.startY);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    if (!isFocused) {
      cancelAnimation(translateY);
      cancelAnimation(translateX);
      cancelAnimation(opacity);
      cancelAnimation(scale);
      opacity.value = 0;
      return;
    }

    opacity.value = withDelay(
      particle.delay,
      withTiming(0.6, { duration: 800, easing: Easing.out(Easing.ease) })
    );
    scale.value = withDelay(
      particle.delay,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.back(1.2)) })
    );

    translateY.value = withDelay(
      particle.delay,
      withRepeat(
        withSequence(
          withTiming(-winHeight * 0.15, { duration: particle.duration, easing: Easing.inOut(Easing.ease) }),
          withTiming(particle.startY, { duration: particle.duration, easing: Easing.inOut(Easing.ease) })
        ),
        -1, true
      )
    );
    translateX.value = withDelay(
      particle.delay,
      withRepeat(
        withSequence(
          withTiming(20, { duration: particle.duration * 0.7, easing: Easing.inOut(Easing.ease) }),
          withTiming(-20, { duration: particle.duration * 0.7, easing: Easing.inOut(Easing.ease) })
        ),
        -1, true
      )
    );
  }, [isFocused]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: particle.startX + translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.particle, { width: particle.size, height: particle.size, borderRadius: particle.size / 2 }, style]}>
      <LinearGradient
        colors={particle.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
});

const PARTICLE_GRADIENTS: readonly [string, string, ...string[]][] = [
  ['#FFD700', '#FFA500'],
  ['#FF69B4', '#FF1493'],
  ['#87CEEB', '#4169E1'],
  ['#98FB98', '#32CD32'],
  ['#DDA0DD', '#9370DB'],
  ['#FFB6C1', '#FF69B4'],
];

interface FloatingParticlesProps {
  count?: number;
}

export const FloatingParticles: React.FC<FloatingParticlesProps> = React.memo(({ count = 5 }) => {
  const { width, height } = useWindowDimensions();
  let isFocused = true;
  try {
    isFocused = useIsFocused();
  } catch (_e) {
    isFocused = true;
  }

  const particles = React.useMemo<Particle[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      size: randomFloat(4, 10),
      startX: randomFloat(0, width),
      startY: randomFloat(0, height),
      delay: i * 200,
      duration: randomFloat(4000, 7000),
      colors: randomChoice(PARTICLE_GRADIENTS),
    }));
  }, [count, width, height]);

  if (!isFocused) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map(p => (
        <FloatingParticle key={p.id} particle={p} winHeight={height} isFocused={isFocused} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particle: {
    position: 'absolute',
    overflow: 'hidden',
  },
});
