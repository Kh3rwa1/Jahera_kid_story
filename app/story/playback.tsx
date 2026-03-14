import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { storyService, quizService } from '@/services/database';
import { Story } from '@/types/database';
import {
  Play,
  Pause,
  RotateCcw,
  Award,
  RefreshCw,
  Volume2,
  VolumeX,
  ArrowLeft,
  BookOpen,
  Clock,
  Share2,
} from 'lucide-react-native';
import { SPACING, BORDER_RADIUS, SHADOWS, FONTS, FONT_SIZES } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { hapticFeedback } from '@/utils/haptics';
import { shareStory } from '@/utils/sharing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function StoryPlayback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { currentTheme } = useTheme();
  const themeColors = currentTheme.colors;
  const [story, setStory] = useState<Story | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showText, setShowText] = useState(true);
  const [audioError, setAudioError] = useState(false);
  const [hasQuiz, setHasQuiz] = useState(false);

  const playScale = useSharedValue(1);

  useEffect(() => {
    loadStory();
  }, []);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(() => {});
      }
    };
  }, [sound]);

  const loadStory = async () => {
    try {
      const storyId = params.storyId as string;
      if (!storyId) {
        setIsLoading(false);
        return;
      }
      const storyData = await storyService.getById(storyId);
      if (!storyData) {
        setIsLoading(false);
        return;
      }
      setStory(storyData);
      const quizData = await quizService.getQuestionsByStoryId(storyId);
      setHasQuiz(!!quizData && quizData.length > 0);
      if (storyData.audio_url) {
        await loadAudio(storyData.audio_url);
      } else {
        setAudioError(true);
        setShowText(true);
      }
      setIsLoading(false);
    } catch {
      setIsLoading(false);
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
      setAudioError(false);
    } catch {
      setAudioError(true);
      setShowText(true);
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
      return;
    }
    if (status.error) {
      setAudioError(true);
      setIsPlaying(false);
      setShowText(true);
    }
  };

  const handlePlayPause = useCallback(async () => {
    if (!sound) return;
    try {
      hapticFeedback.medium();
      playScale.value = withSpring(0.92, { damping: 10 });
      setTimeout(() => {
        playScale.value = withSpring(1, { damping: 10 });
      }, 150);
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch {
      setAudioError(true);
      setShowText(true);
    }
  }, [sound, isPlaying]);

  const handleRestart = useCallback(async () => {
    if (!sound) return;
    try {
      hapticFeedback.light();
      await sound.setPositionAsync(0);
      await sound.playAsync();
    } catch {}
  }, [sound]);

  const handleBack = useCallback(() => {
    hapticFeedback.light();
    if (sound) {
      sound.stopAsync().catch(() => {});
    }
    router.back();
  }, [sound, router]);

  const handleShare = useCallback(async () => {
    if (!story) return;
    hapticFeedback.medium();
    try {
      await shareStory(story.title, story.content);
    } catch {}
  }, [story]);

  const handleRegenerate = useCallback(() => {
    if (!story) return;
    hapticFeedback.medium();
    if (sound) {
      sound.stopAsync().catch(() => {});
    }
    router.push({
      pathname: '/story/generate',
      params: {
        profileId: story.profile_id,
        languageCode: story.language_code,
      },
    });
  }, [story, sound, router]);

  const handleProgressBarPress = useCallback(
    async (event: any) => {
      if (!sound || !duration) return;
      const { locationX } = event.nativeEvent;
      const barWidth = SCREEN_WIDTH - SPACING.xl * 2 - SPACING.lg * 2;
      const percentage = Math.max(0, Math.min(1, locationX / barWidth));
      const newPosition = duration * percentage;
      try {
        hapticFeedback.light();
        await sound.setPositionAsync(newPosition);
      } catch {}
    },
    [sound, duration]
  );

  const formatTime = (millis: number): string => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const playAnimStyle = useAnimatedStyle(() => {
    'worklet';
    return { transform: [{ scale: playScale.value }] };
  });

  if (isLoading) {
    return (
      <LinearGradient colors={themeColors.backgroundGradient} style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <BookOpen size={48} color={themeColors.primary} strokeWidth={1.5} />
          <Text style={[styles.loadingText, { color: themeColors.text.secondary, fontFamily: FONTS.medium }]}>
            Loading story...
          </Text>
        </View>
      </LinearGradient>
    );
  }

  if (!story) {
    return (
      <LinearGradient colors={themeColors.backgroundGradient} style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Text style={[styles.errorTitle, { color: themeColors.text.primary, fontFamily: FONTS.bold }]}>
            Story Not Found
          </Text>
          <Text style={[styles.errorSubtitle, { color: themeColors.text.secondary, fontFamily: FONTS.medium }]}>
            This story may have been deleted.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            style={[styles.errorButton, { backgroundColor: themeColors.primary }]}
          >
            <Text style={[styles.errorButtonText, { fontFamily: FONTS.semibold }]}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const progressPercentage = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <LinearGradient colors={themeColors.backgroundGradient} style={styles.container}>
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={[styles.backButton, { backgroundColor: themeColors.cardBackground }]}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={themeColors.text.primary} strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.headerRight}>
          {story.season && (
            <View style={[styles.badge, { backgroundColor: themeColors.primary + '15' }]}>
              <Text style={[styles.badgeText, { color: themeColors.primary, fontFamily: FONTS.semibold }]}>
                {story.season}
              </Text>
            </View>
          )}
          {story.time_of_day && (
            <View style={[styles.badge, { backgroundColor: themeColors.primary + '15' }]}>
              <Clock size={12} color={themeColors.primary} />
              <Text style={[styles.badgeText, { color: themeColors.primary, fontFamily: FONTS.semibold }]}>
                {story.time_of_day}
              </Text>
            </View>
          )}
          <TouchableOpacity
            onPress={handleShare}
            style={[styles.shareButton, { backgroundColor: themeColors.cardBackground }]}
            activeOpacity={0.7}
          >
            <Share2 size={18} color={themeColors.primary} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.delay(200).springify()}>
          <Text style={[styles.storyTitle, { color: themeColors.text.primary, fontFamily: FONTS.bold }]}>
            {story.title}
          </Text>
        </Animated.View>

        {!audioError && (
          <Animated.View entering={FadeInUp.delay(300).springify()}>
            <View style={[styles.audioCard, { backgroundColor: themeColors.cardBackground }]}>
              <View style={styles.audioVisualizer}>
                {Array.from({ length: 24 }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.audioBar,
                      {
                        backgroundColor: themeColors.primary,
                        height: isPlaying ? 8 + Math.random() * 32 : 8,
                        opacity: isPlaying ? 0.4 + (i % 3) * 0.2 : 0.2,
                      },
                    ]}
                  />
                ))}
              </View>

              <Text
                style={[
                  styles.playingLabel,
                  { color: isPlaying ? themeColors.primary : themeColors.text.light, fontFamily: FONTS.semibold },
                ]}
              >
                {isPlaying ? 'Now Playing' : 'Paused'}
              </Text>
            </View>
          </Animated.View>
        )}

        {audioError && (
          <Animated.View entering={FadeInUp.delay(300).springify()}>
            <View style={[styles.audioErrorCard, { backgroundColor: themeColors.warning + '12' }]}>
              <VolumeX size={24} color={themeColors.warning} strokeWidth={1.5} />
              <Text style={[styles.audioErrorText, { color: themeColors.text.secondary, fontFamily: FONTS.medium }]}>
                Audio narration unavailable. Read the story below.
              </Text>
            </View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(400).springify()}>
          <TouchableOpacity
            onPress={() => {
              hapticFeedback.light();
              setShowText(!showText);
            }}
            style={[styles.toggleTextButton, { borderColor: themeColors.primary + '30' }]}
            activeOpacity={0.7}
          >
            <BookOpen size={18} color={themeColors.primary} />
            <Text style={[styles.toggleTextLabel, { color: themeColors.primary, fontFamily: FONTS.semibold }]}>
              {showText ? 'Hide Story Text' : 'Show Story Text'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {showText && (
          <Animated.View entering={FadeInDown.springify()}>
            <View style={[styles.storyTextCard, { backgroundColor: themeColors.cardBackground }]}>
              <Text style={[styles.storyContent, { color: themeColors.text.secondary, fontFamily: FONTS.regular }]}>
                {story.content}
              </Text>
            </View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.actionButtons}>
          <TouchableOpacity
            onPress={handleRegenerate}
            style={[styles.actionButton, { borderColor: themeColors.primary + '30', borderWidth: 1.5 }]}
            activeOpacity={0.7}
          >
            <RefreshCw size={20} color={themeColors.primary} />
            <Text style={[styles.actionButtonText, { color: themeColors.primary, fontFamily: FONTS.semibold }]}>
              New Story
            </Text>
          </TouchableOpacity>

          {hasQuiz && (
            <TouchableOpacity
              onPress={() => {
                hapticFeedback.medium();
                router.push({ pathname: '/story/quiz', params: { storyId: story.$id } });
              }}
              activeOpacity={0.9}
              style={{ flex: 1 }}
            >
              <LinearGradient
                colors={themeColors.gradients.sunset}
                style={styles.quizButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Award size={22} color="#FFFFFF" />
                <Text style={[styles.quizButtonText, { fontFamily: FONTS.bold }]}>Start Quiz</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScrollView>

      {!audioError && (
        <View style={[styles.controls, { backgroundColor: themeColors.cardBackground }]}>
          <Pressable onPress={handleProgressBarPress} style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { backgroundColor: themeColors.text.light + '25' }]}>
              <LinearGradient
                colors={themeColors.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${progressPercentage}%` }]}
              />
            </View>
          </Pressable>

          <View style={styles.timeRow}>
            <Text style={[styles.timeText, { color: themeColors.text.light, fontFamily: FONTS.medium }]}>
              {formatTime(position)}
            </Text>
            <Text style={[styles.timeText, { color: themeColors.text.light, fontFamily: FONTS.medium }]}>
              {formatTime(duration)}
            </Text>
          </View>

          <View style={styles.controlButtons}>
            <TouchableOpacity
              onPress={handleRestart}
              disabled={!sound}
              style={styles.controlBtn}
              activeOpacity={0.6}
            >
              <RotateCcw size={24} color={sound ? themeColors.text.primary : themeColors.text.light} />
            </TouchableOpacity>

            <Animated.View style={playAnimStyle}>
              <TouchableOpacity
                onPress={handlePlayPause}
                disabled={!sound}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={sound ? themeColors.gradients.primary : [themeColors.text.light, themeColors.text.light]}
                  style={styles.playButton}
                >
                  {isPlaying ? (
                    <Pause size={32} color="#FFFFFF" fill="#FFFFFF" />
                  ) : (
                    <Play size={32} color="#FFFFFF" fill="#FFFFFF" />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.controlBtn}>
              <Volume2 size={24} color={themeColors.text.light} />
            </View>
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    gap: SPACING.lg,
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
  },
  errorTitle: {
    fontSize: FONT_SIZES.xxl,
    marginBottom: SPACING.sm,
  },
  errorSubtitle: {
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.xl,
  },
  errorButton: {
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.pill,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.pill,
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    textTransform: 'capitalize',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: 220,
  },
  storyTitle: {
    fontSize: 28,
    lineHeight: 36,
    marginBottom: SPACING.xl,
    letterSpacing: -0.3,
  },
  audioCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  audioVisualizer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    gap: 3,
    marginBottom: SPACING.md,
  },
  audioBar: {
    width: 4,
    borderRadius: 2,
  },
  playingLabel: {
    fontSize: FONT_SIZES.sm,
  },
  audioErrorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  audioErrorText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
  },
  toggleTextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  toggleTextLabel: {
    fontSize: FONT_SIZES.sm,
  },
  storyTextCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },
  storyContent: {
    fontSize: FONT_SIZES.md,
    lineHeight: 28,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
  },
  actionButtonText: {
    fontSize: FONT_SIZES.sm,
  },
  quizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.lg,
  },
  quizButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.lg,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: SPACING.lg,
    paddingBottom: 40,
    paddingHorizontal: SPACING.xl,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    ...SHADOWS.lg,
  },
  progressBarContainer: {
    paddingVertical: SPACING.sm,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  timeText: {
    fontSize: FONT_SIZES.xs,
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },
});
