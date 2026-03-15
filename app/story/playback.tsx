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
  FadeIn,
  FadeInUp,
  FadeInDown,
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
import { Play, Pause, Award, RefreshCw, VolumeX, ArrowLeft, BookOpen, Share2, Minus, Plus, Headphones, SkipBack, SkipForward, BookMarked, Sparkles, Type, ChevronLeft as AlignLeft, TextAlignJustify as AlignJustify } from 'lucide-react-native';
import { SPACING, BORDER_RADIUS, FONTS, FONT_SIZES } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import {
  useReadingPreferences,
  LINE_SPACING_VALUES,
  FONT_FAMILY_VALUES,
  FontFamily,
  LineSpacing,
} from '@/contexts/ReadingPreferencesContext';
import { hapticFeedback } from '@/utils/haptics';
import { shareStory } from '@/utils/sharing';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const THEME_GRADIENTS: Record<string, readonly [string, string, string]> = {
  adventure:   ['#FF6B35', '#D94F1C', '#A83000'],
  fantasy:     ['#1E40AF', '#1D4ED8', '#1E3A8A'],
  magic:       ['#0F766E', '#0D9488', '#134E4A'],
  animals:     ['#15803D', '#166534', '#14532D'],
  space:       ['#0C2340', '#0F172A', '#020617'],
  ocean:       ['#0369A1', '#075985', '#0C4A6E'],
  forest:      ['#166534', '#14532D', '#052E16'],
  dinosaurs:   ['#B45309', '#92400E', '#78350F'],
  superheroes: ['#991B1B', '#7F1D1D', '#450A0A'],
  heroes:      ['#1D4ED8', '#1E3A8A', '#172554'],
  nature:      ['#4D7C0F', '#3F6212', '#1A2E05'],
  science:     ['#0369A1', '#0C4A6E', '#082F49'],
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

const FONT_FAMILIES: FontFamily[] = ['nunito', 'merriweather', 'comic-neue', 'atkinson'];
const LINE_SPACINGS: LineSpacing[] = ['compact', 'normal', 'relaxed'];

export default function StoryPlayback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { currentTheme } = useTheme();
  const C = currentTheme.colors;
  const { prefs, setFontSize, setFontFamily, setLineSpacing, setTextAlign } = useReadingPreferences();
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
  const [showSettings, setShowSettings] = useState(false);

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
  }, [isPlaying]);

  const vinylStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${vinylRotation.value}deg` },
      { scale: interpolate(vinylElevation.value, [0, 1], [1, 1.04]) },
    ],
  }));

  const makeWaveStyle = (anim: SharedValue<number>) =>
    useAnimatedStyle(() => ({ transform: [{ scaleY: anim.value }] }));

  const w1s = makeWaveStyle(waveAnim1);
  const w2s = makeWaveStyle(waveAnim2);
  const w3s = makeWaveStyle(waveAnim3);
  const w4s = makeWaveStyle(waveAnim4);
  const w5s = makeWaveStyle(waveAnim5);
  const w6s = makeWaveStyle(waveAnim6);

  const playBtnStyle = useAnimatedStyle(() => ({ transform: [{ scale: playScale.value }] }));
  const skipBackStyle = useAnimatedStyle(() => ({ transform: [{ scale: skipBackPulse.value }] }));
  const skipFwdStyle = useAnimatedStyle(() => ({ transform: [{ scale: skipFwdPulse.value }] }));
  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ scale: progressThumbScale.value }] }));

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
        { uri: audioPath }, { shouldPlay: false }, onPlaybackStatusUpdate
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
      playScale.value = withSequence(withSpring(0.88, { damping: 8 }), withSpring(1, { damping: 10 }));
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

  const handleGoToQuiz = useCallback(() => {
    hapticFeedback.medium();
    if (sound) sound.stopAsync().catch(() => {});
    router.push({ pathname: '/story/quiz', params: { storyId: story!.$id } });
  }, [sound, story, router]);

  const handleNewStory = useCallback(() => {
    hapticFeedback.light();
    if (sound) sound.stopAsync().catch(() => {});
    router.push({ pathname: '/story/generate', params: { profileId: story!.profile_id, languageCode: story!.language_code } });
  }, [sound, story, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#134E4A', '#0F766E', '#042F2E']} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={[styles.fill, styles.center]}>
          <Animated.View entering={FadeIn.duration(600)} style={styles.loadingBox}>
            <View style={styles.loadingRing}>
              <BookOpen size={32} color="rgba(255,255,255,0.9)" strokeWidth={1.5} />
            </View>
            <Text style={[styles.loadingTitle, { fontFamily: FONTS.bold }]}>Opening Story</Text>
            <Text style={[styles.loadingSubtitle, { fontFamily: FONTS.regular }]}>Preparing your adventure...</Text>
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
          <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={[styles.errorBtn, { backgroundColor: C.primary }]}>
            <Text style={[styles.errorBtnText, { fontFamily: FONTS.semibold }]}>Go Home</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const lineHeight = prefs.fontSize * LINE_SPACING_VALUES[prefs.lineSpacing];
  const activeFontDef = FONT_FAMILY_VALUES[prefs.fontFamily ?? 'nunito'];
  let globalWordCounter = 0;

  if (tab === 'text' || audioError) {
    return (
      <View style={styles.fill}>
        <StatusBar barStyle="dark-content" />

        <SafeAreaView edges={['top']} style={{ backgroundColor: '#FAFAF8' }}>
          <View style={[styles.readNavBar, { borderBottomColor: '#E5E5E0' }]}>
            <TouchableOpacity onPress={handleBack} style={styles.readNavBtn} activeOpacity={0.7}>
              <ArrowLeft size={20} color="#111" strokeWidth={2.5} />
            </TouchableOpacity>

            <View style={styles.readNavCenter}>
              <Text style={[styles.readNavTitle, { fontFamily: FONTS.bold, color: '#111' }]} numberOfLines={1}>
                {story.title}
              </Text>
              <View style={[styles.readNavAccent, { backgroundColor: accentColor }]} />
            </View>

            <View style={styles.readNavRight}>
              {!audioError && (
                <TouchableOpacity
                  onPress={() => { hapticFeedback.light(); setTab('audio'); }}
                  style={[styles.readNavChip, { backgroundColor: accentColor + '18', borderColor: accentColor + '40' }]}
                  activeOpacity={0.7}
                >
                  <Headphones size={13} color={accentColor} />
                  <Text style={[styles.readNavChipText, { color: accentColor, fontFamily: FONTS.semibold }]}>Audio</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => { hapticFeedback.light(); setShowSettings(s => !s); }}
                style={[styles.readNavIconBtn, { backgroundColor: showSettings ? '#11111110' : 'transparent' }]}
                activeOpacity={0.7}
              >
                <Type size={18} color="#555" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare} style={styles.readNavIconBtn} activeOpacity={0.7}>
                <Share2 size={18} color="#555" />
              </TouchableOpacity>
            </View>
          </View>

          {showSettings && (
            <Animated.View entering={FadeInDown.duration(200)} style={styles.settingsPanel}>
              <View style={styles.settingsRow}>
                <Text style={[styles.settingsLabel, { fontFamily: FONTS.semibold, color: '#555' }]}>Size</Text>
                <View style={styles.fontSizeRow}>
                  <TouchableOpacity
                    onPress={() => { hapticFeedback.light(); setFontSize(prefs.fontSize - 1); }}
                    style={styles.fontSizeBtn}
                    activeOpacity={0.7}
                  >
                    <Minus size={14} color="#333" />
                  </TouchableOpacity>
                  <Text style={[styles.fontSizeNum, { fontFamily: FONTS.bold, color: '#111' }]}>{prefs.fontSize}</Text>
                  <TouchableOpacity
                    onPress={() => { hapticFeedback.light(); setFontSize(prefs.fontSize + 1); }}
                    style={[styles.fontSizeBtn, { backgroundColor: accentColor + '25' }]}
                    activeOpacity={0.7}
                  >
                    <Plus size={14} color={accentColor} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.settingsDivider, { backgroundColor: '#E5E5E0' }]} />

              <View style={styles.settingsRow}>
                <Text style={[styles.settingsLabel, { fontFamily: FONTS.semibold, color: '#555' }]}>Font</Text>
                <View style={styles.fontFamilyRow}>
                  {FONT_FAMILIES.map(f => (
                    <TouchableOpacity
                      key={f}
                      onPress={() => { hapticFeedback.light(); setFontFamily(f); }}
                      style={[
                        styles.fontChip,
                        prefs.fontFamily === f && { backgroundColor: accentColor, borderColor: accentColor },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.fontChipText,
                        { fontFamily: FONT_FAMILY_VALUES[f].regular },
                        prefs.fontFamily === f ? { color: '#FFF' } : { color: '#444' },
                      ]}>
                        {FONT_FAMILY_VALUES[f].label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={[styles.settingsDivider, { backgroundColor: '#E5E5E0' }]} />

              <View style={styles.settingsRow}>
                <Text style={[styles.settingsLabel, { fontFamily: FONTS.semibold, color: '#555' }]}>Spacing</Text>
                <View style={styles.spacingRow}>
                  {LINE_SPACINGS.map(s => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => { hapticFeedback.light(); setLineSpacing(s); }}
                      style={[
                        styles.spacingChip,
                        prefs.lineSpacing === s && { backgroundColor: accentColor, borderColor: accentColor },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.spacingChipText,
                        { fontFamily: FONTS.medium },
                        prefs.lineSpacing === s ? { color: '#FFF' } : { color: '#444' },
                      ]}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={[styles.settingsDivider, { backgroundColor: '#E5E5E0' }]} />

              <View style={styles.settingsRow}>
                <Text style={[styles.settingsLabel, { fontFamily: FONTS.semibold, color: '#555' }]}>Align</Text>
                <View style={styles.alignRow}>
                  <TouchableOpacity
                    onPress={() => { hapticFeedback.light(); setTextAlign('left'); }}
                    style={[styles.alignBtn, prefs.textAlign === 'left' && { backgroundColor: accentColor, borderColor: accentColor }]}
                    activeOpacity={0.7}
                  >
                    <AlignLeft size={16} color={prefs.textAlign === 'left' ? '#FFF' : '#444'} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => { hapticFeedback.light(); setTextAlign('justify'); }}
                    style={[styles.alignBtn, prefs.textAlign === 'justify' && { backgroundColor: accentColor, borderColor: accentColor }]}
                    activeOpacity={0.7}
                  >
                    <AlignJustify size={16} color={prefs.textAlign === 'justify' ? '#FFF' : '#444'} />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          )}
        </SafeAreaView>

        <ScrollView
          ref={scrollRef}
          style={[styles.fill, { backgroundColor: '#FAFAF8' }]}
          contentContainerStyle={[styles.readContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.readStoryMeta, { borderLeftColor: accentColor }]}>
            {story.theme && (
              <View style={[styles.readMetaBadge, { backgroundColor: accentColor + '18', borderColor: accentColor + '35' }]}>
                <Sparkles size={10} color={accentColor} />
                <Text style={[styles.readMetaBadgeText, { fontFamily: FONTS.semibold, color: accentColor }]}>
                  {story.theme}
                </Text>
              </View>
            )}
            {story.mood && (
              <View style={[styles.readMetaBadge, { backgroundColor: '#11111108', borderColor: '#11111115' }]}>
                <Text style={[styles.readMetaBadgeText, { fontFamily: FONTS.medium, color: '#666' }]}>
                  {story.mood}
                </Text>
              </View>
            )}
            <Text style={[styles.readMetaWords, { fontFamily: FONTS.medium, color: '#999' }]}>
              {allWords.length} words
            </Text>
          </View>

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
                        color: '#444',
                      },
                      isPast && { color: '#111' },
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
                  { marginBottom: prefs.fontSize * 1.2 },
                  prefs.textAlign === 'justify' && { textAlign: 'justify' },
                ]}
              >
                {elements}
              </Text>
            );
          })}

          <View style={[styles.readEndDivider, { backgroundColor: '#E5E5E0' }]} />

          <View style={styles.readEndActions}>
            {!audioError && (
              <TouchableOpacity
                onPress={() => { hapticFeedback.medium(); setTab('audio'); }}
                style={[styles.readEndBtn, { backgroundColor: accentColor + '15', borderColor: accentColor + '35' }]}
                activeOpacity={0.7}
              >
                <Headphones size={16} color={accentColor} />
                <Text style={[styles.readEndBtnText, { color: accentColor, fontFamily: FONTS.semibold }]}>
                  Switch to Audio
                </Text>
              </TouchableOpacity>
            )}
            {hasQuiz && (
              <TouchableOpacity onPress={handleGoToQuiz} activeOpacity={0.88}>
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  style={styles.quizBtn}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Award size={18} color="#FFF" fill="#FFF" />
                  <Text style={[styles.quizBtnText, { fontFamily: FONTS.bold }]}>Take the Quiz</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleNewStory}
              style={[styles.readEndBtn, { borderColor: '#DDD' }]}
              activeOpacity={0.7}
            >
              <RefreshCw size={14} color="#888" />
              <Text style={[styles.readEndBtnText, { color: '#888', fontFamily: FONTS.semibold }]}>
                New Story
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {audioError && (
          <SafeAreaView edges={['bottom']} style={styles.errorBanner}>
            <VolumeX size={13} color="#D97706" />
            <Text style={[styles.errorBannerText, { fontFamily: FONTS.medium }]}>
              Audio unavailable — reading mode active
            </Text>
          </SafeAreaView>
        )}
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={themeGradient as any}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.15)' }]} />

      <SafeAreaView edges={['top']} style={styles.audioTopBar}>
        <View style={styles.audioTopRow}>
          <TouchableOpacity onPress={handleBack} style={styles.audioTopBtn} activeOpacity={0.7}>
            <ArrowLeft size={20} color="rgba(255,255,255,0.9)" strokeWidth={2.5} />
          </TouchableOpacity>

          <View style={styles.audioTabPill}>
            <View style={[styles.audioTabBtn, { backgroundColor: 'rgba(255,255,255,0.95)' }]}>
              <Headphones size={13} color="#111" />
              <Text style={[styles.audioTabText, { fontFamily: FONTS.semibold, color: '#111' }]}>
                Listen
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => { hapticFeedback.light(); setTab('text'); }}
              style={styles.audioTabBtn}
              activeOpacity={0.8}
            >
              <BookMarked size={13} color="rgba(255,255,255,0.7)" />
              <Text style={[styles.audioTabText, { fontFamily: FONTS.semibold, color: 'rgba(255,255,255,0.7)' }]}>
                Read
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleShare} style={styles.audioTopBtn} activeOpacity={0.7}>
            <Share2 size={18} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={styles.heroSection}>
        <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.albumWrapper}>
          <Animated.View style={[styles.albumOuter, vinylStyle]}>
            <LinearGradient
              colors={[accentColor + '40', accentColor + '15', 'rgba(0,0,0,0.35)']}
              style={styles.albumInner}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <View style={styles.albumRing}>
                <View style={[styles.albumCore, { backgroundColor: accentColor + '44' }]}>
                  <BookOpen size={28} color="rgba(255,255,255,0.95)" strokeWidth={1.5} />
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(180).duration(600)} style={styles.heroMeta}>
          <Text style={[styles.heroTitle, { fontFamily: FONTS.extrabold }]} numberOfLines={2}>
            {story.title}
          </Text>
          <View style={styles.heroBadges}>
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
              style={[styles.waveBar, ws, {
                backgroundColor: isPlaying ? accentColor : '#33333330',
                height: 28 + (i % 3) * 4,
              }]}
            />
          ))}
          {[w6s, w5s, w4s, w3s, w2s, w1s].map((ws, i) => (
            <Animated.View
              key={`r${i}`}
              style={[styles.waveBar, ws, {
                backgroundColor: isPlaying ? accentColor : '#33333330',
                height: 28 + ((5 - i) % 3) * 4,
              }]}
            />
          ))}
        </View>

        <Pressable onPress={handleProgressPress} style={styles.progressArea} hitSlop={12}>
          <View style={[styles.progressTrack, { backgroundColor: '#33333318' }]}>
            <View style={[styles.progressFilled, { width: `${progressPercentage}%`, backgroundColor: accentColor }]} />
            <Animated.View style={[styles.progressThumb, thumbStyle, { left: `${progressPercentage}%`, backgroundColor: accentColor }]} />
          </View>
          <View style={styles.timeLabels}>
            <Text style={[styles.timeLabel, { color: '#888', fontFamily: FONTS.medium }]}>{formatTime(position)}</Text>
            <Text style={[styles.timeLabel, { color: '#888', fontFamily: FONTS.medium }]}>-{formatTime(Math.max(0, duration - position))}</Text>
          </View>
        </Pressable>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { fontFamily: FONTS.bold, color: '#111' }]}>
              {story.word_count ?? allWords.length}
            </Text>
            <Text style={[styles.statLabel, { fontFamily: FONTS.medium, color: '#888' }]}>words</Text>
          </View>
          <View style={[styles.statDot, { backgroundColor: '#33333320' }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { fontFamily: FONTS.bold, color: '#111' }]}>{formatTime(duration)}</Text>
            <Text style={[styles.statLabel, { fontFamily: FONTS.medium, color: '#888' }]}>length</Text>
          </View>
          <View style={[styles.statDot, { backgroundColor: '#33333320' }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { fontFamily: FONTS.bold, color: '#111' }]}>
              {story.language_code?.toUpperCase() ?? 'EN'}
            </Text>
            <Text style={[styles.statLabel, { fontFamily: FONTS.medium, color: '#888' }]}>lang</Text>
          </View>
        </View>

        <View style={styles.controlsRow}>
          <Animated.View style={skipBackStyle}>
            <TouchableOpacity onPress={handleSkipBack} disabled={!sound} style={[styles.skipBtn, !sound && { opacity: 0.3 }]} activeOpacity={0.7}>
              <SkipBack size={26} color="#111" strokeWidth={2} />
              <Text style={[styles.skipSec, { color: '#888', fontFamily: FONTS.bold }]}>10</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={playBtnStyle}>
            <TouchableOpacity
              onPress={handlePlayPause}
              disabled={!sound}
              activeOpacity={0.9}
              style={[styles.playBtnWrap, { shadowColor: accentColor, opacity: sound ? 1 : 0.4 }]}
            >
              <LinearGradient
                colors={sound ? [accentColor, accentColor + 'CC'] : ['#888', '#666']}
                style={styles.playBtn}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                {isBuffering ? (
                  <View style={styles.bufferRow}>
                    {[0, 1, 2].map(i => <View key={i} style={[styles.bufferDot, { backgroundColor: '#FFF' }]} />)}
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
            <TouchableOpacity onPress={handleSkipForward} disabled={!sound} style={[styles.skipBtn, !sound && { opacity: 0.3 }]} activeOpacity={0.7}>
              <SkipForward size={26} color="#111" strokeWidth={2} />
              <Text style={[styles.skipSec, { color: '#888', fontFamily: FONTS.bold }]}>15</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={styles.actionStack}>
          {hasQuiz && (
            <TouchableOpacity onPress={handleGoToQuiz} activeOpacity={0.88}>
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.quizBtn}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Award size={18} color="#FFF" fill="#FFF" />
                <Text style={[styles.quizBtnText, { fontFamily: FONTS.bold }]}>Take the Quiz</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleNewStory}
            style={[styles.outlineBtn, { borderColor: '#DDD' }]}
            activeOpacity={0.7}
          >
            <RefreshCw size={14} color="#888" />
            <Text style={[styles.outlineBtnText, { color: '#888', fontFamily: FONTS.semibold }]}>New Story</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },

  loadingBox: { alignItems: 'center', gap: SPACING.lg },
  loadingRing: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  loadingTitle: { fontSize: FONT_SIZES.xl, color: '#FFF', letterSpacing: -0.3 },
  loadingSubtitle: { fontSize: FONT_SIZES.sm, color: 'rgba(255,255,255,0.55)' },

  errorTitle: { fontSize: FONT_SIZES.xxl, marginBottom: SPACING.xl },
  errorBtn: { paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.pill },
  errorBtnText: { color: '#FFF', fontSize: FONT_SIZES.md },

  readNavBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: 10,
    borderBottomWidth: 1, backgroundColor: '#FAFAF8',
    gap: SPACING.sm,
  },
  readNavBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#11111108',
  },
  readNavCenter: { flex: 1, alignItems: 'center', position: 'relative' },
  readNavTitle: { fontSize: 14, color: '#111', letterSpacing: -0.2 },
  readNavAccent: { width: 24, height: 2.5, borderRadius: 2, marginTop: 3 },
  readNavRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  readNavChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: BORDER_RADIUS.pill, borderWidth: 1,
  },
  readNavChipText: { fontSize: 11 },
  readNavIconBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },

  settingsPanel: {
    backgroundColor: '#FAFAF8',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: '#E8E8E4',
    gap: SPACING.sm,
  },
  settingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingsLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 },
  settingsDivider: { height: 1 },
  fontSizeRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  fontSizeBtn: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#11111108',
  },
  fontSizeNum: { fontSize: 15, minWidth: 24, textAlign: 'center' },
  fontFamilyRow: { flexDirection: 'row', gap: SPACING.xs, flexWrap: 'wrap', justifyContent: 'flex-end' },
  fontChip: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: BORDER_RADIUS.lg, borderWidth: 1, borderColor: '#DDD',
    backgroundColor: '#FFF',
  },
  fontChipText: { fontSize: 11 },
  spacingRow: { flexDirection: 'row', gap: SPACING.xs },
  spacingChip: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: BORDER_RADIUS.lg, borderWidth: 1, borderColor: '#DDD',
    backgroundColor: '#FFF',
  },
  spacingChipText: { fontSize: 11 },
  alignRow: { flexDirection: 'row', gap: SPACING.xs },
  alignBtn: {
    width: 34, height: 34, borderRadius: BORDER_RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#DDD', backgroundColor: '#FFF',
  },

  readContent: { paddingHorizontal: SPACING.xxl, paddingTop: SPACING.xl },
  readStoryMeta: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
    gap: SPACING.sm, marginBottom: SPACING.xxl,
    paddingLeft: SPACING.md,
    borderLeftWidth: 3,
  },
  readMetaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: BORDER_RADIUS.pill, borderWidth: 1,
  },
  readMetaBadgeText: { fontSize: 11, textTransform: 'capitalize' },
  readMetaWords: { fontSize: 11 },
  paragraph: { flexDirection: 'row', flexWrap: 'wrap' },
  readEndDivider: { height: 1, marginVertical: SPACING.xxl },
  readEndActions: { gap: SPACING.md, paddingBottom: SPACING.xl },
  readEndBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: 13,
    borderRadius: BORDER_RADIUS.xl, borderWidth: 1.5,
  },
  readEndBtnText: { fontSize: FONT_SIZES.sm },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: '#FFFBEB', paddingHorizontal: SPACING.xl, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: '#FEF3C7',
  },
  errorBannerText: { color: '#92400E', fontSize: FONT_SIZES.xs },

  audioTopBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
  audioTopRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
  },
  audioTopBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  audioTabPill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: BORDER_RADIUS.pill,
    padding: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  audioTabBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: SPACING.md, paddingVertical: 7,
    borderRadius: BORDER_RADIUS.pill,
  },
  audioTabText: { fontSize: 12 },

  heroSection: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: 80, paddingBottom: SCREEN_HEIGHT * 0.49,
    paddingHorizontal: SPACING.xxl,
  },
  albumWrapper: { alignItems: 'center', marginBottom: SPACING.xxl },
  albumOuter: {
    width: 160, height: 160, borderRadius: 80,
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4, shadowRadius: 30, elevation: 20,
  },
  albumInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  albumRing: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  albumCore: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
  },
  heroMeta: { alignItems: 'center', gap: SPACING.md },
  heroTitle: {
    fontSize: 22, color: '#FFF', textAlign: 'center',
    lineHeight: 28, letterSpacing: -0.4,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6,
  },
  heroBadges: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap', justifyContent: 'center' },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: BORDER_RADIUS.pill, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1,
  },
  heroBadgeText: { fontSize: 11, textTransform: 'capitalize' },

  playerSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: SCREEN_HEIGHT * 0.56,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: SPACING.xxl, paddingTop: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 20,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#00000012', alignSelf: 'center', marginBottom: SPACING.lg,
  },

  waveRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 3, height: 40, marginBottom: SPACING.lg,
  },
  waveBar: { width: 3.5, borderRadius: 2 },

  progressArea: { marginBottom: SPACING.sm },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'visible', position: 'relative' },
  progressFilled: { height: '100%', borderRadius: 2 },
  progressThumb: {
    position: 'absolute', top: -6, width: 16, height: 16,
    borderRadius: 8, marginLeft: -8,
    borderWidth: 2.5, borderColor: '#FFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  timeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.sm },
  timeLabel: { fontSize: 11 },

  statsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.xl, marginBottom: SPACING.lg, paddingVertical: SPACING.xs,
  },
  statItem: { alignItems: 'center', gap: 1 },
  statValue: { fontSize: 16 },
  statLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDot: { width: 4, height: 4, borderRadius: 2 },

  controlsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.xxxl + 8, marginBottom: SPACING.lg,
  },
  skipBtn: { alignItems: 'center', gap: 2, minWidth: 44 },
  skipSec: { fontSize: 9, letterSpacing: 0.5 },
  playBtnWrap: {
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.38, shadowRadius: 20, elevation: 12,
  },
  playBtn: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  bufferRow: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  bufferDot: { width: 6, height: 6, borderRadius: 3 },

  actionStack: { gap: SPACING.sm },
  quizBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: 14, borderRadius: BORDER_RADIUS.xl,
    shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 10, elevation: 6,
  },
  quizBtnText: { color: '#FFF', fontSize: FONT_SIZES.md },
  outlineBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: 12,
    borderRadius: BORDER_RADIUS.xl, borderWidth: 1.5,
  },
  outlineBtnText: { fontSize: FONT_SIZES.sm },
});
