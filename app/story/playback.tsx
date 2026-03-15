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
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  cancelAnimation,
  interpolate,
  FadeIn,
} from 'react-native-reanimated';
import { useFloat, useRotate } from '@/utils/animations';
import { storyService, quizService } from '@/services/database';
import { Story } from '@/types/database';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Play, Pause, Award, RefreshCw, VolumeX, ArrowLeft, BookOpen, Share2, Minus, Plus, Headphones, ChevronLeft as AlignLeft, SkipBack, SkipForward } from 'lucide-react-native';
import { SPACING, BORDER_RADIUS, SHADOWS, FONTS, FONT_SIZES } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useReadingPreferences, LINE_SPACING_VALUES, FONT_FAMILY_VALUES } from '@/contexts/ReadingPreferencesContext';
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
  const { prefs, setFontSize } = useReadingPreferences();
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const [story, setStory] = useState<Story | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [audioError, setAudioError] = useState(false);
  const [hasQuiz, setHasQuiz] = useState(false);
  const [tab, setTab] = useState<TabMode>('audio');

  const playScale = useSharedValue(1);
  const coverRotation = useSharedValue(0);
  const coverFloat = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      coverRotation.value = withRepeat(
        withTiming(360, { duration: 12000, easing: Easing.linear }),
        -1, false
      );
      coverFloat.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
          withTiming(6, { duration: 2200, easing: Easing.inOut(Easing.sin) })
        ),
        -1, true
      );
    } else {
      cancelAnimation(coverRotation);
      cancelAnimation(coverFloat);
      coverFloat.value = withSpring(0, { damping: 8 });
    }
  }, [isPlaying]);

  const coverArtStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${coverRotation.value}deg` },
      { translateY: coverFloat.value },
    ],
  }));

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
  const lineHeight = prefs.fontSize * LINE_SPACING_VALUES[prefs.lineSpacing];
  const activeFontDef = FONT_FAMILY_VALUES[prefs.fontFamily ?? 'nunito'];

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
        style={styles.heroBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView edges={['top']} style={styles.floatingTopBar}>
        <View style={styles.topBarRow}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.topBarBtn}
            activeOpacity={0.7}
          >
            <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>

          {!audioError && (
            <View style={styles.tabToggle}>
              <TouchableOpacity
                onPress={() => { hapticFeedback.light(); setTab('audio'); }}
                style={[styles.tabBtn, tab === 'audio' && styles.tabBtnActive]}
                activeOpacity={0.8}
              >
                <Headphones size={14} color={tab === 'audio' ? '#1A1A1A' : 'rgba(255,255,255,0.85)'} />
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
                style={[styles.tabBtn, tab === 'text' && styles.tabBtnActive]}
                activeOpacity={0.8}
              >
                <AlignLeft size={14} color={tab === 'text' ? '#1A1A1A' : 'rgba(255,255,255,0.85)'} />
                <Text style={[
                  styles.tabBtnText,
                  { fontFamily: FONTS.semibold },
                  tab === 'text' ? styles.tabBtnTextActive : styles.tabBtnTextInactive,
                ]}>
                  Text
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            onPress={handleShare}
            style={styles.topBarBtn}
            activeOpacity={0.7}
          >
            <Share2 size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {tab === 'audio' && !audioError ? (
        <View style={styles.fill}>
          <View style={styles.heroContent}>
            <Animated.View style={coverArtStyle}>
              <LinearGradient
                colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
                style={styles.coverArt}
              >
                <BookOpen size={56} color="rgba(255,255,255,0.9)" strokeWidth={1.2} />
              </LinearGradient>
            </Animated.View>

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

          <Animated.View
            entering={SlideInDown.delay(80).springify().damping(20)}
            style={styles.audioSheet}
          >
            <View style={styles.sheetHandle} />

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: C.text.primary, fontFamily: FONTS.bold }]}>
                  {story.word_count ?? allWords.length}
                </Text>
                <Text style={[styles.statLabel, { color: C.text.secondary, fontFamily: FONTS.medium }]}>
                  words
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: '#00000015' }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: C.text.primary, fontFamily: FONTS.bold }]}>
                  {formatTime(duration || 0)}
                </Text>
                <Text style={[styles.statLabel, { color: C.text.secondary, fontFamily: FONTS.medium }]}>
                  duration
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: '#00000015' }]} />
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
              <View style={[styles.progressTrack, { backgroundColor: '#0000001A' }]}>
                <View style={[styles.progressFill, { width: `${progressPercentage}%`, backgroundColor: C.primary }]} />
                <Animated.View
                  style={[
                    styles.progressThumb,
                    { left: `${progressPercentage}%`, backgroundColor: C.primary, borderColor: '#FFF' },
                    playAnimStyle,
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
                <SkipBack size={28} color={C.text.primary} />
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
                <SkipForward size={28} color={C.text.primary} />
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
                style={styles.actionBtnWrapper}
              >
                <LinearGradient
                  colors={C.gradients.sunset}
                  style={styles.actionBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Award size={20} color="#FFF" />
                  <Text style={[styles.actionBtnText, { fontFamily: FONTS.bold }]}>Take the Quiz</Text>
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
              style={[styles.outlineBtn, { borderColor: '#0000001A' }]}
              activeOpacity={0.7}
            >
              <RefreshCw size={16} color={C.text.secondary} />
              <Text style={[styles.outlineBtnText, { color: C.text.secondary, fontFamily: FONTS.semibold }]}>
                Generate New Story
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      ) : (
        <View style={styles.fill}>
          <Animated.View
            entering={SlideInDown.delay(60).springify().damping(20)}
            style={[styles.textSheet, { paddingTop: insets.top + 60 }]}
          >
            <View style={styles.textSheetHeader}>
              <Text
                style={[styles.textSheetTitle, { color: C.primary, fontFamily: FONTS.bold }]}
                numberOfLines={2}
              >
                {story.title}
              </Text>

              <View style={styles.fontControls}>
                <TouchableOpacity
                  onPress={() => { hapticFeedback.light(); setFontSize(prefs.fontSize - 1); }}
                  style={[styles.fontBtn, { backgroundColor: '#0000000F' }]}
                  activeOpacity={0.7}
                >
                  <Minus size={16} color={C.text.primary} />
                </TouchableOpacity>
                <Text style={[styles.fontSizeNum, { color: C.text.primary, fontFamily: FONTS.bold }]}>
                  {prefs.fontSize}
                </Text>
                <TouchableOpacity
                  onPress={() => { hapticFeedback.light(); setFontSize(prefs.fontSize + 1); }}
                  style={[styles.fontBtn, { backgroundColor: C.primary }]}
                  activeOpacity={0.7}
                >
                  <Plus size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: '#0000000A' }]} />

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
                          {
                            fontSize: prefs.fontSize,
                            lineHeight,
                            fontFamily: activeFontDef.regular,
                            color: C.text.secondary,
                          },
                          isPast && { color: C.text.primary },
                          isActive && {
                            color: C.primary,
                            backgroundColor: C.primary + '22',
                            borderRadius: 4,
                            fontFamily: activeFontDef.bold,
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
                  <Text
                    key={`para-${paraIdx}`}
                    style={[
                      styles.paragraph,
                      { marginBottom: prefs.fontSize * 0.9 },
                      prefs.textAlign === 'justify' && { textAlign: 'justify' },
                    ]}
                  >
                    {elements}
                  </Text>
                );
              })}

              <View style={styles.textEndActions}>
                {!audioError && (
                  <TouchableOpacity
                    onPress={() => { hapticFeedback.medium(); setTab('audio'); }}
                    style={[styles.switchBtn, { backgroundColor: C.primary + '12', borderColor: C.primary + '30' }]}
                    activeOpacity={0.7}
                  >
                    <Headphones size={18} color={C.primary} />
                    <Text style={[styles.switchBtnText, { color: C.primary, fontFamily: FONTS.semibold }]}>
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
                      style={styles.actionBtn}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Award size={20} color="#FFF" />
                      <Text style={[styles.actionBtnText, { fontFamily: FONTS.bold }]}>Take the Quiz</Text>
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
                  style={[styles.outlineBtn, { borderColor: '#0000001A' }]}
                  activeOpacity={0.7}
                >
                  <RefreshCw size={16} color={C.text.secondary} />
                  <Text style={[styles.outlineBtnText, { color: C.text.secondary, fontFamily: FONTS.semibold }]}>
                    Generate New Story
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      )}

      {audioError && (
        <View style={[styles.errorBanner, { paddingBottom: insets.bottom || SPACING.md }]}>
          <VolumeX size={16} color="#F59E0B" />
          <Text style={[styles.errorBannerText, { fontFamily: FONTS.medium }]}>
            Audio unavailable — reading mode
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#1A3A2A' },
  center: { justifyContent: 'center', alignItems: 'center', gap: SPACING.lg },

  loadingText: { fontSize: FONT_SIZES.md, marginTop: SPACING.md },
  errorTitle: { fontSize: FONT_SIZES.xxl, marginBottom: SPACING.xl },
  errorButton: {
    paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.pill,
  },
  errorButtonText: { color: '#FFF', fontSize: FONT_SIZES.md },

  heroBackground: {
    ...StyleSheet.absoluteFillObject,
  },

  floatingTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  topBarBtn: {
    width: 42,
    height: 42,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.4)',
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
  tabBtnActive: { backgroundColor: '#FFFFFF' },
  tabBtnText: { fontSize: 13 },
  tabBtnTextActive: { color: '#1A1A1A' },
  tabBtnTextInactive: { color: 'rgba(255,255,255,0.9)' },

  heroContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
    paddingTop: 80,
    paddingBottom: SCREEN_HEIGHT * 0.45,
  },
  coverArt: {
    width: 120,
    height: 120,
    borderRadius: BORDER_RADIUS.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    marginBottom: SPACING.xl,
    ...SHADOWS.xl,
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
  heroBadgeText: { color: '#FFF', fontSize: 12, textTransform: 'capitalize' },

  audioSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.56,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.md,
    ...SHADOWS.xxl,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00000018',
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#00000008',
  },
  statItem: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: 18 },
  statLabel: { fontSize: 11 },
  statDivider: { width: 1, height: 32 },

  progressTouchable: { marginBottom: SPACING.xs },
  progressTrack: {
    height: 5, borderRadius: 3,
    overflow: 'visible', position: 'relative',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressThumb: {
    position: 'absolute', top: -5,
    width: 15, height: 15, borderRadius: 8,
    borderWidth: 2.5, marginLeft: -7, ...SHADOWS.sm,
  },
  timeRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  timeText: { fontSize: 12 },

  controlsRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xxxl, marginBottom: SPACING.lg,
  },
  sideControl: { alignItems: 'center', gap: 2 },
  skipLabel: {
    fontSize: 10, position: 'absolute', bottom: -2,
  },
  playBtnLarge: {
    width: 76, height: 76, borderRadius: 38,
    alignItems: 'center', justifyContent: 'center', ...SHADOWS.lg,
  },

  actionBtnWrapper: { marginBottom: SPACING.sm },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xl, ...SHADOWS.md,
  },
  actionBtnText: { color: '#FFF', fontSize: FONT_SIZES.md },

  outlineBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: SPACING.sm,
    marginTop: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xl, borderWidth: 1.5,
  },
  outlineBtnText: { fontSize: FONT_SIZES.sm },

  textSheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  textSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xxl,
    paddingBottom: SPACING.md,
  },
  textSheetTitle: {
    fontSize: 15,
    flex: 1,
    marginRight: SPACING.md,
    lineHeight: 20,
  },
  fontControls: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
  },
  fontBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  fontSizeNum: {
    fontSize: 14, minWidth: 24, textAlign: 'center',
  },
  divider: { height: 1, marginHorizontal: SPACING.xxl, marginBottom: SPACING.lg },

  textScroll: { flex: 1 },
  textScrollContent: {
    paddingHorizontal: SPACING.xxl,
    paddingBottom: SPACING.xxxl,
  },
  paragraph: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  textEndActions: {
    gap: SPACING.md,
    marginTop: SPACING.xxl,
    paddingBottom: SPACING.xl,
  },
  switchBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xl, borderWidth: 1.5,
  },
  switchBtnText: { fontSize: FONT_SIZES.sm },

  errorBanner: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    zIndex: 200,
  },
  errorBannerText: { color: '#92400E', fontSize: FONT_SIZES.xs },
});
