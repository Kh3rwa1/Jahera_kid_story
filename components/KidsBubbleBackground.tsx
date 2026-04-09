import { randomFloat } from '@/utils/secureRandom';
import { LinearGradient } from 'expo-linear-gradient';
import React,{ useEffect,useMemo } from 'react';
import { StyleSheet,useWindowDimensions,View } from 'react-native';
import Animated,{
Easing,
useAnimatedStyle,
useSharedValue,
withDelay,
withRepeat,
withSequence,
withTiming,
} from 'react-native-reanimated';

const BUBBLE_COLORS: readonly (readonly [string, string])[] = [
  ['rgba(255, 182, 193, 0.45)', 'rgba(255, 182, 193, 0)'],
  ['rgba(152, 251, 152, 0.35)', 'rgba(152, 251, 152, 0)'],
  ['rgba(135, 206, 250, 0.4)', 'rgba(135, 206, 250, 0)'],
  ['rgba(255, 218, 100, 0.38)', 'rgba(255, 218, 100, 0)'],
  ['rgba(216, 191, 216, 0.38)', 'rgba(216, 191, 216, 0)'],
  ['rgba(255, 160, 122, 0.32)', 'rgba(255, 160, 122, 0)'],
  ['rgba(100, 220, 220, 0.35)', 'rgba(100, 220, 220, 0)'],
];

const CLOUD_COLORS: readonly (readonly [string, string, string])[] = [
  ['rgba(255, 240, 245, 0.55)', 'rgba(255, 220, 235, 0.35)', 'rgba(255, 240, 245, 0)'],
  ['rgba(240, 255, 245, 0.5)', 'rgba(200, 240, 220, 0.3)', 'rgba(240, 255, 245, 0)'],
  ['rgba(240, 248, 255, 0.55)', 'rgba(200, 225, 255, 0.32)', 'rgba(240, 248, 255, 0)'],
  ['rgba(255, 253, 240, 0.5)', 'rgba(255, 240, 180, 0.28)', 'rgba(255, 253, 240, 0)'],
];

interface Bubble {
  id: number;
  size: number;
  startX: number;
  startY: number;
  delay: number;
  duration: number;
  colors: readonly [string, string];
  swayAmount: number;
}

interface Cloud {
  id: number;
  width: number;
  height: number;
  startX: number;
  startY: number;
  delay: number;
  duration: number;
  colors: readonly [string, string, string];
}

const FloatingBubble: React.FC<{ bubble: Bubble; winHeight: number }> = React.memo(({ bubble, winHeight }) => {
  const translateY = useSharedValue(bubble.startY);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      bubble.delay,
      withTiming(0.8, { duration: 1200, easing: Easing.out(Easing.quad) })
    );
    translateY.value = withDelay(
      bubble.delay,
      withRepeat(
        withTiming(-winHeight - 150, {
          duration: bubble.duration,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );
    translateX.value = withDelay(
      bubble.delay,
      withRepeat(
        withSequence(
          withTiming(bubble.swayAmount, { duration: bubble.duration / 3, easing: Easing.inOut(Easing.quad) }),
          withTiming(-bubble.swayAmount, { duration: (bubble.duration / 3) * 2, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: bubble.duration / 3, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      )
    );
  }, [winHeight, bubble.delay, bubble.duration, bubble.swayAmount, opacity, translateY, translateX]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.bubble,
        { width: bubble.size, height: bubble.size, left: bubble.startX, top: bubble.startY },
        animStyle,
      ]}
    >
      <LinearGradient
        colors={bubble.colors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />
    </Animated.View>
  );
});

const DriftingCloud: React.FC<{ cloud: Cloud; winWidth: number }> = React.memo(({ cloud, winWidth }) => {
  const translateX = useSharedValue(cloud.startX);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const fadeDuration = Math.min(3000, cloud.duration * 0.15);
    const holdDuration = Math.max(100, cloud.duration - fadeDuration * 2);
    opacity.value = withDelay(
      cloud.delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: fadeDuration, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: holdDuration }),
          withTiming(0, { duration: fadeDuration, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      )
    );
    translateX.value = withDelay(
      cloud.delay,
      withRepeat(
        withTiming(winWidth + cloud.width + 50, {
          duration: cloud.duration,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );
  }, [winWidth, cloud.delay, cloud.duration, cloud.width, opacity, translateX]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.cloud,
        { width: cloud.width, height: cloud.height, top: cloud.startY },
        animStyle,
      ]}
    >
      <LinearGradient
        colors={cloud.colors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
      />
    </Animated.View>
  );
});

interface KidsBubbleBackgroundProps {
  bubbleCount?: number;
  cloudCount?: number;
}

export const KidsBubbleBackground: React.FC<KidsBubbleBackgroundProps> = React.memo(({
  bubbleCount = 6,
  cloudCount = 2,
}) => {
  const { width: winWidth, height: winHeight } = useWindowDimensions();

  const bubbles = useMemo<Bubble[]>(
    () =>
      Array.from({ length: bubbleCount }, (_, i) => ({
        id: i,
        size: randomFloat(15, 65),
        startX: randomFloat(0, winWidth),
        startY: winHeight + randomFloat(0, 300),
        delay: randomFloat(0, 4000),
        duration: randomFloat(14000, 24000),
        colors: BUBBLE_COLORS[i % BUBBLE_COLORS.length],
        swayAmount: randomFloat(10, 40),
      })),
    [bubbleCount, winWidth, winHeight]
  );

  const clouds = useMemo<Cloud[]>(
    () =>
      Array.from({ length: cloudCount }, (_, i) => ({
        id: i,
        width: randomFloat(80, 200),
        height: randomFloat(35, 85),
        startX: -150 - randomFloat(0, 200),
        startY: randomFloat(0, winHeight * 0.6),
        delay: randomFloat(0, 8000),
        duration: randomFloat(30000, 50000),
        colors: CLOUD_COLORS[i % CLOUD_COLORS.length],
      })),
    [cloudCount, winHeight]
  );

  return (
    <View style={styles.container} pointerEvents="none">
      {clouds.map(cloud => (
        <DriftingCloud key={`cloud-${cloud.id}`} cloud={cloud} winWidth={winWidth} />
      ))}
      {bubbles.map(bubble => (
        <FloatingBubble key={`bubble-${bubble.id}`} bubble={bubble} winHeight={winHeight} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  bubble: {
    position: 'absolute',
    borderRadius: 999,
  },
  cloud: {
    position: 'absolute',
    borderRadius: 999,
  },
});
