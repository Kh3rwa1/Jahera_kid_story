import { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { storyService } from '@/services/database';
import { Story } from '@/types/database';
import { Play, Pause, RotateCcw, X, ChevronDown, Award } from 'lucide-react-native';
import { Container } from '@/components/Container';
import { Typography } from '@/components/Typography';
import { PremiumButton } from '@/components/PremiumButton';
import { PremiumCard } from '@/components/PremiumCard';
import { AudioWaveform } from '@/components/AudioWaveform';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { ErrorState } from '@/components/ErrorState';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT_SIZES } from '@/constants/theme';
import { hapticFeedback } from '@/utils/haptics';
import { useFadeIn, useSlideInUp } from '@/utils/animations';

export default function StoryPlayback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [story, setStory] = useState<Story | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    loadStory();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const loadStory = async () => {
    try {
      const storyId = params.storyId as string;
      const storyData = await storyService.getByProfileId(storyId);

      if (!storyData || storyData.length === 0) {
        router.back();
        return;
      }

      const currentStory = storyData[0];
      setStory(currentStory);

      if (currentStory.audio_url) {
        await loadAudio(currentStory.audio_url);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading story:', error);
      router.back();
    }
  };

  const loadAudio = async (audioPath: string) => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { sound: audioSound } = await Audio.Sound.createAsync(
        { uri: audioPath },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );

      setSound(audioSound);
    } catch (error) {
      console.error('Error loading audio:', error);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);

      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
      }
    }
  };

  const handlePlayPause = useCallback(async () => {
    if (!sound) return;

    try {
      hapticFeedback.medium();
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (error) {
      console.error('Error playing/pausing audio:', error);
    }
  }, [sound, isPlaying]);

  const handleRestart = useCallback(async () => {
    if (!sound) return;

    try {
      hapticFeedback.light();
      await sound.setPositionAsync(0);
      await sound.playAsync();
    } catch (error) {
      console.error('Error restarting audio:', error);
    }
  }, [sound]);

  const handleClose = useCallback(() => {
    hapticFeedback.light();
    if (sound) {
      sound.stopAsync();
    }
    router.back();
  }, [sound, router]);

  const handleProgressBarPress = useCallback(async (event: any) => {
    if (!sound || !duration) return;

    const { locationX } = event.nativeEvent;
    const screenWidth = Dimensions.get('window').width - (SPACING.xl * 2);
    const percentage = locationX / screenWidth;
    const newPosition = duration * percentage;

    try {
      hapticFeedback.light();
      await sound.setPositionAsync(newPosition);
    } catch (error) {
      console.error('Error seeking audio:', error);
    }
  }, [sound, duration]);

  const formatTime = (millis: number): string => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading || !story) {
    return (
      <Container gradient gradientColors={COLORS.backgroundGradient} centered>
        <LoadingSkeleton type="card" count={3} />
      </Container>
    );
  }

  if (!story) {
    return (
      <Container gradient gradientColors={COLORS.backgroundGradient}>
        <ErrorState
          type="notFound"
          title="Story Not Found"
          message="We couldn't find this story. It may have been deleted."
          onGoHome={() => router.replace('/(tabs)')}
        />
      </Container>
    );
  }

  const progressPercentage = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <Container safeArea={false} padding={false} gradient gradientColors={COLORS.backgroundGradient}>
      {/* Header with close button */}
      <View style={styles.header}>
        <Pressable
          style={styles.closeButton}
          onPress={handleClose}
          accessibilityLabel="Close playback"
          accessibilityRole="button"
        >
          <ChevronDown size={28} color={COLORS.text.primary} strokeWidth={2.5} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Story Title */}
        <View style={styles.titleContainer}>
          <Typography variant="displayMedium" align="center" style={styles.title}>
            {story.title}
          </Typography>
          <View style={styles.metadata}>
            <PremiumCard padding={SPACING.sm} shadow="sm" style={styles.metadataBadge}>
              <Typography variant="caption" color="secondary">
                {story.season}
              </Typography>
            </PremiumCard>
            <PremiumCard padding={SPACING.sm} shadow="sm" style={styles.metadataBadge}>
              <Typography variant="caption" color="secondary">
                {story.time_of_day}
              </Typography>
            </PremiumCard>
          </View>
        </View>

        {/* Waveform Visualization */}
        <PremiumCard gradient={COLORS.cardGradient} shadow="lg" style={styles.waveformCard}>
          <AudioWaveform isPlaying={isPlaying} color={COLORS.primary} />
          <View style={styles.statusContainer}>
            <Typography variant="label" color={isPlaying ? 'primary' : 'secondary'}>
              {isPlaying ? 'Now Playing' : 'Paused'}
            </Typography>
          </View>
        </PremiumCard>

        {/* Story Text Toggle */}
        {showText && (
          <PremiumCard style={styles.textCard} shadow="md">
            <ScrollView style={styles.textScroll} nestedScrollEnabled>
              <Typography variant="bodyMedium" color="secondary" style={styles.storyText}>
                {story.content}
              </Typography>
            </ScrollView>
          </PremiumCard>
        )}

        <PremiumButton
          title={showText ? 'Hide Story Text' : 'Show Story Text'}
          onPress={() => {
            hapticFeedback.light();
            setShowText(!showText);
          }}
          variant="ghost"
          size="medium"
          style={styles.showTextButton}
          accessibilityLabel={showText ? 'Hide story text' : 'Show story text'}
        />

        {/* Quiz Button */}
        <PremiumButton
          title="Start Quiz"
          onPress={() => router.push({ pathname: '/story/quiz', params: { storyId: story.id } })}
          variant="primary"
          size="large"
          icon={<Award size={24} color={COLORS.text.inverse} />}
          style={styles.quizButton}
          gradient={COLORS.gradients.sunset}
          accessibilityLabel="Start quiz for this story"
        />
      </ScrollView>

      {/* Audio Controls */}
      <LinearGradient
        colors={['transparent', COLORS.cardBackground]}
        style={styles.controlsGradient}
      >
        <View style={styles.controls}>
          {/* Progress Bar with Scrubbing */}
          <Pressable
            onPress={handleProgressBarPress}
            style={styles.progressBarContainer}
            accessibilityLabel={`Progress: ${formatTime(position)} of ${formatTime(duration)}`}
            accessibilityRole="adjustable"
          >
            <View style={styles.progressBar}>
              <LinearGradient
                colors={COLORS.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${progressPercentage}%` }]}
              />
              <View style={[styles.progressThumb, { left: `${progressPercentage}%` }]} />
            </View>
          </Pressable>

          <View style={styles.timeContainer}>
            <Typography variant="caption" color="secondary">
              {formatTime(position)}
            </Typography>
            <Typography variant="caption" color="secondary">
              {formatTime(duration)}
            </Typography>
          </View>

          {/* Control Buttons */}
          <View style={styles.controlButtons}>
            <Pressable
              onPress={handleRestart}
              disabled={!sound}
              style={({ pressed }) => [
                styles.controlButton,
                pressed && styles.controlButtonPressed,
              ]}
              accessibilityLabel="Restart story"
              accessibilityRole="button"
            >
              <RotateCcw size={28} color={sound ? COLORS.text.primary : COLORS.text.light} />
            </Pressable>

            <Pressable
              onPress={handlePlayPause}
              disabled={!sound}
              style={({ pressed }) => [
                styles.playButton,
                pressed && styles.playButtonPressed,
                !sound && styles.playButtonDisabled,
              ]}
              accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
              accessibilityRole="button"
            >
              <LinearGradient
                colors={sound ? COLORS.gradients.primary : [COLORS.text.light, COLORS.text.light]}
                style={styles.playButtonGradient}
              >
                {isPlaying ? (
                  <Pause size={40} color={COLORS.text.inverse} fill={COLORS.text.inverse} />
                ) : (
                  <Play size={40} color={COLORS.text.inverse} fill={COLORS.text.inverse} />
                )}
              </LinearGradient>
            </Pressable>

            {/* Spacer for symmetry */}
            <View style={styles.controlButton} />
          </View>
        </View>
      </LinearGradient>
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: SPACING.xxxl + 20,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: 260,
  },
  titleContainer: {
    marginBottom: SPACING.xxxl,
  },
  title: {
    marginBottom: SPACING.md,
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  metadataBadge: {
    borderRadius: BORDER_RADIUS.md,
    textTransform: 'capitalize',
  },
  waveformCard: {
    marginBottom: SPACING.xl,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  statusContainer: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  textCard: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
    maxHeight: 300,
  },
  textScroll: {
    maxHeight: 260,
  },
  storyText: {
    lineHeight: 26,
  },
  showTextButton: {
    marginTop: SPACING.md,
    alignSelf: 'center',
  },
  quizButton: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
    alignSelf: 'center',
  },
  controlsGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: SPACING.xxxl,
  },
  controls: {
    backgroundColor: COLORS.cardBackground,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxxl + 10,
    paddingHorizontal: SPACING.xl,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    ...SHADOWS.lg,
  },
  progressBarContainer: {
    marginBottom: SPACING.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.text.light + '30',
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'visible',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.sm,
  },
  progressThumb: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    marginLeft: -8,
    ...SHADOWS.md,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonPressed: {
    opacity: 0.6,
  },
  playButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.colored,
  },
  playButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.95 }],
  },
  playButtonDisabled: {
    opacity: 0.5,
  },
});
