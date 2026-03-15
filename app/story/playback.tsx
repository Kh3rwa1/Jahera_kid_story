import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  SlideInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { storyService, quizService } from '@/services/database';
import { Story } from '@/types/database';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Pause, Award, RefreshCw, VolumeX, ArrowLeft, BookOpen, Share2, Minus, Plus, Headphones, ChevronLeft as AlignLeft, SkipBack, SkipForward } from 'lucide-react-native';
import { SPACING, BORDER_RADIUS, SHADOWS, FONTS, FONT_SIZES } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { hapticFeedback } from '@/utils/haptics';
import { shareStory } from '@/utils/sharing';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const THEME_GRADIENTS: Record<string, [string, string]> = {
  adventure: ['#FF6B35', '#F7931E'],
  fantasy: ['#7B2FBE', '#C77DFF'],
  magic: ['#5E35B1', '#AB47BC'],
  animals: ['#2E7D32', '#66BB6A'],
  space: ['#0D1B2A', '#1565C0'],
  ocean: ['#006994', '#00BCD4'],
  forest: ['#1B5E20', '#558B2F'],
  dinosaurs: ['#BF360C', '#E64A19'],
  superheroes: ['#B71C1C', '#F57F17'],
  heroes: ['#1A237E', '#283593'],
  nature: ['#33691E', '#689F38'],
  science: ['#01579B', '#0288D1'],
  default: ['#1A3A2A', '#2D5A3D'],
};

