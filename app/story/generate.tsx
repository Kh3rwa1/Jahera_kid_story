import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing as ReEasing,
  FadeInUp,
} from 'react-native-reanimated';
import { profileService, storyService, quizService } from '@/services/database';
import { generateAdventureStory, QuotaExceededError, StoryOptions } from '@/services/aiService';
import { generateAudio } from '@/services/audioService';
import { getCurrentContext } from '@/utils/contextUtils';
import { Sparkles, BookOpen, Volume2, Circle as HelpCircle, Check, Zap } from 'lucide-react-native';
import { Container } from '@/components/Container';
import { ErrorState } from '@/components/ErrorState';
import { SPACING, BORDER_RADIUS, SHADOWS, FONTS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useApp } from '@/contexts/AppContext';
import { hapticFeedback } from '@/utils/haptics';

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
  { id: 'adventure', label: 'Adventure', emoji: '🗺️' },
  { id: 'fantasy', label: 'Fantasy', emoji: '🐉' },
  { id: 'space', label: 'Space', emoji: '🚀' },
  { id: 'animals', label: 'Animals', emoji: '🦁' },
  { id: 'ocean', label: 'Ocean', emoji: '🌊' },
  { id: 'superheroes', label: 'Heroes', emoji: '🦸' },
  { id: 'nature', label: 'Nature', emoji: '🌿' },
  { id: 'science', label: 'Science', emoji: '🔬' },
];

const MOODS = [
  { id: 'exciting', label: 'Exciting', emoji: '⚡' },
  { id: 'funny', label: 'Funny', emoji: '😄' },
  { id: 'calming', label: 'Calming', emoji: '🌙' },
  { id: 'educational', label: 'Learn', emoji: '📚' },
];

const LENGTHS = [
  { id: 'short', label: 'Quick', desc: '~50 words' },
  { id: 'medium', label: 'Medium', desc: '~120 words' },
  { id: 'long', label: 'Long', desc: '~250 words', pro: true },
];

interface GenerationStep {
  id: string;
  label: string;
  icon: typeof BookOpen;
  completed: boolean;
}

