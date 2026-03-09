import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { storyService, quizService } from '@/services/database';
import { Story, QuizQuestionWithAnswers } from '@/types/database';
import { CircleCheck as CheckCircle2, Circle as XCircle, Trophy, Target, Hop as Home, ChevronRight, ArrowLeft, Sparkles, Star } from 'lucide-react-native';
import { CelebrationOverlay } from '@/components/CelebrationOverlay';
import { SPACING, BORDER_RADIUS, SHADOWS, FONTS, FONT_SIZES } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { hapticFeedback } from '@/utils/haptics';

export default function QuizScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { currentTheme } = useTheme();
  const themeColors = currentTheme.colors;
  const [story, setStory] = useState<Story | null>(null);
  const [questions, setQuestions] = useState<QuizQuestionWithAnswers[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const questionFade = useSharedValue(1);
  const questionSlide = useSharedValue(0);
  const scoreScale = useSharedValue(1);

  const questionAnimStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: questionFade.value,
      transform: [{ translateX: questionSlide.value }],
    };
  });

  const scoreAnimStyle = useAnimatedStyle(() => {
    'worklet';
    return { transform: [{ scale: scoreScale.value }] };
  });

  useEffect(() => {
    loadQuiz();
  }, []);

  const loadQuiz = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const storyId = params.storyId as string;
      const storyData = await storyService.getById(storyId);
      const quizData = await quizService.getQuestionsByStoryId(storyId);
      if (!storyData || quizData === null) {
        setLoadError("Oops, the quiz got lost! Let's try another story.");
        return;
      }
      setStory(storyData);
      setQuestions(quizData);
    } catch {
      setLoadError("Oops, the quiz got lost! Let's try another story.");
    } finally {
      setIsLoading(false);
    }
  };

  const animateTransition = useCallback(() => {
    questionFade.value = withSequence(
      withTiming(0, { duration: 200 }),
      withTiming(1, { duration: 300 })
    );
    questionSlide.value = withSequence(
      withTiming(-50, { duration: 200 }),
      withTiming(50, { duration: 0 }),
      withTiming(0, { duration: 300 })
    );
  }, []);

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
        scoreScale.value = withSequence(
          withSpring(1.3, { damping: 8 }),
          withSpring(1, { damping: 10 })
        );
      } else {
        hapticFeedback.error();
      }
    },
    [selectedAnswer, questions, currentQuestionIndex, score]
  );

  const handleNextQuestion = useCallback(async () => {
    hapticFeedback.light();
    if (currentQuestionIndex < questions.length - 1) {
      animateTransition();
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
      }, 200);
    } else {
      const profileId = await AsyncStorage.getItem('profileId');
      if (profileId && story) {
        await quizService.createAttempt(profileId, story.id, score + (isCorrect ? 1 : 0), questions.length);
      }
      setShowCelebration(true);
      setTimeout(() => {
        setShowResult(true);
        setShowCelebration(false);
      }, 2000);
    }
  }, [currentQuestionIndex, questions, story, score, isCorrect, animateTransition]);

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
      <LinearGradient colors={themeColors.backgroundGradient} style={styles.centered}>
        <Sparkles size={48} color={themeColors.primary} strokeWidth={1.5} />
        <Text style={[styles.loadingText, { color: themeColors.text.secondary, fontFamily: FONTS.medium }]}>
          Loading quiz...
        </Text>
      </LinearGradient>
    );
  }

  if (loadError) {
    return (
      <LinearGradient colors={themeColors.backgroundGradient} style={styles.centered}>
        <Text style={[styles.errorTitle, { color: themeColors.text.primary, fontFamily: FONTS.bold }]}>Oops!</Text>
        <Text style={[styles.errorMsg, { color: themeColors.text.secondary, fontFamily: FONTS.medium }]}>
          {loadError}
        </Text>
        <View style={styles.errorActions}>
          <TouchableOpacity
            onPress={loadQuiz}
            style={[styles.retryBtn, { backgroundColor: themeColors.primary }]}
          >
            <Text style={[styles.retryText, { fontFamily: FONTS.semibold }]}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleGoHome}>
            <Text style={[styles.goHomeLink, { color: themeColors.primary, fontFamily: FONTS.semibold }]}>
              Go Home
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  if (!story || questions.length === 0) {
    return (
      <LinearGradient colors={themeColors.backgroundGradient} style={styles.centered}>
        <Text style={[styles.errorTitle, { color: themeColors.text.primary, fontFamily: FONTS.bold }]}>
          No Quiz Available
        </Text>
        <Text style={[styles.errorMsg, { color: themeColors.text.secondary, fontFamily: FONTS.medium }]}>
          There's no quiz for this story yet. Generate a new story to get a quiz!
        </Text>
        <View style={styles.errorActions}>
          {story && (
            <TouchableOpacity
              onPress={() => {
                hapticFeedback.medium();
                router.push({
                  pathname: '/story/generate',
                  params: { profileId: story.profile_id, languageCode: story.language_code },
                });
              }}
              style={[styles.retryBtn, { backgroundColor: themeColors.primary }]}
            >
              <Text style={[styles.retryText, { fontFamily: FONTS.semibold }]}>Generate New Story</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleGoHome}>
            <Text style={[styles.goHomeLink, { color: themeColors.primary, fontFamily: FONTS.semibold }]}>
              Go Home
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  if (showResult) {
    const finalScore = score;
    const percentage = Math.round((finalScore / questions.length) * 100);
    const isPerfect = percentage === 100;
    const isGreat = percentage >= 66 && percentage < 100;

    const getMessage = () => {
      if (isPerfect) return { title: 'Perfect Score!', subtitle: "You're a superstar!" };
      if (isGreat) return { title: 'Great Work!', subtitle: 'Keep it up!' };
      return { title: 'Good Try!', subtitle: 'Practice makes perfect!' };
    };
    const message = getMessage();

    return (
      <LinearGradient colors={themeColors.backgroundGradient} style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultScrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.resultHeader}>
            <LinearGradient
              colors={isPerfect ? themeColors.gradients.sunset : themeColors.gradients.primary}
              style={styles.trophyCircle}
            >
              <Trophy size={64} color="#FFFFFF" strokeWidth={1.8} />
            </LinearGradient>

            <Text style={[styles.resultTitle, { color: themeColors.text.primary, fontFamily: FONTS.extrabold }]}>
              {message.title}
            </Text>
            <Text style={[styles.resultSubtitle, { color: themeColors.text.secondary, fontFamily: FONTS.medium }]}>
              {message.subtitle}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(400).springify()}>
            <View style={[styles.scoreCard, { backgroundColor: themeColors.cardBackground }]}>
              <Text style={[styles.scoreLabel, { color: themeColors.text.light, fontFamily: FONTS.semibold }]}>
                Your Score
              </Text>
              <Text style={[styles.scoreValue, { color: themeColors.text.primary, fontFamily: FONTS.extrabold }]}>
                {finalScore} / {questions.length}
              </Text>
              <LinearGradient
                colors={isPerfect ? themeColors.gradients.success : themeColors.gradients.primary}
                style={styles.percentCircle}
              >
                <Text style={[styles.percentText, { fontFamily: FONTS.bold }]}>{percentage}%</Text>
              </LinearGradient>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.resultActions}>
            <TouchableOpacity onPress={handleFinish} activeOpacity={0.9}>
              <LinearGradient
                colors={themeColors.gradients.sunset}
                style={styles.primaryResultBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Target size={22} color="#FFFFFF" />
                <Text style={[styles.primaryResultText, { fontFamily: FONTS.bold }]}>View Library</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleGoHome}
              style={[styles.secondaryResultBtn, { borderColor: themeColors.primary + '30' }]}
              activeOpacity={0.7}
            >
              <Home size={20} color={themeColors.primary} />
              <Text style={[styles.secondaryResultText, { color: themeColors.primary, fontFamily: FONTS.semibold }]}>
                Go Home
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <LinearGradient colors={themeColors.backgroundGradient} style={styles.container}>
      {showCelebration && <CelebrationOverlay />}

      <View style={styles.quizHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: themeColors.cardBackground }]}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={themeColors.text.primary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.questionCounter, { color: themeColors.text.primary, fontFamily: FONTS.bold }]}>
            {currentQuestionIndex + 1} / {questions.length}
          </Text>
          <View style={[styles.progressBar, { backgroundColor: themeColors.text.light + '20' }]}>
            <LinearGradient
              colors={themeColors.gradients.sunset}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${progress}%` }]}
            />
          </View>
        </View>

        <Animated.View style={[styles.scoreChip, scoreAnimStyle]}>
          <LinearGradient
            colors={themeColors.gradients.primary}
            style={styles.scoreChipGradient}
          >
            <Star size={14} color="#FFFFFF" fill="#FFFFFF" />
            <Text style={[styles.scoreChipText, { fontFamily: FONTS.bold }]}>{score}</Text>
          </LinearGradient>
        </Animated.View>
      </View>

      <ScrollView contentContainerStyle={styles.quizContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={questionAnimStyle}>
          <View style={[styles.questionCard, { backgroundColor: themeColors.cardBackground }]}>
            <Text style={[styles.questionText, { color: themeColors.text.primary, fontFamily: FONTS.semibold }]}>
              {currentQuestion.question_text}
            </Text>
          </View>

          <View style={styles.answersContainer}>
            {currentQuestion.answers.map((answer) => {
              const isSelected = selectedAnswer === answer.answer_order;
              const showCorrect = selectedAnswer !== null && answer.is_correct;
              const showWrong = isSelected && !answer.is_correct;

              let cardBg = themeColors.cardBackground;
              let textColor = themeColors.text.primary;
              let borderColor = 'transparent';
              let showGradient = false;
              let gradientColors = themeColors.gradients.success;

              if (showCorrect) {
                showGradient = true;
                gradientColors = themeColors.gradients.success;
                textColor = '#FFFFFF';
              } else if (showWrong) {
                showGradient = true;
                gradientColors = [themeColors.errorLight, themeColors.error];
                textColor = '#FFFFFF';
              } else if (selectedAnswer === null) {
                borderColor = themeColors.text.light + '20';
              }

              return (
                <Animated.View key={answer.id} entering={FadeInDown.delay(100).springify()}>
                  <TouchableOpacity
                    onPress={() => handleAnswerSelect(answer.answer_order)}
                    disabled={selectedAnswer !== null}
                    activeOpacity={0.7}
                    style={{ opacity: selectedAnswer !== null && !isSelected && !showCorrect ? 0.5 : 1 }}
                  >
                    {showGradient ? (
                      <LinearGradient
                        colors={gradientColors}
                        style={styles.answerCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.answerLetterCircle}>
                          <Text style={[styles.answerLetter, { color: themeColors.primary, fontFamily: FONTS.bold }]}>
                            {answer.answer_order}
                          </Text>
                        </View>
                        <Text
                          style={[styles.answerText, { color: textColor, fontFamily: FONTS.medium }]}
                          numberOfLines={3}
                        >
                          {answer.answer_text}
                        </Text>
                        {showCorrect && <CheckCircle2 size={24} color="#FFFFFF" />}
                        {showWrong && <XCircle size={24} color="#FFFFFF" />}
                      </LinearGradient>
                    ) : (
                      <View style={[styles.answerCard, { backgroundColor: cardBg, borderColor, borderWidth: 1.5 }]}>
                        <LinearGradient colors={themeColors.gradients.primary} style={styles.answerLetterCircle}>
                          <Text style={[styles.answerLetter, { color: '#FFFFFF', fontFamily: FONTS.bold }]}>
                            {answer.answer_order}
                          </Text>
                        </LinearGradient>
                        <Text
                          style={[styles.answerText, { color: textColor, fontFamily: FONTS.medium }]}
                          numberOfLines={3}
                        >
                          {answer.answer_text}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      {selectedAnswer !== null && (
        <Animated.View entering={FadeInUp.springify()} style={[styles.footer, { backgroundColor: themeColors.cardBackground }]}>
          <View style={styles.feedbackRow}>
            {isCorrect ? (
              <Text style={[styles.feedbackText, { color: themeColors.success, fontFamily: FONTS.bold }]}>
                Correct!
              </Text>
            ) : (
              <Text style={[styles.feedbackText, { color: themeColors.error, fontFamily: FONTS.bold }]}>
                Not quite!
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={handleNextQuestion} activeOpacity={0.9}>
            <LinearGradient
              colors={themeColors.gradients.sunset}
              style={styles.nextButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={[styles.nextButtonText, { fontFamily: FONTS.bold }]}>
                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
              </Text>
              <ChevronRight size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    gap: SPACING.lg,
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
  },
  errorTitle: {
    fontSize: FONT_SIZES.xxl,
  },
  errorMsg: {
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorActions: {
    alignItems: 'center',
    gap: SPACING.lg,
    marginTop: SPACING.md,
  },
  retryBtn: {
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.pill,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.md,
  },
  goHomeLink: {
    fontSize: FONT_SIZES.md,
  },
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
    gap: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  headerCenter: {
    flex: 1,
    gap: SPACING.sm,
  },
  questionCounter: {
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreChip: {
    borderRadius: BORDER_RADIUS.pill,
    overflow: 'hidden',
  },
  scoreChipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.pill,
  },
  scoreChipText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.sm,
  },
  quizContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: 140,
  },
  questionCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },
  questionText: {
    fontSize: FONT_SIZES.lg,
    lineHeight: 28,
    textAlign: 'center',
  },
  answersContainer: {
    gap: SPACING.md,
  },
  answerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.sm,
  },
  answerLetterCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerLetter: {
    fontSize: FONT_SIZES.lg,
  },
  answerText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: 40,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    ...SHADOWS.lg,
  },
  feedbackRow: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  feedbackText: {
    fontSize: FONT_SIZES.lg,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.lg,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.lg,
  },
  resultScrollContent: {
    padding: SPACING.xl,
    paddingTop: 80,
    alignItems: 'center',
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
  },
  trophyCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xxl,
    ...SHADOWS.lg,
  },
  resultTitle: {
    fontSize: 32,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  resultSubtitle: {
    fontSize: FONT_SIZES.lg,
    textAlign: 'center',
  },
  scoreCard: {
    width: '100%',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: 'center',
    marginBottom: SPACING.xxl,
    ...SHADOWS.md,
  },
  scoreLabel: {
    fontSize: FONT_SIZES.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  scoreValue: {
    fontSize: 48,
    marginBottom: SPACING.lg,
  },
  percentCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },
  percentText: {
    color: '#FFFFFF',
    fontSize: 28,
  },
  resultActions: {
    width: '100%',
    gap: SPACING.md,
  },
  primaryResultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.lg,
  },
  primaryResultText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.lg,
  },
  secondaryResultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
  },
  secondaryResultText: {
    fontSize: FONT_SIZES.md,
  },
});
