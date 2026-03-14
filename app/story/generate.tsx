import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing as ReEasing,
  FadeInUp,
  FadeInDown,
  ZoomIn,
} from 'react-native-reanimated';
import { profileService, storyService, quizService } from '@/services/database';
import { generateAdventureStory, QuotaExceededError, StoryOptions } from '@/services/aiService';
import { generateAudio } from '@/services/audioService';
import { getCurrentContext } from '@/utils/contextUtils';
import { Sparkles, BookOpen, Volume2, Circle as HelpCircle, Check, Zap, ChevronLeft, Wand as Wand2 } from 'lucide-react-native';
import { ErrorState } from '@/components/ErrorState';
import { SPACING, BORDER_RADIUS, SHADOWS, FONTS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useApp } from '@/contexts/AppContext';
import { hapticFeedback } from '@/utils/haptics';

const { width: SW } = Dimensions.get('window');
const CARD_SIZE = (SW - SPACING.xl * 2 - SPACING.sm * 3) / 4;

const FUN_FACTS = [
  'Did you know? Dolphins sleep with one eye open!',
  'Did you know? Octopuses have 3 hearts!',
  'Did you know? Honey never spoils!',
  'Did you know? Sloths can hold their breath for 40 minutes!',
  'Did you know? The moon has moonquakes!',
  'Did you know? Butterflies taste with their feet!',
  'Did you know? Cats have over 20 vocalizations!',
  'Did you know? Penguins propose with pebbles!',
  'Did you know? Bananas glow blue under UV light!',
  'Did you know? A group of flamingos is called a flamboyance!',
];

const THEMES = [
  { id: 'adventure', label: 'Adventure', emoji: '🗺️', gradient: ['#F97316', '#EF4444'] as [string, string] },
  { id: 'fantasy', label: 'Fantasy', emoji: '🐉', gradient: ['#8B5CF6', '#6D28D9'] as [string, string] },
  { id: 'space', label: 'Space', emoji: '🚀', gradient: ['#0EA5E9', '#1D4ED8'] as [string, string] },
  { id: 'animals', label: 'Animals', emoji: '🦁', gradient: ['#F59E0B', '#D97706'] as [string, string] },
  { id: 'ocean', label: 'Ocean', emoji: '🌊', gradient: ['#06B6D4', '#0284C7'] as [string, string] },
  { id: 'superheroes', label: 'Heroes', emoji: '🦸', gradient: ['#EC4899', '#BE185D'] as [string, string] },
  { id: 'nature', label: 'Nature', emoji: '🌿', gradient: ['#10B981', '#059669'] as [string, string] },
  { id: 'science', label: 'Science', emoji: '🔬', gradient: ['#6366F1', '#4338CA'] as [string, string] },
];

const MOODS = [
  { id: 'exciting', label: 'Exciting', emoji: '⚡', color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'funny', label: 'Funny', emoji: '😄', color: '#10B981', bg: '#ECFDF5' },
  { id: 'calming', label: 'Calming', emoji: '🌙', color: '#6366F1', bg: '#EEF2FF' },
  { id: 'educational', label: 'Learn', emoji: '📚', color: '#0EA5E9', bg: '#F0F9FF' },
];

const LENGTHS = [
  { id: 'short', label: 'Quick', desc: '~50 words', emoji: '⚡' },
  { id: 'medium', label: 'Medium', desc: '~120 words', emoji: '📖' },
  { id: 'long', label: 'Long', desc: '~250 words', emoji: '📜', pro: true },
];

interface GenerationStep {
  id: string;
  label: string;
  icon: typeof BookOpen;
  completed: boolean;
}

type Phase = 'options' | 'generating';

