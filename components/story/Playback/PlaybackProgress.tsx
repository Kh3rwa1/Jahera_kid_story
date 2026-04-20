import { FONTS, SPACING } from '@/constants/theme';
import { useAudio, useAudioProgress } from '@/contexts/AudioContext';
import { ThemeColors } from '@/types/theme';
import React, { useCallback, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';

interface PlaybackProgressProps {
  accentColor: string;
  colors: ThemeColors;
  isDeviceTTS?: boolean;
}

export function formatTime(ms: number) {
  if (Number.isNaN(ms) || ms < 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes + ':' + seconds.toString().padStart(2, '0');
}

export function PlaybackProgress({
  accentColor,
  colors,
  isDeviceTTS,
}: Readonly<PlaybackProgressProps>) {
  const { position, duration } = useAudioProgress();
  const { seek } = useAudio();
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);
  const trackWidthRef = useRef(0);

  // Use refs so PanResponder closures always have fresh values
  const seekRef = useRef(seek);
  const durationRef = useRef(duration);
  const seekPosRef = useRef(0);
  seekRef.current = seek;
  durationRef.current = duration;

  const progress = duration > 0 ? position / duration : 0;
  const displayProgress = isSeeking ? seekPosition : progress;
  const displayTime = isSeeking ? seekPosition * duration : position;

  const onTrackLayout = useCallback((e: LayoutChangeEvent) => {
    trackWidthRef.current = e.nativeEvent.layout.width;
  }, []);

  const clamp = (val: number, min: number, max: number) =>
    Math.min(Math.max(val, min), max);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isDeviceTTS,
      onMoveShouldSetPanResponder: () => !isDeviceTTS,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        if (!trackWidthRef.current || !durationRef.current) return;
        setIsSeeking(true);
        const x = evt.nativeEvent.locationX;
        const pct = clamp(x / trackWidthRef.current, 0, 1);
        seekPosRef.current = pct;
        setSeekPosition(pct);
      },
      onPanResponderMove: (evt: GestureResponderEvent) => {
        if (!trackWidthRef.current || !durationRef.current) return;
        const x = evt.nativeEvent.locationX;
        const pct = clamp(x / trackWidthRef.current, 0, 1);
        seekPosRef.current = pct;
        setSeekPosition(pct);
      },
      onPanResponderRelease: async () => {
        const d = durationRef.current;
        const s = seekRef.current;
        if (d > 0 && s) {
          const seekMs = seekPosRef.current * d;
          await s(seekMs);
        }
        setIsSeeking(false);
      },
      onPanResponderTerminate: () => {
        setIsSeeking(false);
      },
    }),
  ).current;

  return (
    <View style={styles.container}>
      <View
        style={[styles.trackHitArea]}
        onLayout={onTrackLayout}
        {...panResponder.panHandlers}
      >
        <View
          style={[styles.track, { backgroundColor: colors.text.light + '15' }]}
        >
          <View
            style={[
              styles.filled,
              {
                backgroundColor: accentColor,
                width: (displayProgress * 100 + '%') as any,
              },
            ]}
          />
        </View>
        <View
          style={[
            styles.thumb,
            {
              left: (displayProgress * 100 + '%') as any,
              backgroundColor: accentColor,
              borderColor: '#FFF',
              transform: [{ scale: isSeeking ? 1.3 : 1 }],
            },
          ]}
        />
      </View>
      <View style={styles.timeRow}>
        <Text style={[styles.timeLabel, { color: colors.text.light }]}>
          {formatTime(displayTime)}
        </Text>
        <Text style={[styles.timeLabel, { color: colors.text.light }]}>
          {formatTime(duration)}
        </Text>
      </View>
      {isDeviceTTS && (
        <Text style={[styles.note, { color: colors.text.secondary }]}>
          Device voice — scrubbing disabled
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
  },
  trackHitArea: {
    height: 32,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    height: 6,
    borderRadius: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  filled: {
    height: '100%',
    borderRadius: 3,
  },
  thumb: {
    position: 'absolute',
    top: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: -9,
    borderWidth: 2.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: Platform.OS === 'android' ? 0 : 5,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeLabel: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  note: {
    marginTop: 8,
    fontSize: 11,
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
});
