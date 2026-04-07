import React,{ useEffect,useMemo } from 'react';
import { StyleSheet,useWindowDimensions,View } from 'react-native';
import Animated,{
Easing,
useAnimatedStyle,
useSharedValue,
withDelay,
withRepeat,
withTiming
} from 'react-native-reanimated';

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

const FloatingOrb: React.FC<{ orb: Orb }> = React.memo(({ orb }) => {
  const transX = useSharedValue(0);
  const transY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    transX.value = withDelay(
      orb.delay,
      withRepeat(
        withTiming(orb.moveRange, {
          duration: orb.duration,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );
    transY.value = withDelay(
      orb.delay + 500,
      withRepeat(
        withTiming(-orb.moveRange * 0.8, {
          duration: orb.duration * 1.2,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );
    scale.value = withDelay(
      orb.delay,
      withRepeat(
        withTiming(1.2, {
          duration: orb.duration * 0.8,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: transX.value },
      { translateY: transY.value },
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
          left: orb.initialX,
          top: orb.initialY,
          backgroundColor: orb.color,
          opacity: 0.15,
        },
        animatedStyle,
      ]}
    />
  );
});

export const MeshBackground: React.FC<{ primaryColor: string }> = React.memo(({ primaryColor }) => {
  const { width: winWidth, height: winHeight } = useWindowDimensions();

  const orbs = useMemo<Orb[]>(() => [
    {
      id: 1,
      size: winWidth * 0.8,
      initialX: -winWidth * 0.2,
      initialY: winHeight * 0.1,
      color: primaryColor,
      duration: 15000,
      delay: 0,
      moveRange: 40,
    },
    {
      id: 2,
      size: winWidth * 0.7,
      initialX: winWidth * 0.5,
      initialY: winHeight * 0.4,
      color: primaryColor,
      duration: 18000,
      delay: 1000,
      moveRange: 60,
    },
    {
      id: 3,
      size: winWidth * 0.9,
      initialX: winWidth * 0.1,
      initialY: winHeight * 0.7,
      color: primaryColor,
      duration: 22000,
      delay: 2000,
      moveRange: 50,
    },
  ], [winWidth, winHeight, primaryColor]);

  return (
    <View style={styles.container} pointerEvents="none">
      {orbs.map(orb => (
        <FloatingOrb key={orb.id} orb={orb} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    // Blur is handled by large size + low opacity + overlapping
  },
});
