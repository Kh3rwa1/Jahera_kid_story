import { COLORS } from '@/constants/theme';
import { randomBool,randomChoice,randomFloat } from '@/utils/secureRandom';
import React,{ useEffect,useMemo } from 'react';
import { StyleSheet,useWindowDimensions,View } from 'react-native';
import Animated,{
Easing,
interpolate,
useAnimatedStyle,
useSharedValue,
withDelay,
withTiming,
} from 'react-native-reanimated';

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

const ConfettiPiece = ({ x, color, size, delay, winHeight, driftX, isCircle }: { x: number; color: string; size: number; delay: number; winHeight: number; driftX: number; isCircle: boolean }) => {
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
          borderRadius: isCircle ? size / 2 : 4,
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

  const pieces = useMemo(() =>
    Array.from({ length: 90 }, (_, i) => ({
      id: i,
      x: randomFloat(0, width),
      color: randomChoice(CONFETTI_COLORS),
      size: randomFloat(12, 28), // 12-28px size for chunky kid feel
      delay: randomFloat(0, 400),
      driftX: randomFloat(-75, 75),
      isCircle: randomBool(),
    })),
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
