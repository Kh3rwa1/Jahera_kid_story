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
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  SlideInDown,
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';
import { storyService, quizService } from '@/services/database';
import { Story } from '@/types/database';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Play, Pause, Award, RefreshCw, VolumeX, ArrowLeft, BookOpen, Share2, Minus, Plus, Headphones, ChevronLeft as AlignLeft, SkipBack, SkipForward, BookMarked, Sparkles } from 'lucide-react-native';
import { SPACING, BORDER_RADIUS, SHADOWS, FONTS, FONT_SIZES } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useReadingPreferences, LINE_SPACING_VALUES, FONT_FAMILY_VALUES } from '@/contexts/ReadingPreferencesContext';
import { hapticFeedback } from '@/utils/haptics';
import { shareStory } from '@/utils/sharing';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const THEME_GRADIENTS: Record<string, readonly [string, string, string]> = {
  adventure:   ['#FF6B35', '#E85D2F', '#C23B22'],
  fantasy:     ['#2563EB', '#1D4ED8', '#1E3A8A'],
  magic:       ['#0F766E', '#0D9488', '#134E4A'],
  animals:     ['#16A34A', '#15803D', '#14532D'],
  space:       ['#0F172A', '#1E3A5F', '#0C2340'],
  ocean:       ['#0369A1', '#0284C7', '#075985'],
  forest:      ['#166534', '#15803D', '#052E16'],
  dinosaurs:   ['#B45309', '#D97706', '#78350F'],
  superheroes: ['#DC2626', '#B91C1C', '#7F1D1D'],
  heroes:      ['#1D4ED8', '#1E40AF', '#1E3A8A'],
  nature:      ['#4D7C0F', '#65A30D', '#1A2E05'],
  science:     ['#0369A1', '#0EA5E9', '#0C4A6E'],
  default:     ['#134E4A', '#0F766E', '#042F2E'],
};

const THEME_ACCENT: Record<string, string> = {
  adventure:   '#FF8C5A',
  fantasy:     '#60A5FA',
  magic:       '#2DD4BF',
  animals:     '#4ADE80',
  space:       '#38BDF8',
  ocean:       '#38BDF8',
  forest:      '#4ADE80',
  dinosaurs:   '#FBBF24',
  superheroes: '#F87171',
  heroes:      '#60A5FA',
  nature:      '#86EFAC',
  science:     '#38BDF8',
  default:     '#2DD4BF',
};

function splitIntoParagraphs(content: string): string[] {
  return content.split(/\n+/).map(p => p.trim()).filter(p => p.length > 0);
}

