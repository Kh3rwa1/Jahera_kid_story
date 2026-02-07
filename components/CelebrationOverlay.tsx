import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

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

const ConfettiPiece = ({ x, color, size, delay }: { x: number; color: string; size: number; delay: number }) => {
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
        { translateY: interpolate(progress.value, [0, 1], [-50, height + 50]) },
        { rotate: `${interpolate(progress.value, [0, 1], [0, 720])}deg` },
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
  const pieces = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: Math.random() * 10 + 5,
      delay: Math.random() * 300,
    })),
    []
  );

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => onComplete?.(), 2200);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {pieces.map(piece => (
        <ConfettiPiece key={piece.id} {...piece} />
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
    borderRadius: 2,
  },
});