function ThemeCard({ theme, selected, onPress }: {
  theme: typeof THEMES[0];
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    scale.value = withSequence(withSpring(0.9, { damping: 10 }), withSpring(1, { damping: 12 }));
    onPress();
    hapticFeedback.light();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1}>
      <ReAnimated.View style={animStyle}>
        <View style={[styles.themeCard, selected && styles.themeCardSelected]}>
          {selected ? (
            <LinearGradient colors={theme.gradient} style={styles.themeCardGradient}>
              <Text style={styles.themeCardEmoji}>{theme.emoji}</Text>
              <Text style={styles.themeCardLabelSelected}>{theme.label}</Text>
            </LinearGradient>
          ) : (
            <View style={styles.themeCardInner}>
              <Text style={styles.themeCardEmoji}>{theme.emoji}</Text>
              <Text style={styles.themeCardLabel}>{theme.label}</Text>
            </View>
          )}
        </View>
      </ReAnimated.View>
    </TouchableOpacity>
  );
}

function MoodCard({ mood, selected, onPress }: {
  mood: typeof MOODS[0];
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    scale.value = withSequence(withSpring(0.88, { damping: 10 }), withSpring(1, { damping: 12 }));
    onPress();
    hapticFeedback.light();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1} style={{ flex: 1 }}>
      <ReAnimated.View style={[animStyle, { flex: 1 }]}>
        <View style={[
          styles.moodCard,
          { borderColor: selected ? mood.color : 'transparent', backgroundColor: selected ? mood.bg : '#F8FAFC' },
        ]}>
          <Text style={styles.moodEmoji}>{mood.emoji}</Text>
          <Text style={[styles.moodLabel, { color: selected ? mood.color : '#64748B' }]}>
            {mood.label}
          </Text>
          {selected && (
            <View style={[styles.moodDot, { backgroundColor: mood.color }]} />
          )}
        </View>
      </ReAnimated.View>
    </TouchableOpacity>
  );
}

