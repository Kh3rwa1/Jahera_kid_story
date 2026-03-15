import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  SharedValue,
  cancelAnimation,
} from 'react-native-reanimated';
import { ANIMATION } from '@/constants/theme';

export const useFadeIn = (duration = ANIMATION.normal, delay = 0) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  return useAnimatedStyle(() => ({ opacity: opacity.value }));
};

export const useSlideInUp = (duration = ANIMATION.normal, delay = 0) => {
  const translateY = useSharedValue(30);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(delay, withTiming(0, { duration, easing: Easing.out(Easing.cubic) }));
    opacity.value = withDelay(delay, withTiming(1, { duration }));
  }, []);

  return useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));
};

export const useScaleIn = (duration = ANIMATION.normal, delay = 0) => {
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, { damping: 12, stiffness: 100 }));
    opacity.value = withDelay(delay, withTiming(1, { duration }));
  }, []);

  return useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
};

export const usePulse = (minScale = 0.97, maxScale = 1.03) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(maxScale, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(minScale, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
  }, []);

  return useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
};

export const useShimmer = () => {
  const translateX = useSharedValue(-1);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.linear }),
      -1, false
    );
  }, []);

  return useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(translateX.value, [-1, 1], [-200, 200]) }],
  }));
};

export const useBounce = () => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 400, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 400, easing: Easing.in(Easing.quad) })
      ),
      -1, true
    );
  }, []);

  return useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
};

export const useStaggeredAnimation = (index: number, itemsCount: number) => {
  const delay = (index / Math.max(itemsCount, 1)) * 400;
  return useSlideInUp(ANIMATION.normal, delay);
};

export const useFloat = (amplitude = 8, speed = 2400, delay = 0) => {
  const y = useSharedValue(0);

  useEffect(() => {
    y.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(-amplitude, { duration: speed, easing: Easing.inOut(Easing.sin) }),
        withTiming(amplitude, { duration: speed, easing: Easing.inOut(Easing.sin) })
      ),
      -1, true
    ));
    return () => cancelAnimation(y);
  }, []);

  return useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
};

export const useCountUp = (target: number, duration = 1000, delay = 0) => {
  const value = useSharedValue(0);

  useEffect(() => {
    value.value = withDelay(delay, withTiming(target, { duration, easing: Easing.out(Easing.cubic) }));
  }, [target]);

  return value;
};

export const useGlowPulse = (baseOpacity = 0.3, peakOpacity = 0.7, speed = 1600) => {
  const opacity = useSharedValue(baseOpacity);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(peakOpacity, { duration: speed, easing: Easing.inOut(Easing.ease) }),
        withTiming(baseOpacity, { duration: speed, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
    return () => cancelAnimation(opacity);
  }, []);

  return useAnimatedStyle(() => ({ opacity: opacity.value }));
};

export const useSlideInFromRight = (duration = ANIMATION.normal, delay = 0) => {
  const translateX = useSharedValue(40);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = withDelay(delay, withSpring(0, { damping: 16, stiffness: 120 }));
    opacity.value = withDelay(delay, withTiming(1, { duration }));
  }, []);

  return useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));
};

export const useProgressBar = (target: number, duration = 1200, delay = 400) => {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withDelay(delay, withTiming(target, { duration, easing: Easing.out(Easing.cubic) }));
  }, [target]);

  return useAnimatedStyle(() => ({ width: `${width.value}%` as any }));
};

export const useSpringPress = () => {
  const scale = useSharedValue(1);

  const onPressIn = () => { scale.value = withSpring(0.96, { damping: 15, stiffness: 200 }); };
  const onPressOut = () => { scale.value = withSpring(1, { damping: 12, stiffness: 150 }); };

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return { style, onPressIn, onPressOut };
};

export const useRotate = (duration = 8000) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration, easing: Easing.linear }),
      -1, false
    );
    return () => cancelAnimation(rotation);
  }, []);

  return useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));
};

export const useEntranceSequence = (index: number, baseDelay = 40, stagger = 55) => {
  const delay = baseDelay + index * stagger;
  const translateY = useSharedValue(24);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.96);

  useEffect(() => {
    translateY.value = withDelay(delay, withSpring(0, { damping: 18, stiffness: 160 }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 280 }));
    scale.value = withDelay(delay, withSpring(1, { damping: 16, stiffness: 140 }));
  }, []);

  return useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));
};
