import { CelebrationOverlay } from '@/components/CelebrationOverlay';
import { MeshBackground } from '@/components/MeshBackground';
import { BORDER_RADIUS,BREAKPOINTS,FONTS,LAYOUT,SHADOWS,SPACING } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { generateAudio } from '@/services/audioService';
import { quizService,storyService } from '@/services/database';
import { QuizQuestionWithAnswers,Story } from '@/types/database';
import { hapticFeedback } from '@/utils/haptics';
import { talkative } from '@/utils/talkative';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams,useRouter } from 'expo-router';
import {
ArrowLeft,
BookOpen,
CircleCheck as CheckCircle2,
House as Home,
Loader2,
Star,
Volume2,
Circle as XCircle,
Zap,
} from 'lucide-react-native';
import { useCallback,useEffect,useMemo,useRef,useState } from 'react';
import {
Pressable,
StyleSheet,
Text,
useWindowDimensions,
View,
} from 'react-native';
import Animated,{
Easing,
FadeInDown,
FadeInUp,
useAnimatedStyle,
useSharedValue,
withDelay,
withRepeat,
withSequence,
withSpring,
withTiming,
ZoomIn,
} from 'react-native-reanimated';
import { SafeAreaView,useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Animated bounce star ───────────────────────────────────────────────
function BounceStar({ delay = 0, color }: { delay?: number; color: string }) {
  const y = useSharedValue(0);
  const opacity = useSharedValue(0.7);
  useEffect(() => {
    y.value = withDelay(delay, withRepeat(withTiming(-10, { duration: 1200, easing: Easing.inOut(Easing.sin) }), -1, true));
    opacity.value = withDelay(delay, withRepeat(withTiming(1, { duration: 1200 }), -1, true));
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }], opacity: opacity.value }));
  return <Animated.Text style={[{ fontSize: 18, color, position: 'absolute' }, style]}>⭐</Animated.Text>;
}

// ─── Score pulse ring ───────────────────────────────────────────────────
function PulseRing({ color }: { color: string }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);
  useEffect(() => {
    scale.value = withRepeat(withTiming(1.8, { duration: 1400, easing: Easing.out(Easing.quad) }), -1, false);
    opacity.value = withRepeat(withTiming(0, { duration: 1400 }), -1, false);
  }, []);
  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 2, borderColor: color,
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  return <Animated.View style={style} />;
}