function LengthCard({ len, selected, isPro, onPress }: {
  len: typeof LENGTHS[0];
  selected: boolean;
  isPro: boolean;
  onPress: () => void;
}) {
  const { currentTheme } = useTheme();
  const COLORS = currentTheme.colors;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{ flex: 1 }}>
      <View style={[
        styles.lengthCard,
        selected && { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '0F' },
        !selected && { borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
      ]}>
        {len.pro && !isPro && (
          <View style={styles.proCrown}>
            <Text style={styles.proText}>PRO</Text>
          </View>
        )}
        <Text style={styles.lengthEmoji}>{len.emoji}</Text>
        <Text style={[styles.lengthTitle, { color: selected ? COLORS.primary : '#1E293B' }]}>
          {len.label}
        </Text>
        <Text style={[styles.lengthWords, { color: selected ? COLORS.primary + 'AA' : '#94A3B8' }]}>
          {len.desc}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function GenerateStory() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { currentTheme } = useTheme();
  const themeColors = currentTheme.colors;
  const { subscription, refreshSubscription } = useApp();

  const [phase, setPhase] = useState<Phase>('options');
  const [selectedTheme, setSelectedTheme] = useState('adventure');
  const [selectedMood, setSelectedMood] = useState('exciting');
  const [selectedLength, setSelectedLength] = useState<'short' | 'medium' | 'long'>('short');

  const [status, setStatus] = useState('Preparing your adventure...');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isQuotaError, setIsQuotaError] = useState(false);
  const [funFactIndex, setFunFactIndex] = useState(0);
  const [longWait, setLongWait] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const longWaitRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [steps, setSteps] = useState<GenerationStep[]>([
    { id: 'profile', label: 'Loading profile', icon: Sparkles, completed: false },
    { id: 'story', label: 'Creating story', icon: BookOpen, completed: false },
    { id: 'quiz', label: 'Generating quiz', icon: HelpCircle, completed: false },
    { id: 'audio', label: 'Adding narration', icon: Volume2, completed: false },
  ]);

  const pulseScale = useSharedValue(1);
  const orbRotate = useSharedValue(0);

  const isPro = subscription?.plan !== 'free';

  useEffect(() => {
    if (phase !== 'generating') return;

    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1400, easing: ReEasing.inOut(ReEasing.quad) }),
        withTiming(1, { duration: 1400, easing: ReEasing.inOut(ReEasing.quad) })
      ),
      -1,
      true
    );

    orbRotate.value = withRepeat(
      withTiming(360, { duration: 8000, easing: ReEasing.linear }),
      -1,
      false
    );

    timerRef.current = setInterval(() => {
      setFunFactIndex(prev => (prev + 1) % FUN_FACTS.length);
    }, 4000);

    longWaitRef.current = setTimeout(() => setLongWait(true), 15000);

    runGeneration();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (longWaitRef.current) clearTimeout(longWaitRef.current);
    };
  }, [phase]);

  const pulseAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${orbRotate.value}deg` }],
  }));

  const completeStep = (stepId: string) => {
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, completed: true } : s));
    hapticFeedback.light();
  };

  const handleStartGeneration = () => {
    if (selectedLength === 'long' && !isPro) {
      router.push('/paywall');
      return;
    }
    setPhase('generating');
  };

  const runGeneration = async () => {
    try {
      const profileId = params.profileId as string;
      const languageCode = params.languageCode as string;

      setStatus('Loading your profile...');
      setProgress(20);

      const profile = await profileService.getWithRelations(profileId);
      if (!profile) {
        setError('Profile not found. Please make sure you have created a profile first.');
        return;
      }

      completeStep('profile');
      setStatus('Creating your adventure story...');
      setProgress(40);

      const context = getCurrentContext();
      const options: StoryOptions = {
        theme: selectedTheme,
        mood: selectedMood,
        length: selectedLength,
      };

      const story = await generateAdventureStory(profile, languageCode, context, options);

      if (!story) {
        setError('Could not generate a story. Please try again.');
        return;
      }

      completeStep('story');
      setStatus('Creating quiz questions...');
      setProgress(60);

      const storyRecord = await storyService.create({
        profile_id: profileId,
        language_code: languageCode,
        title: story.title,
        content: story.content,
        audio_url: null,
        season: context.season,
        time_of_day: context.timeOfDay,
        theme: selectedTheme,
        mood: selectedMood,
        word_count: story.word_count || null,
        share_token: null,
        like_count: 0,
        generated_at: new Date().toISOString(),
      });

      if (!storyRecord) {
        setError('Failed to save story. Please check your internet connection and try again.');
        return;
      }

      setProgress(70);

      let quizCreatedCount = 0;
      for (let i = 0; i < story.quiz.length; i++) {
        const quizQuestion = story.quiz[i];
        const question = await quizService.createQuestion(storyRecord.$id, quizQuestion.question, i + 1);
        if (question) {
          await quizService.createAnswer(question.$id, quizQuestion.options.A, quizQuestion.correct_answer === 'A', 'A');
          await quizService.createAnswer(question.$id, quizQuestion.options.B, quizQuestion.correct_answer === 'B', 'B');
          await quizService.createAnswer(question.$id, quizQuestion.options.C, quizQuestion.correct_answer === 'C', 'C');
          quizCreatedCount++;
        }
      }

      if (quizCreatedCount === 0) {
        setError('Failed to create quiz questions. Please try generating a new story.');
        return;
      }

      completeStep('quiz');

      setStatus('Generating audio narration...');
      setProgress(85);

      try {
        const audioPath = await generateAudio(story.content, languageCode, storyRecord.$id);
        if (audioPath) {
          await storyService.update(storyRecord.$id, { audio_url: audioPath });
          completeStep('audio');
          setStatus('Story ready with audio narration!');
        } else {
          setStatus('Your story is ready!');
        }
      } catch {
        setStatus('Your story is ready!');
      }

      setProgress(100);
      hapticFeedback.success();
      await refreshSubscription();

      setTimeout(() => {
        router.replace({ pathname: '/story/playback', params: { storyId: storyRecord.$id } });
      }, 800);
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        setIsQuotaError(true);
        setError(err.message);
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate story';
        setError(errorMessage);
      }
    }
  };

  const handleRetry = () => {
    setError(null);
    setIsQuotaError(false);
    setProgress(0);
    setLongWait(false);
    setStatus('Preparing your adventure...');
    setSteps(prev => prev.map(s => ({ ...s, completed: false })));
    runGeneration();
  };

  if (isQuotaError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFBFF' }}>
        <View style={styles.quotaContainer}>
          <View style={styles.quotaIconWrap}>
            <LinearGradient colors={['#FEF3C7', '#FDE68A']} style={styles.quotaIconBg}>
              <Zap size={36} color="#F59E0B" strokeWidth={2} />
            </LinearGradient>
          </View>
          <Text style={styles.quotaTitle}>Monthly Limit Reached</Text>
          <Text style={styles.quotaSubtitle}>
            You've used all your free stories this month. Upgrade to Pro for unlimited adventures!
          </Text>
          <TouchableOpacity onPress={() => router.push('/paywall')} activeOpacity={0.9} style={{ width: '100%' }}>
            <LinearGradient
              colors={[...themeColors.gradients.sunset]}
              style={styles.upgradeButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Sparkles size={18} color="#FFFFFF" />
              <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFBFF' }}>
        <ErrorState
          type="general"
          title="Generation Failed"
          message={error}
          onRetry={handleRetry}
          onGoHome={() => router.back()}
          showDetails={false}
        />
      </SafeAreaView>
    );
  }

  if (phase === 'generating') {
    return (
      <SafeAreaView style={[styles.generatingScreen, { backgroundColor: themeColors.background }]}>
        <View style={styles.generatingContent}>
          <ReAnimated.View entering={ZoomIn.springify()} style={styles.orbContainer}>
            <ReAnimated.View style={[styles.orbRing, orbStyle]} />
            <ReAnimated.View style={[styles.pulseWrap, pulseAnimStyle]}>
              <LinearGradient
                colors={[...themeColors.gradients.sunset]}
                style={styles.iconCircle}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Wand2 size={52} color="#FFFFFF" strokeWidth={1.5} />
              </LinearGradient>
            </ReAnimated.View>
          </ReAnimated.View>

          <ReAnimated.Text
            entering={FadeInUp.delay(200).springify()}
            style={styles.genTitle}
          >
            Creating Your Story
          </ReAnimated.Text>
          <ReAnimated.Text
            entering={FadeInUp.delay(280).springify()}
            style={styles.genStatus}
          >
            {status}
          </ReAnimated.Text>

          <ReAnimated.View entering={FadeInUp.delay(340).springify()} style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <LinearGradient
                colors={[...themeColors.gradients.sunset]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${progress}%` }]}
              />
            </View>
            <Text style={styles.progressPct}>{progress}%</Text>
          </ReAnimated.View>

          <ReAnimated.View
            entering={FadeInUp.delay(400).springify()}
            style={[styles.stepsCard, { backgroundColor: themeColors.cardBackground }]}
          >
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <View key={step.id} style={styles.stepRow}>
                  <View style={[
                    styles.stepDot,
                    step.completed
                      ? { backgroundColor: themeColors.success }
                      : { backgroundColor: themeColors.text.light + '20' },
                  ]}>
                    {step.completed
                      ? <Check size={13} color="#FFFFFF" strokeWidth={3} />
                      : <Icon size={13} color={themeColors.text.light} strokeWidth={2} />
                    }
                  </View>
                  <Text style={[
                    styles.stepLabel,
                    { color: step.completed ? themeColors.text.primary : themeColors.text.light },
                  ]}>
                    {step.label}
                  </Text>
                  {step.completed && (
                    <ReAnimated.View entering={ZoomIn.springify()} style={styles.stepCheck}>
                      <Text style={{ fontSize: 12 }}>✓</Text>
                    </ReAnimated.View>
                  )}
                </View>
              );
            })}
          </ReAnimated.View>

          <ReAnimated.View
            entering={FadeInUp.delay(480).springify()}
            style={[styles.funFactCard, { backgroundColor: themeColors.primary + '0C' }]}
          >
            <Text style={[styles.funFact, { color: themeColors.text.secondary }]}>
              {FUN_FACTS[funFactIndex]}
            </Text>
          </ReAnimated.View>

          {longWait && (
            <Text style={[styles.longWaitText, { color: themeColors.text.light }]}>
              Making it extra special — hang tight! ✨
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const selectedThemeObj = THEMES.find(t => t.id === selectedTheme)!;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ReAnimated.View entering={FadeInDown.delay(0).springify()} style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft size={22} color="#1E293B" />
          </TouchableOpacity>
        </ReAnimated.View>

        <ReAnimated.View entering={FadeInDown.delay(60).springify()} style={styles.header}>
          <LinearGradient
            colors={selectedThemeObj.gradient}
            style={styles.headerAccent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <Text style={styles.pageTitle}>Craft Your{'\n'}Story</Text>
          <Text style={styles.pageSubtitle}>Choose your theme, mood, and length</Text>
        </ReAnimated.View>

        <ReAnimated.View entering={FadeInUp.delay(80).springify()} style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionLabel}>Story Theme</Text>
            <View style={[styles.sectionBadge, { backgroundColor: selectedThemeObj.gradient[0] + '18' }]}>
              <Text style={[styles.sectionBadgeText, { color: selectedThemeObj.gradient[0] }]}>
                {selectedThemeObj.emoji} {selectedThemeObj.label}
              </Text>
            </View>
          </View>
          <View style={styles.themeGrid}>
            {THEMES.map((theme, i) => (
              <ReAnimated.View key={theme.id} entering={FadeInUp.delay(100 + i * 30).springify()}>
                <ThemeCard
                  theme={theme}
                  selected={selectedTheme === theme.id}
                  onPress={() => setSelectedTheme(theme.id)}
                />
              </ReAnimated.View>
            ))}
          </View>
        </ReAnimated.View>

        <ReAnimated.View entering={FadeInUp.delay(200).springify()} style={styles.section}>
          <Text style={styles.sectionLabel}>Mood</Text>
          <View style={styles.moodRow}>
            {MOODS.map(mood => (
              <MoodCard
                key={mood.id}
                mood={mood}
                selected={selectedMood === mood.id}
                onPress={() => setSelectedMood(mood.id)}
              />
            ))}
          </View>
        </ReAnimated.View>

        <ReAnimated.View entering={FadeInUp.delay(280).springify()} style={styles.section}>
          <Text style={styles.sectionLabel}>Story Length</Text>
          <View style={styles.lengthRow}>
            {LENGTHS.map(len => (
              <LengthCard
                key={len.id}
                len={len}
                selected={selectedLength === len.id}
                isPro={isPro}
                onPress={() => setSelectedLength(len.id as 'short' | 'medium' | 'long')}
              />
            ))}
          </View>
        </ReAnimated.View>

        <ReAnimated.View entering={FadeInUp.delay(340).springify()} style={styles.ctaSection}>
          {subscription && subscription.plan === 'free' && (
            <View style={styles.quotaRow}>
              <View style={styles.quotaDot} />
              <Text style={styles.quotaText}>
                {subscription.stories_remaining} free {subscription.stories_remaining === 1 ? 'story' : 'stories'} remaining
              </Text>
            </View>
          )}

          <TouchableOpacity onPress={handleStartGeneration} activeOpacity={0.9}>
            <LinearGradient
              colors={selectedThemeObj.gradient}
              style={styles.ctaButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.ctaButtonInner}>
                <Wand2 size={22} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.ctaText}>Create Story</Text>
                <View style={styles.ctaArrow}>
                  <Sparkles size={16} color="rgba(255,255,255,0.8)" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </ReAnimated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAFBFF' },
  scrollContent: { paddingBottom: 48 },

  topBar: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  header: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
    gap: SPACING.sm,
  },
  headerAccent: {
    height: 4,
    width: 48,
    borderRadius: 2,
    marginBottom: SPACING.sm,
  },
  pageTitle: {
    fontSize: 36,
    fontFamily: FONTS.extrabold,
    color: '#0F172A',
    letterSpacing: -1,
    lineHeight: 42,
  },
  pageSubtitle: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    color: '#64748B',
    lineHeight: 22,
  },

  section: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xxl,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.pill,
  },
  sectionBadgeText: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
  },

  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  themeCard: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.sm,
  },
  themeCardSelected: {
    borderColor: 'transparent',
    ...SHADOWS.md,
  },
  themeCardGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  themeCardInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
  },
  themeCardEmoji: { fontSize: 26 },
  themeCardLabel: {
    fontSize: 11,
    fontFamily: FONTS.semibold,
    color: '#475569',
  },
  themeCardLabelSelected: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },

  moodRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  moodCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 2,
    gap: 6,
    ...SHADOWS.xs,
    position: 'relative',
  },
  moodEmoji: { fontSize: 22 },
  moodLabel: { fontSize: 12, fontFamily: FONTS.bold },
  moodDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  lengthRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  lengthCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 2,
    gap: 4,
    position: 'relative',
    ...SHADOWS.xs,
  },
  lengthEmoji: { fontSize: 20 },
  lengthTitle: {
    fontSize: 13,
    fontFamily: FONTS.bold,
  },
  lengthWords: {
    fontSize: 10,
    fontFamily: FONTS.medium,
  },
  proCrown: {
    position: 'absolute',
    top: -8,
    right: -4,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.pill,
  },
  proText: {
    fontSize: 8,
    fontFamily: FONTS.extrabold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  ctaSection: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
    alignItems: 'center',
  },
  quotaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quotaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
  },
  quotaText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: '#94A3B8',
  },
  ctaButton: {
    borderRadius: BORDER_RADIUS.xxl,
    ...SHADOWS.lg,
    overflow: 'hidden',
  },
  ctaButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 48,
    gap: SPACING.sm,
  },
  ctaText: {
    fontSize: 18,
    fontFamily: FONTS.extrabold,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  ctaArrow: {
    marginLeft: 4,
  },

  quotaContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxxl,
    gap: SPACING.lg,
  },
  quotaIconWrap: { marginBottom: SPACING.sm },
  quotaIconBg: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quotaTitle: {
    fontSize: 24,
    fontFamily: FONTS.extrabold,
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  quotaSubtitle: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 23,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 18,
    borderRadius: BORDER_RADIUS.xxl,
    ...SHADOWS.lg,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontFamily: FONTS.extrabold,
    color: '#FFFFFF',
  },
  backLink: { paddingVertical: SPACING.md },
  backLinkText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#94A3B8',
  },

  generatingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generatingContent: {
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
  },
  orbContainer: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xxl,
  },
  orbRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1.5,
    borderColor: 'rgba(99,102,241,0.2)',
    borderStyle: 'dashed',
  },
  pulseWrap: { ...SHADOWS.lg },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genTitle: {
    fontSize: 26,
    fontFamily: FONTS.extrabold,
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: SPACING.sm,
  },
  genStatus: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: SPACING.xxl,
    lineHeight: 21,
  },
  progressWrap: {
    width: '100%',
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },
  progressPct: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
    color: '#94A3B8',
    textAlign: 'center',
  },
  stepsCard: {
    width: '100%',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: { fontSize: 14, fontFamily: FONTS.medium, flex: 1 },
  stepCheck: { marginLeft: 'auto' as any },
  funFactCard: {
    width: '100%',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.md,
  },
  funFact: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    textAlign: 'center',
    lineHeight: 20,
  },
  longWaitText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    textAlign: 'center',
    color: '#94A3B8',
  },
});
