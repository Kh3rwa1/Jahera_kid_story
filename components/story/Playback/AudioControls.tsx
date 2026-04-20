import { FONTS } from '@/constants/theme';
import { useAudio,useAudioProgress } from '@/contexts/AudioContext';
import { ThemeColors } from '@/types/theme';
import { hapticFeedback } from '@/utils/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen,Pause,Play,SkipBack,SkipForward } from 'lucide-react-native';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface AudioControlsProps {
  accentColor: string;
  colors: ThemeColors;
}

export function AudioControls({ accentColor, colors }: Readonly<AudioControlsProps>) {
  const { 
    isPlaying, isBuffering, isDeviceTTS, sound,
    playPause, seek 
  } = useAudio();
  const { position, duration } = useAudioProgress();

  const vinylRotation = useSharedValue(0);
  const vinylElevation = useSharedValue(0);
  const playScale = useSharedValue(1);

  const waveAnim1 = useSharedValue(0.3);
  const waveAnim2 = useSharedValue(0.6);
  const waveAnim3 = useSharedValue(0.45);
  const waveAnim4 = useSharedValue(0.8);
  const waveAnim5 = useSharedValue(0.25);
  const waveAnim6 = useSharedValue(0.55);

  useEffect(() => {
    if (isPlaying) {
      vinylRotation.value = withRepeat(
        withTiming(360, { duration: 8000, easing: Easing.linear }), -1, false
      );
      vinylElevation.value = withSpring(1, { damping: 12 });
      [waveAnim1, waveAnim2, waveAnim3, waveAnim4, waveAnim5, waveAnim6].forEach((anim, i) => {
        const heights = [0.4, 0.9, 0.6, 1, 0.5, 0.75];
        const durations = [320, 420, 380, 460, 340, 400];
        anim.value = withRepeat(
          withSequence(
            withTiming(heights[i], { duration: durations[i], easing: Easing.inOut(Easing.sin) }),
            withTiming(0.15, { duration: durations[i], easing: Easing.inOut(Easing.sin) })
          ), -1, true
        );
      });
    } else {
      cancelAnimation(vinylRotation);
      vinylElevation.value = withSpring(0, { damping: 12 });
      [waveAnim1, waveAnim2, waveAnim3, waveAnim4, waveAnim5, waveAnim6].forEach(anim => {
        cancelAnimation(anim);
        anim.value = withTiming(0.3, { duration: 400 });
      });
    }
  }, [isPlaying, vinylRotation, vinylElevation, waveAnim1, waveAnim2, waveAnim3, waveAnim4, waveAnim5, waveAnim6]);

  const vinylStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${vinylRotation.value}deg` },
      { scale: interpolate(vinylElevation.value, [0, 1], [1, 1.04]) },
    ],
  }));

  const handlePlayPause = () => {
    playScale.value = withSequence(withSpring(0.88, { damping: 8 }), withSpring(1, { damping: 10 }));
    playPause();
  };

  const handleSkipBack = () => {
    hapticFeedback.light();
    seek(Math.max(0, position - 10000));
  };

  const handleSkipForward = () => {
    if (!duration) return;
    hapticFeedback.light();
    seek(Math.min(duration, position + 15000));
  };

  return (
    <View style={styles.container}>
      <View style={styles.albumWrapper}>
        <Animated.View style={[styles.albumOuter, vinylStyle]}>
          <LinearGradient
            colors={[accentColor + '50', accentColor + '20', 'rgba(0,0,0,0.4)']}
            style={styles.albumInner}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <View style={[styles.albumDecorRing, { borderColor: accentColor + '25' }]} />
            <View style={styles.albumRing}>
              <View style={[styles.albumCore, { backgroundColor: accentColor + '44' }]}>
                <BookOpen size={28} color="rgba(255,255,255,0.95)" strokeWidth={1.5} />
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>

      <View style={styles.controlsRow}>
        <TouchableOpacity onPress={handleSkipBack} disabled={!sound || isDeviceTTS} style={styles.skipBtn}>
          <SkipBack size={26} color={colors.text.primary} strokeWidth={2} />
          <Text style={[styles.skipSec, { color: colors.text.secondary, fontFamily: FONTS.bold }]}>10</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePlayPause}
          disabled={!sound && !isDeviceTTS}
          style={[styles.playBtnWrap, { shadowColor: accentColor }]}
        >
          <LinearGradient
            colors={sound || isDeviceTTS ? [accentColor, accentColor + 'CC'] : ['#888', '#666']}
            style={styles.playBtn}
          >
            {isBuffering ? (
              <ActivityIndicator color="#FFF" />
            ) : isPlaying ? (
              <Pause size={32} color="#FFF" fill="#FFF" />
            ) : (
              <Play size={32} color="#FFF" fill="#FFF" style={{ marginLeft: 3 }} />
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSkipForward} disabled={!sound || isDeviceTTS} style={styles.skipBtn}>
          <SkipForward size={26} color={colors.text.primary} strokeWidth={2} />
          <Text style={[styles.skipSec, { color: colors.text.secondary, fontFamily: FONTS.bold }]}>15</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 24,
  },
  albumWrapper: {
    marginVertical: 40,
  },
  albumOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: Platform.OS === 'android' ? 0 : 20,
  },
  albumInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  albumDecorRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  albumRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  albumCore: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 40,
  },
  skipBtn: {
    alignItems: 'center',
    gap: 4,
  },
  skipSec: {
    fontSize: 12,
  },
  playBtnWrap: {
    borderRadius: 45,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 20,
    elevation: Platform.OS === 'android' ? 0 : 12,
  },
  playBtn: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
