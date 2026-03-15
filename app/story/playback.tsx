import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
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
} from 'react-native-reanimated';
import { storyService, quizService } from '@/services/database';
import { Story } from '@/types/database';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Play,
  Pause,
  RotateCcw,
  Award,
  RefreshCw,
  VolumeX,
  ArrowLeft,
  BookOpen,
  Clock,
  Share2,
  Library,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { SPACING, BORDER_RADIUS, SHADOWS, FONTS, FONT_SIZES } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { hapticFeedback } from '@/utils/haptics';
import { shareStory } from '@/utils/sharing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WORDS_PER_PAGE = 120;

function splitIntoParagraphs(content: string): string[] {
  return content
    .split(/\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

function splitIntoWords(text: string): string[] {
  return text.split(/(\s+)/).filter(t => t.length > 0);
}

function paginateWords(paragraphs: string[]): Array<{ tokens: string[]; isSpace: boolean[] }[]> {
  const pages: Array<{ tokens: string[]; isSpace: boolean[] }[]> = [];
  let currentPage: { tokens: string[]; isSpace: boolean[] }[] = [];
  let wordCount = 0;

  for (const para of paragraphs) {
    const tokens = splitIntoWords(para);
    const paraWords = tokens.filter(t => t.trim().length > 0).length;

    if (wordCount > 0 && wordCount + paraWords > WORDS_PER_PAGE) {
      pages.push(currentPage);
      currentPage = [];
      wordCount = 0;
    }

    currentPage.push({
      tokens,
      isSpace: tokens.map(t => /^\s+$/.test(t)),
    });
    wordCount += paraWords;
  }

  if (currentPage.length > 0) pages.push(currentPage);
  return pages;
}

function buildWordIndex(paragraphs: string[]): string[] {
  const allWords: string[] = [];
  for (const para of paragraphs) {
    const tokens = splitIntoWords(para);
    for (const t of tokens) {
      if (t.trim().length > 0) allWords.push(t);
    }
  }
  return allWords;
}

export default function StoryPlayback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { currentTheme } = useTheme();
  const C = currentTheme.colors;
  const scrollRef = useRef<ScrollView>(null);

  const [story, setStory] = useState<Story | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [audioError, setAudioError] = useState(false);
  const [hasQuiz, setHasQuiz] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const playScale = useSharedValue(1);

  const paragraphs = useMemo(
    () => (story ? splitIntoParagraphs(story.content) : []),
    [story]
  );

  const pages = useMemo(() => paginateWords(paragraphs), [paragraphs]);

  const allWords = useMemo(() => buildWordIndex(paragraphs), [paragraphs]);

  const activeWordIndex = useMemo(() => {
    if (!isPlaying && position === 0) return -1;
    if (duration <= 0 || allWords.length === 0) return -1;
    const progress = Math.min(position / duration, 1);
    return Math.floor(progress * allWords.length);
  }, [position, duration, allWords.length, isPlaying]);

  const pageWordRanges = useMemo(() => {
    let wordOffset = 0;
    return pages.map(page => {
      const start = wordOffset;
      let count = 0;
      for (const para of page) {
        for (let i = 0; i < para.tokens.length; i++) {
          if (!para.isSpace[i] && para.tokens[i].trim().length > 0) count++;
        }
      }
      wordOffset += count;
      return { start, end: wordOffset - 1 };
    });
  }, [pages]);

  useEffect(() => {
    if (activeWordIndex >= 0 && pages.length > 0) {
      for (let p = 0; p < pageWordRanges.length; p++) {
        if (activeWordIndex <= pageWordRanges[p].end) {
          if (p !== currentPage) setCurrentPage(p);
          break;
        }
      }
    }
  }, [activeWordIndex]);

  useEffect(() => {
    loadStory();
  }, []);

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync().catch(() => {});
    };
  }, [sound]);

  const loadStory = async () => {
    try {
      const storyId = params.storyId as string;
      if (!storyId) { setIsLoading(false); return; }
      const storyData = await storyService.getById(storyId);
      if (!storyData) { setIsLoading(false); return; }
      setStory(storyData);
      const quizData = await quizService.getQuestionsByStoryId(storyId);
      setHasQuiz(!!quizData && quizData.length > 0);
      if (storyData.audio_url) {
        await loadAudio(storyData.audio_url);
      } else {
        setAudioError(true);
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
    }
  };

  const handlePlayPause = useCallback(async () => {
    if (!sound) return;
    try {
      hapticFeedback.medium();
      playScale.value = withSpring(0.92, { damping: 10 });
      setTimeout(() => { playScale.value = withSpring(1, { damping: 10 }); }, 150);
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch {
      setAudioError(true);
    }
  }, [sound, isPlaying]);

  const handleRestart = useCallback(async () => {
    if (!sound) return;
    try {
      hapticFeedback.light();
      await sound.setPositionAsync(0);
      await sound.playAsync();
      setCurrentPage(0);
    } catch {}
  }, [sound]);

  const handleBack = useCallback(() => {
    hapticFeedback.light();
    if (sound) sound.stopAsync().catch(() => {});
    router.back();
  }, [sound, router]);

  const handleShare = useCallback(async () => {
    if (!story) return;
    hapticFeedback.medium();
    try { await shareStory(story.title, story.content); } catch {}
  }, [story]);

  const handleRegenerate = useCallback(() => {
    if (!story) return;
    hapticFeedback.medium();
    if (sound) sound.stopAsync().catch(() => {});
    router.push({
      pathname: '/story/generate',
      params: { profileId: story.profile_id, languageCode: story.language_code },
    });
  }, [story, sound, router]);

  const handleProgressBarPress = useCallback(
    async (event: any) => {
      if (!sound || !duration) return;
      const { locationX } = event.nativeEvent;
      const barWidth = SCREEN_WIDTH - SPACING.xl * 2 - SPACING.lg * 2;
      const pct = Math.max(0, Math.min(1, locationX / barWidth));
      try {
        hapticFeedback.light();
        await sound.setPositionAsync(duration * pct);
      } catch {}
    },
    [sound, duration]
  );

  const formatTime = (millis: number): string => {
    const s = Math.floor(millis / 1000);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  };

  const playAnimStyle = useAnimatedStyle(() => {
    'worklet';
    return { transform: [{ scale: playScale.value }] };
  });

  const progressPercentage = duration > 0 ? (position / duration) * 100 : 0;

  if (isLoading) {
    return (
      <LinearGradient colors={C.backgroundGradient} style={styles.fill}>
        <SafeAreaView style={[styles.fill, styles.center]}>
          <BookOpen size={48} color={C.primary} strokeWidth={1.5} />
          <Text style={[styles.loadingText, { color: C.text.secondary, fontFamily: FONTS.medium }]}>
            Opening your story...
          </Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!story) {
    return (
      <LinearGradient colors={C.backgroundGradient} style={styles.fill}>
        <SafeAreaView style={[styles.fill, styles.center]}>
          <Text style={[styles.errorTitle, { color: C.text.primary, fontFamily: FONTS.bold }]}>Story Not Found</Text>
          <Text style={[styles.errorSubtitle, { color: C.text.secondary, fontFamily: FONTS.medium }]}>
            This story may have been deleted.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            style={[styles.errorButton, { backgroundColor: C.primary }]}
          >
            <Text style={[styles.errorButtonText, { fontFamily: FONTS.semibold }]}>Go Home</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const currentPageData = pages[currentPage] || [];
  const wordOffsetOnPage = pageWordRanges[currentPage]?.start ?? 0;

  let wordCounter = wordOffsetOnPage;

  return (
    <LinearGradient colors={C.backgroundGradient} style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top', 'bottom']}>

        <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            style={[styles.iconBtn, { backgroundColor: C.cardBackground }]}
            activeOpacity={0.7}
          >
            <ArrowLeft size={22} color={C.text.primary} strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            {story.season && (
              <View style={[styles.badge, { backgroundColor: C.primary + '18' }]}>
                <Text style={[styles.badgeText, { color: C.primary, fontFamily: FONTS.semibold }]}>
                  {story.season}
                </Text>
              </View>
            )}
            {story.time_of_day && (
              <View style={[styles.badge, { backgroundColor: C.primary + '18' }]}>
                <Clock size={11} color={C.primary} />
                <Text style={[styles.badgeText, { color: C.primary, fontFamily: FONTS.semibold }]}>
                  {story.time_of_day}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/history')}
              style={[styles.iconBtn, { backgroundColor: C.cardBackground }]}
              activeOpacity={0.7}
            >
              <Library size={18} color={C.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShare}
              style={[styles.iconBtn, { backgroundColor: C.cardBackground }]}
              activeOpacity={0.7}
            >
              <Share2 size={18} color={C.primary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(120).springify()} style={styles.titleWrap}>
          <Text style={[styles.storyTitle, { color: C.text.primary, fontFamily: FONTS.bold }]}>
            {story.title}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).springify()} style={[styles.bookCard, { backgroundColor: C.cardBackground }]}>
          <View style={[styles.bookSpineLeft, { backgroundColor: C.primary + '28' }]} />

          <ScrollView
            ref={scrollRef}
            style={styles.pageScroll}
            contentContainerStyle={styles.pageContent}
            showsVerticalScrollIndicator={false}
          >
            {currentPageData.map((para, paraIdx) => {
              const paraElements: JSX.Element[] = [];
              for (let ti = 0; ti < para.tokens.length; ti++) {
                const token = para.tokens[ti];
                const isSpaceToken = para.isSpace[ti];
                if (isSpaceToken) {
                  paraElements.push(<Text key={`sp-${paraIdx}-${ti}`}> </Text>);
                } else {
                  const wIdx = wordCounter;
                  wordCounter++;
                  const isActive = wIdx === activeWordIndex;
                  const isPast = wIdx < activeWordIndex;
                  paraElements.push(
                    <Text
                      key={`w-${paraIdx}-${ti}`}
                      style={[
                        styles.wordToken,
                        { fontFamily: FONTS.regular, color: C.text.secondary },
                        isPast && { color: C.text.primary + 'BB' },
                        isActive && [
                          styles.wordActive,
                          { backgroundColor: C.primary + '30', color: C.primary },
                        ],
                      ]}
                    >
                      {token}
                    </Text>
                  );
                }
              }
              return (
                <Text key={`para-${paraIdx}`} style={styles.paragraph}>
                  {paraElements}
                </Text>
              );
            })}
          </ScrollView>

          <View style={[styles.bookSpineRight, { backgroundColor: C.primary + '10' }]} />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(280).springify()} style={styles.pageNav}>
          <TouchableOpacity
            onPress={() => {
              hapticFeedback.light();
              if (currentPage > 0) setCurrentPage(p => p - 1);
            }}
            disabled={currentPage === 0}
            style={[styles.pageNavBtn, { opacity: currentPage === 0 ? 0.3 : 1 }]}
            activeOpacity={0.7}
          >
            <ChevronLeft size={20} color={C.primary} />
          </TouchableOpacity>

          <Text style={[styles.pageIndicator, { color: C.text.secondary, fontFamily: FONTS.semibold }]}>
            {currentPage + 1} / {Math.max(1, pages.length)}
          </Text>

          <TouchableOpacity
            onPress={() => {
              hapticFeedback.light();
              if (currentPage < pages.length - 1) setCurrentPage(p => p + 1);
            }}
            disabled={currentPage >= pages.length - 1}
            style={[styles.pageNavBtn, { opacity: currentPage >= pages.length - 1 ? 0.3 : 1 }]}
            activeOpacity={0.7}
          >
            <ChevronRight size={20} color={C.primary} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(340).springify()} style={styles.actionRow}>
          <TouchableOpacity
            onPress={handleRegenerate}
            style={[styles.actionBtn, { borderColor: C.primary + '35', borderWidth: 1.5 }]}
            activeOpacity={0.7}
          >
            <RefreshCw size={18} color={C.primary} />
            <Text style={[styles.actionBtnText, { color: C.primary, fontFamily: FONTS.semibold }]}>
              New Story
            </Text>
          </TouchableOpacity>

          {hasQuiz && (
            <TouchableOpacity
              onPress={() => {
                hapticFeedback.medium();
                if (sound) sound.stopAsync().catch(() => {});
                router.push({ pathname: '/story/quiz', params: { storyId: story.$id } });
              }}
              activeOpacity={0.9}
              style={{ flex: 1 }}
            >
              <LinearGradient
                colors={C.gradients.sunset}
                style={styles.quizBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Award size={20} color="#FFFFFF" />
                <Text style={[styles.quizBtnText, { fontFamily: FONTS.bold }]}>Start Quiz</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </Animated.View>

        {audioError ? (
          <View style={[styles.audioErrorBar, { backgroundColor: C.warning + '18' }]}>
            <VolumeX size={18} color={C.warning} />
            <Text style={[styles.audioErrorText, { color: C.text.secondary, fontFamily: FONTS.medium }]}>
              Audio unavailable — reading mode active
            </Text>
          </View>
        ) : (
          <View style={[styles.controls, { backgroundColor: C.cardBackground }]}>
            <Pressable onPress={handleProgressBarPress} style={styles.progressPressable}>
              <View style={[styles.progressTrack, { backgroundColor: C.text.light + '28' }]}>
                <LinearGradient
                  colors={C.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${progressPercentage}%` }]}
                />
              </View>
            </Pressable>

            <View style={styles.timeRow}>
              <Text style={[styles.timeText, { color: C.text.light, fontFamily: FONTS.medium }]}>
                {formatTime(position)}
              </Text>
              <Text style={[styles.timeText, { color: C.text.light, fontFamily: FONTS.medium }]}>
                {formatTime(duration)}
              </Text>
            </View>

            <View style={styles.controlBtns}>
              <TouchableOpacity
                onPress={handleRestart}
                disabled={!sound}
                style={styles.sideBtn}
                activeOpacity={0.6}
              >
                <RotateCcw size={22} color={sound ? C.text.primary : C.text.light} />
              </TouchableOpacity>

              <Animated.View style={playAnimStyle}>
                <TouchableOpacity onPress={handlePlayPause} disabled={!sound} activeOpacity={0.8}>
                  <LinearGradient
                    colors={sound ? C.gradients.primary : [C.text.light, C.text.light]}
                    style={styles.playBtn}
                  >
                    {isPlaying
                      ? <Pause size={30} color="#FFF" fill="#FFF" />
                      : <Play size={30} color="#FFF" fill="#FFF" />
                    }
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              <View style={styles.sideBtn} />
            </View>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center', gap: SPACING.lg },

  loadingText: { fontSize: FONT_SIZES.md },
  errorTitle: { fontSize: FONT_SIZES.xxl, marginBottom: SPACING.sm },
  errorSubtitle: { fontSize: FONT_SIZES.md, marginBottom: SPACING.xl },
  errorButton: {
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.pill,
  },
  errorButtonText: { color: '#FFF', fontSize: FONT_SIZES.md },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flex: 1,
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconBtn: {
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
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.pill,
  },
  badgeText: {
    fontSize: 11,
    textTransform: 'capitalize',
  },

  titleWrap: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.sm,
  },
  storyTitle: {
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.4,
  },

  bookCard: {
    marginHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    flexDirection: 'row',
    overflow: 'hidden',
    flex: 1,
    minHeight: 240,
    ...SHADOWS.md,
  },
  bookSpineLeft: {
    width: 6,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderBottomLeftRadius: BORDER_RADIUS.xl,
  },
  bookSpineRight: {
    width: 4,
    borderTopRightRadius: BORDER_RADIUS.xl,
    borderBottomRightRadius: BORDER_RADIUS.xl,
  },
  pageScroll: { flex: 1 },
  pageContent: {
    padding: SPACING.xl,
    paddingRight: SPACING.lg,
    gap: SPACING.lg,
  },
  paragraph: {
    fontSize: 17,
    lineHeight: 28,
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
  wordToken: {
    fontSize: 17,
    lineHeight: 28,
  },
  wordActive: {
    borderRadius: 4,
    paddingHorizontal: 2,
    overflow: 'hidden',
    fontFamily: FONTS.bold,
  },

  pageNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xl,
    paddingVertical: SPACING.sm,
  },
  pageNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageIndicator: {
    fontSize: FONT_SIZES.sm,
    minWidth: 56,
    textAlign: 'center',
  },

  actionRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
  },
  actionBtnText: { fontSize: FONT_SIZES.sm },
  quizBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.md,
  },
  quizBtnText: {
    color: '#FFF',
    fontSize: FONT_SIZES.md,
  },

  audioErrorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  audioErrorText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
  },

  controls: {
    paddingTop: SPACING.md,
    paddingBottom: 28,
    paddingHorizontal: SPACING.xl,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    ...SHADOWS.lg,
  },
  progressPressable: { paddingVertical: SPACING.sm },
  progressTrack: {
    height: 5,
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
    marginBottom: SPACING.sm,
  },
  timeText: { fontSize: FONT_SIZES.xs },
  controlBtns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sideBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },
});
