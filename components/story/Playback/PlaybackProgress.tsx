import { FONTS,SPACING } from '@/constants/theme';
import { useAudioProgress } from '@/contexts/AudioContext';
import { ThemeColors } from '@/types/theme';
import {
StyleSheet,
Text,
View
} from 'react-native';

interface PlaybackProgressProps {
  accentColor: string;
  colors: ThemeColors;
}

export function formatTime(ms: number) {
  if (Number.isNaN(ms) || ms < 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function PlaybackProgress({ accentColor, colors }: Readonly<PlaybackProgressProps>) {
  const { position, duration } = useAudioProgress();
  const progress = duration > 0 ? position / duration : 0;

  return (
    <View style={styles.container}>
      <View style={[styles.track, { backgroundColor: colors.text.light + '15' }]}>
        <View 
          style={[
            styles.filled, 
            { backgroundColor: accentColor, width: `${progress * 100}%` }
          ]} 
        />
        <View 
          style={[
            styles.thumb, 
            { left: `${progress * 100}%`, borderColor: '#FFF' }
          ]} 
        />
      </View>
      <View style={styles.timeRow}>
        <Text style={[styles.timeLabel, { color: colors.text.light }]}>
          {formatTime(position)}
        </Text>
        <Text style={[styles.timeLabel, { color: colors.text.light }]}>
          {formatTime(duration)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
  },
  track: {
    height: 4,
    borderRadius: 2,
    position: 'relative',
    overflow: 'visible',
  },
  filled: {
    height: '100%',
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: -8,
    borderWidth: 2.5,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeLabel: {
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
});