type Phase = 'options' | 'generating';

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

  const isPro = subscription?.plan !== 'free';

  useEffect(() => {
    if (phase !== 'generating') return;

    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1200, easing: ReEasing.inOut(ReEasing.ease) }),
        withTiming(1, { duration: 1200, easing: ReEasing.inOut(ReEasing.ease) })
      ),
      -1,
      true
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

  const pulseAnimStyle = useAnimatedStyle(() => {
    'worklet';
    return { transform: [{ scale: pulseScale.value }] };
  });

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
      <Container gradient gradientColors={themeColors.backgroundGradient} centered>
        <View style={styles.quotaContainer}>
          <View style={[styles.quotaIcon, { backgroundColor: themeColors.warning + '15' }]}>
            <Zap size={40} color={themeColors.warning} strokeWidth={1.5} />
          </View>
          <Text style={[styles.quotaTitle, { color: themeColors.text.primary }]}>
            Monthly Limit Reached
          </Text>
          <Text style={[styles.quotaSubtitle, { color: themeColors.text.secondary }]}>
            You have used all your free stories this month. Upgrade to Pro for unlimited stories!
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/paywall')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={themeColors.gradients.sunset}
              style={styles.upgradeButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Sparkles size={18} color="#FFFFFF" />
              <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backLink]}
          >
            <Text style={[styles.backLinkText, { color: themeColors.text.secondary }]}>
              Maybe later
            </Text>
          </TouchableOpacity>
        </View>
      </Container>
    );
  }

  if (error) {
    return (
      <Container gradient gradientColors={themeColors.backgroundGradient} centered>
        <ErrorState
          type="general"
          title="Generation Failed"
          message={error}
          onRetry={handleRetry}
          onGoHome={() => router.back()}
          showDetails={false}
        />
      </Container>
    );
  }

  if (phase === 'options') {
    return (
      <Container gradient gradientColors={themeColors.backgroundGradient}>
        <ScrollView
          contentContainerStyle={styles.optionsScroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.optionsHeader}>
            <Text style={[styles.optionsTitle, { color: themeColors.text.primary }]}>
              Craft Your Story
            </Text>
            <Text style={[styles.optionsSubtitle, { color: themeColors.text.secondary }]}>
              Pick a theme and mood for your adventure
            </Text>
          </View>

          <View style={styles.optionSection}>
            <Text style={[styles.optionLabel, { color: themeColors.text.primary }]}>Story Theme</Text>
            <View style={styles.themeGrid}>
              {THEMES.map(theme => (
                <TouchableOpacity
                  key={theme.id}
                  onPress={() => setSelectedTheme(theme.id)}
                  activeOpacity={0.8}
                >
                  <View style={[
                    styles.themeChip,
                    { backgroundColor: themeColors.cardBackground, borderColor: themeColors.text.light + '30' },
                    selectedTheme === theme.id && { borderColor: themeColors.primary, backgroundColor: themeColors.primary + '12' },
                  ]}>
                    <Text style={styles.themeEmoji}>{theme.emoji}</Text>
                    <Text style={[
                      styles.themeLabel,
                      { color: selectedTheme === theme.id ? themeColors.primary : themeColors.text.secondary },
                    ]}>
                      {theme.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.optionSection}>
            <Text style={[styles.optionLabel, { color: themeColors.text.primary }]}>Mood</Text>
            <View style={styles.moodRow}>
              {MOODS.map(mood => (
                <TouchableOpacity
                  key={mood.id}
                  onPress={() => setSelectedMood(mood.id)}
                  activeOpacity={0.8}
                  style={{ flex: 1 }}
                >
                  <View style={[
                    styles.moodChip,
                    { backgroundColor: themeColors.cardBackground, borderColor: themeColors.text.light + '30' },
                    selectedMood === mood.id && { borderColor: themeColors.primary, backgroundColor: themeColors.primary + '12' },
                  ]}>
                    <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                    <Text style={[
                      styles.moodLabel,
                      { color: selectedMood === mood.id ? themeColors.primary : themeColors.text.secondary },
                    ]}>
                      {mood.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.optionSection}>
            <Text style={[styles.optionLabel, { color: themeColors.text.primary }]}>Story Length</Text>
            <View style={styles.lengthRow}>
              {LENGTHS.map(len => (
                <TouchableOpacity
                  key={len.id}
                  onPress={() => setSelectedLength(len.id as 'short' | 'medium' | 'long')}
                  activeOpacity={0.8}
                  style={{ flex: 1 }}
                >
                  <View style={[
                    styles.lengthChip,
                    { backgroundColor: themeColors.cardBackground, borderColor: themeColors.text.light + '30' },
                    selectedLength === len.id && { borderColor: themeColors.primary, backgroundColor: themeColors.primary + '12' },
                  ]}>
                    <Text style={[
                      styles.lengthLabel,
                      { color: selectedLength === len.id ? themeColors.primary : themeColors.text.primary },
                    ]}>
                      {len.label}
                    </Text>
                    <Text style={[styles.lengthDesc, { color: themeColors.text.light }]}>{len.desc}</Text>
                    {len.pro && !isPro && (
                      <View style={[styles.proBadge, { backgroundColor: themeColors.warning }]}>
                        <Text style={styles.proBadgeText}>PRO</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.generateButtonWrap}>
            <TouchableOpacity onPress={handleStartGeneration} activeOpacity={0.9}>
              <LinearGradient
                colors={themeColors.gradients.sunset}
                style={styles.generateButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Sparkles size={20} color="#FFFFFF" />
                <Text style={styles.generateButtonText}>Create Story</Text>
              </LinearGradient>
            </TouchableOpacity>

            {subscription && subscription.plan === 'free' && (
              <Text style={[styles.quotaHint, { color: themeColors.text.light }]}>
                {subscription.stories_remaining} free {subscription.stories_remaining === 1 ? 'story' : 'stories'} remaining this month
              </Text>
            )}
          </View>
        </ScrollView>
      </Container>
    );
  }

  return (
    <Container gradient gradientColors={themeColors.backgroundGradient} centered>
      <View style={styles.content}>
        <ReAnimated.View style={[styles.iconContainer, pulseAnimStyle]}>
          <LinearGradient colors={themeColors.gradients.sunset} style={styles.iconCircle}>
            <Sparkles size={64} color="#FFFFFF" strokeWidth={1.5} />
          </LinearGradient>
        </ReAnimated.View>

        <Text style={[styles.title, { color: themeColors.text.primary }]}>Creating Your Story</Text>
        <Text style={[styles.statusText, { color: themeColors.text.secondary }]}>{status}</Text>

        <View style={styles.progressBarWrap}>
          <View style={[styles.progressBar, { backgroundColor: themeColors.text.light + '25' }]}>
            <LinearGradient
              colors={themeColors.gradients.sunset}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${progress}%` }]}
            />
          </View>
          <Text style={[styles.progressText, { color: themeColors.text.light }]}>{progress}%</Text>
        </View>

        <View style={[styles.stepsCard, { backgroundColor: themeColors.cardBackground }]}>
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <View key={step.id} style={styles.stepRow}>
                <View style={[styles.stepDot, step.completed && { backgroundColor: themeColors.success }]}>
                  {step.completed ? (
                    <Check size={14} color="#FFFFFF" strokeWidth={3} />
                  ) : (
                    <Icon size={14} color={themeColors.text.light} strokeWidth={2} />
                  )}
                </View>
                <Text style={[styles.stepLabel, { color: step.completed ? themeColors.text.primary : themeColors.text.light }]}>
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={[styles.funFactWrap, { backgroundColor: themeColors.primary + '10' }]}>
          <Text style={[styles.funFact, { color: themeColors.text.secondary }]}>{FUN_FACTS[funFactIndex]}</Text>
        </View>

        {longWait && (
          <Text style={[styles.longWaitText, { color: themeColors.text.light }]}>
            This story is going to be extra special -- hang tight!
          </Text>
        )}
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  optionsScroll: { paddingBottom: 60 },
  optionsHeader: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxxl + SPACING.lg,
    paddingBottom: SPACING.xxl,
    gap: SPACING.sm,
  },
  optionsTitle: { fontSize: 28, fontFamily: FONTS.extrabold, letterSpacing: -0.5 },
  optionsSubtitle: { fontSize: 15, fontFamily: FONTS.medium, lineHeight: 22 },
  optionSection: { paddingHorizontal: SPACING.xl, marginBottom: SPACING.xxl },
  optionLabel: { fontSize: 16, fontFamily: FONTS.bold, marginBottom: SPACING.md },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  themeChip: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.pill, borderWidth: 1.5, ...SHADOWS.xs,
  },
  themeEmoji: { fontSize: 16 },
  themeLabel: { fontSize: 13, fontFamily: FONTS.semibold },
  moodRow: { flexDirection: 'row', gap: SPACING.sm },
  moodChip: {
    alignItems: 'center', paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg, borderWidth: 1.5, gap: 4, ...SHADOWS.xs,
  },
  moodEmoji: { fontSize: 20 },
  moodLabel: { fontSize: 12, fontFamily: FONTS.semibold },
  lengthRow: { flexDirection: 'row', gap: SPACING.sm },
  lengthChip: {
    alignItems: 'center', paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg, borderWidth: 1.5, gap: 2,
    position: 'relative', ...SHADOWS.xs,
  },
  lengthLabel: { fontSize: 14, fontFamily: FONTS.bold },
  lengthDesc: { fontSize: 11, fontFamily: FONTS.regular },
  proBadge: {
    position: 'absolute', top: -8, right: -8,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: BORDER_RADIUS.pill,
  },
  proBadgeText: { fontSize: 9, fontFamily: FONTS.bold, color: '#FFFFFF' },
  generateButtonWrap: {
    paddingHorizontal: SPACING.xl, gap: SPACING.md, alignItems: 'center',
  },
  generateButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.xxxl + SPACING.xl,
    borderRadius: BORDER_RADIUS.pill, ...SHADOWS.lg,
  },
  generateButtonText: { fontSize: 17, fontFamily: FONTS.bold, color: '#FFFFFF' },
  quotaHint: { fontSize: 13, fontFamily: FONTS.medium },
  quotaContainer: { width: '100%', maxWidth: 360, paddingHorizontal: SPACING.xl, alignItems: 'center', gap: SPACING.lg },
  quotaIcon: {
    width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm,
  },
  quotaTitle: { fontSize: 24, fontFamily: FONTS.bold, textAlign: 'center' },
  quotaSubtitle: { fontSize: 15, fontFamily: FONTS.medium, textAlign: 'center', lineHeight: 22 },
  upgradeButton: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingVertical: SPACING.xl, paddingHorizontal: SPACING.xxxl + SPACING.lg,
    borderRadius: BORDER_RADIUS.pill, ...SHADOWS.lg,
  },
  upgradeButtonText: { fontSize: 16, fontFamily: FONTS.bold, color: '#FFFFFF' },
  backLink: { paddingVertical: SPACING.md },
  backLinkText: { fontSize: 14, fontFamily: FONTS.medium },
  content: { width: '100%', maxWidth: 400, paddingHorizontal: SPACING.xl, alignItems: 'center' },
  iconContainer: { marginBottom: SPACING.xxl },
  iconCircle: {
    width: 140, height: 140, borderRadius: 70,
    alignItems: 'center', justifyContent: 'center', ...SHADOWS.lg,
  },
  title: { fontSize: 26, fontFamily: FONTS.bold, textAlign: 'center', marginBottom: SPACING.sm },
  statusText: { fontSize: 15, fontFamily: FONTS.medium, textAlign: 'center', marginBottom: SPACING.xxl },
  progressBarWrap: { width: '100%', marginBottom: SPACING.xxl },
  progressBar: { height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: SPACING.sm },
  progressFill: { height: '100%', borderRadius: 5 },
  progressText: { fontSize: 13, fontFamily: FONTS.semibold, textAlign: 'center' },
  stepsCard: {
    width: '100%', padding: SPACING.lg, borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.md, marginBottom: SPACING.xl, ...SHADOWS.sm,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  stepDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center',
  },
  stepLabel: { fontSize: 14, fontFamily: FONTS.medium },
  funFactWrap: {
    width: '100%', padding: SPACING.lg, borderRadius: BORDER_RADIUS.lg, marginBottom: SPACING.md,
  },
  funFact: { fontSize: 13, fontFamily: FONTS.medium, textAlign: 'center', lineHeight: 20 },
  longWaitText: { fontSize: 13, fontFamily: FONTS.medium, textAlign: 'center' },
});
