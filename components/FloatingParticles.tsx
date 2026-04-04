import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
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

interface Particle {
  id: number;
  size: number;
  startX: number;
  startY: number;
  delay: number;
  duration: number;
  colors: readonly [string, string, ...string[]];
}

const FloatingParticle: React.FC<{ particle: Particle; winHeight: number }> = ({ particle, winHeight }) => {
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
        withTiming(-winHeight - 100, {
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
  }, [winHeight, particle.delay, particle.duration]);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
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
    >
      <LinearGradient
        colors={particle.colors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    </Animated.View>
  );
};

interface FloatingParticlesProps {
  count?: number;
  colors?: ReadonlyArray<readonly [string, string, ...string[]]>;
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
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  
  const particles: Particle[] = React.useMemo(() => 
    Array.from({ length: count }, (_, i) => ({
      id: i,
      size: Math.random() * 40 + 20, // 20-60px
      startX: Math.random() * winWidth,
      startY: winHeight + Math.random() * 200,
      delay: Math.random() * 3000,
      duration: Math.random() * 8000 + 12000, // 12-20 seconds
      colors: colors[Math.floor(Math.random() * colors.length)],
    })),
    [count, winWidth, winHeight, colors]
  );

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle) => (
        <FloatingParticle key={particle.id} particle={particle} winHeight={winHeight} />
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
