import { COLORS } from '@/constants/theme';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface WaveBarProps {
  color: string;
  index: number;
  isPlaying: boolean;
}

const WaveBar = ({ color, index, isPlaying }: Readonly<WaveBarProps>) => {
  const scaleY = useSharedValue(0.3);

  useEffect(() => {
    if (!isPlaying) {
      scaleY.value = withTiming(0.3, { duration: 200 });
      return;
    }

    const targetHeight = 0.3 + Math.random() * 0.7;
    const duration = 300 + Math.random() * 400;
    const delay = Math.random() * 200;

    scaleY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(targetHeight, {
            duration,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          }),
          withTiming(0.3, {
            duration,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          }),
        ),
        -1,
        false,
      ),
    );
  }, [isPlaying, scaleY]);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scaleY: scaleY.value }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          backgroundColor: color,
          opacity: 0.4 + (index % 3) * 0.2,
        },
        animatedStyle,
      ]}
    />
  );
};

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
  const bars = Array.from({ length: barCount }, (_, i) => i);

  return (
    <View style={styles.container}>
      {bars.map((index) => (
        <WaveBar
          key={index}
          color={color}
          index={index}
          isPlaying={isPlaying}
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
