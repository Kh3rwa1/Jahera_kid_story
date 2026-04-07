import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '@/constants/theme';

const CONFETTI_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.accent.gold,
  COLORS.accent.rose,
  COLORS.accent.mint,
  COLORS.categoryColors.green,
  COLORS.categoryColors.teal,
];

interface CelebrationOverlayProps {
  visible?: boolean;
  onComplete?: () => void;
}

function getSecureRandom(): number {
  if (!globalThis.crypto?.getRandomValues) return 0.5;
  const values = new Uint32Array(1);
  globalThis.crypto.getRandomValues(values);
  return values[0] / 0xffffffff;
}

const ConfettiPiece = ({
  x,
  color,
  size,
  delay,
  winHeight,
  driftX,
  borderRadius,
}: {
  x: number;
  color: string;
  size: number;
  delay: number;
  winHeight: number;
  driftX: number;
  borderRadius: number;
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 2000, easing: Easing.out(Easing.quad) })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { translateY: interpolate(progress.value, [0, 1], [-50, winHeight + 100]) },
        { translateX: interpolate(progress.value, [0, 1], [0, driftX]) },
        { rotate: `${interpolate(progress.value, [0, 1], [0, 1080])}deg` },
      ],
      opacity: interpolate(progress.value, [0, 0.1, 0.9, 1], [0, 1, 1, 0]),
    };
  });

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          left: x,
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius,
        },
        animatedStyle,
      ]}
    />
  );
};

export const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({
  visible = true,
  onComplete,
}) => {
  const { width, height } = useWindowDimensions();

  const pieces = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => {
        const size = getSecureRandom() * 16 + 12;
        return {
          id: i,
          x: getSecureRandom() * width,
          color: CONFETTI_COLORS[Math.floor(getSecureRandom() * CONFETTI_COLORS.length)],
          size,
          delay: getSecureRandom() * 400,
          driftX: (getSecureRandom() - 0.5) * 150,
          borderRadius: getSecureRandom() > 0.5 ? size / 2 : 4,
        };
      }),
    [width]
  );

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => onComplete?.(), 2500);
      return () => clearTimeout(timer);
    }
  }, [visible, onComplete]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {pieces.map(piece => (
        <ConfettiPiece key={piece.id} {...piece} winHeight={height} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  confetti: {
    position: 'absolute',
  },
});
