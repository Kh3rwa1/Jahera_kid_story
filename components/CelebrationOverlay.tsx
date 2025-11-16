import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
}

interface CelebrationOverlayProps {
  visible: boolean;
  onComplete?: () => void;
}

export const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({
  visible,
  onComplete,
}) => {
  const confettiPieces = useRef<ConfettiPiece[]>([]);
  const animations = useRef<Animated.Value[]>([]);

  // Generate confetti pieces
  useEffect(() => {
    const colors = [
      COLORS.primary,
      COLORS.secondary,
      COLORS.accent.gold,
      COLORS.accent.rose,
      COLORS.accent.mint,
      COLORS.accent.lavender,
      COLORS.categoryColors.green,
      COLORS.categoryColors.teal,
      COLORS.categoryColors.purple,
    ];

    confettiPieces.current = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 10 + 5,
      delay: Math.random() * 200,
    }));

    animations.current = confettiPieces.current.map(() => new Animated.Value(0));
  }, []);

  useEffect(() => {
    if (visible) {
      // Animate all confetti pieces
      const animationPromises = animations.current.map((anim, index) => {
        const piece = confettiPieces.current[index];
        return new Promise<void>((resolve) => {
          Animated.timing(anim, {
            toValue: 1,
            duration: 2000,
            delay: piece.delay,
            useNativeDriver: true,
          }).start(() => resolve());
        });
      });

      Promise.all(animationPromises).then(() => {
        onComplete?.();
      });
    } else {
      // Reset animations
      animations.current.forEach((anim) => anim.setValue(0));
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {confettiPieces.current.map((piece, index) => {
        const translateY = animations.current[index].interpolate({
          inputRange: [0, 1],
          outputRange: [-50, height + 50],
        });

        const rotate = animations.current[index].interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '720deg'],
        });

        const opacity = animations.current[index].interpolate({
          inputRange: [0, 0.1, 0.9, 1],
          outputRange: [0, 1, 1, 0],
        });

        return (
          <Animated.View
            key={piece.id}
            style={[
              styles.confetti,
              {
                left: piece.x,
                width: piece.size,
                height: piece.size,
                backgroundColor: piece.color,
                transform: [{ translateY }, { rotate }],
                opacity,
              },
            ]}
          />
        );
      })}
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