function splitIntoTokens(text: string): Array<{ word: string; isSpace: boolean }> {
  return text.split(/(\s+)/).filter(t => t.length > 0).map(t => ({
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

function formatTime(millis: number): string {
  const s = Math.floor(millis / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

type TabMode = 'audio' | 'text';

const AnimatedPressable = Animated.createAnimatedComponent(TouchableOpacity);

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
  const [isBuffering, setIsBuffering] = useState(false);

  const playScale = useSharedValue(1);
  const vinylRotation = useSharedValue(0);
  const vinylElevation = useSharedValue(0);
  const progressThumbScale = useSharedValue(1);
  const waveAnim1 = useSharedValue(0.3);
  const waveAnim2 = useSharedValue(0.6);
  const waveAnim3 = useSharedValue(0.45);
  const waveAnim4 = useSharedValue(0.8);
  const waveAnim5 = useSharedValue(0.25);
  const waveAnim6 = useSharedValue(0.55);
  const skipBackPulse = useSharedValue(1);
  const skipFwdPulse = useSharedValue(1);

  const themeKey = useMemo(() => story?.theme ?? 'default', [story?.theme]);
  const themeGradient = useMemo(() => THEME_GRADIENTS[themeKey] ?? THEME_GRADIENTS.default, [themeKey]);
  const accentColor = useMemo(() => THEME_ACCENT[themeKey] ?? THEME_ACCENT.default, [themeKey]);

  useEffect(() => {
    if (isPlaying) {
      vinylRotation.value = withRepeat(
        withTiming(360, { duration: 8000, easing: Easing.linear }), -1, false
      );
      vinylElevation.value = withSpring(1, { damping: 12 });
      [waveAnim1, waveAnim2, waveAnim3, waveAnim4, waveAnim5, waveAnim6].forEach((anim, i) => {
        const heights = [0.4, 0.9, 0.6, 1.0, 0.5, 0.75];
        const durations = [320, 420, 380, 460, 340, 400];
        anim.value = withRepeat(
          withSequence(
            withTiming(heights[i], { duration: durations[i], easing: Easing.inOut(Easing.sin) }),
            withTiming(0.15, { duration: durations[i], easing: Easing.inOut(Easing.sin) })
          ),
          -1, true
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
  }, [isPlaying]);

  const vinylStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${vinylRotation.value}deg` },
      { scale: interpolate(vinylElevation.value, [0, 1], [1, 1.04]) },
    ],
    shadowOpacity: interpolate(vinylElevation.value, [0, 1], [0.2, 0.45]),
    shadowRadius: interpolate(vinylElevation.value, [0, 1], [16, 32]),
  }));

  const makeWaveStyle = (anim: SharedValue<number>) =>
    useAnimatedStyle(() => ({ transform: [{ scaleY: anim.value }] }));

  const w1s = makeWaveStyle(waveAnim1);
  const w2s = makeWaveStyle(waveAnim2);
  const w3s = makeWaveStyle(waveAnim3);
  const w4s = makeWaveStyle(waveAnim4);
  const w5s = makeWaveStyle(waveAnim5);
  const w6s = makeWaveStyle(waveAnim6);

  const playBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playScale.value }],
  }));

  const skipBackStyle = useAnimatedStyle(() => ({ transform: [{ scale: skipBackPulse.value }] }));
  const skipFwdStyle = useAnimatedStyle(() => ({ transform: [{ scale: skipFwdPulse.value }] }));

  const progressPercentage = duration > 0 ? (position / duration) * 100 : 0;

  const paragraphs = useMemo(() => (story ? splitIntoParagraphs(story.content) : []), [story]);
  const allWords = useMemo(() => buildWordIndex(paragraphs), [paragraphs]);

  const activeWordIndex = useMemo(() => {
    if (duration <= 0 || allWords.length === 0 || position === 0) return -1;
    return Math.floor(Math.min(position / duration, 1) * allWords.length);
  }, [position, duration, allWords.length]);

  useEffect(() => { loadStory(); }, []);
  useEffect(() => () => { if (sound) sound.unloadAsync().catch(() => {}); }, [sound]);

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
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true });
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
      setIsBuffering(status.isBuffering || false);
      if (status.didJustFinish) { setIsPlaying(false); setPosition(0); }
    } else if (status.error) {
      setAudioError(true); setIsPlaying(false);
    }
  };

  const handlePlayPause = useCallback(async () => {
    if (!sound) return;
    try {
      hapticFeedback.medium();
      playScale.value = withSequence(
        withSpring(0.88, { damping: 8 }),
        withSpring(1, { damping: 10 })
      );
      isPlaying ? await sound.pauseAsync() : await sound.playAsync();
    } catch { setAudioError(true); }
  }, [sound, isPlaying]);

  const handleSkipBack = useCallback(async () => {
    if (!sound) return;
    hapticFeedback.light();
    skipBackPulse.value = withSequence(withSpring(0.82), withSpring(1, { damping: 8 }));
    try { await sound.setPositionAsync(Math.max(0, position - 10000)); } catch {}
  }, [sound, position]);

  const handleSkipForward = useCallback(async () => {
    if (!sound || !duration) return;
    hapticFeedback.light();
    skipFwdPulse.value = withSequence(withSpring(0.82), withSpring(1, { damping: 8 }));
    try { await sound.setPositionAsync(Math.min(duration, position + 15000)); } catch {}
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

  const handleProgressPress = useCallback(async (event: any) => {
    if (!sound || !duration) return;
    const { locationX } = event.nativeEvent;
    const barWidth = SCREEN_WIDTH - SPACING.xxl * 2;
    const pct = Math.max(0, Math.min(1, locationX / barWidth));
    progressThumbScale.value = withSequence(withSpring(1.4, { damping: 6 }), withSpring(1, { damping: 10 }));
    try { hapticFeedback.light(); await sound.setPositionAsync(duration * pct); } catch {}
  }, [sound, duration]);

  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ scale: progressThumbScale.value }] }));

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#042F2E' }}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#134E4A', '#0F766E', '#042F2E']} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={[styles.fill, styles.center]}>
          <Animated.View entering={FadeIn.duration(600)} style={styles.loadingContainer}>
            <View style={styles.loadingIconRing}>
              <BookOpen size={32} color="rgba(255,255,255,0.9)" strokeWidth={1.5} />
            </View>
            <Text style={[styles.loadingTitle, { fontFamily: FONTS.bold }]}>Opening Story</Text>
            <Text style={[styles.loadingSubtitle, { fontFamily: FONTS.regular }]}>Preparing your adventure...</Text>
            <View style={styles.loadingDots}>
              {[0, 1, 2].map(i => (
                <View key={i} style={[styles.loadingDot, { opacity: 0.4 + i * 0.2 }]} />
              ))}
            </View>
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  if (!story) {
    return (
      <LinearGradient colors={C.backgroundGradient} style={styles.fill}>
        <SafeAreaView style={[styles.fill, styles.center]}>
          <Text style={[styles.errorTitle, { color: C.text.primary, fontFamily: FONTS.bold }]}>Story Not Found</Text>
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

  const lineHeight = prefs.fontSize * LINE_SPACING_VALUES[prefs.lineSpacing];
  const activeFontDef = FONT_FAMILY_VALUES[prefs.fontFamily ?? 'nunito'];
  let globalWordCounter = 0;

  return (
    <View style={styles.fill}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={themeGradient as any}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />

      <View style={[StyleSheet.absoluteFill, styles.noiseMask]} />

      <SafeAreaView edges={['top']} style={styles.topBarContainer}>
        <View style={styles.topBarRow}>
          <TouchableOpacity onPress={handleBack} style={styles.topBarBtn} activeOpacity={0.7}>
            <ArrowLeft size={20} color="rgba(255,255,255,0.9)" strokeWidth={2.5} />
          </TouchableOpacity>

          {!audioError && (
            <View style={styles.tabPill}>
              <TouchableOpacity
                onPress={() => { hapticFeedback.light(); setTab('audio'); }}
                style={[styles.tabPillBtn, tab === 'audio' && { backgroundColor: 'rgba(255,255,255,0.95)' }]}
                activeOpacity={0.8}
              >
                <Headphones size={13} color={tab === 'audio' ? '#111' : 'rgba(255,255,255,0.7)'} />
                <Text style={[
                  styles.tabPillText,
                  { fontFamily: FONTS.semibold },
                  tab === 'audio' ? { color: '#111' } : { color: 'rgba(255,255,255,0.7)' },
                ]}>Listen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { hapticFeedback.light(); setTab('text'); }}
                style={[styles.tabPillBtn, tab === 'text' && { backgroundColor: 'rgba(255,255,255,0.95)' }]}
                activeOpacity={0.8}
              >
                <BookMarked size={13} color={tab === 'text' ? '#111' : 'rgba(255,255,255,0.7)'} />
                <Text style={[
                  styles.tabPillText,
                  { fontFamily: FONTS.semibold },
                  tab === 'text' ? { color: '#111' } : { color: 'rgba(255,255,255,0.7)' },
                ]}>Read</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity onPress={handleShare} style={styles.topBarBtn} activeOpacity={0.7}>
            <Share2 size={18} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {tab === 'audio' && !audioError ? (
        <>
          <View style={styles.heroSection}>
            <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.albumArtWrapper}>
              <Animated.View style={[styles.albumArtGlow, { shadowColor: accentColor }]} />
              <Animated.View style={[styles.albumArtOuter, vinylStyle]}>
                <LinearGradient
                  colors={[accentColor + '33', accentColor + '11', 'rgba(0,0,0,0.3)']}
                  style={styles.albumArtInner}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.albumArtVinylRing}>
                    <View style={[styles.albumArtCenter, { backgroundColor: accentColor + '44' }]}>
                      <BookOpen size={28} color="rgba(255,255,255,0.95)" strokeWidth={1.5} />
                    </View>
                  </View>
                </LinearGradient>
              </Animated.View>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(180).duration(600)} style={styles.heroTextBlock}>
              <Text style={[styles.heroTitle, { fontFamily: FONTS.extrabold }]} numberOfLines={2}>
                {story.title}
              </Text>
              <View style={styles.heroBadgeRow}>
                {story.theme && (
                  <View style={[styles.heroBadge, { borderColor: accentColor + '55', backgroundColor: accentColor + '22' }]}>
                    <Sparkles size={10} color={accentColor} />
                    <Text style={[styles.heroBadgeText, { fontFamily: FONTS.semibold, color: accentColor }]}>
                      {story.theme}
                    </Text>
                  </View>
                )}
                {story.mood && (
                  <View style={[styles.heroBadge, { borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                    <Text style={[styles.heroBadgeText, { fontFamily: FONTS.semibold, color: 'rgba(255,255,255,0.85)' }]}>
                      {story.mood}
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>
          </View>

          <Animated.View
            entering={SlideInDown.delay(80).springify().damping(22).stiffness(200)}
            style={styles.playerSheet}
          >
            <View style={styles.sheetHandle} />

            <View style={styles.waveRow}>
              {[w1s, w2s, w3s, w4s, w5s, w6s].map((ws, i) => (
                <Animated.View
                  key={i}
                  style={[styles.waveBar, ws, { backgroundColor: isPlaying ? accentColor : C.text.secondary + '40', height: 28 + (i % 3) * 4 }]}
                />
              ))}
              <View style={styles.waveTimeCenter}>
                <Text style={[styles.waveCurrentTime, { fontFamily: FONTS.bold, color: C.text.primary }]}>
                  {formatTime(position)}
                </Text>
              </View>
              {[w6s, w5s, w4s, w3s, w2s, w1s].map((ws, i) => (
                <Animated.View
                  key={`r${i}`}
                  style={[styles.waveBar, ws, { backgroundColor: isPlaying ? accentColor : C.text.secondary + '40', height: 28 + ((5 - i) % 3) * 4 }]}
                />
              ))}
            </View>

            <Pressable onPress={handleProgressPress} style={styles.progressArea} hitSlop={12}>
              <View style={[styles.progressTrack, { backgroundColor: C.text.secondary + '20' }]}>
                <View
                  style={[styles.progressFilled, { width: `${progressPercentage}%`, backgroundColor: accentColor }]}
                />
                <Animated.View
                  style={[
                    styles.progressThumb,
                    thumbStyle,
                    { left: `${progressPercentage}%`, backgroundColor: accentColor },
                  ]}
                />
              </View>
              <View style={styles.timeLabels}>
                <Text style={[styles.timeLabel, { color: C.text.secondary, fontFamily: FONTS.medium }]}>
                  {formatTime(position)}
                </Text>
                <Text style={[styles.timeLabel, { color: C.text.secondary, fontFamily: FONTS.medium }]}>
                  -{formatTime(Math.max(0, duration - position))}
                </Text>
              </View>
            </Pressable>

            <View style={styles.statsStrip}>
              <View style={styles.statChip}>
                <Text style={[styles.statChipValue, { color: C.text.primary, fontFamily: FONTS.bold }]}>
                  {story.word_count ?? allWords.length}
                </Text>
                <Text style={[styles.statChipLabel, { color: C.text.secondary, fontFamily: FONTS.medium }]}>words</Text>
              </View>
              <View style={[styles.statChipDot, { backgroundColor: C.text.secondary + '30' }]} />
              <View style={styles.statChip}>
                <Text style={[styles.statChipValue, { color: C.text.primary, fontFamily: FONTS.bold }]}>
                  {formatTime(duration)}
                </Text>
                <Text style={[styles.statChipLabel, { color: C.text.secondary, fontFamily: FONTS.medium }]}>length</Text>
              </View>
              <View style={[styles.statChipDot, { backgroundColor: C.text.secondary + '30' }]} />
              <View style={styles.statChip}>
                <Text style={[styles.statChipValue, { color: C.text.primary, fontFamily: FONTS.bold }]}>
                  {story.language_code?.toUpperCase() ?? 'EN'}
                </Text>
                <Text style={[styles.statChipLabel, { color: C.text.secondary, fontFamily: FONTS.medium }]}>lang</Text>
              </View>
            </View>

            <View style={styles.controlsRow}>
              <Animated.View style={skipBackStyle}>
                <TouchableOpacity
                  onPress={handleSkipBack}
                  disabled={!sound}
                  style={[styles.skipBtn, !sound && { opacity: 0.3 }]}
                  activeOpacity={0.7}
                >
                  <SkipBack size={26} color={C.text.primary} strokeWidth={2} />
                  <Text style={[styles.skipSeconds, { color: C.text.secondary, fontFamily: FONTS.bold }]}>10</Text>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View style={playBtnStyle}>
                <TouchableOpacity
                  onPress={handlePlayPause}
                  disabled={!sound}
                  activeOpacity={0.9}
                  style={[styles.playBtnShadow, { shadowColor: accentColor, opacity: sound ? 1 : 0.4 }]}
                >
                  <LinearGradient
                    colors={sound ? [accentColor, accentColor + 'CC'] : ['#888', '#666']}
                    style={styles.playBtn}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {isBuffering ? (
                      <View style={styles.bufferingDots}>
                        {[0, 1, 2].map(i => (
                          <View key={i} style={[styles.bufferingDot, { backgroundColor: '#FFF' }]} />
                        ))}
                      </View>
                    ) : isPlaying ? (
                      <Pause size={32} color="#FFF" fill="#FFF" />
                    ) : (
                      <Play size={32} color="#FFF" fill="#FFF" style={{ marginLeft: 3 }} />
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View style={skipFwdStyle}>
                <TouchableOpacity
                  onPress={handleSkipForward}
                  disabled={!sound}
                  style={[styles.skipBtn, !sound && { opacity: 0.3 }]}
                  activeOpacity={0.7}
                >
                  <SkipForward size={26} color={C.text.primary} strokeWidth={2} />
                  <Text style={[styles.skipSeconds, { color: C.text.secondary, fontFamily: FONTS.bold }]}>15</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>

            <View style={styles.actionStack}>
              {hasQuiz && (
                <TouchableOpacity
                  onPress={() => {
                    hapticFeedback.medium();
                    if (sound) sound.stopAsync().catch(() => {});
                    router.push({ pathname: '/story/quiz', params: { storyId: story.$id } });
                  }}
                  activeOpacity={0.88}
                  style={styles.quizBtnWrapper}
                >
                  <LinearGradient
                    colors={['#F59E0B', '#D97706']}
                    style={styles.quizBtn}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Award size={18} color="#FFF" fill="#FFF" />
                    <Text style={[styles.quizBtnText, { fontFamily: FONTS.bold }]}>Take the Quiz</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => {
                  hapticFeedback.light();
                  if (sound) sound.stopAsync().catch(() => {});
                  router.push({ pathname: '/story/generate', params: { profileId: story.profile_id, languageCode: story.language_code } });
                }}
                style={[styles.newStoryBtn, { borderColor: C.text.secondary + '25' }]}
                activeOpacity={0.7}
              >
                <RefreshCw size={14} color={C.text.secondary} />
                <Text style={[styles.newStoryBtnText, { color: C.text.secondary, fontFamily: FONTS.semibold }]}>
                  New Story
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </>
      ) : (
        <View style={styles.fill}>
          <Animated.View
            entering={SlideInDown.delay(60).springify().damping(22)}
            style={[styles.readSheet, { paddingTop: insets.top + 68 }]}
          >
            <View style={styles.readHeader}>
              <View style={styles.readHeaderLeft}>
                <View style={[styles.readTitleDot, { backgroundColor: accentColor }]} />
                <Text style={[styles.readTitle, { color: C.text.primary, fontFamily: FONTS.bold }]} numberOfLines={2}>
                  {story.title}
                </Text>
              </View>
              <View style={styles.fontSizeControls}>
                <TouchableOpacity
                  onPress={() => { hapticFeedback.light(); setFontSize(prefs.fontSize - 1); }}
                  style={[styles.fontSizeBtn, { backgroundColor: C.text.secondary + '15' }]}
                  activeOpacity={0.7}
                >
                  <Minus size={14} color={C.text.primary} />
                </TouchableOpacity>
                <Text style={[styles.fontSizeLabel, { color: C.text.primary, fontFamily: FONTS.bold }]}>
                  {prefs.fontSize}
                </Text>
                <TouchableOpacity
                  onPress={() => { hapticFeedback.light(); setFontSize(prefs.fontSize + 1); }}
                  style={[styles.fontSizeBtn, { backgroundColor: accentColor + '33', borderColor: accentColor + '44' }]}
                  activeOpacity={0.7}
                >
                  <Plus size={14} color={accentColor} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.readDivider, { backgroundColor: C.text.secondary + '12' }]} />

            <ScrollView
              ref={scrollRef}
              style={styles.readScroll}
              contentContainerStyle={styles.readScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {paragraphs.map((para, paraIdx) => {
                const tokens = splitIntoTokens(para);
                const elements: React.ReactNode[] = [];

                for (let ti = 0; ti < tokens.length; ti++) {
                  const { word, isSpace } = tokens[ti];
                  if (isSpace) {
                    elements.push(<Text key={`sp-${paraIdx}-${ti}`}> </Text>);
                  } else {
                    const wIdx = globalWordCounter++;
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
                            color: accentColor,
                            backgroundColor: accentColor + '20',
                            borderRadius: 3,
                            fontFamily: activeFontDef.bold,
                            overflow: 'hidden' as const,
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
                      { marginBottom: prefs.fontSize * 1.1 },
                      prefs.textAlign === 'justify' && { textAlign: 'justify' },
                    ]}
                  >
                    {elements}
                  </Text>
                );
              })}

              <View style={styles.readEndActions}>
                {!audioError && (
                  <TouchableOpacity
                    onPress={() => { hapticFeedback.medium(); setTab('audio'); }}
                    style={[styles.switchToAudioBtn, { backgroundColor: accentColor + '15', borderColor: accentColor + '40' }]}
                    activeOpacity={0.7}
                  >
                    <Headphones size={16} color={accentColor} />
                    <Text style={[styles.switchToAudioText, { color: accentColor, fontFamily: FONTS.semibold }]}>
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
                      colors={['#F59E0B', '#D97706']}
                      style={styles.quizBtn}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Award size={18} color="#FFF" fill="#FFF" />
                      <Text style={[styles.quizBtnText, { fontFamily: FONTS.bold }]}>Take the Quiz</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => {
                    hapticFeedback.light();
                    if (sound) sound.stopAsync().catch(() => {});
                    router.push({ pathname: '/story/generate', params: { profileId: story.profile_id, languageCode: story.language_code } });
                  }}
                  style={[styles.newStoryBtn, { borderColor: C.text.secondary + '20' }]}
                  activeOpacity={0.7}
                >
                  <RefreshCw size={14} color={C.text.secondary} />
                  <Text style={[styles.newStoryBtnText, { color: C.text.secondary, fontFamily: FONTS.semibold }]}>
                    New Story
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      )}

      {audioError && (
        <View style={[styles.audioErrorBanner, { paddingBottom: Math.max(insets.bottom, SPACING.md) }]}>
          <VolumeX size={14} color="#D97706" />
          <Text style={[styles.audioErrorText, { fontFamily: FONTS.medium }]}>
            Audio unavailable — reading mode active
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  noiseMask: { backgroundColor: 'rgba(0,0,0,0.18)' },

  loadingContainer: { alignItems: 'center', gap: SPACING.lg },
  loadingIconRing: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  loadingTitle: { fontSize: FONT_SIZES.xl, color: '#FFFFFF', letterSpacing: -0.3 },
  loadingSubtitle: { fontSize: FONT_SIZES.sm, color: 'rgba(255,255,255,0.55)' },
  loadingDots: { flexDirection: 'row', gap: 6, marginTop: SPACING.sm },
  loadingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.8)' },

  errorTitle: { fontSize: FONT_SIZES.xxl, marginBottom: SPACING.xl },
  errorButton: { paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.pill },
  errorButtonText: { color: '#FFF', fontSize: FONT_SIZES.md },

  topBarContainer: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
  topBarRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
  },
  topBarBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  tabPill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: BORDER_RADIUS.pill,
    padding: 3,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  tabPillBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: SPACING.md, paddingVertical: 7,
    borderRadius: BORDER_RADIUS.pill,
  },
  tabPillText: { fontSize: 12 },

  heroSection: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: 80, paddingBottom: SCREEN_HEIGHT * 0.49,
    paddingHorizontal: SPACING.xxl,
  },
  albumArtWrapper: { alignItems: 'center', marginBottom: SPACING.xxl, position: 'relative' },
  albumArtGlow: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    shadowOffset: { width: 0, height: 0 }, shadowRadius: 40, shadowOpacity: 0.6,
    top: -10,
  },
  albumArtOuter: {
    width: 160, height: 160, borderRadius: 80,
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4, shadowRadius: 30, elevation: 20,
  },
  albumArtInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  albumArtVinylRing: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  albumArtCenter: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
  },
  heroTextBlock: { alignItems: 'center', gap: SPACING.md },
  heroTitle: {
    fontSize: 22, color: '#FFFFFF', textAlign: 'center',
    lineHeight: 28, letterSpacing: -0.4,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6,
  },
  heroBadgeRow: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap', justifyContent: 'center' },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: BORDER_RADIUS.pill, paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1,
  },
  heroBadgeText: { fontSize: 11, textTransform: 'capitalize' },

  playerSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: SCREEN_HEIGHT * 0.56,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18, shadowRadius: 24, elevation: 20,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#00000014', alignSelf: 'center', marginBottom: SPACING.lg,
  },

  waveRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 3, height: 40, marginBottom: SPACING.lg, position: 'relative',
  },
  waveBar: { width: 3.5, borderRadius: 2 },
  waveTimeCenter: { position: 'absolute', alignItems: 'center' },
  waveCurrentTime: { fontSize: 13, opacity: 0 },

  progressArea: { marginBottom: SPACING.sm },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'visible', position: 'relative' },
  progressFilled: { height: '100%', borderRadius: 2 },
  progressThumb: {
    position: 'absolute', top: -6, width: 16, height: 16,
    borderRadius: 8, marginLeft: -8,
    borderWidth: 2.5, borderColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  timeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.sm },
  timeLabel: { fontSize: 11 },

  statsStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.xl, marginBottom: SPACING.xl,
    paddingVertical: SPACING.sm,
  },
  statChip: { alignItems: 'center', gap: 1 },
  statChipValue: { fontSize: 16 },
  statChipLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  statChipDot: { width: 4, height: 4, borderRadius: 2 },

  controlsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.xxxl + 8, marginBottom: SPACING.xl,
  },
  skipBtn: { alignItems: 'center', gap: 2, minWidth: 44 },
  skipSeconds: { fontSize: 9, letterSpacing: 0.5 },
  playBtnShadow: {
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 12,
  },
  playBtn: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  bufferingDots: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  bufferingDot: { width: 6, height: 6, borderRadius: 3 },

  actionStack: { gap: SPACING.sm },
  quizBtnWrapper: {},
  quizBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: 14,
    borderRadius: BORDER_RADIUS.xl,
    shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  quizBtnText: { color: '#FFF', fontSize: FONT_SIZES.md },
  newStoryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: 12,
    borderRadius: BORDER_RADIUS.xl, borderWidth: 1.5,
  },
  newStoryBtnText: { fontSize: FONT_SIZES.sm },

  readSheet: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#FFFFFF',
  },
  readHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.xxl, paddingBottom: SPACING.md,
  },
  readHeaderLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginRight: SPACING.md },
  readTitleDot: { width: 4, height: 20, borderRadius: 2 },
  readTitle: { fontSize: 15, lineHeight: 20, flex: 1 },
  fontSizeControls: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  fontSizeBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent',
  },
  fontSizeLabel: { fontSize: 14, minWidth: 22, textAlign: 'center' },
  readDivider: { height: 1, marginHorizontal: SPACING.xxl, marginBottom: SPACING.xl },
  readScroll: { flex: 1 },
  readScrollContent: { paddingHorizontal: SPACING.xxl, paddingBottom: 80 },
  paragraph: { flexDirection: 'row', flexWrap: 'wrap' },
  readEndActions: { gap: SPACING.md, marginTop: SPACING.xxl, paddingBottom: SPACING.xl },
  switchToAudioBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: 12,
    borderRadius: BORDER_RADIUS.xl, borderWidth: 1.5,
  },
  switchToAudioText: { fontSize: FONT_SIZES.sm },

  audioErrorBanner: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: SPACING.xl, paddingTop: SPACING.sm, zIndex: 200,
  },
  audioErrorText: { color: '#92400E', fontSize: FONT_SIZES.xs },
});
