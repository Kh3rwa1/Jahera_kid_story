import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
import { generateAdventureStory } from '@/services/aiService';
import { generateAudio } from '@/services/audioService';
import { getCurrentContext } from '@/utils/contextUtils';
import { Sparkles, BookOpen, Volume2, Circle as HelpCircle, Check } from 'lucide-react-native';
import { Container } from '@/components/Container';
import { ErrorState } from '@/components/ErrorState';
import { SPACING, BORDER_RADIUS, SHADOWS, FONTS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
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

interface GenerationStep {
  id: string;
  label: string;
  icon: typeof BookOpen;
  completed: boolean;
}

export default function GenerateStory() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { currentTheme } = useTheme();
  const themeColors = currentTheme.colors;
  const [status, setStatus] = useState('Preparing your adventure...');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
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

    generateStory();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (longWaitRef.current) clearTimeout(longWaitRef.current);
    };
  }, []);

  const pulseAnimStyle = useAnimatedStyle(() => {
    'worklet';
    return { transform: [{ scale: pulseScale.value }] };
  });

  const completeStep = (stepId: string) => {
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, completed: true } : s));
    hapticFeedback.light();
  };

  const generateStory = async () => {
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
      const story = await generateAdventureStory(profile, languageCode, context);

      if (!story) {
        setError('Our story magic needs a little help -- ask a grown-up to check the settings.');
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
        const question = await quizService.createQuestion(storyRecord.id, quizQuestion.question, i + 1);
        if (question) {
          await quizService.createAnswer(question.id, quizQuestion.options.A, quizQuestion.correct_answer === 'A', 'A');
          await quizService.createAnswer(question.id, quizQuestion.options.B, quizQuestion.correct_answer === 'B', 'B');
          await quizService.createAnswer(question.id, quizQuestion.options.C, quizQuestion.correct_answer === 'C', 'C');
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
        const audioPath = await generateAudio(story.content, languageCode, storyRecord.id);
        if (audioPath) {
          await storyService.update(storyRecord.id, { audio_url: audioPath });
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

      setTimeout(() => {
        router.replace({ pathname: '/story/playback', params: { storyId: storyRecord.id } });
      }, 800);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate story';
      if (errorMessage.includes('API key not configured')) {
        setError('Our story magic needs a little help -- ask a grown-up to check the settings.');
      } else {
        setError(errorMessage);
      }
    }
  };

  const handleRetry = () => {
    setError(null);
    setProgress(0);
    setLongWait(false);
    setStatus('Preparing your adventure...');
    setSteps(prev => prev.map(s => ({ ...s, completed: false })));
    generateStory();
  };

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
