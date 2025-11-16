import { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Animated,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { storyService, quizService } from '@/services/database';
import { Story, QuizQuestionWithAnswers } from '@/types/database';
import { CheckCircle2, XCircle, Trophy, Target, Home, ChevronRight } from 'lucide-react-native';
import { Container } from '@/components/Container';
import { Typography } from '@/components/Typography';
import { PremiumButton } from '@/components/PremiumButton';
import { PremiumCard } from '@/components/PremiumCard';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { ErrorState } from '@/components/ErrorState';
import { CelebrationOverlay } from '@/components/CelebrationOverlay';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT_SIZES } from '@/constants/theme';
import { hapticFeedback } from '@/utils/haptics';
import { useFadeIn, useSlideInUp } from '@/utils/animations';

export default function QuizScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [story, setStory] = useState<Story | null>(null);
  const [questions, setQuestions] = useState<QuizQuestionWithAnswers[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [questionFadeAnim] = useState(new Animated.Value(1));
  const [questionSlideAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadQuiz();
  }, []);

  const loadQuiz = async () => {
    try {
      const storyId = params.storyId as string;
      const storyData = await storyService.getById(storyId);
      const quizData = await quizService.getQuestionsByStoryId(storyId);

      if (!storyData || !quizData) {
        router.back();
        return;
      }

      setStory(storyData);
      setQuestions(quizData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading quiz:', error);
      router.back();
    }
  };

  const animateQuestionTransition = useCallback(() => {
    // Fade out and slide left
    Animated.parallel([
      Animated.timing(questionFadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(questionSlideAnim, {
        toValue: -50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Reset position and fade in
      questionSlideAnim.setValue(50);
      Animated.parallel([
        Animated.timing(questionFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(questionSlideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [questionFadeAnim, questionSlideAnim]);

  const handleAnswerSelect = useCallback(
    (answerOrder: string) => {
      if (selectedAnswer !== null) return;

      const currentQuestion = questions[currentQuestionIndex];
      const correctAnswer = currentQuestion.answers.find((a) => a.is_correct);

      setSelectedAnswer(answerOrder);
      const correct = answerOrder === correctAnswer?.answer_order;
      setIsCorrect(correct);

      if (correct) {
        hapticFeedback.success();
        setScore(score + 1);
      } else {
        hapticFeedback.error();
      }
    },
    [selectedAnswer, questions, currentQuestionIndex, score]
  );

  const handleNextQuestion = useCallback(async () => {
    hapticFeedback.light();

    if (currentQuestionIndex < questions.length - 1) {
      animateQuestionTransition();
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
      }, 200);
    } else {
      const profileId = await AsyncStorage.getItem('profileId');
      if (profileId && story) {
        await quizService.createAttempt(profileId, story.id, score + (isCorrect ? 0 : 0), questions.length);
      }
      setShowCelebration(true);
      setTimeout(() => {
        setShowResult(true);
        setShowCelebration(false);
      }, 2000);
    }
  }, [currentQuestionIndex, questions, story, score, isCorrect, animateQuestionTransition]);

  const handleFinish = useCallback(() => {
    hapticFeedback.medium();
    router.push('/(tabs)/history');
  }, [router]);

  const handleGoHome = useCallback(() => {
    hapticFeedback.medium();
    router.replace('/(tabs)');
  }, [router]);

  if (isLoading) {
    return (
      <Container gradient gradientColors={COLORS.backgroundGradient} centered>
        <LoadingSkeleton type="card" count={2} />
      </Container>
    );
  }

  if (!story || questions.length === 0) {
    return (
      <Container gradient gradientColors={COLORS.backgroundGradient}>
        <ErrorState
          type="notFound"
          title="No Quiz Available"
          message="There's no quiz for this story yet. Try another story!"
          onGoHome={handleGoHome}
        />
      </Container>
    );
  }

  if (showResult) {
    const percentage = Math.round((score / questions.length) * 100);
    const isPerfect = percentage === 100;
    const isGreat = percentage >= 66 && percentage < 100;

    const getMessage = () => {
      if (isPerfect) return { title: 'Perfect Score!', subtitle: "You're a superstar!" };
      if (isGreat) return { title: 'Great Work!', subtitle: 'Keep it up!' };
      return { title: 'Good Try!', subtitle: 'Practice makes perfect!' };
    };

    const message = getMessage();

    return (
      <Container scroll gradient gradientColors={COLORS.backgroundGradient}>
        <View style={styles.resultContainer}>
          {/* Trophy Icon */}
          <View style={styles.resultHeader}>
            <PremiumCard
              gradient={isPerfect ? COLORS.gradients.sunset : COLORS.gradients.primary}
              style={styles.trophyContainer}
              shadow="xl"
            >
              <Trophy size={80} color={COLORS.text.inverse} strokeWidth={2} />
            </PremiumCard>

            <Typography variant="displayMedium" align="center" style={styles.resultTitle}>
              {message.title}
            </Typography>
            <Typography variant="bodyLarge" color="secondary" align="center">
              You completed the quiz!
            </Typography>
          </View>

          {/* Score Card */}
          <PremiumCard shadow="lg" style={styles.scoreCard}>
            <Typography variant="label" color="secondary" align="center">
              Your Score
            </Typography>
            <Typography variant="displayLarge" align="center" style={styles.scoreValue}>
              {score} / {questions.length}
            </Typography>

            {/* Percentage Circle */}
            <LinearGradient
              colors={isPerfect ? COLORS.gradients.success : COLORS.gradients.primary}
              style={styles.percentageCircle}
            >
              <Typography variant="displayMedium" color="inverse">
                {percentage}%
              </Typography>
            </LinearGradient>
          </PremiumCard>

          {/* Encouragement */}
          <PremiumCard
            gradient={COLORS.cardGradient}
            style={styles.encouragementCard}
            shadow="md"
          >
            <Typography variant="h2" align="center" color="primary">
              {message.title}
            </Typography>
            <Typography variant="bodyMedium" color="secondary" align="center" style={{ marginTop: SPACING.sm }}>
              {message.subtitle}
            </Typography>
          </PremiumCard>

          {/* Action Buttons */}
          <View style={styles.resultActions}>
            <PremiumButton
              title="View Library"
              onPress={handleFinish}
              variant="primary"
              size="large"
              gradient={COLORS.gradients.sunset}
              fullWidth
              icon={<Target size={24} color={COLORS.text.inverse} />}
            />
            <PremiumButton
              title="Go Home"
              onPress={handleGoHome}
              variant="outline"
              size="medium"
              fullWidth
              icon={<Home size={20} color={COLORS.primary} />}
            />
          </View>
        </View>
      </Container>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <Container gradient gradientColors={COLORS.backgroundGradient} safeArea padding={false}>
      {showCelebration && <CelebrationOverlay />}

      {/* Progress Header */}
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <Typography variant="h4" color="primary" align="center">
            Question {currentQuestionIndex + 1} of {questions.length}
          </Typography>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={COLORS.gradients.sunset}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${progress}%` }]}
              />
            </View>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.quizContainer} showsVerticalScrollIndicator={false}>
        {/* Story Title Card */}
        <PremiumCard gradient={COLORS.cardGradient} shadow="md" style={styles.storyPreview}>
          <Typography variant="h4" align="center">
            {story.title}
          </Typography>
        </PremiumCard>

        {/* Question Card with Animation */}
        <Animated.View
          style={[
            styles.questionCardContainer,
            {
              opacity: questionFadeAnim,
              transform: [{ translateX: questionSlideAnim }],
            },
          ]}
        >
          <PremiumCard shadow="lg" style={styles.questionCard}>
            <Typography variant="h3" align="center" style={styles.questionText}>
              {currentQuestion.question_text}
            </Typography>

            {/* Answer Options */}
            <View style={styles.answersContainer}>
              {currentQuestion.answers.map((answer, index) => {
                const isSelected = selectedAnswer === answer.answer_order;
                const showCorrect = selectedAnswer !== null && answer.is_correct;
                const showWrong = isSelected && !answer.is_correct;

                const getAnswerGradient = () => {
                  if (showCorrect) return COLORS.gradients.success;
                  if (showWrong) return [COLORS.errorLight, COLORS.error];
                  if (isSelected) return COLORS.gradients.primary;
                  return undefined;
                };

                return (
                  <Pressable
                    key={answer.id}
                    onPress={() => handleAnswerSelect(answer.answer_order)}
                    disabled={selectedAnswer !== null}
                    style={({ pressed }) => [
                      styles.answerButton,
                      pressed && styles.answerButtonPressed,
                    ]}
                    accessibilityLabel={`Answer ${answer.answer_order}: ${answer.answer_text}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected, disabled: selectedAnswer !== null }}
                  >
                    <PremiumCard
                      gradient={getAnswerGradient()}
                      shadow={isSelected || showCorrect ? 'md' : 'sm'}
                      style={[
                        styles.answerContent,
                        !getAnswerGradient() && styles.answerContentDefault,
                      ]}
                    >
                      <View style={styles.answerLetter}>
                        <LinearGradient
                          colors={
                            showCorrect
                              ? COLORS.gradients.success
                              : showWrong
                              ? [COLORS.error, COLORS.errorLight]
                              : COLORS.gradients.primary
                          }
                          style={styles.answerLetterGradient}
                        >
                          <Typography variant="h3" color="inverse">
                            {answer.answer_order}
                          </Typography>
                        </LinearGradient>
                      </View>

                      <Typography
                        variant="bodyLarge"
                        style={styles.answerText}
                        color={showCorrect || showWrong || isSelected ? 'inverse' : 'primary'}
                      >
                        {answer.answer_text}
                      </Typography>

                      {showCorrect && <CheckCircle2 size={28} color={COLORS.text.inverse} />}
                      {showWrong && <XCircle size={28} color={COLORS.text.inverse} />}
                    </PremiumCard>
                  </Pressable>
                );
              })}
            </View>
          </PremiumCard>
        </Animated.View>
      </ScrollView>

      {/* Next Button Footer */}
      {selectedAnswer !== null && (
        <View style={styles.footer}>
          <PremiumButton
            title={currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
            onPress={handleNextQuestion}
            variant="primary"
            size="large"
            fullWidth
            gradient={COLORS.gradients.sunset}
            icon={<ChevronRight size={24} color={COLORS.text.inverse} />}
            accessibilityLabel={
              currentQuestionIndex < questions.length - 1
                ? 'Continue to next question'
                : 'View quiz results'
            }
          />
        </View>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  // Header
  header: {
    paddingTop: SPACING.xxxl + 20,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.cardBackground,
    ...SHADOWS.sm,
  },
  progressContainer: {
    gap: SPACING.md,
  },
  progressBarContainer: {
    marginTop: SPACING.sm,
  },
  progressBar: {
    height: 10,
    backgroundColor: COLORS.primaryLight + '40',
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.sm,
  },

  // Quiz Content
  quizContainer: {
    padding: SPACING.xl,
    paddingBottom: 120,
  },
  storyPreview: {
    marginBottom: SPACING.xxl,
    borderRadius: BORDER_RADIUS.xl,
  },
  questionCardContainer: {
    width: '100%',
  },
  questionCard: {
    padding: SPACING.xxl,
    borderRadius: BORDER_RADIUS.xl,
  },
  questionText: {
    marginBottom: SPACING.xxxl,
  },
  answersContainer: {
    gap: SPACING.lg,
  },
  answerButton: {
    marginBottom: SPACING.xs,
  },
  answerButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  answerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  answerContentDefault: {
    backgroundColor: COLORS.cardBackground,
  },
  answerLetter: {
    width: 52,
    height: 52,
  },
  answerLetterGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  answerText: {
    flex: 1,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    ...SHADOWS.lg,
  },

  // Results Screen
  resultContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  resultHeader: {
    alignItems: 'center',
    marginTop: SPACING.xxxl,
    marginBottom: SPACING.xxxl,
  },
  trophyContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xxl,
  },
  resultTitle: {
    marginBottom: SPACING.md,
  },
  scoreCard: {
    padding: SPACING.xxxl,
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
    borderRadius: BORDER_RADIUS.xl,
  },
  scoreValue: {
    marginVertical: SPACING.lg,
  },
  percentageCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    ...SHADOWS.colored,
  },
  encouragementCard: {
    width: '100%',
    padding: SPACING.xxl,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.xxxl,
  },
  resultActions: {
    width: '100%',
    gap: SPACING.md,
  },
});
