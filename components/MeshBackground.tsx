import React, { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useIsFocused } from '@react-navigation/native';

interface Orb {
  id: number;
  size: number;
  initialX: number;
  initialY: number;
  color: string;
  duration: number;
  delay: number;
  moveRange: number;
}

const FloatingOrb: React.FC<{ orb: Orb; isFocused: boolean }> = React.memo(
  ({ orb, isFocused }) => {
    const transX = useSharedValue(0);
    const transY = useSharedValue(0);
    const scale = useSharedValue(1);

    useEffect(() => {
      if (!isFocused) {
        cancelAnimation(transX);
        cancelAnimation(transY);
        cancelAnimation(scale);
        return;
      }

      transX.value = withDelay(
        orb.delay,
        withRepeat(
          withTiming(orb.moveRange, {
            duration: orb.duration,
            easing: Easing.inOut(Easing.sin),
          }),
          -1,
          true,
        ),
      );
      transY.value = withDelay(
        orb.delay + 300,
        withRepeat(
          withTiming(orb.moveRange * 0.6, {
            duration: orb.duration * 1.2,
            easing: Easing.inOut(Easing.sin),
          }),
          -1,
          true,
        ),
      );
      scale.value = withDelay(
        orb.delay,
        withRepeat(
          withTiming(1.15, {
            duration: orb.duration * 0.8,
            easing: Easing.inOut(Easing.ease),
          }),
          -1,
          true,
        ),
      );
    }, [
      isFocused,
      orb.delay,
      orb.duration,
      orb.moveRange,
      scale,
      transX,
      transY,
    ]);

    const style = useAnimatedStyle(() => ({
      transform: [
        { translateX: orb.initialX + transX.value },
        { translateY: orb.initialY + transY.value },
        { scale: scale.value },
      ],
    }));

    return (
      <Animated.View
        style={[
          styles.orb,
          {
            width: orb.size,
            height: orb.size,
            borderRadius: orb.size / 2,
            backgroundColor: orb.color,
          },
          style,
        ]}
      />
    );
  },
);

FloatingOrb.displayName = 'FloatingOrb';

interface MeshBackgroundProps {
  primaryColor: string;
}

export const MeshBackground: React.FC<MeshBackgroundProps> = React.memo(
  ({ primaryColor }) => {
    const isFocused = useIsFocused();
    const { width, height } = useWindowDimensions();

    const orbs = useMemo<Orb[]>(
      () => [
        {
          id: 0,
          size: 200,
          initialX: -50,
          initialY: -30,
          color: primaryColor + '08',
          duration: 8000,
          delay: 0,
          moveRange: 40,
        },
        {
          id: 1,
          size: 160,
          initialX: width * 0.6,
          initialY: height * 0.2,
          color: primaryColor + '06',
          duration: 10000,
          delay: 500,
          moveRange: 30,
        },
        {
          id: 2,
          size: 120,
          initialX: width * 0.3,
          initialY: height * 0.7,
          color: primaryColor + '05',
          duration: 9000,
          delay: 1000,
          moveRange: 35,
        },
      ],
      [primaryColor, width, height],
    );

    if (!isFocused) return null;

    return (
      <View style={styles.container} pointerEvents="none">
        {orbs.map((orb) => (
          <FloatingOrb key={orb.id} orb={orb} isFocused={isFocused} />
        ))}
      </View>
    );
  },
);

MeshBackground.displayName = 'MeshBackground';

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
  orb: {
    position: 'absolute',
    opacity: 1,
  },
});
