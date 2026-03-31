import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';
import { storyService, quizService } from '@/services/database';
import { useApp } from '@/contexts/AppContext';
import { Story, QuizQuestionWithAnswers } from '@/types/database';
import {
  CircleCheck as CheckCircle2,
  Circle as XCircle,
  Trophy,
  BookOpen,
  House as Home,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Star,
  Zap,
  Target,
} from 'lucide-react-native';
import { CelebrationOverlay } from '@/components/CelebrationOverlay';
import { SPACING, BORDER_RADIUS, FONTS, FONT_SIZES } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { hapticFeedback } from '@/utils/haptics';

const { width: SW } = Dimensions.get('window');

const ANSWER_LABELS = ['A', 'B', 'C', 'D'];

export default function QuizScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { currentTheme } = useTheme();
  const { profile, refreshQuizAttempts } = useApp();
  const C = currentTheme.colors;

  const [story, setStory] = useState<Story | null>(null);
  const [questions, setQuestions] = useState<QuizQuestionWithAnswers[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [finalScore, setFinalScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const questionFade = useSharedValue(1);
  const questionSlide = useSharedValue(0);
  const scoreScale = useSharedValue(1);
  const progressWidth = useSharedValue(0);

  const questionAnimStyle = useAnimatedStyle(() => ({
    opacity: questionFade.value,
    transform: [{ translateX: questionSlide.value }],
  }));

  const scoreAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
  }));

  useEffect(() => {
    loadQuiz();
  }, []);

  useEffect(() => {
    if (questions.length > 0) {
      const pct = ((currentQuestionIndex + 1) / questions.length) * 100;
      progressWidth.value = withSpring(pct, { damping: 18, stiffness: 120 });
    }
  }, [currentQuestionIndex, questions.length]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

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
      withTiming(0, { duration: 180 }),
      withTiming(1, { duration: 260 })
    );
    questionSlide.value = withSequence(
      withTiming(-40, { duration: 180 }),
      withTiming(40, { duration: 0 }),
      withSpring(0, { damping: 16, stiffness: 200 })
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
        scoreRef.current += 1;
        setScore(scoreRef.current);
        scoreScale.value = withSequence(
          withSpring(1.4, { damping: 6, stiffness: 500 }),
          withSpring(1, { damping: 12 })
        );
      } else {
        hapticFeedback.error();
      }
    },
    [selectedAnswer, questions, currentQuestionIndex]
  );

  const handleNextQuestion = useCallback(async () => {
    hapticFeedback.light();
    if (currentQuestionIndex < questions.length - 1) {
      animateTransition();
      setTimeout(() => {
        setCurrentQuestionIndex((i) => i + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
      }, 180);
    } else {
      const computed = scoreRef.current;
      setFinalScore(computed);
      if (profile && story) {
        await quizService.createAttempt(profile.id, story.id, computed, questions.length);
        await refreshQuizAttempts();
      }
      setShowCelebration(true);
      setTimeout(() => {
        setShowResult(true);
        setShowCelebration(false);
      }, 2000);
    }
  }, [currentQuestionIndex, questions, story, profile, refreshQuizAttempts, animateTransition]);

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
      <LinearGradient colors={C.backgroundGradient} style={styles.fill}>
        <SafeAreaView style={styles.centeredSafe}>
          <Animated.View entering={ZoomIn.springify()} style={styles.loadingIcon}>
            <LinearGradient colors={C.gradients.primary} style={styles.loadingCircle}>
              <Sparkles size={36} color="#fff" strokeWidth={1.8} />
            </LinearGradient>
          </Animated.View>
          <Text style={[styles.loadingText, { color: C.text.secondary, fontFamily: FONTS.semibold }]}>
            Preparing your quiz...
          </Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (loadError || !story || questions.length === 0) {
    const msg = loadError || 'No quiz available for this story.';
    return (
      <LinearGradient colors={C.backgroundGradient} style={styles.fill}>
        <SafeAreaView style={styles.centeredSafe}>
          <Animated.View entering={FadeInDown.springify()} style={styles.errorCard}>
            <View style={[styles.errorIconWrap, { backgroundColor: C.error + '15' }]}>
              <XCircle size={40} color={C.error} strokeWidth={1.6} />
            </View>
            <Text style={[styles.errorTitle, { color: C.text.primary, fontFamily: FONTS.extrabold }]}>
              {loadError ? 'Oops!' : 'No Quiz Yet'}
            </Text>
            <Text style={[styles.errorMsg, { color: C.text.secondary, fontFamily: FONTS.medium }]}>
              {msg}
            </Text>
            <Pressable onPress={loadError ? loadQuiz : handleGoHome} style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}>
              <LinearGradient colors={C.gradients.primary} style={styles.errorBtn}>
                <Text style={[styles.errorBtnText, { fontFamily: FONTS.bold }]}>
                  {loadError ? 'Try Again' : 'Go Home'}
                </Text>
              </LinearGradient>
            </Pressable>
            <Pressable onPress={handleGoHome}>
              <Text style={[styles.errorLink, { color: C.primary, fontFamily: FONTS.semibold }]}>
                Back to Home
              </Text>
            </Pressable>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (showResult) {
    const percentage = Math.round((finalScore / questions.length) * 100);
    const isPerfect = percentage === 100;
    const isGreat = percentage >= 66 && percentage < 100;

    const getMessage = () => {
      if (isPerfect) return { title: 'Perfect Score!', sub: "You crushed it — flawless!" };
      if (isGreat) return { title: 'Great Work!', sub: "You're on a roll, keep going!" };
      return { title: 'Good Effort!', sub: "Every attempt builds your skills." };
    };
    const { title, sub } = getMessage();
    const resultGradient = isPerfect ? C.gradients.success : isGreat ? C.gradients.primary : C.gradients.secondary;

    const statItems = [
      { label: 'Correct', value: `${finalScore}`, icon: CheckCircle2, color: C.success },
      { label: 'Wrong', value: `${questions.length - finalScore}`, icon: XCircle, color: C.error },
      { label: 'Score', value: `${percentage}%`, icon: Target, color: C.primary },
    ];

    return (
      <LinearGradient colors={C.backgroundGradient} style={styles.fill}>
        <SafeAreaView style={styles.fill} edges={['top', 'bottom']}>
          <ScrollView contentContainerStyle={styles.resultScroll} showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.resultTopSection}>
              <LinearGradient colors={resultGradient} style={styles.resultTrophyRing}>
                <View style={styles.resultTrophyInner}>
                  <Trophy size={52} color="#fff" strokeWidth={1.6} />
                </View>
              </LinearGradient>

              <Animated.Text
                entering={FadeInDown.delay(180).springify()}
                style={[styles.resultTitle, { color: C.text.primary, fontFamily: FONTS.extrabold }]}>
                {title}
              </Animated.Text>
              <Animated.Text
                entering={FadeInDown.delay(240).springify()}
                style={[styles.resultSub, { color: C.text.secondary, fontFamily: FONTS.medium }]}>
                {sub}
              </Animated.Text>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.resultStatsRow}>
              {statItems.map((item, i) => {
                const Icon = item.icon;
                return (
                  <Animated.View key={item.label} entering={ZoomIn.delay(340 + i * 80).springify()}>
                    <View style={[styles.statCard, { backgroundColor: C.cardBackground }]}>
                      <View style={[styles.statIconWrap, { backgroundColor: item.color + '18' }]}>
                        <Icon size={18} color={item.color} strokeWidth={2} />
                      </View>
                      <Text style={[styles.statValue, { color: C.text.primary, fontFamily: FONTS.extrabold }]}>
                        {item.value}
                      </Text>
                      <Text style={[styles.statLabel, { color: C.text.secondary, fontFamily: FONTS.medium }]}>
                        {item.label}
                      </Text>
                    </View>
                  </Animated.View>
                );
              })}
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(520).springify()} style={styles.resultScoreBar}>
              <View style={[styles.scoreBarTrack, { backgroundColor: C.text.light + '22' }]}>
                <LinearGradient
                  colors={resultGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.scoreBarFill, { width: `${percentage}%` }]}
                />
              </View>
              <Text style={[styles.scoreBarLabel, { color: C.text.light, fontFamily: FONTS.semibold }]}>
                {finalScore} of {questions.length} correct
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(620).springify()} style={styles.resultActions}>
              <Pressable onPress={handleFinish} style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}>
                <LinearGradient
                  colors={C.gradients.sunset}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryResultBtn}>
                  <BookOpen size={20} color="#fff" />
                  <Text style={[styles.primaryResultBtnText, { fontFamily: FONTS.bold }]}>View Library</Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                onPress={handleGoHome}
                style={({ pressed }) => [
                  styles.secondaryResultBtn,
                  { borderColor: C.primary + '28', opacity: pressed ? 0.75 : 1 },
                ]}>
                <Home size={18} color={C.primary} />
                <Text style={[styles.secondaryResultBtnText, { color: C.primary, fontFamily: FONTS.semibold }]}>
                  Back to Home
                </Text>
              </Pressable>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <LinearGradient colors={C.backgroundGradient} style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top', 'bottom']}>
        {showCelebration && <CelebrationOverlay />}

        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backBtn,
              { backgroundColor: C.cardBackground, opacity: pressed ? 0.7 : 1 },
            ]}>
            <ArrowLeft size={20} color={C.text.primary} />
          </Pressable>

          <View style={styles.headerCenter}>
            <View style={[styles.progressTrack, { backgroundColor: C.text.light + '22' }]}>
              <Animated.View style={[styles.progressFill, progressStyle]}>
                <LinearGradient
                  colors={C.gradients.sunset}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
              </Animated.View>
            </View>
            <Text style={[styles.progressLabel, { color: C.text.light, fontFamily: FONTS.semibold }]}>
              {currentQuestionIndex + 1} / {questions.length}
            </Text>
          </View>

          <Animated.View style={scoreAnimStyle}>
            <LinearGradient colors={C.gradients.primary} style={styles.scoreChip}>
              <Star size={13} color="#fff" fill="#fff" />
              <Text style={[styles.scoreChipText, { fontFamily: FONTS.extrabold }]}>{score}</Text>
            </LinearGradient>
          </Animated.View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <Animated.View style={questionAnimStyle}>
            <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.questionSection}>
              <View style={[styles.questionBadge, { backgroundColor: C.primary + '14' }]}>
                <Zap size={13} color={C.primary} fill={C.primary} />
                <Text style={[styles.questionBadgeText, { color: C.primary, fontFamily: FONTS.bold }]}>
                  Question {currentQuestionIndex + 1}
                </Text>
              </View>
              <Text style={[styles.questionText, { color: C.text.primary, fontFamily: FONTS.bold }]}>
                {currentQuestion.question_text}
              </Text>
            </Animated.View>

            <View style={styles.answersGrid}>
              {currentQuestion.answers.map((answer, idx) => {
                const isSelected = selectedAnswer === answer.answer_order;
                const showCorrect = selectedAnswer !== null && answer.is_correct;
                const showWrong = isSelected && !answer.is_correct;
                const isDisabledFaded =
                  selectedAnswer !== null && !isSelected && !answer.is_correct;
                const label = ANSWER_LABELS[idx] ?? answer.answer_order;

                return (
                  <Animated.View
                    key={answer.id}
                    entering={FadeInDown.delay(120 + idx * 70).springify()}
                    style={{ opacity: isDisabledFaded ? 0.38 : 1 }}>
                    <Pressable
                      onPress={() => handleAnswerSelect(answer.answer_order)}
                      disabled={selectedAnswer !== null}
                      style={({ pressed }) => [{ transform: [{ scale: pressed && !selectedAnswer ? 0.975 : 1 }] }]}>
                      {showCorrect ? (
                        <LinearGradient
                          colors={C.gradients.success}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.answerCard}>
                          <View style={styles.answerLabelCorrect}>
                            <CheckCircle2 size={18} color="#fff" strokeWidth={2.5} />
                          </View>
                          <Text style={[styles.answerText, { color: '#fff', fontFamily: FONTS.semibold }]}
                            numberOfLines={3}>
                            {answer.answer_text}
                          </Text>
                        </LinearGradient>
                      ) : showWrong ? (
                        <LinearGradient
                          colors={[C.errorLight, C.error]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.answerCard}>
                          <View style={styles.answerLabelWrong}>
                            <XCircle size={18} color="#fff" strokeWidth={2.5} />
                          </View>
                          <Text style={[styles.answerText, { color: '#fff', fontFamily: FONTS.semibold }]}
                            numberOfLines={3}>
                            {answer.answer_text}
                          </Text>
                        </LinearGradient>
                      ) : (
                        <View style={[
                          styles.answerCard,
                          styles.answerCardDefault,
                          {
                            backgroundColor: C.cardBackground,
                            borderColor: selectedAnswer === null ? C.text.light + '30' : C.text.light + '18',
                          },
                        ]}>
                          <LinearGradient colors={C.gradients.primary} style={styles.answerLabelBadge}>
                            <Text style={[styles.answerLabelText, { fontFamily: FONTS.extrabold }]}>
                              {label}
                            </Text>
                          </LinearGradient>
                          <Text style={[styles.answerText, { color: C.text.primary, fontFamily: FONTS.medium }]}
                            numberOfLines={3}>
                            {answer.answer_text}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>
        </ScrollView>

        {selectedAnswer !== null && (
          <Animated.View
            entering={FadeInUp.springify()}
            style={[styles.bottomSheet, { backgroundColor: C.cardBackground }]}>
            <View style={styles.feedbackRow}>
              {isCorrect ? (
                <>
                  <View style={[styles.feedbackDot, { backgroundColor: C.success }]} />
                  <Text style={[styles.feedbackText, { color: C.success, fontFamily: FONTS.extrabold }]}>
                    Correct!
                  </Text>
                  <Text style={[styles.feedbackSub, { color: C.text.secondary, fontFamily: FONTS.medium }]}>
                    Excellent answer
                  </Text>
                </>
              ) : (
                <>
                  <View style={[styles.feedbackDot, { backgroundColor: C.error }]} />
                  <Text style={[styles.feedbackText, { color: C.error, fontFamily: FONTS.extrabold }]}>
                    Not quite
                  </Text>
                  <Text style={[styles.feedbackSub, { color: C.text.secondary, fontFamily: FONTS.medium }]}>
                    Keep trying!
                  </Text>
                </>
              )}
            </View>

            <Pressable onPress={handleNextQuestion} style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}>
              <LinearGradient
                colors={C.gradients.sunset}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.nextBtn}>
                <Text style={[styles.nextBtnText, { fontFamily: FONTS.bold }]}>
                  {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
                </Text>
                <ChevronRight size={20} color="#fff" />
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },

  centeredSafe: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    gap: SPACING.lg,
  },

  loadingIcon: { marginBottom: SPACING.sm },
  loadingCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    letterSpacing: 0.2,
  },

  errorCard: {
    alignItems: 'center',
    gap: SPACING.lg,
    padding: SPACING.xxl,
    width: '100%',
    maxWidth: 360,
  },
  errorIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  errorTitle: {
    fontSize: FONT_SIZES.xxl,
    textAlign: 'center',
  },
  errorMsg: {
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorBtn: {
    paddingHorizontal: SPACING.xxl + 8,
    paddingVertical: SPACING.md + 2,
    borderRadius: BORDER_RADIUS.pill,
    marginTop: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  errorBtnText: {
    color: '#fff',
    fontSize: FONT_SIZES.md,
  },
  errorLink: {
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    gap: SPACING.md,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerCenter: {
    flex: 1,
    gap: 6,
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressLabel: {
    fontSize: 11,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  scoreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.pill,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreChipText: {
    color: '#fff',
    fontSize: FONT_SIZES.md,
  },

  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: 180,
    gap: SPACING.lg,
  },

  questionSection: {
    gap: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  questionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.pill,
  },
  questionBadgeText: {
    fontSize: 12,
    letterSpacing: 0.3,
  },
  questionText: {
    fontSize: 22,
    lineHeight: 32,
    letterSpacing: -0.2,
  },

  answersGrid: {
    gap: SPACING.md,
  },
  answerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  answerCardDefault: {
    borderWidth: 1.5,
  },
  answerLabelBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  answerLabelText: {
    color: '#fff',
    fontSize: FONT_SIZES.md,
  },
  answerLabelCorrect: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    flexShrink: 0,
  },
  answerLabelWrong: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    flexShrink: 0,
  },
  answerText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    lineHeight: 22,
  },

  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 16,
    gap: SPACING.lg,
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  feedbackDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  feedbackText: {
    fontSize: FONT_SIZES.lg,
  },
  feedbackSub: {
    fontSize: FONT_SIZES.sm,
    marginLeft: 2,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 18,
    borderRadius: BORDER_RADIUS.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
  nextBtnText: {
    color: '#fff',
    fontSize: FONT_SIZES.lg,
    letterSpacing: 0.1,
  },

  resultScroll: {
    padding: SPACING.xl,
    paddingTop: SPACING.xxl,
    gap: SPACING.xl,
    alignItems: 'center',
  },
  resultTopSection: {
    alignItems: 'center',
    gap: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  resultTrophyRing: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 14,
    marginBottom: SPACING.sm,
  },
  resultTrophyInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  resultTitle: {
    fontSize: 34,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  resultSub: {
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    lineHeight: 24,
  },

  resultStatsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
    justifyContent: 'center',
  },
  statCard: {
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    minWidth: (SW - SPACING.xl * 2 - SPACING.md * 2) / 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
  },
  statLabel: {
    fontSize: 11,
    letterSpacing: 0.3,
  },

  resultScoreBar: {
    width: '100%',
    gap: SPACING.sm,
  },
  scoreBarTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  scoreBarLabel: {
    fontSize: 12,
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  resultActions: {
    width: '100%',
    gap: SPACING.md,
    marginTop: SPACING.sm,
    paddingBottom: SPACING.xxxl,
  },
  primaryResultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 18,
    borderRadius: BORDER_RADIUS.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 8,
  },
  primaryResultBtnText: {
    color: '#fff',
    fontSize: FONT_SIZES.lg,
  },
  secondaryResultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 16,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
  },
  secondaryResultBtnText: {
    fontSize: FONT_SIZES.md,
  },
});
