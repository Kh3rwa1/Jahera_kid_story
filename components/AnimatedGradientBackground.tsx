import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type GradientSet = readonly [string, string, ...string[]];

interface AnimatedGradientBackgroundProps {
  colorSets?: GradientSet[];
  duration?: number;
}

export const AnimatedGradientBackground: React.FC<
  AnimatedGradientBackgroundProps
> = ({
  colorSets = [
    ['#F9FFFE', '#F0FFFE', '#E8FDFC'],
    ['#FFF9FC', '#FFF0F7', '#FFE8F5'],
    ['#F9FCFF', '#F0F9FF', '#E5F4FF'],
    ['#FFFBF5', '#FFF0E5', '#FFE8D8'],
  ],
  duration = 8000,
}) => {
  const [currentColorSet, setCurrentColorSet] = useState<GradientSet>(
    colorSets[0],
  );
  const [nextColorSet, setNextColorSet] = useState<GradientSet>(colorSets[1]);
  const opacity = useSharedValue(0);

  useEffect(() => {
    let currentIndex = 0;
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const cycle = () => {
      if (!mounted) return;
      const nextIndex = (currentIndex + 1) % colorSets.length;
      const afterNextIndex = (nextIndex + 1) % colorSets.length;

      setCurrentColorSet(colorSets[nextIndex]);
      setNextColorSet(colorSets[afterNextIndex]);
      currentIndex = nextIndex;
      timeoutId = setTimeout(cycle, duration);
    };

    timeoutId = setTimeout(cycle, duration);

    opacity.value = withRepeat(
      withTiming(1, {
        duration: duration / 2,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      cancelAnimation(opacity);
    };
  }, [colorSets, duration, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: interpolate(opacity.value, [0, 1], [0, 0.5]),
    };
  });

  return (
    <>
      <LinearGradient
        colors={currentColorSet}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient colors={nextColorSet} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </>
  );
};
