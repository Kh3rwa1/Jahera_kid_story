import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { generateAudio } from '@/services/audioService';
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
import { MarqueeText } from '@/components/MarqueeText';


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

function buildWordTimings(words: string[], totalChars: number): number[] {
  let cumulative = 0;
  const timings: number[] = [];
  for (const word of words) {
    timings.push(cumulative / Math.max(totalChars, 1));
    cumulative += word.length + 1;
  }
  return timings;
}

function countTotalChars(words: string[]): number {
  return words.reduce((sum, w) => sum + w.length + 1, 0);
}

function buildSentences(words: string[]): Array<{ start: number; end: number; text: string }> {
  const sentences: Array<{ start: number; end: number; text: string }> = [];
  let start = 0;
  let current: string[] = [];
  for (let i = 0; i < words.length; i++) {
    current.push(words[i]);
    if (/[.!?]["']?$/.test(words[i]) || i === words.length - 1) {
      sentences.push({ start, end: i, text: current.join(' ') });
      start = i + 1;
      current = [];
    }
  }
  return sentences;
}

function formatTime(millis: number): string {
  const s = Math.floor(millis / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

type TabMode = 'audio' | 'text';

const FONT_FAMILIES: FontFamily[] = ['nunito', 'merriweather', 'comic-neue', 'atkinson'];
const LINE_SPACINGS: LineSpacing[] = ['compact', 'normal', 'relaxed'];

export default function StoryPlayback() {
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { currentTheme } = useTheme();
  const C = currentTheme.colors;
  const { prefs, setFontSize, setFontFamily, setLineSpacing, setTextAlign } = useReadingPreferences();
  const scrollRef = useRef<ScrollView>(null);
  const lyricsScrollRef = useRef<ScrollView>(null);
  const lastPositionRef = useRef<number>(0);
  const lastSentenceRef = useRef<number>(-1);
  const lastActiveParaRef = useRef<number>(-1);
  const paraOffsets = useRef<number[]>([]);
  const insets = useSafeAreaInsets();

  const styles = useStyles(C, insets, winWidth, winHeight);

  const [story, setStory] = useState<Story | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [audioError, setAudioError] = useState(false);
  const [audioPolling, setAudioPolling] = useState(false);
  const [hasQuiz, setHasQuiz] = useState(false);
  const [tab, setTab] = useState<TabMode>('audio');
  const [isBuffering, setIsBuffering] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isPlayingRequested, setIsPlayingRequested] = useState(true); // Auto-play by default
  const audioPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const PROGRESS_KEY_PREFIX = 'story_progress_';

  const saveProgress = useCallback(async (pos: number, dur: number) => {
    if (!story?.id || dur <= 0) return;
    try {
      const progress = {
        position: pos,
        duration: dur,
        updatedAt: Date.now(),
        title: story.title,
        theme: story.theme
      };
      await AsyncStorage.setItem(`${PROGRESS_KEY_PREFIX}${story.id}`, JSON.stringify(progress));
      // Also track this as the 'latest' active story globally for the home screen
      await AsyncStorage.setItem('last_active_story_id', story.id);
    } catch (err) {
      console.warn('[playback] Failed to save progress:', err);
    }
  }, [story]);

  // Periodic autosave
  useEffect(() => {
    if (isPlaying && duration > 0) {
      progressSaveTimerRef.current = setInterval(() => {
        saveProgress(lastPositionRef.current, duration);
      }, 5000);
    } else {
      if (progressSaveTimerRef.current) clearInterval(progressSaveTimerRef.current);
    }
    return () => {
      if (progressSaveTimerRef.current) clearInterval(progressSaveTimerRef.current);
    };
  }, [isPlaying, duration, saveProgress]);

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
  const totalChars = useMemo(() => countTotalChars(allWords), [allWords]);
  const wordTimings = useMemo(() => buildWordTimings(allWords, totalChars), [allWords, totalChars]);

  // Pre-compute paragraph word ranges to avoid recomputation during render
  const paragraphWordRanges = useMemo(() => {
    const ranges: Array<{ start: number; end: number }> = [];
    let count = 0;
    for (const para of paragraphs) {
      const words = buildWordIndex([para]);
      ranges.push({ start: count, end: count + words.length - 1 });
      count += words.length;
    }
    return ranges;
  }, [paragraphs]);

  const activeWordIndex = useMemo(() => {
    if (duration <= 0 || allWords.length === 0 || position === 0) return -1;
    const progress = Math.min(position / duration, 1);
    let lo = 0, hi = wordTimings.length - 1, best = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (wordTimings[mid] <= progress) { best = mid; lo = mid + 1; }
      else hi = mid - 1;
    }
    return best;
  }, [position, duration, wordTimings]);

  const sentences = useMemo(() => buildSentences(allWords), [allWords]);

  const activeSentenceIndex = useMemo(() => {
    if (activeWordIndex < 0) return -1;
    for (let i = 0; i < sentences.length; i++) {
      if (activeWordIndex >= sentences[i].start && activeWordIndex <= sentences[i].end) return i;
    }
    return -1;
  }, [activeWordIndex, sentences]);

  useEffect(() => {
    if (activeSentenceIndex >= 0 && activeSentenceIndex !== lastSentenceRef.current) {
      lastSentenceRef.current = activeSentenceIndex;
      lyricsScrollRef.current?.scrollTo({ y: activeSentenceIndex * 72, animated: true });
    }
  }, [activeSentenceIndex]);

  const activeParaIndex = useMemo(() => {
    if (activeWordIndex < 0) return -1;
    for (let pi = 0; pi < paragraphWordRanges.length; pi++) {
      const { start, end } = paragraphWordRanges[pi];
      if (activeWordIndex >= start && activeWordIndex <= end) return pi;
    }
    return -1;
  }, [activeWordIndex, paragraphWordRanges]);

  useEffect(() => {
    if (tab === 'text' && activeParaIndex >= 0 && activeParaIndex !== lastActiveParaRef.current) {
      lastActiveParaRef.current = activeParaIndex;
      const offset = paraOffsets.current[activeParaIndex];
      if (offset !== undefined) {
        scrollRef.current?.scrollTo({ y: Math.max(0, offset - 80), animated: true });
      }
    }
  }, [activeParaIndex, tab]);

  useEffect(() => { loadStory(); }, []);
  useEffect(() => () => {
    if (sound) sound.unloadAsync().catch(() => {});
    if (audioPollingRef.current) clearInterval(audioPollingRef.current);
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
        // Audio is missing. Trigger generation immediately and poll.
        setAudioPolling(true);
        setTab('audio'); // Audio-first: Stay on audio tab even while generating
        
        // Trigger generation — server writes audio_url directly to DB
        generateAudio(storyData.content, storyData.language_code || 'en', storyData.id).catch(err => {
          console.error('[playback] Failed to trigger audio generation:', err);
        });

        let polls = 0;
        const MAX_POLLS = 25; // 25 × 3s = 75s
        audioPollingRef.current = setInterval(async () => {
          polls++;
          try {
            const fresh = await storyService.getById(storyId);
            if (fresh?.audio_url) {
              if (audioPollingRef.current) clearInterval(audioPollingRef.current);
              setAudioPolling(false);
              await loadAudio(fresh.audio_url);
              setTab('audio');
            } else if (polls >= MAX_POLLS) {
              if (audioPollingRef.current) clearInterval(audioPollingRef.current);
              setAudioPolling(false);
              setAudioError(true);
            }
          } catch {
            if (polls >= MAX_POLLS) {
              if (audioPollingRef.current) clearInterval(audioPollingRef.current);
              setAudioPolling(false);
              setAudioError(true);
            }
          }
        }, 3000);
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
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false
      });

      // Check for saved progress
      let startPosition = 0;
      try {
        const saved = await AsyncStorage.getItem(`${PROGRESS_KEY_PREFIX}${params.storyId}`);
        if (saved) {
          const { position: savedPos, duration: savedDur } = JSON.parse(saved);
          // Only resume if not at the very end (98%)
          if (savedPos > 5000 && savedPos < (savedDur * 0.98)) {
            startPosition = savedPos;
            console.log('[playback] Resuming from saved position:', startPosition);
          }
        }
      } catch (e) {
        console.warn('[playback] Failed to load saved progress:', e);
      }

      const { sound: audioSound } = await Audio.Sound.createAsync(
        { uri: audioPath },
        { 
          shouldPlay: true, 
          positionMillis: startPosition,
          progressUpdateIntervalMillis: 50 
        },
        onPlaybackStatusUpdate
      );
      setSound(audioSound);
      setAudioError(false);
      
      // Explicitly trigger play to ensure autoplay in all environments
      try {
        await audioSound.playAsync();
        setIsPlaying(true);
        hapticFeedback.light();
      } catch (err) {
        console.warn('[playback] Autoplay blocked or failed:', err);
      }
    } catch (err) {
      console.error('Failed to load audio:', err);
      setAudioError(true);
      setTab('text');
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      const newPos: number = status.positionMillis ?? 0;
      if (Math.abs(newPos - lastPositionRef.current) >= 80 || status.didJustFinish) {
        lastPositionRef.current = newPos;
        setPosition(newPos);
      }
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);
      setIsBuffering(status.isBuffering || false);
      if (status.didJustFinish) { setIsPlaying(false); setPosition(0); lastPositionRef.current = 0; }
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
    if (sound) {
      sound.stopAsync().catch(() => {});
      saveProgress(lastPositionRef.current, duration);
    }
    router.back();
  }, [sound, router, saveProgress, duration]);

  const handleShare = useCallback(async () => {
    if (!story) return;
    hapticFeedback.medium();
    try { await shareStory(story.title, story.content); } catch {}
  }, [story]);

  const handleProgressPress = useCallback(async (event: any) => {
    if (!sound || !duration) return;
    const { locationX } = event.nativeEvent;
    const barWidth = winWidth - SPACING.xxl * 2;
    const pct = Math.max(0, Math.min(1, locationX / barWidth));
    progressThumbScale.value = withSequence(withSpring(1.4, { damping: 6 }), withSpring(1, { damping: 10 }));
    try { hapticFeedback.light(); await sound.setPositionAsync(duration * pct); } catch {}
  }, [sound, duration]);

  const handleGoToQuiz = useCallback(() => {
    hapticFeedback.medium();
    if (sound) sound.stopAsync().catch(() => {});
    router.push({ pathname: '/story/quiz', params: { storyId: story!.id } });
  }, [sound, story, router]);

  const handleNewStory = useCallback(() => {
    hapticFeedback.light();
    if (sound) sound.stopAsync().catch(() => {});
    router.push({ pathname: '/story/generate', params: { profileId: story!.profile_id, languageCode: story!.language_code } });
  }, [sound, story, router]);

  const handleRetryAudio = useCallback(async () => {
    if (!story) return;
    hapticFeedback.medium();
    setAudioError(false);
    setAudioPolling(true);
    
    try {
      await generateAudio(story.content, story.language_code || 'en', story.id);
      // After triggering, loadStory logic for polling will be handled by re-mounting or manual call
      // But here we can just wait for a moment and then the polling in loadStory (if active) would pick it up
      // Or we can manually start a new poll here for better UX
      let polls = 0;
      const MAX_POLLS = 20;
      const interval = setInterval(async () => {
        polls++;
        const fresh = await storyService.getById(story.id);
        if (fresh?.audio_url) {
          clearInterval(interval);
          setAudioPolling(false);
          await loadAudio(fresh.audio_url);
          setTab('audio');
        } else if (polls >= MAX_POLLS) {
          clearInterval(interval);
          setAudioPolling(false);
          setAudioError(true);
        }
      }, 3000);
    } catch (err) {
      setAudioError(true);
      setAudioPolling(false);
    }
  }, [story, loadAudio]);

  const lineHeight = prefs.fontSize * LINE_SPACING_VALUES[prefs.lineSpacing];
  const activeFontDef = FONT_FAMILY_VALUES[prefs.fontFamily ?? 'nunito'];

  // Pre-compute styles for active/past words to avoid inline object creation
  // These useMemo hooks MUST be before any early returns to satisfy React's Rules of Hooks
  const activeWordStyle = useMemo(() => ({
    color: accentColor,
    backgroundColor: accentColor + '20',
    borderRadius: 3,
    fontFamily: activeFontDef.bold,
    overflow: 'hidden' as const,
  }), [accentColor, activeFontDef.bold]);

  const pastWordColor = useMemo(() => ({ color: C.text.primary }), [C.text.primary]);
  const baseWordStyle = useMemo(() => ({
    fontSize: prefs.fontSize,
    lineHeight,
    fontFamily: activeFontDef.regular,
    color: C.text.secondary,
  }), [prefs.fontSize, lineHeight, activeFontDef.regular, C.text.secondary]);

  if (isLoading) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <LinearGradient 
          colors={[
            C.primaryDark,
            C.primaryDark + 'E6', // slightly transparent mid
            '#000000' + 'CC'      // Fade to near-black
          ]} 
          style={StyleSheet.absoluteFill} 
        />
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

  let globalWordCounter = 0;

  if (tab === 'text' || audioError) {
    return (
      <View style={[styles.fill, { backgroundColor: C.background }]}>
        <StatusBar barStyle="dark-content" />

        <SafeAreaView edges={['top']} style={{ backgroundColor: C.cardBackground }}>
          <View style={[styles.readNavBar, { borderBottomColor: C.text.light + '22', backgroundColor: C.cardBackground }]}>
            <TouchableOpacity onPress={handleBack} style={[styles.readNavBtn, { backgroundColor: C.text.primary + '08' }]} activeOpacity={0.7}>
              <ArrowLeft size={20} color={C.text.primary} strokeWidth={2.5} />
            </TouchableOpacity>

            <View style={styles.readNavCenter}>
              <MarqueeText
                text={story.title}
                style={[styles.readNavTitle, { fontFamily: FONTS.bold, color: C.text.primary }]}
              />
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
                style={[styles.readNavIconBtn, { backgroundColor: showSettings ? C.text.primary + '10' : 'transparent' }]}
                activeOpacity={0.7}
              >
                <Type size={18} color={C.text.secondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare} style={styles.readNavIconBtn} activeOpacity={0.7}>
                <Share2 size={18} color={C.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>

          {showSettings && (
            <Animated.View entering={FadeInDown.duration(200)} style={[styles.settingsPanel, { backgroundColor: C.cardBackground, borderBottomColor: C.text.light + '20' }]}>
              <View style={styles.settingsRow}>
                <Text style={[styles.settingsLabel, { fontFamily: FONTS.semibold, color: C.text.secondary }]}>Size</Text>
                <View style={styles.fontSizeRow}>
                  <TouchableOpacity
                    onPress={() => { hapticFeedback.light(); setFontSize(prefs.fontSize - 1); }}
                    style={[styles.fontSizeBtn, { backgroundColor: C.text.primary + '08' }]}
                    activeOpacity={0.7}
                  >
                    <Minus size={14} color={C.text.primary} />
                  </TouchableOpacity>
                  <Text style={[styles.fontSizeNum, { fontFamily: FONTS.bold, color: C.text.primary }]}>{prefs.fontSize}</Text>
                  <TouchableOpacity
                    onPress={() => { hapticFeedback.light(); setFontSize(prefs.fontSize + 1); }}
                    style={[styles.fontSizeBtn, { backgroundColor: accentColor + '25' }]}
                    activeOpacity={0.7}
                  >
                    <Plus size={14} color={accentColor} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.settingsDivider, { backgroundColor: C.text.light + '30' }]} />

              <View style={styles.settingsFontSection}>
                <Text style={[styles.settingsLabel, { fontFamily: FONTS.semibold, color: C.text.secondary }]}>Font</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.fontFamilyRow}
                  style={styles.fontFamilyScroll}
                >
                  {FONT_FAMILIES.map(f => (
                    <TouchableOpacity
                      key={f}
                      onPress={() => { hapticFeedback.light(); setFontFamily(f); }}
                      style={[
                        styles.fontChip,
                        { backgroundColor: C.cardBackground, borderColor: C.text.light + '40' },
                        prefs.fontFamily === f && { backgroundColor: accentColor, borderColor: accentColor },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.fontChipText,
                        { fontFamily: FONT_FAMILY_VALUES[f].regular },
                        prefs.fontFamily === f ? { color: '#FFF' } : { color: C.text.secondary },
                      ]}>
                        {FONT_FAMILY_VALUES[f].label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={[styles.settingsDivider, { backgroundColor: C.text.light + '30' }]} />

              <View style={styles.settingsRow}>
                <Text style={[styles.settingsLabel, { fontFamily: FONTS.semibold, color: C.text.secondary }]}>Spacing</Text>
                <View style={styles.spacingRow}>
                  {LINE_SPACINGS.map(s => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => { hapticFeedback.light(); setLineSpacing(s); }}
                      style={[
                        styles.spacingChip,
                        { backgroundColor: C.cardBackground, borderColor: C.text.light + '40' },
                        prefs.lineSpacing === s && { backgroundColor: accentColor, borderColor: accentColor },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.spacingChipText,
                        { fontFamily: FONTS.medium },
                        prefs.lineSpacing === s ? { color: '#FFF' } : { color: C.text.secondary },
                      ]}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={[styles.settingsDivider, { backgroundColor: C.text.light + '30' }]} />

              <View style={styles.settingsRow}>
                <Text style={[styles.settingsLabel, { fontFamily: FONTS.semibold, color: C.text.secondary }]}>Align</Text>
                <View style={styles.alignRow}>
                  <TouchableOpacity
                    onPress={() => { hapticFeedback.light(); setTextAlign('left'); }}
                    style={[styles.alignBtn, { backgroundColor: C.cardBackground, borderColor: C.text.light + '40' }, prefs.textAlign === 'left' && { backgroundColor: accentColor, borderColor: accentColor }]}
                    activeOpacity={0.7}
                  >
                    <AlignLeft size={16} color={prefs.textAlign === 'left' ? '#FFF' : C.text.secondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => { hapticFeedback.light(); setTextAlign('justify'); }}
                    style={[styles.alignBtn, { backgroundColor: C.cardBackground, borderColor: C.text.light + '40' }, prefs.textAlign === 'justify' && { backgroundColor: accentColor, borderColor: accentColor }]}
                    activeOpacity={0.7}
                  >
                    <AlignJustify size={16} color={prefs.textAlign === 'justify' ? '#FFF' : C.text.secondary} />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          )}
        </SafeAreaView>

        <ScrollView
          ref={scrollRef}
          style={[styles.fill, { backgroundColor: C.background }]}
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
              <View style={[styles.readMetaBadge, { backgroundColor: C.text.primary + '08', borderColor: C.text.primary + '12' }]}>
                <Text style={[styles.readMetaBadgeText, { fontFamily: FONTS.medium, color: C.text.secondary }]}>
                  {story.mood}
                </Text>
              </View>
            )}
            <Text style={[styles.readMetaWords, { fontFamily: FONTS.medium, color: C.text.light }]}>
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
                      baseWordStyle,
                      isPast && pastWordColor,
                      isActive && activeWordStyle,
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
                onLayout={(e) => { paraOffsets.current[paraIdx] = e.nativeEvent.layout.y; }}
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

          <View style={[styles.readEndDivider, { backgroundColor: C.text.light + '30' }]} />

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
              style={[styles.readEndBtn, { borderColor: C.text.light + '40' }]}
              activeOpacity={0.7}
            >
              <RefreshCw size={14} color={C.text.light} />
              <Text style={[styles.readEndBtnText, { color: C.text.light, fontFamily: FONTS.semibold }]}>
                New Story
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {(audioError || audioPolling) && (
          <SafeAreaView edges={['bottom']} style={[styles.errorBanner, { backgroundColor: audioPolling ? '#ECFDF5' : '#FFF7ED' }]}>
            <View style={styles.errorBannerContent}>
              <View style={styles.errorBannerLeft}>
                <VolumeX size={14} color={audioPolling ? '#10B981' : '#D97706'} />
                <Text style={[styles.errorBannerText, { fontFamily: FONTS.medium, color: audioPolling ? '#10B981' : '#D97706' }]}>
                  {audioPolling ? '🎙️ Narration generating...' : 'Audio unavailable'}
                </Text>
              </View>
              {audioError && (
                <TouchableOpacity 
                  onPress={handleRetryAudio} 
                  style={[styles.retryBtn, { backgroundColor: '#FFEDD5' }]}
                  activeOpacity={0.7}
                >
                  <RefreshCw size={12} color="#D97706" />
                  <Text style={[styles.retryBtnText, { color: '#D97706', fontFamily: FONTS.bold }]}>Retry</Text>
                </TouchableOpacity>
              )}
            </View>
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

      <View style={[styles.heroSection, { paddingBottom: winHeight * 0.46 }]}>
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
          <MarqueeText
            text={story.title}
            style={[styles.heroTitle, { fontFamily: FONTS.extrabold }]}
            containerStyle={{ width: '100%' }}
          />
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
        style={[styles.playerSheet, { height: winHeight * 0.54 }]}
      >
        <View style={styles.sheetHandle} />

        <View style={styles.waveRow}>
          {[w1s, w2s, w3s, w4s, w5s, w6s].map((ws, i) => (
            <Animated.View
              key={i}
              style={[styles.waveBar, ws, {
                backgroundColor: isPlaying ? (accentColor + 'E5') : '#1E293B20',
                height: 32 + (i % 3) * 6,
                marginHorizontal: 2,
              }]}
            />
          ))}
          {[w6s, w5s, w4s, w3s, w2s, w1s].map((ws, i) => (
            <Animated.View
              key={`r${i}`}
              style={[styles.waveBar, ws, {
                backgroundColor: isPlaying ? (accentColor + 'E5') : (C.text.primary + '15'),
                height: 32 + ((5 - i) % 3) * 6,
                marginHorizontal: 2,
              }]}
            />
          ))}
        </View>

        {/* Live lyrics sync strip */}
        <View style={[styles.lyricsStrip, { borderColor: C.text.light + '08', backgroundColor: C.cardBackground }]}>
          <ScrollView
            ref={lyricsScrollRef}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            style={styles.lyricsScroll}
            contentContainerStyle={styles.lyricsContent}
          >
            {sentences.map((sentence, si) => {
              const isCurrentSentence = si === activeSentenceIndex;
              const isPastSentence = si < activeSentenceIndex;
              const sentenceWords = allWords.slice(sentence.start, sentence.end + 1);
              return (
                <View key={si} style={[styles.lyricsSentenceRow, { height: 72, justifyContent: 'center' }]}>
                  <Text style={[
                    styles.lyricsSentenceText,
                    { fontFamily: FONTS.medium },
                    isPastSentence && { opacity: 0.3 },
                    !isCurrentSentence && !isPastSentence && { opacity: 0.25 },
                  ]} numberOfLines={2}>
                    {sentenceWords.map((word, wi) => {
                      const globalIdx = sentence.start + wi;
                      const isActive = globalIdx === activeWordIndex;
                      const isPastWord = globalIdx < activeWordIndex && isCurrentSentence;
                      return (
                        <Text
                          key={wi}
                          style={[
                            styles.lyricsWord,
                            { fontFamily: FONTS.medium },
                            isCurrentSentence && { color: C.text.primary },
                            isPastWord && { color: C.text.primary, opacity: 0.8, fontFamily: FONTS.bold },
                            isActive && {
                              color: accentColor,
                              fontFamily: FONTS.extrabold,
                            },
                          ]}
                        >
                          {word}{wi < sentenceWords.length - 1 ? ' ' : ''}
                        </Text>
                      );
                    })}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        <Pressable onPress={handleProgressPress} style={styles.progressArea} hitSlop={12}>
          <View style={[styles.progressTrack, { backgroundColor: C.text.primary + '12' }]}>
            <View style={[styles.progressFilled, { width: `${progressPercentage}%`, backgroundColor: accentColor }]} />
            <Animated.View style={[styles.progressThumb, thumbStyle, { left: `${progressPercentage}%`, backgroundColor: accentColor }]} />
          </View>
          <View style={styles.timeLabels}>
            <Text style={[styles.timeLabel, { color: C.text.light, fontFamily: FONTS.medium }]}>{formatTime(position)}</Text>
            <Text style={[styles.timeLabel, { color: C.text.light, fontFamily: FONTS.medium }]}>-{formatTime(Math.max(0, duration - position))}</Text>
          </View>
        </Pressable>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { fontFamily: FONTS.bold, color: C.text.primary }]}>
              {story.word_count ?? allWords.length}
            </Text>
            <Text style={[styles.statLabel, { fontFamily: FONTS.medium, color: C.text.secondary }]}>words</Text>
          </View>
          <View style={[styles.statDot, { backgroundColor: C.text.light + '15' }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { fontFamily: FONTS.bold, color: C.text.primary }]}>{formatTime(duration)}</Text>
            <Text style={[styles.statLabel, { fontFamily: FONTS.medium, color: C.text.secondary }]}>length</Text>
          </View>
          <View style={[styles.statDot, { backgroundColor: C.text.light + '15' }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { fontFamily: FONTS.bold, color: C.text.primary }]}>
              {story.language_code?.toUpperCase() ?? 'EN'}
            </Text>
            <Text style={[styles.statLabel, { fontFamily: FONTS.medium, color: C.text.secondary }]}>lang</Text>
          </View>
        </View>

        <View style={styles.controlsRow}>
          <Animated.View style={skipBackStyle}>
            <TouchableOpacity onPress={handleSkipBack} disabled={!sound} style={[styles.skipBtn, !sound && { opacity: 0.3 }]} activeOpacity={0.7}>
              <SkipBack size={26} color={C.text.primary} strokeWidth={2} />
              <Text style={[styles.skipSec, { color: C.text.secondary, fontFamily: FONTS.bold }]}>10</Text>
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
              <SkipForward size={26} color={C.text.primary} strokeWidth={2} />
              <Text style={[styles.skipSec, { color: C.text.secondary, fontFamily: FONTS.bold }]}>15</Text>
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
            style={[styles.outlineBtn, { borderColor: C.text.light + '30' }]}
            activeOpacity={0.7}
          >
            <RefreshCw size={14} color={C.text.secondary} />
            <Text style={[styles.outlineBtnText, { color: C.text.secondary, fontFamily: FONTS.semibold }]}>New Story</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const useStyles = (C: any, insets: any, winWidth: number, winHeight: number) => {
  return useMemo(() => StyleSheet.create({
    fill: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center' },
  
    loadingBox: { alignItems: 'center', gap: SPACING.lg },
    loadingRing: {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: C.text.primary + '18',
      borderWidth: 1.5, borderColor: C.text.primary + '25',
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
      borderBottomWidth: 1, backgroundColor: C.cardBackground,
      gap: SPACING.sm,
    },
    readNavBtn: {
      width: 36, height: 36, borderRadius: 18,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: C.text.primary + '08',
    },
    readNavCenter: { flex: 1, alignItems: 'center', position: 'relative' },
    readNavTitle: { fontSize: 14, color: C.text.primary, letterSpacing: -0.2 },
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
      backgroundColor: C.cardBackground,
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.md,
      borderBottomWidth: 1, borderBottomColor: C.text.light + '20',
      gap: SPACING.sm,
    },
    settingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    settingsLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 },
    settingsDivider: { height: 1 },
    fontSizeRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    fontSizeBtn: {
      width: 30, height: 30, borderRadius: 15,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: C.text.primary + '08',
    },
    fontSizeNum: { fontSize: 15, minWidth: 24, textAlign: 'center' },
    settingsFontSection: { paddingVertical: 2, gap: SPACING.xs },
    fontFamilyScroll: { marginTop: 6 },
    fontFamilyRow: { flexDirection: 'row', gap: SPACING.xs, paddingRight: SPACING.sm },
    fontChip: {
      paddingHorizontal: 10, paddingVertical: 5,
      borderRadius: BORDER_RADIUS.lg, borderWidth: 1, borderColor: C.text.light + '40',
      backgroundColor: C.cardBackground,
    },
    fontChipText: { fontSize: 11 },
    spacingRow: { flexDirection: 'row', gap: SPACING.xs },
    spacingChip: {
      paddingHorizontal: 10, paddingVertical: 5,
      borderRadius: BORDER_RADIUS.lg, borderWidth: 1, borderColor: C.text.light + '40',
      backgroundColor: C.cardBackground,
    },
    spacingChipText: { fontSize: 11 },
    alignRow: { flexDirection: 'row', gap: SPACING.xs },
    alignBtn: {
      width: 34, height: 34, borderRadius: BORDER_RADIUS.md,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: C.text.light + '40', backgroundColor: C.cardBackground,
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
    readMetaBadgeText: { fontSize: 13, textTransform: 'capitalize' },
    readMetaWords: { fontSize: 13 },
    paragraph: { flexDirection: 'row', flexWrap: 'wrap' },
    readEndDivider: { height: 1, marginVertical: SPACING.xxl },
    readEndActions: { gap: SPACING.md, paddingBottom: SPACING.xl },
    readEndBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: SPACING.sm, paddingVertical: 13,
      borderRadius: BORDER_RADIUS.xl, borderWidth: 1.5,
    },
    readEndBtnText: { fontSize: 16 },
  
    errorBanner: {
      paddingVertical: 10, paddingHorizontal: SPACING.xl,
      borderTopWidth: 1, borderTopColor: C.text.light + '12',
    },
    errorBannerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    errorBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    errorBannerText: { fontSize: 13 },
    retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    retryBtnText: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  
    audioTopBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
    audioTopRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
    },
    audioTopBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.25)',
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
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
    audioTabText: { fontSize: 14 },
  
    heroSection: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      paddingTop: 80,
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
      fontSize: 30, color: '#FFF', textAlign: 'center',
      lineHeight: 38, letterSpacing: -0.5,
      textShadowColor: 'rgba(0,0,0,0.35)',
      textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6,
    },
    heroBadges: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap', justifyContent: 'center' },
    heroBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      borderRadius: BORDER_RADIUS.pill, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1,
    },
    heroBadgeText: { fontSize: 14, textTransform: 'capitalize' },
  
    playerSheet: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: C.cardBackground,
      borderTopLeftRadius: 32, borderTopRightRadius: 32,
      paddingHorizontal: SPACING.xxl, paddingTop: SPACING.md,
      shadowColor: '#000', shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.15, shadowRadius: 24, elevation: 20,
    },
    sheetHandle: {
      width: 36, height: 4, borderRadius: 2,
      backgroundColor: C.text.primary + '12', alignSelf: 'center', marginBottom: SPACING.lg,
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
    statValue: { fontSize: 20 },
    statLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    statDot: { width: 4, height: 4, borderRadius: 2 },
  
    controlsRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: SPACING.xxxl + 8, marginBottom: SPACING.lg,
    },
    skipBtn: { alignItems: 'center', gap: 2, minWidth: 44 },
    skipSec: { fontSize: 11, letterSpacing: 0.5 },
    playBtnWrap: {
      shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.38, shadowRadius: 20, elevation: 12,
    },
    playBtn: {
      width: 80, height: 80, borderRadius: 40,
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
    quizBtnText: { color: '#FFF', fontSize: 20 },
    outlineBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: SPACING.sm, paddingVertical: 13,
      borderRadius: BORDER_RADIUS.xl, borderWidth: 1.5,
    },
    outlineBtnText: { fontSize: 16 },
  
    lyricsStrip: {
      height: 72, borderRadius: BORDER_RADIUS.lg,
      borderWidth: 1, overflow: 'hidden',
      marginBottom: SPACING.sm,
    },
    lyricsScroll: { flex: 1 },
    lyricsContent: { paddingHorizontal: SPACING.lg },
    lyricsSentenceRow: { paddingVertical: SPACING.xs },
    lyricsSentenceText: {
      fontSize: 14, color: C.text.primary, lineHeight: 22, textAlign: 'center',
    },
    lyricsWord: { fontSize: 14, color: C.text.secondary },
  }), [C, insets, winWidth, winHeight]);
};
