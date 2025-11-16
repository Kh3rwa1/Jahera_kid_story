import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { ANIMATION } from '@/constants/theme';

/**
 * Premium animation utilities for smooth, delightful interactions
 */

/**
 * Fade in animation hook
 */
export const useFadeIn = (duration = ANIMATION.normal, delay = 0) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, []);

  return opacity;
};

/**
 * Slide in from bottom animation hook
 */
export const useSlideInUp = (duration = ANIMATION.normal, delay = 0) => {
  const translateY = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return { translateY, opacity };
};

/**
 * Scale animation hook (pop in effect)
 */
export const useScaleIn = (duration = ANIMATION.normal, delay = 0) => {
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        delay,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return { scale, opacity };
};

/**
 * Pulse animation for drawing attention
 */
export const usePulse = (minScale = 0.95, maxScale = 1.05, duration = ANIMATION.verySlow) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: maxScale,
          duration: duration / 2,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(scale, {
          toValue: minScale,
          duration: duration / 2,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();
  }, []);

  return scale;
};

/**
 * Shimmer animation for loading states
 */
export const useShimmer = () => {
  const translateX = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(translateX, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();
  }, []);

  return translateX;
};

/**
 * Bounce animation
 */
export const useBounce = (duration = ANIMATION.slow) => {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -10,
          duration: duration / 2,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: duration / 2,
          useNativeDriver: true,
          easing: Easing.in(Easing.quad),
        }),
      ])
    ).start();
  }, []);

  return translateY;
};

/**
 * Create a press animation (scale down on press)
 */
export const createPressAnimation = (
  scale: Animated.Value,
  onPressIn?: () => void,
  onPressOut?: () => void
) => {
  return {
    onPressIn: () => {
      onPressIn?.();
      Animated.spring(scale, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 100,
        friction: 3,
      }).start();
    },
    onPressOut: () => {
      onPressOut?.();
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 3,
      }).start();
    },
  };
};

/**
 * Celebration animation (confetti-like effect)
 */
export const useCelebration = () => {
  const scale = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const celebrate = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1.2,
          useNativeDriver: true,
          tension: 50,
          friction: 3,
        }),
        Animated.timing(rotate, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.elastic(1.5),
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          delay: 1000,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const rotation = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return { scale, rotation, opacity, celebrate };
};

/**
 * Stagger animation for list items
 */
export const useStaggeredAnimation = (index: number, itemsCount: number) => {
  const delay = (index / itemsCount) * 500; // Stagger over 500ms
  return useSlideInUp(ANIMATION.normal, delay);
};
