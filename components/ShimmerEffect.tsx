import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface ShimmerEffectProps {
  width?: number | string;
  height?: number | string;
  colors?: readonly [string, string, ...string[]];
  duration?: number;
}

export const ShimmerEffect: React.FC<ShimmerEffectProps> = ({
  width: _width = '100%',
  height: _height = '100%',
  colors = [
    'rgba(255, 255, 255, 0)',
    'rgba(255, 255, 255, 0.5)',
    'rgba(255, 255, 255, 0)',
  ],
  duration = 2000,
}) => {
  const shimmerTranslate = useSharedValue(-1);

  useEffect(() => {
    shimmerTranslate.value = withRepeat(
      withTiming(1, {
        duration,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [duration, shimmerTranslate]);

  const shimmerStyle = useAnimatedStyle(() => {
    'worklet';
    const translateX = interpolate(
      shimmerTranslate.value,
      [-1, 1],
      [-400, 400],
    );

    return {
      transform: [{ translateX }],
    };
  });

  return (
    <Animated.View style={[styles.shimmer, shimmerStyle]} pointerEvents="none">
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