export default function QuizScreen() {
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { currentTheme } = useTheme();
  const C = currentTheme.colors;
  const { profile, refreshQuizAttempts } = useApp();
  const isTablet = winWidth >= BREAKPOINTS.tablet;
  const styles = useStyles(C, winWidth, winHeight, isTablet, insets);

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

  // Audio
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animations
  const questionFade = useSharedValue(1);
  const questionSlide = useSharedValue(0);
  const scoreScale = useSharedValue(1);
  const progressWidth = useSharedValue(0);
  const feedbackSlide = useSharedValue(120);
  const cardScale = useSharedValue(1);

  const questionAnimStyle = useAnimatedStyle(() => ({
    opacity: questionFade.value,
    transform: [{ translateX: questionSlide.value }],
  }));
  const scoreAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: scoreScale.value }] }));
  const progressStyle = useAnimatedStyle(() => ({ width: `${progressWidth.value}%` as any }));
  const feedbackStyle = useAnimatedStyle(() => ({ transform: [{ translateY: feedbackSlide.value }] }));

  useEffect(() => {
    loadQuiz();
    return () => { sound?.unloadAsync().catch(() => {}); };
  }, []);

  // Auto-play question
  useEffect(() => {
    if (questions.length > 0 && !showResult && !isLoading) {
      const q = questions[currentQuestionIndex];
      const timer = setTimeout(() => {
        speak(q.question_text, `q_${currentQuestionIndex}`);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentQuestionIndex, questions.length, showResult, isLoading]);

  // Auto-play result
  useEffect(() => {
    if (showResult && questions.length > 0) {
      const pct = Math.round((finalScore / questions.length) * 100);
      const isPerfect = pct === 100;
      const isGreat = pct >= 66;
      let msg = 'Good Effort! Keep practicing!';
      if (isPerfect) {
        msg = 'Perfect Score! You are a genius!';
      } else if (isGreat) {
        msg = "Great Work! You're a superstar!";
      }
      const timer = setTimeout(() => talkative.speak(msg, story?.language_code || 'en'), 1000);
      return () => clearTimeout(timer);
    }
  }, [showResult]);

  // Progress bar
  useEffect(() => {
    if (questions.length > 0) {
      const pct = ((currentQuestionIndex + 1) / questions.length) * 100;
      progressWidth.value = withSpring(pct, { damping: 18, stiffness: 120 });
    }
  }, [currentQuestionIndex, questions.length]);

  const speak = async (text: string, id: string) => {
    try {
      if (playingId === id && sound) {
        await sound.stopAsync();
        setPlayingId(null);
        return;
      }
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }
      setPlayingId(id);
      setIsAudioLoading(true);
      const url = await generateAudio(text, story?.language_code || 'en', undefined, true);
      if (!url) { setIsAudioLoading(false); setPlayingId(null); return; }
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
      setSound(newSound);
      setIsAudioLoading(false);
      newSound.setOnPlaybackStatusUpdate((s) => {
        if (s.isLoaded && s.didJustFinish) setPlayingId(null);
      });
    } catch {
      setIsAudioLoading(false);
      setPlayingId(null);
    }
  };

  const loadQuiz = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const storyId = params.storyId as string;
      const [storyData, quizData] = await Promise.all([
        storyService.getById(storyId),
        quizService.getQuestionsByStoryId(storyId),
      ]);
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
    questionFade.value = withSequence(withTiming(0, { duration: 160 }), withTiming(1, { duration: 240 }));
    questionSlide.value = withSequence(
      withTiming(-50, { duration: 160 }),
      withTiming(50, { duration: 0 }),
      withSpring(0, { damping: 16, stiffness: 200 })
    );
  }, []);

  const handleNextQuestion = useCallback(async () => {
    if (autoAdvanceTimerRef.current) { clearTimeout(autoAdvanceTimerRef.current); autoAdvanceTimerRef.current = null; }
    hapticFeedback.light();
    // Hide feedback sheet
    feedbackSlide.value = withTiming(120, { duration: 200 });

    if (currentQuestionIndex < questions.length - 1) {
      animateTransition();
      setTimeout(() => {
        setCurrentQuestionIndex(i => i + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
      }, 160);
    } else {
      const computed = scoreRef.current;
      setFinalScore(computed);
      if (profile && story) {
        await quizService.createAttempt(profile.id, story.id, computed, questions.length);
        await refreshQuizAttempts();
      }
      setShowCelebration(true);
      // Show result screen immediately — confetti fires at the same tick
      setShowResult(true);
    }
  }, [currentQuestionIndex, questions, story, profile, refreshQuizAttempts, animateTransition]);

  const handleAnswerSelect = useCallback((answerOrder: string) => {
    if (selectedAnswer !== null) return;
    const correctAnswer = questions[currentQuestionIndex].answers.find(a => a.is_correct);
    setSelectedAnswer(answerOrder);
    const correct = answerOrder === correctAnswer?.answer_order;
    setIsCorrect(correct);
    const username = profile?.kid_name || 'my friend';
    talkative.speak(correct ? talkative.reactions.correct(username) : talkative.reactions.incorrect(username), story?.language_code || 'en');
    if (correct) {
      hapticFeedback.success();
      scoreRef.current += 1;
      setScore(scoreRef.current);
      scoreScale.value = withSequence(withSpring(1.6, { damping: 4, stiffness: 700 }), withSpring(1, { damping: 12 }));
    } else {
      hapticFeedback.error();
      // Shake animation for incorrect answer
      cardScale.value = withSequence(
        withTiming(1.02, { duration: 50 }),
        withTiming(0.98, { duration: 80 }),
        withTiming(1.01, { duration: 60 }),
        withTiming(0.99, { duration: 60 }),
        withSpring(1, { damping: 12 }),
      );
    }
    // Slide up feedback
    feedbackSlide.value = withSpring(0, { damping: 18, stiffness: 300 });
    // Auto-advance: immediate on last question, 2200ms otherwise
    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    autoAdvanceTimerRef.current = setTimeout(handleNextQuestion, isLastQuestion ? 0 : 2200);
  }, [selectedAnswer, questions, currentQuestionIndex, handleNextQuestion]);

  // ─── Loading ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <LinearGradient colors={C.backgroundGradient} style={styles.fill}>
        <SafeAreaView style={styles.centeredSafe}>
          <Animated.View entering={ZoomIn.springify()} style={styles.loadingCircle}>
            <LinearGradient colors={C.gradients.primary} style={StyleSheet.absoluteFill} />
            <Star size={40} color="#fff" strokeWidth={1.8} fill="#fff" />
          </Animated.View>
          <Animated.Text entering={FadeInDown.delay(300).springify()} style={[styles.loadingEmoji]}>🧠</Animated.Text>
          <Text style={[styles.loadingText, { color: C.text.secondary, fontFamily: FONTS.display }]}>
            Getting your quiz ready...
          </Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ─── Error ───────────────────────────────────────────────────────────
  if (loadError || !story || questions.length === 0) {
    const msg = loadError || 'No quiz available for this story.';
    return (
      <LinearGradient colors={C.backgroundGradient} style={styles.fill}>
        <SafeAreaView style={styles.centeredSafe}>
          <Animated.View entering={FadeInDown.springify()} style={styles.errorCard}>
            <Text style={styles.errorEmoji}>😮</Text>
            <Text style={[styles.errorTitle, { color: C.text.primary, fontFamily: FONTS.display }]}>
              {loadError ? 'Oops!' : 'No Quiz Yet'}
            </Text>
            <Text style={[styles.errorMsg, { color: C.text.secondary, fontFamily: FONTS.medium }]}>{msg}</Text>
            <Pressable onPress={loadError ? loadQuiz : () => router.replace('/(tabs)')}>
              <LinearGradient colors={C.gradients.primary} style={styles.errorBtn}>
                <Text style={[styles.errorBtnText, { fontFamily: FONTS.displayBold }]}>
                  {loadError ? 'Try Again 🔄' : 'Go Home 🏠'}
                </Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ─── Result Screen ───────────────────────────────────────────────────
  if (showResult) {
    const pct = Math.round((finalScore / questions.length) * 100);
    const isPerfect = pct === 100;
    const isGreat = pct >= 66;
    let resultEmoji = '💪';
    let resultTitle = 'GOOD TRY!';
    let resultSub = "Every try makes you smarter! 🧠✨";
    let resultGradient = C.gradients.secondary;

    if (isPerfect) {
      resultEmoji = '🏆';
      resultTitle = 'PERFECT!';
      resultSub = "You got every answer right! You're a genius! 🎉";
      resultGradient = C.gradients.success;
    } else if (isGreat) {
      resultEmoji = '🌟';
      resultTitle = 'GREAT JOB!';
      resultSub = "Amazing work! You're on a roll! 🚀";
      resultGradient = C.gradients.primary;
    }

    return (
      <LinearGradient colors={C.backgroundGradient} style={styles.fill}>
        <MeshBackground primaryColor={C.primary} />
        <SafeAreaView style={[styles.fill, { paddingHorizontal: SPACING.xl }]}>
          {/* Trophy */}
          <Animated.View entering={ZoomIn.delay(100).springify()} style={styles.resultTrophyWrap}>
            <LinearGradient colors={resultGradient} style={styles.resultTrophyRing}>
              <Text style={styles.resultTrophyEmoji}>{resultEmoji}</Text>
            </LinearGradient>
            <BounceStar color="#F59E0B" delay={0} />
            <BounceStar color="#EF4444" delay={400} />
            <BounceStar color="#10B981" delay={800} />
          </Animated.View>

          {/* Title */}
          <Animated.Text entering={FadeInDown.delay(200).springify()} style={[styles.resultTitle, { color: C.text.primary, fontFamily: FONTS.display }]}>
            {resultTitle}
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(300).springify()} style={[styles.resultSub, { color: C.text.secondary, fontFamily: FONTS.displayMedium }]}>
            {resultSub}
          </Animated.Text>

          {/* Big score */}
          <Animated.View entering={ZoomIn.delay(400).springify()} style={styles.resultScoreRing}>
            <LinearGradient colors={resultGradient} style={styles.resultScoreGradient}>
              <Text style={[styles.resultScorePercent, { fontFamily: FONTS.display }]}>{pct}%</Text>
              <Text style={[styles.resultScoreFraction, { fontFamily: FONTS.displayMedium }]}>
                {finalScore} / {questions.length}
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Progress bar */}
          <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.resultBar}>
            <View style={[styles.resultBarTrack, { backgroundColor: C.text.light + '22' }]}>
              <LinearGradient
                colors={resultGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.resultBarFill, { width: `${pct}%` }]}
              />
            </View>
          </Animated.View>

          {/* Buttons */}
          <Animated.View entering={FadeInUp.delay(600).springify()} style={styles.resultButtons}>
            <Pressable onPress={() => router.push('/(tabs)/history')} style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1, flex: 1 }]}>
              <LinearGradient colors={resultGradient} style={styles.resultPrimaryBtn}>
                <BookOpen size={22} color="#fff" />
                <Text style={[styles.resultPrimaryBtnText, { fontFamily: FONTS.display }]}>My Library</Text>
              </LinearGradient>
            </Pressable>
            <Pressable onPress={() => router.replace('/(tabs)')} style={({ pressed }) => [styles.resultSecondaryBtn, { borderColor: C.primary + '30', opacity: pressed ? 0.75 : 1 }]}>
              <Home size={20} color={C.primary} />
              <Text style={[styles.resultSecondaryBtnText, { color: C.primary, fontFamily: FONTS.displayBold }]}>Home</Text>
            </Pressable>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ─── Quiz Screen ─────────────────────────────────────────────────────
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <LinearGradient colors={C.backgroundGradient} style={styles.fill}>
      <MeshBackground primaryColor={C.primary} />
      <SafeAreaView style={[styles.fill]} edges={['top', 'bottom']}>
        {showCelebration && <CelebrationOverlay />}

        {/* ── Header ── */}
        <View style={styles.quizHeader}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, { backgroundColor: C.cardBackground, opacity: pressed ? 0.7 : 1 }]}
          >
            <ArrowLeft size={20} color={C.text.primary} strokeWidth={2.5} />
          </Pressable>

          <View style={styles.headerCenter}>
            <View style={[styles.progressTrack, { backgroundColor: C.text.light + '18' }]}>
              <Animated.View style={[styles.progressFill, progressStyle]}>
                <LinearGradient
                  colors={C.gradients.sunset}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.progressGloss} />
              </Animated.View>
            </View>
            <Text style={[styles.progressLabel, { color: C.text.secondary, fontFamily: FONTS.displayMedium }]}>
              Question {currentQuestionIndex + 1} of {questions.length}
            </Text>
          </View>

          <Animated.View style={[styles.scoreChipWrap, scoreAnimStyle]}>
            <PulseRing color={C.primary} />
            <LinearGradient colors={C.gradients.primary} style={styles.scoreChip}>
              <Star size={14} color="#fff" fill="#fff" />
              <Text style={[styles.scoreChipText, { fontFamily: FONTS.display }]}>{score}</Text>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* ── Question ── */}
        <Animated.View style={[styles.questionWrap, questionAnimStyle]}>
          {/* Badge row */}
          <View style={styles.questionHeaderRow}>
            <LinearGradient
              colors={[C.primary + '26', C.primary + '0A']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.questionBadge}
            >
              <Zap size={13} color={C.primary} fill={C.primary} />
              <Text style={[styles.questionBadgeText, { color: C.primary, fontFamily: FONTS.displayBold }]}>
                CHALLENGE {currentQuestionIndex + 1}
              </Text>
            </LinearGradient>

            <Pressable
              onPress={() => speak(currentQuestion.question_text, `q_${currentQuestionIndex}`)}
              style={styles.speakerBtn}
            >
              <LinearGradient
                colors={playingId === `q_${currentQuestionIndex}` ? C.gradients.primary : ['rgba(255,255,255,0.6)', 'rgba(255,255,255,0.3)']}
                style={styles.speakerCircle}
              >
                {isAudioLoading && playingId === `q_${currentQuestionIndex}` ? (
                  <Loader2 size={18} color={C.primary} />
                ) : (
                  <Volume2 size={18} color={playingId === `q_${currentQuestionIndex}` ? '#fff' : C.text.light} strokeWidth={2.2} />
                )}
              </LinearGradient>
            </Pressable>
          </View>

          {/* Question text */}
          <Text style={[styles.questionText, { color: C.text.primary, fontFamily: FONTS.display }]}>
            {currentQuestion.question_text}
          </Text>
        </Animated.View>

        {/* ── Answers ── */}
        <Animated.View style={[styles.answersWrap, questionAnimStyle]}>
          {currentQuestion.answers.map((answer, idx) => {
            const isSelected = selectedAnswer === answer.answer_order;
            const showCorrect = selectedAnswer !== null && answer.is_correct;
            const showWrong = isSelected && !answer.is_correct;
            const isFaded = selectedAnswer !== null && !isSelected && !answer.is_correct;
            const label = ['A', 'B', 'C', 'D'][idx] ?? answer.answer_order;

            let answerContent;
            if (showCorrect) {
              answerContent = (
                <LinearGradient
                  colors={C.gradients.success}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={[styles.answerCard, styles.answerCardActive]}
                >
                  <View style={styles.answerIconWrap}>
                    <CheckCircle2 size={40} color="#fff" strokeWidth={2.5} />
                  </View>
                  <Text style={[styles.answerText, { color: '#fff', fontFamily: FONTS.displayBold }]}>
                    {answer.answer_text}
                  </Text>
                </LinearGradient>
              );
            } else if (showWrong) {
              answerContent = (
                <LinearGradient
                  colors={[C.error, C.error + 'CC']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={[styles.answerCard, styles.answerCardActive]}
                >
                  <View style={styles.answerIconWrap}>
                    <XCircle size={40} color="#fff" strokeWidth={2.5} />
                  </View>
                  <Text style={[styles.answerText, { color: '#fff', fontFamily: FONTS.displayBold }]}>
                    {answer.answer_text}
                  </Text>
                </LinearGradient>
              );
            } else {
              answerContent = (
                <View style={[styles.answerCard, styles.answerCardDefault, { backgroundColor: C.cardBackground, borderColor: isSelected ? C.primary : C.glass.border }]}>
                  <LinearGradient
                    colors={isSelected ? C.gradients.primary : [C.primary + '22', C.primary + '0C']}
                    style={styles.answerLabelBadge}
                  >
                    <Text style={[styles.answerLabelText, { color: isSelected ? '#fff' : C.primary, fontFamily: FONTS.display }]}>
                      {label}
                    </Text>
                  </LinearGradient>
                  <Text style={[styles.answerText, { color: C.text.primary, fontFamily: FONTS.displayBold }]}>
                    {answer.answer_text}
                  </Text>
                </View>
              );
            }

            return (
              <Animated.View
                key={answer.id}
                entering={FadeInDown.delay(260 + idx * 80).springify().damping(14)}
                style={[styles.answerPressable, { opacity: isFaded ? 0.22 : 1 }]}
              >
                <Pressable
                  onPress={() => handleAnswerSelect(answer.answer_order)}
                  disabled={selectedAnswer !== null}
                  style={({ pressed }) => [{ flex: 1, transform: [{ scale: pressed && !selectedAnswer ? 0.97 : 1 }] }]}
                >
                  {answerContent}
                </Pressable>
              </Animated.View>
            );
          })}
        </Animated.View>

        {/* ── Mascot emoji ── */}
        {selectedAnswer === null && (
          <Animated.View entering={FadeInDown.delay(700).springify()} style={styles.mascotWrap}>
            <Text style={styles.mascotEmoji}>🤔</Text>
            <Text style={[styles.mascotHint, { color: C.text.light, fontFamily: FONTS.displayMedium }]}>
              Pick the best answer!
            </Text>
          </Animated.View>
        )}

        {/* ── Feedback bottom sheet ── */}
        <Animated.View style={[styles.feedbackSheet, { backgroundColor: C.cardBackground }, feedbackStyle]}>
          {isCorrect ? (
            <View style={styles.feedbackInner}>
              <LinearGradient colors={C.gradients.success} style={styles.feedbackIconCircle}>
                <Text style={styles.feedbackEmoji}>🎉</Text>
              </LinearGradient>
              <View style={styles.feedbackText}>
                <Text style={[styles.feedbackTitle, { color: C.success, fontFamily: FONTS.display }]}>
                  Correct!
                </Text>
                <Text style={[styles.feedbackSub, { color: C.text.secondary, fontFamily: FONTS.displayMedium }]}>
                  Brilliant! You're on fire! 🔥
                </Text>
              </View>
              <View style={styles.feedbackStars}>
                <Text style={{ fontSize: 26 }}>⭐</Text>
                <Text style={{ fontSize: 22 }}>⭐</Text>
                <Text style={{ fontSize: 26 }}>⭐</Text>
              </View>
            </View>
          ) : (
            <View style={styles.feedbackInner}>
              <LinearGradient colors={[C.error, C.error + 'BB']} style={styles.feedbackIconCircle}>
                <Text style={styles.feedbackEmoji}>💪</Text>
              </LinearGradient>
              <View style={styles.feedbackText}>
                <Text style={[styles.feedbackTitle, { color: C.error, fontFamily: FONTS.display }]}>
                  Not quite!
                </Text>
                <Text style={[styles.feedbackSub, { color: C.text.secondary, fontFamily: FONTS.displayMedium }]}>
                  You've got this next time!
                </Text>
              </View>
              <Text style={{ fontSize: 22 }}>🌈</Text>
            </View>
          )}
          <View style={styles.feedbackProgress}>
            <View style={[styles.feedbackProgressTrack, { backgroundColor: C.text.light + '18' }]}>
              <Animated.View
                entering={FadeInDown.duration(2200)}
                style={[styles.feedbackProgressFill, { backgroundColor: C.primary }]}
              />
            </View>
            <Text style={[styles.feedbackProgressText, { color: C.text.light, fontFamily: FONTS.displayMedium }]}>
              Moving to next question...
            </Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function useStyles(C: any, winWidth: number, winHeight: number, isTablet: boolean, insets: any) {
  let qFontSize = 40;
  let qLineHeight = 52;
  if (isTablet) {
    qFontSize = 44;
    qLineHeight = 56;
  } else if (winHeight < 700) {
    qFontSize = 32;
    qLineHeight = 42;
  }

  return useMemo(() => StyleSheet.create({
    fill: { flex: 1 },

    // ── Loading ──────────────────────────────────────────────────────
    centeredSafe: {
      flex: 1, justifyContent: 'center', alignItems: 'center',
      paddingHorizontal: SPACING.xl, gap: SPACING.lg,
    },
    loadingCircle: {
      width: 100, height: 100, borderRadius: 50,
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      ...SHADOWS.lg,
    },
    loadingEmoji: { fontSize: 56, marginTop: 8 },
    loadingText: { fontSize: 18, textAlign: 'center', letterSpacing: -0.2 },

    // ── Error ────────────────────────────────────────────────────────
    errorCard: {
      alignItems: 'center', gap: SPACING.lg,
      padding: SPACING.xxl, width: '100%', maxWidth: 380,
    },
    errorEmoji: { fontSize: 72 },
    errorTitle: { fontSize: 32, textAlign: 'center' },
    errorMsg: { fontSize: 16, textAlign: 'center', lineHeight: 24, opacity: 0.8 },
    errorBtn: {
      paddingVertical: 18, paddingHorizontal: 40,
      borderRadius: BORDER_RADIUS.pill, marginTop: SPACING.sm,
      ...SHADOWS.md,
    },
    errorBtnText: { color: '#fff', fontSize: 16, textAlign: 'center' },

    // ── Header ───────────────────────────────────────────────────────
    quizHeader: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: isTablet ? SPACING.xxl : SPACING.lg,
      paddingTop: 2,
      paddingBottom: SPACING.sm,
      gap: SPACING.md,
    },
    backBtn: {
      width: 44, height: 44, borderRadius: 22,
      alignItems: 'center', justifyContent: 'center',
      ...SHADOWS.xs,
    },
    headerCenter: { flex: 1, gap: 6 },
    progressTrack: {
      height: 12, borderRadius: 6,
      overflow: 'hidden',
      borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
    },
    progressFill: { height: '100%', borderRadius: 6 },
    progressGloss: {
      height: '40%', backgroundColor: 'rgba(255,255,255,0.25)',
      position: 'absolute', left: 0, right: 0, top: 0,
    },
    progressLabel: { fontSize: 12, textAlign: 'center', letterSpacing: 0.3 },
    scoreChipWrap: { alignItems: 'center', justifyContent: 'center' },
    scoreChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 14, paddingVertical: 9,
      borderRadius: 24,
      ...SHADOWS.sm,
    },
    scoreChipText: { fontSize: 18, color: '#fff' },

    // ── Question ─────────────────────────────────────────────────────
    questionWrap: {
      paddingHorizontal: isTablet ? SPACING.xxl : SPACING.xl,
      paddingTop: SPACING.xs,
      paddingBottom: SPACING.sm,
      gap: SPACING.sm,
      maxWidth: LAYOUT.maxWidth, alignSelf: 'center', width: '100%',
    },
    questionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, justifyContent: 'space-between' },
    questionBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8,
      borderRadius: BORDER_RADIUS.pill,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    },
    questionBadgeText: { fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase' },
    speakerBtn: { width: 48, height: 48 },
    speakerCircle: {
      width: 48, height: 48, borderRadius: 24,
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    },
    questionText: {
      fontSize: qFontSize,
      lineHeight: qLineHeight,
      letterSpacing: -0.5,
    },

    // ── Answers ──────────────────────────────────────────────────────
    answersWrap: {
      flex: 1,
      paddingHorizontal: isTablet ? SPACING.xxl : SPACING.xl,
      paddingBottom: SPACING.md,
      gap: isTablet ? SPACING.lg : SPACING.md,
      maxWidth: LAYOUT.maxWidth, alignSelf: 'center', width: '100%',
    },
    // flex:1 so each card stretches to fill even vertical space
    answerPressable: { flex: 1, width: '100%' },
    answerCard: {
      flex: 1,
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.xl,
      borderRadius: 28,
      gap: SPACING.lg,
    },
    answerCardActive: { ...SHADOWS.md },
    answerCardDefault: {
      borderWidth: 2.5,
      ...SHADOWS.sm,
    },
    answerLabelBadge: {
      width: 64, height: 64, borderRadius: 32,
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    },
    answerLabelText: { fontSize: 30, lineHeight: 36 },
    answerIconWrap: {
      width: 64, height: 64, borderRadius: 32,
      backgroundColor: 'rgba(255,255,255,0.25)',
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    },
    answerText: {
      flex: 1, fontSize: isTablet ? 28 : 28, lineHeight: isTablet ? 38 : 36,
    },

    // ── Mascot hint ───────────────────────────────────────────────────
    mascotWrap: {
      alignItems: 'center', paddingBottom: SPACING.sm,
      flexDirection: 'row', justifyContent: 'center', gap: 8,
    },
    mascotEmoji: { fontSize: 22 },
    mascotHint: { fontSize: 13, letterSpacing: 0.2 },

    // ── Feedback Sheet ────────────────────────────────────────────────
    feedbackSheet: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingHorizontal: isTablet ? SPACING.xxl : SPACING.xl,
      paddingTop: SPACING.xl,
      paddingBottom: SPACING.xxl,
      borderTopLeftRadius: 36, borderTopRightRadius: 36,
      ...SHADOWS.xl,
      gap: SPACING.md,
      maxWidth: LAYOUT.maxWidth, alignSelf: 'center', width: '100%',
    },
    feedbackInner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg },
    feedbackIconCircle: {
      width: 56, height: 56, borderRadius: 28,
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    },
    feedbackEmoji: { fontSize: 28 },
    feedbackText: { flex: 1, gap: 2 },
    feedbackTitle: { fontSize: isTablet ? 26 : 22, lineHeight: isTablet ? 30 : 26 },
    feedbackSub: { fontSize: 14, lineHeight: 20, opacity: 0.75 },
    feedbackStars: { flexDirection: 'row', gap: 2, alignSelf: 'flex-start' },
    feedbackProgress: { gap: 6 },
    feedbackProgressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
    feedbackProgressFill: { height: '100%', width: '100%', borderRadius: 3 },
    feedbackProgressText: { fontSize: 12, textAlign: 'center', letterSpacing: 0.3, opacity: 0.8 },

    // ── Result Screen ─────────────────────────────────────────────────
    resultTrophyWrap: {
      alignItems: 'center', justifyContent: 'center',
      marginTop: SPACING.xl, marginBottom: SPACING.lg,
      height: isTablet ? 180 : 150,
    },
    resultTrophyRing: {
      width: isTablet ? 160 : 130, height: isTablet ? 160 : 130, borderRadius: isTablet ? 80 : 65,
      alignItems: 'center', justifyContent: 'center',
      ...SHADOWS.xl,
    },
    resultTrophyEmoji: { fontSize: isTablet ? 90 : 72 },
    resultTitle: {
      fontSize: isTablet ? 52 : 42, textAlign: 'center',
      letterSpacing: -0.5,
    },
    resultSub: {
      fontSize: isTablet ? 18 : 16, textAlign: 'center',
      lineHeight: isTablet ? 26 : 24, opacity: 0.8,
      paddingHorizontal: SPACING.md,
    },
    resultScoreRing: {
      marginVertical: SPACING.xl,
      ...SHADOWS.md,
      borderRadius: 28, overflow: 'hidden',
      alignSelf: 'center',
    },
    resultScoreGradient: {
      paddingHorizontal: isTablet ? 60 : 48,
      paddingVertical: isTablet ? 28 : 22,
      borderRadius: 28,
      alignItems: 'center', gap: 4,
    },
    resultScorePercent: { fontSize: isTablet ? 72 : 60, color: '#fff', letterSpacing: -2 },
    resultScoreFraction: { fontSize: isTablet ? 20 : 16, color: 'rgba(255,255,255,0.85)' },
    resultBar: { width: '100%', maxWidth: 500, alignSelf: 'center' },
    resultBarTrack: { height: 12, borderRadius: 6, overflow: 'hidden' },
    resultBarFill: { height: '100%', borderRadius: 6 },
    resultButtons: {
      flexDirection: 'row', gap: SPACING.md,
      marginTop: SPACING.xl,
      paddingBottom: SPACING.xl,
    },
    resultPrimaryBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: SPACING.sm, paddingVertical: 20,
      borderRadius: BORDER_RADIUS.pill,
      ...SHADOWS.md,
    },
    resultPrimaryBtnText: { color: '#fff', fontSize: isTablet ? 20 : 18 },
    resultSecondaryBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: SPACING.sm, paddingVertical: 20, paddingHorizontal: 28,
      borderRadius: BORDER_RADIUS.pill, borderWidth: 2,
    },
    resultSecondaryBtnText: { fontSize: isTablet ? 18 : 16 },
  }), [C, winWidth, winHeight, isTablet, insets]);
}
