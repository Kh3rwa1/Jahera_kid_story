import { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { profileService, storyService, quizService } from '@/services/database';
import { generateAdventureStory } from '@/services/aiService';
import { generateAudio } from '@/services/audioService';
import { getCurrentContext } from '@/utils/contextUtils';
import { ProfileWithRelations } from '@/types/database';
import { Sparkles, BookOpen, Volume2, HelpCircle, Check } from 'lucide-react-native';
import { Container } from '@/components/Container';
import { Typography } from '@/components/Typography';
import { PremiumButton } from '@/components/PremiumButton';
import { PremiumCard } from '@/components/PremiumCard';
import { ErrorState } from '@/components/ErrorState';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { hapticFeedback } from '@/utils/haptics';

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
  const [steps, setSteps] = useState<GenerationStep[]>([
    { id: 'profile', label: 'Loading profile', icon: Sparkles, completed: false },
    { id: 'story', label: 'Creating story', icon: BookOpen, completed: false },
    { id: 'quiz', label: 'Generating quiz', icon: HelpCircle, completed: false },
    { id: 'audio', label: 'Adding narration', icon: Volume2, completed: false },
  ]);

  const [sparkleAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // Sparkle rotation animation
    Animated.loop(
      Animated.timing(sparkleAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    generateStory();
  }, []);

  const completeStep = (stepId: string) => {
    setSteps((prevSteps) =>
      prevSteps.map((step) => (step.id === stepId ? { ...step, completed: true } : step))
    );
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
        setError('Failed to generate story. Please check your API keys in Profile → Manage API Keys and try again.');
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
        setError('Failed to save story to database. Please check your internet connection and try again.');
        return;
      }

      completeStep('quiz');
      setProgress(70);

      for (let i = 0; i < story.quiz.length; i++) {
        const quizQuestion = story.quiz[i];
        const question = await quizService.createQuestion(
          storyRecord.id,
          quizQuestion.question,
          i + 1
        );

        if (question) {
          await quizService.createAnswer(question.id, quizQuestion.options.A, quizQuestion.correct_answer === 'A', 'A');
          await quizService.createAnswer(question.id, quizQuestion.options.B, quizQuestion.correct_answer === 'B', 'B');
          await quizService.createAnswer(question.id, quizQuestion.options.C, quizQuestion.correct_answer === 'C', 'C');
        }
      }

      setStatus('Generating audio narration...');
      setProgress(85);

      try {
        const audioPath = await generateAudio(story.content, languageCode, storyRecord.id);

        if (audioPath) {
          await storyService.update(storyRecord.id, { audio_url: audioPath });
          completeStep('audio');
          setStatus('Story ready with audio narration!');
        } else {
          console.warn('Audio generation failed, continuing without audio');
          setStatus('Story ready (audio narration unavailable)');
        }
      } catch (audioError) {
        console.error('Audio generation error:', audioError);
        setStatus('Story ready (audio narration failed)');
      }

      setProgress(100);
      hapticFeedback.success();

      setTimeout(() => {
        router.replace({
          pathname: '/story/playback',
          params: {
            storyId: storyRecord.id,
          },
        });
      }, 500);
    } catch (error) {
      console.error('Error generating story:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate story';

      if (errorMessage.includes('API key not configured')) {
        setError('Please add your OpenAI API key in Profile → Manage API Keys');
      } else {
        setError(errorMessage);
      }
    }
  };

  const handleRetry = () => {
    setError(null);
    setProgress(0);
    setStatus('Preparing your adventure...');
    generateStory();
  };

  const handleGoBack = () => {
    router.back();
  };

  if (error) {
    return (
      <Container gradient gradientColors={themeColors.backgroundGradient} centered>
        <ErrorState
          type="general"
          title="Generation Failed"
          message={error}
          onRetry={handleRetry}
          onGoHome={handleGoBack}
          showDetails={false}
        />
      </Container>
    );
  }

  const sparkleRotation = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Container gradient gradientColors={themeColors.backgroundGradient} centered>
      <View style={styles.content}>
        {/* Animated Icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ rotate: sparkleRotation }, { scale: pulseAnim }],
            },
          ]}
        >
          <PremiumCard gradient={themeColors.gradients.sunset} style={styles.iconCard} shadow="xl">
            <Sparkles size={80} color={themeColors.text.inverse} strokeWidth={2} />
          </PremiumCard>
        </Animated.View>

        {/* Title and Status */}
        <Typography variant="displayMedium" align="center" style={styles.title}>
          Creating Your Story
        </Typography>
        <Typography variant="bodyLarge" color="secondary" align="center" style={styles.status}>
          {status}
        </Typography>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={themeColors.gradients.sunset}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${progress}%` }]}
            />
          </View>
          <Typography variant="label" align="center" style={styles.progressText}>
            {progress}% Complete
          </Typography>
        </View>

        {/* Step Indicators */}
        <PremiumCard shadow="md" style={styles.stepsCard}>
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <View key={step.id} style={styles.stepItem}>
                <View
                  style={[
                    styles.stepIcon,
                    step.completed && styles.stepIconCompleted,
                  ]}
                >
                  {step.completed ? (
                    <Check size={20} color={themeColors.text.inverse} strokeWidth={3} />
                  ) : (
                    <Icon
                      size={20}
                      color={step.completed ? themeColors.text.inverse : themeColors.text.light}
                      strokeWidth={2}
                    />
                  )}
                </View>
                <Typography
                  variant="bodySmall"
                  color={step.completed ? 'primary' : 'light'}
                  style={[styles.stepLabel, step.completed && styles.stepLabelCompleted]}
                >
                  {step.label}
                </Typography>
              </View>
            );
          })}
        </PremiumCard>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: SPACING.xl,
  },
  iconContainer: {
    alignSelf: 'center',
    marginBottom: SPACING.xxxl,
  },
  iconCard: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginBottom: SPACING.md,
  },
  status: {
    marginBottom: SPACING.xxxl,
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: SPACING.xxl,
  },
  progressBar: {
    height: 12,
    backgroundColor: COLORS.text.light + '30',
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.md,
  },
  progressText: {
    marginTop: SPACING.xs,
  },
  stepsCard: {
    width: '100%',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.md,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.text.light + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconCompleted: {
    backgroundColor: COLORS.success,
    ...SHADOWS.sm,
  },
  stepLabel: {
    flex: 1,
  },
  stepLabelCompleted: {
    textDecorationLine: 'line-through',
  },
});
