import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { COLORS, SPACING } from '@/constants/theme';

interface AudioWaveformProps {
  isPlaying: boolean;
  barCount?: number;
  color?: string;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isPlaying,
  barCount = 40,
  color = COLORS.primary,
}) => {
  const animations = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(0.3))
  ).current;

  useEffect(() => {
    if (isPlaying) {
      startAnimations();
    } else {
      stopAnimations();
    }

    return () => {
      animations.forEach(anim => anim.stopAnimation());
    };
  }, [isPlaying]);

  const startAnimations = () => {
    const createBarAnimation = (index: number) => {
      const randomDelay = Math.random() * 200;
      const randomDuration = 300 + Math.random() * 400;

      Animated.loop(
        Animated.sequence([
          Animated.timing(animations[index], {
            toValue: 0.3 + Math.random() * 0.7,
            duration: randomDuration,
            delay: randomDelay,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1),
            useNativeDriver: true,
          }),
          Animated.timing(animations[index], {
            toValue: 0.3,
            duration: randomDuration,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animations.forEach((_, index) => createBarAnimation(index));
  };

  const stopAnimations = () => {
    animations.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  return (
    <View style={styles.container}>
      {animations.map((animation, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              backgroundColor: color,
              opacity: 0.4 + (index % 3) * 0.2,
              transform: [{ scaleY: animation }],
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    gap: 3,
  },
  bar: {
    width: 4,
    height: '100%',
    borderRadius: 2,
  },
});
