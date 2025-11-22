import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface AnimatedGradientBackgroundProps {
  colorSets?: string[][];
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
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(colorSets.length - 1, {
        duration: duration * colorSets.length,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [colorSets.length, duration]);

  const animatedProps = useAnimatedProps(() => {
    // Calculate which color set we're transitioning between
    const index = Math.floor(progress.value);
    const nextIndex = (index + 1) % colorSets.length;
    const interpolation = progress.value - index;

    return {
      colors: [
        interpolateColor(interpolation, [0, 1], [colorSets[index][0], colorSets[nextIndex][0]]),
        interpolateColor(interpolation, [0, 1], [colorSets[index][1], colorSets[nextIndex][1]]),
        interpolateColor(interpolation, [0, 1], [colorSets[index][2], colorSets[nextIndex][2]]),
      ],
    };
  });

  return <AnimatedLinearGradient animatedProps={animatedProps} style={StyleSheet.absoluteFill} />;
};
