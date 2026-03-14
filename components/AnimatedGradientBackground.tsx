import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

type GradientSet = readonly [string, string, ...string[]];

interface AnimatedGradientBackgroundProps {
  colorSets?: GradientSet[];
  duration?: number;
}

export const AnimatedGradientBackground: React.FC<AnimatedGradientBackgroundProps> = ({
  colorSets = [
    ['#F9FFFE', '#F0FFFE', '#E8FDFC'],
    ['#FFF9FC', '#FFF0F7', '#FFE8F5'],
    ['#F9FCFF', '#F0F9FF', '#E5F4FF'],
    ['#FFFBF5', '#FFF0E5', '#FFE8D8'],
  ],
  duration = 8000,
}) => {
  const [currentColorSet, setCurrentColorSet] = useState<GradientSet>(colorSets[0]);
  const [nextColorSet, setNextColorSet] = useState<GradientSet>(colorSets[1]);
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    let currentIndex = 0;

    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % colorSets.length;
      const afterNextIndex = (nextIndex + 1) % colorSets.length;

      setCurrentColorSet(colorSets[nextIndex]);
      setNextColorSet(colorSets[afterNextIndex]);
      currentIndex = nextIndex;
    }, duration);

    opacity.value = withRepeat(
      withTiming(1, {
        duration: duration / 2,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    return () => clearInterval(interval);
  }, [colorSets, duration]);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: interpolate(opacity.value, [0, 1], [0, 0.5]),
    };
  });

  return (
    <>
      <LinearGradient colors={currentColorSet} style={StyleSheet.absoluteFill} />
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient colors={nextColorSet} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </>
  );
};