function splitIntoParagraphs(content: string): string[] {
  return content
    .split(/\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

function splitIntoTokens(text: string): Array<{ word: string; isSpace: boolean }> {
  const raw = text.split(/(\s+)/);
  return raw.filter(t => t.length > 0).map(t => ({
    word: t,
    isSpace: /^\s+$/.test(t),
  }));
}

function buildWordIndex(paragraphs: string[]): string[] {
  const words: string[] = [];
  for (const para of paragraphs) {
    for (const tok of splitIntoTokens(para)) {
      if (!tok.isSpace && tok.word.trim().length > 0) words.push(tok.word);
    }
  }
  return words;
}

type TabMode = 'audio' | 'text';

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
  const [tab, setTab] = useState<TabMode>('audio');
  const [fontSize, setFontSize] = useState(17);
  const playScale = useSharedValue(1);

  const paragraphs = useMemo(
    () => (story ? splitIntoParagraphs(story.content) : []),
    [story]
  );

  const allWords = useMemo(() => buildWordIndex(paragraphs), [paragraphs]);

  const activeWordIndex = useMemo(() => {
    if (duration <= 0 || allWords.length === 0 || position === 0) return -1;
    const progress = Math.min(position / duration, 1);
    return Math.floor(progress * allWords.length);
  }, [position, duration, allWords.length]);

  const themeGradient: [string, string] = useMemo(() => {
    if (!story?.theme) return THEME_GRADIENTS.default;
    return THEME_GRADIENTS[story.theme] || THEME_GRADIENTS.default;
  }, [story?.theme]);

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
        setTab('text');
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
      setTab('text');
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
      playScale.value = withSpring(0.88, { damping: 8 });
      setTimeout(() => { playScale.value = withSpring(1, { damping: 10 }); }, 120);
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch {
      setAudioError(true);
    }
  }, [sound, isPlaying]);

  const handleSkipBack = useCallback(async () => {
    if (!sound) return;
    try {
      hapticFeedback.light();
      const newPos = Math.max(0, position - 10000);
      await sound.setPositionAsync(newPos);
    } catch {}
  }, [sound, position]);

  const handleSkipForward = useCallback(async () => {
    if (!sound || !duration) return;
    try {
      hapticFeedback.light();
      const newPos = Math.min(duration, position + 15000);
      await sound.setPositionAsync(newPos);
    } catch {}
  }, [sound, position, duration]);

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

  const handleProgressBarPress = useCallback(
    async (event: any) => {
      if (!sound || !duration) return;
      const { locationX } = event.nativeEvent;
      const barWidth = SCREEN_WIDTH - SPACING.xxl * 2;
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
      <LinearGradient colors={['#1A3A2A', '#2D5A3D']} style={styles.fill}>
        <SafeAreaView style={[styles.fill, styles.center]}>
          <BookOpen size={52} color="#FFFFFF" strokeWidth={1.5} />
          <Text style={[styles.loadingText, { color: '#FFFFFF', fontFamily: FONTS.medium }]}>
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
          <Text style={[styles.errorTitle, { color: C.text.primary, fontFamily: FONTS.bold }]}>
            Story Not Found
          </Text>
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

  let globalWordCounter = 0;

  return (
    <View style={styles.fill}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={themeGradient}
        style={styles.heroSection}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroOverlay} />

        <SafeAreaView edges={['top']} style={styles.heroSafeArea}>
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={handleBack}
              style={styles.topBarBtn}
              activeOpacity={0.7}
            >
              <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>

            <View style={styles.tabToggle}>
              <TouchableOpacity
                onPress={() => { hapticFeedback.light(); if (!audioError) setTab('audio'); }}
                style={[
                  styles.tabBtn,
                  tab === 'audio' && styles.tabBtnActive,
                  audioError && styles.tabBtnDisabled,
                ]}
                activeOpacity={0.8}
                disabled={audioError}
              >
                <Headphones size={14} color={tab === 'audio' ? '#1A1A1A' : 'rgba(255,255,255,0.8)'} />
                <Text style={[
                  styles.tabBtnText,
                  { fontFamily: FONTS.semibold },
                  tab === 'audio' ? styles.tabBtnTextActive : styles.tabBtnTextInactive,
                ]}>
                  Audio
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => { hapticFeedback.light(); setTab('text'); }}
                style={[
                  styles.tabBtn,
                  tab === 'text' && styles.tabBtnActive,
                ]}
                activeOpacity={0.8}
              >
                <AlignLeft size={14} color={tab === 'text' ? '#1A1A1A' : 'rgba(255,255,255,0.8)'} />
                <Text style={[
                  styles.tabBtnText,
                  { fontFamily: FONTS.semibold },
                  tab === 'text' ? styles.tabBtnTextActive : styles.tabBtnTextInactive,
                ]}>
                  Text
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleShare}
              style={styles.topBarBtn}
              activeOpacity={0.7}
            >
              <Share2 size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.heroContent}>
            <View style={styles.coverArtContainer}>
              <LinearGradient
                colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
                style={styles.coverArt}
              >
                <BookOpen size={56} color="rgba(255,255,255,0.9)" strokeWidth={1.2} />
              </LinearGradient>
            </View>

            <Text
              style={[styles.heroTitle, { fontFamily: FONTS.extrabold }]}
              numberOfLines={2}
            >
              {story.title}
            </Text>

            {(story.theme || story.mood) && (
              <View style={styles.heroMeta}>
                {story.theme && (
                  <View style={styles.heroBadge}>
                    <Text style={[styles.heroBadgeText, { fontFamily: FONTS.semibold }]}>
                      {story.theme}
                    </Text>
                  </View>
                )}
                {story.mood && (
                  <View style={styles.heroBadge}>
                    <Text style={[styles.heroBadgeText, { fontFamily: FONTS.semibold }]}>
                      {story.mood}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <Animated.View
        entering={SlideInDown.delay(100).springify().damping(20)}
        style={styles.bottomPanel}
      >
        {tab === 'audio' && !audioError ? (
          <View style={styles.audioPanel}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: C.text.primary, fontFamily: FONTS.bold }]}>
                  {story.word_count ?? allWords.length}
                </Text>
                <Text style={[styles.statLabel, { color: C.text.secondary, fontFamily: FONTS.medium }]}>
                  words
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: C.text.light + '30' }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: C.text.primary, fontFamily: FONTS.bold }]}>
                  {formatTime(duration || 0)}
                </Text>
                <Text style={[styles.statLabel, { color: C.text.secondary, fontFamily: FONTS.medium }]}>
                  duration
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: C.text.light + '30' }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: C.text.primary, fontFamily: FONTS.bold }]}>
                  {story.language_code?.toUpperCase() ?? 'EN'}
                </Text>
                <Text style={[styles.statLabel, { color: C.text.secondary, fontFamily: FONTS.medium }]}>
                  language
                </Text>
              </View>
            </View>

            <Pressable onPress={handleProgressBarPress} style={styles.progressTouchable}>
              <View style={[styles.progressTrack, { backgroundColor: C.text.light + '22' }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progressPercentage}%`,
                      backgroundColor: C.primary,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.progressThumb,
                    {
                      left: `${progressPercentage}%`,
                      backgroundColor: C.primary,
                      borderColor: '#FFFFFF',
                    },
                  ]}
                />
              </View>
            </Pressable>

            <View style={styles.timeRow}>
              <Text style={[styles.timeText, { color: C.text.secondary, fontFamily: FONTS.medium }]}>
                {formatTime(position)}
              </Text>
              <Text style={[styles.timeText, { color: C.text.secondary, fontFamily: FONTS.medium }]}>
                {formatTime(duration)}
              </Text>
            </View>

            <View style={styles.controlsRow}>
              <TouchableOpacity
                onPress={handleSkipBack}
                disabled={!sound}
                style={[styles.sideControl, { opacity: sound ? 1 : 0.3 }]}
                activeOpacity={0.6}
              >
                <SkipBack size={26} color={C.text.primary} />
                <Text style={[styles.skipLabel, { color: C.text.secondary, fontFamily: FONTS.semibold }]}>
                  10
                </Text>
              </TouchableOpacity>

              <Animated.View style={playAnimStyle}>
                <TouchableOpacity onPress={handlePlayPause} disabled={!sound} activeOpacity={0.85}>
                  <LinearGradient
                    colors={sound ? [C.primary, C.primaryDark ?? C.primary] : ['#CCC', '#CCC']}
                    style={styles.playBtnLarge}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {isPlaying
                      ? <Pause size={34} color="#FFF" fill="#FFF" />
                      : <Play size={34} color="#FFF" fill="#FFF" />
                    }
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity
                onPress={handleSkipForward}
                disabled={!sound}
                style={[styles.sideControl, { opacity: sound ? 1 : 0.3 }]}
                activeOpacity={0.6}
              >
                <SkipForward size={26} color={C.text.primary} />
                <Text style={[styles.skipLabel, { color: C.text.secondary, fontFamily: FONTS.semibold }]}>
                  15
                </Text>
              </TouchableOpacity>
            </View>

            {hasQuiz && (
              <TouchableOpacity
                onPress={() => {
                  hapticFeedback.medium();
                  if (sound) sound.stopAsync().catch(() => {});
                  router.push({ pathname: '/story/quiz', params: { storyId: story.$id } });
                }}
                activeOpacity={0.88}
                style={{ marginTop: SPACING.md, marginHorizontal: SPACING.xs }}
              >
                <LinearGradient
                  colors={C.gradients.sunset}
                  style={styles.quizBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Award size={20} color="#FFF" />
                  <Text style={[styles.quizBtnText, { fontFamily: FONTS.bold }]}>Take the Quiz</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => {
                hapticFeedback.light();
                if (sound) sound.stopAsync().catch(() => {});
                router.push({
                  pathname: '/story/generate',
                  params: { profileId: story.profile_id, languageCode: story.language_code },
                });
              }}
              style={[styles.newStoryBtn, { borderColor: C.text.light + '33' }]}
              activeOpacity={0.7}
            >
              <RefreshCw size={16} color={C.text.secondary} />
              <Text style={[styles.newStoryText, { color: C.text.secondary, fontFamily: FONTS.semibold }]}>
                Generate New Story
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.textPanel}>
            <View style={styles.textPanelHeader}>
              <Text style={[styles.chapterLabel, { color: C.primary, fontFamily: FONTS.bold }]}>
                {story.title}
              </Text>
              <View style={styles.fontSizeControls}>
                <TouchableOpacity
                  onPress={() => { hapticFeedback.light(); setFontSize(f => Math.max(13, f - 1)); }}
                  style={[styles.fontBtn, { backgroundColor: C.text.light + '18' }]}
                  activeOpacity={0.7}
                >
                  <Minus size={16} color={C.text.primary} />
                </TouchableOpacity>
                <Text style={[styles.fontSizeLabel, { color: C.text.primary, fontFamily: FONTS.bold }]}>
                  {fontSize}
                </Text>
                <TouchableOpacity
                  onPress={() => { hapticFeedback.light(); setFontSize(f => Math.min(24, f + 1)); }}
                  style={[styles.fontBtn, { backgroundColor: C.primary }]}
                  activeOpacity={0.7}
                >
                  <Plus size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              ref={scrollRef}
              style={styles.textScroll}
              contentContainerStyle={styles.textScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {paragraphs.map((para, paraIdx) => {
                const tokens = splitIntoTokens(para);
                const elements: JSX.Element[] = [];

                for (let ti = 0; ti < tokens.length; ti++) {
                  const { word, isSpace } = tokens[ti];
                  if (isSpace) {
                    elements.push(<Text key={`sp-${paraIdx}-${ti}`}> </Text>);
                  } else {
                    const wIdx = globalWordCounter;
                    globalWordCounter++;
                    const isActive = wIdx === activeWordIndex;
                    const isPast = wIdx < activeWordIndex && activeWordIndex > 0;
                    elements.push(
                      <Text
                        key={`w-${paraIdx}-${ti}`}
                        style={[
                          styles.wordToken,
                          { fontSize, lineHeight: fontSize * 1.65, fontFamily: FONTS.regular },
                          { color: C.text.secondary },
                          isPast && { color: C.text.primary },
                          isActive && {
                            color: C.primary,
                            backgroundColor: C.primary + '22',
                            borderRadius: 4,
                            fontFamily: FONTS.bold,
                            overflow: 'hidden',
                          },
                        ]}
                      >
                        {word}
                      </Text>
                    );
                  }
                }

                return (
                  <Text key={`para-${paraIdx}`} style={[styles.paragraph, { marginBottom: fontSize }]}>
                    {elements}
                  </Text>
                );
              })}

              <View style={styles.textPanelActions}>
                {!audioError && (
                  <TouchableOpacity
                    onPress={() => { hapticFeedback.medium(); setTab('audio'); }}
                    style={[styles.switchToAudioBtn, { backgroundColor: C.primary + '15', borderColor: C.primary + '35' }]}
                    activeOpacity={0.7}
                  >
                    <Headphones size={18} color={C.primary} />
                    <Text style={[styles.switchToAudioText, { color: C.primary, fontFamily: FONTS.semibold }]}>
                      Switch to Audio
                    </Text>
                  </TouchableOpacity>
                )}

                {hasQuiz && (
                  <TouchableOpacity
                    onPress={() => {
                      hapticFeedback.medium();
                      if (sound) sound.stopAsync().catch(() => {});
                      router.push({ pathname: '/story/quiz', params: { storyId: story.$id } });
                    }}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={C.gradients.sunset}
                      style={styles.quizBtn}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Award size={20} color="#FFF" />
                      <Text style={[styles.quizBtnText, { fontFamily: FONTS.bold }]}>Take the Quiz</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>
        )}

        {audioError && tab === 'audio' && (
          <View style={[styles.audioErrorBanner, { backgroundColor: '#FFF8E1' }]}>
            <VolumeX size={18} color="#F59E0B" />
            <Text style={[styles.audioErrorText, { color: '#92400E', fontFamily: FONTS.medium }]}>
              Audio unavailable — switched to reading mode
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const PANEL_HEIGHT = SCREEN_HEIGHT * 0.56;

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#1A3A2A' },
  center: { justifyContent: 'center', alignItems: 'center', gap: SPACING.lg },

  loadingText: { fontSize: FONT_SIZES.md, marginTop: SPACING.md },
  errorTitle: { fontSize: FONT_SIZES.xxl, marginBottom: SPACING.sm },
  errorSubtitle: { fontSize: FONT_SIZES.md, marginBottom: SPACING.xl },
  errorButton: {
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.pill,
  },
  errorButtonText: { color: '#FFF', fontSize: FONT_SIZES.md },

  heroSection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.52,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  heroSafeArea: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  topBarBtn: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: BORDER_RADIUS.pill,
    padding: 3,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.pill,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  tabBtnDisabled: { opacity: 0.4 },
  tabBtnText: { fontSize: 13 },
  tabBtnTextActive: { color: '#1A1A1A' },
  tabBtnTextInactive: { color: 'rgba(255,255,255,0.85)' },

  heroContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
    paddingBottom: SPACING.xxxl,
  },
  coverArtContainer: {
    marginBottom: SPACING.xl,
    ...SHADOWS.xl,
  },
  coverArt: {
    width: 120,
    height: 120,
    borderRadius: BORDER_RADIUS.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  heroTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 30,
    letterSpacing: -0.3,
    marginBottom: SPACING.md,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroMeta: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BORDER_RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    textTransform: 'capitalize',
  },

  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: PANEL_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    ...SHADOWS.xxl,
    overflow: 'hidden',
  },

  audioPanel: {
    flex: 1,
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.xl,
    paddingBottom: 0,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  statItem: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: 18 },
  statLabel: { fontSize: 11 },
  statDivider: {
    width: 1,
    height: 32,
  },

  progressTouchable: { marginBottom: SPACING.xs },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    overflow: 'visible',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressThumb: {
    position: 'absolute',
    top: -5,
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 2.5,
    marginLeft: -7,
    ...SHADOWS.sm,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  timeText: { fontSize: 12 },

  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xxxl,
    marginBottom: SPACING.lg,
  },
  sideControl: {
    alignItems: 'center',
    gap: 2,
  },
  skipLabel: {
    fontSize: 10,
    position: 'absolute',
    bottom: -2,
  },
  playBtnLarge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },

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
  newStoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
  },
  newStoryText: { fontSize: FONT_SIZES.sm },

  textPanel: {
    flex: 1,
    paddingTop: SPACING.xl,
  },
  textPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xxl,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    marginBottom: SPACING.md,
  },
  chapterLabel: {
    fontSize: 15,
    flex: 1,
    marginRight: SPACING.md,
  },
  fontSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  fontBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontSizeLabel: {
    fontSize: 14,
    minWidth: 22,
    textAlign: 'center',
  },
  textScroll: { flex: 1 },
  textScrollContent: {
    paddingHorizontal: SPACING.xxl,
    paddingBottom: SPACING.xxxl,
  },
  paragraph: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  wordToken: {
    includeFontPadding: false,
  },
  textPanelActions: {
    gap: SPACING.md,
    marginTop: SPACING.xxl,
    paddingBottom: SPACING.md,
  },
  switchToAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
  },
  switchToAudioText: { fontSize: FONT_SIZES.sm },

  audioErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  audioErrorText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
  },
});
