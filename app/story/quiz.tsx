import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { SPACING, BORDER_RADIUS, FONTS, FONT_SIZES, SHADOWS, BREAKPOINTS, LAYOUT } from '@/constants/theme';
import { Container } from '@/components/Container';
import { useTheme } from '@/contexts/ThemeContext';
import { hapticFeedback } from '@/utils/haptics';
import { Audio } from 'expo-av';
import { generateAudio } from '@/services/audioService';
import { Volume2, VolumeX, Loader2 } from 'lucide-react-native';
import { talkative } from '@/utils/talkative';
import { MeshBackground } from '@/components/MeshBackground';

const QUESTION_TYPOGRAPHY_SIZE = 30; // Agency-grade large typography

export default function QuizScreen() {
  const { width: winWidth } = useWindowDimensions();
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { currentTheme } = useTheme();
  const themeColors = currentTheme.colors;
  const { profile, refreshQuizAttempts } = useApp();
  const isTablet = winWidth >= BREAKPOINTS.tablet;
  const styles = useStyles(themeColors, winWidth, isTablet);
  const C = themeColors;

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

  // Audio State
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isAudioError, setIsAudioError] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null); // Track which item is playing
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    return () => {
      if (sound) {
        sound.unloadAsync().catch(() => {});
      }
    };
  }, [sound]);

  // Auto-play question when it changes
  useEffect(() => {
    if (questions.length > 0 && !showResult && !isLoading) {
      const q = questions[currentQuestionIndex];
      // Small delay to allow transition animation to finish
      const timer = setTimeout(() => {
        speak(q.question_text, `q_${currentQuestionIndex}`);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentQuestionIndex, questions.length, showResult, isLoading]);

  // Auto-play result message
  useEffect(() => {
    if (showResult && questions.length > 0) {
      const percentage = Math.round((finalScore / questions.length) * 100);
      const isPerfect = percentage === 100;
      const isGreat = percentage >= 66 && percentage < 100;
      let msg = "";
      if (isPerfect) msg = talkative.reactions.finished(finalScore, questions.length) + " Perfect Score! You crushed it — flawless!";
      else if (isGreat) msg = talkative.reactions.finished(finalScore, questions.length) + " Great Work! You're on a roll, keep going!";
      else msg = talkative.reactions.finished(finalScore, questions.length) + " Good Effort! Every attempt builds your skills.";
      
      const timer = setTimeout(() => {
        talkative.speak(msg, story?.language_code || 'en');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showResult]);

  const speak = async (text: string, id: string, noStore: boolean = false) => {
    try {
      if (playingId === id && sound) {
        // Toggle off if clicking the same thing
        await sound.stopAsync();
        setPlayingId(null);
        return;
      }

      // Stop existing sound
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }

      setPlayingId(id);
      setIsAudioLoading(true);
      setIsAudioError(false);

      const url = await generateAudio(text, story?.language_code || 'en', undefined, noStore);
      if (!url) {
        setIsAudioError(true);
        setIsAudioLoading(false);
        setPlayingId(null);
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setIsAudioLoading(false);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingId(null);
        }
      });
    } catch (err) {
      console.error('TTS Error:', err);
      setIsAudioError(true);
      setIsAudioLoading(false);
      setPlayingId(null);
    }
  };

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

  const handleNextQuestion = useCallback(async () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
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

  const handleAnswerSelect = useCallback(
    (answerOrder: string) => {
      if (selectedAnswer !== null) return;
      const currentQuestion = questions[currentQuestionIndex];
      const correctAnswer = currentQuestion.answers.find((a) => a.is_correct);
      setSelectedAnswer(answerOrder);
      const correct = answerOrder === correctAnswer?.answer_order;
      setIsCorrect(correct);

      // Construct funny/encouraging personalized reaction
      const username = profile?.kid_name || 'my friend';
      const reaction = correct 
        ? talkative.reactions.correct(username)
        : talkative.reactions.incorrect(username);

      // Trigger immediate talkative feedback (client-side)
      talkative.speak(reaction, story?.language_code || 'en');

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

      // Auto-advance to next question (Event-driven for reliability)
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = setTimeout(() => {
        handleNextQuestion();
      }, 2000);
    },
    [selectedAnswer, questions, currentQuestionIndex, handleNextQuestion]
  );

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
      { label: 'Score', value: `${percentage}%`, icon: Target, color: C.primary },
    ];

    return (
      <Container maxWidth gradient gradientColors={C.backgroundGradient}>
        <ScrollView contentContainerStyle={styles.resultScroll} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.resultTopSection}>
            <Pressable 
              onPress={() => {
                const percentage = Math.round((finalScore / questions.length) * 100);
                const isPerfect = percentage === 100;
                const isGreat = percentage >= 66 && percentage < 100;
                let msg = "";
                if (isPerfect) msg = "Perfect Score! You crushed it — flawless!";
                else if (isGreat) msg = "Great Work! You're on a roll, keep going!";
                else msg = "Good Effort! Every attempt builds your skills.";
                speak(msg, 'result');
              }}
              style={styles.resultAudioBtn}
            >
              <LinearGradient colors={resultGradient} style={styles.resultTrophyRing}>
                <View style={styles.resultTrophyInner}>
                  {playingId === 'result' ? (
                    <Volume2 size={isTablet ? 72 : 52} color="#fff" strokeWidth={2.5} />
                  ) : (
                    <Trophy size={isTablet ? 72 : 52} color="#fff" strokeWidth={1.6} />
                  )}
                </View>
              </LinearGradient>
            </Pressable>

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
                  <View style={[styles.statCard, { backgroundColor: C.cardBackground, minWidth: isTablet ? 160 : (winWidth - SPACING.xl * 2 - SPACING.md * 2) / 3 }]}>
                    <View style={[styles.statIconWrap, { backgroundColor: item.color + '18' }]}>
                      <Icon size={isTablet ? 24 : 18} color={item.color} strokeWidth={2} />
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

          <Animated.View entering={FadeInUp.delay(620).springify()} style={[styles.resultActions, isTablet && { flexDirection: 'row', justifyContent: 'center', gap: SPACING.xl }]}>
            <Pressable onPress={handleFinish} style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1, width: isTablet ? 240 : '100%' }]}>
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
                { borderColor: C.primary + '28', opacity: pressed ? 0.75 : 1, width: isTablet ? 200 : '100%', marginTop: isTablet ? 0 : SPACING.md },
              ]}>
              <Home size={18} color={C.primary} />
              <Text style={[styles.secondaryResultBtnText, { color: C.primary, fontFamily: FONTS.semibold }]}>
                Back to Home
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </Container>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <Container maxWidth gradient gradientColors={C.backgroundGradient} safeAreaEdges={['top', 'bottom']}>
        {showCelebration && <CelebrationOverlay />}

        <View style={styles.quizHeader}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backBtn,
              { backgroundColor: C.cardBackground, opacity: pressed ? 0.7 : 1 },
            ]}>
            <ArrowLeft size={20} color={C.text.primary} />
          </Pressable>

          <View style={styles.headerCenter}>
            <View style={[styles.progressTrack, { backgroundColor: C.text.light + '15' }]}>
              <Animated.View style={[styles.progressFill, progressStyle]}>
                <LinearGradient
                  colors={C.gradients.sunset}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.progressGloss} />
              </Animated.View>
            </View>
            <Text style={[styles.progressLabel, { color: C.text.secondary, fontFamily: FONTS.bold }]}>
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
            <Animated.View entering={FadeInDown.delay(100).springify().damping(15)} style={styles.questionSection}>
              <View style={styles.questionHeaderRow}>
                <LinearGradient
                  colors={[C.primary + '25', C.primary + '10']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.questionBadge}
                >
                  <Zap size={14} color={C.primary} fill={C.primary} />
                  <Text style={[styles.questionBadgeText, { color: C.primary, fontFamily: FONTS.extrabold }]}>
                    CHALLENGE {currentQuestionIndex + 1}
                  </Text>
                </LinearGradient>
                
                <Pressable 
                  onPress={() => speak(currentQuestion.question_text, `q_${currentQuestionIndex}`)}
                  style={styles.speakerBtn}
                >
                  {playingId === `q_${currentQuestionIndex}` ? (
                    <Volume2 size={24} color={C.primary} strokeWidth={2.5} />
                  ) : isAudioLoading && playingId === `q_${currentQuestionIndex}` ? (
                    <Loader2 size={24} color={C.primary} style={styles.rotating} />
                  ) : (
                    <View style={styles.speakerCircle}>
                      <Volume2 size={20} color={C.text.light} strokeWidth={2} />
                    </View>
                  )}
                </Pressable>
              </View>
              <Text style={[styles.questionText, { color: C.text.primary, fontFamily: FONTS.display }]}>
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
                const label = ['A', 'B', 'C', 'D'][idx] ?? answer.answer_order;

                return (
                  <Animated.View
                    key={answer.id}
                    entering={FadeInDown.delay(300 + idx * 100).springify().damping(12)}
                    style={{ opacity: isDisabledFaded ? 0.25 : 1 }}>
                    <Pressable
                      onPress={() => handleAnswerSelect(answer.answer_order)}
                      disabled={selectedAnswer !== null}
                      style={({ pressed }) => [
                        styles.answerPressable,
                        { transform: [{ scale: pressed && !selectedAnswer ? 0.96 : 1 }] }
                      ]}>
                      {showCorrect ? (
                        <LinearGradient
                          colors={C.gradients.success}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={[styles.answerCard, styles.answerCardActive]}>
                          <View style={styles.answerLabelCorrect}>
                            <CheckCircle2 size={24} color="#fff" strokeWidth={3} />
                          </View>
                          <Text style={[styles.answerText, { color: '#fff', fontFamily: FONTS.bold }]}
                            numberOfLines={3}>
                            {answer.answer_text}
                          </Text>
                        </LinearGradient>
                      ) : showWrong ? (
                        <LinearGradient
                          colors={[C.error, C.error + 'DD']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={[styles.answerCard, styles.answerCardActive]}>
                          <View style={styles.answerLabelWrong}>
                            <XCircle size={24} color="#fff" strokeWidth={3} />
                          </View>
                          <Text style={[styles.answerText, { color: '#fff', fontFamily: FONTS.bold }]}
                            numberOfLines={3}>
                            {answer.answer_text}
                          </Text>
                        </LinearGradient>
                      ) : (
                        <View style={[
                          styles.answerCard,
                          styles.glassCard,
                          {
                            borderColor: isSelected ? C.primary : 'rgba(255,255,255,0.3)',
                            borderWidth: isSelected ? 2 : 1,
                          },
                        ]}>
                          <LinearGradient 
                            colors={isSelected ? C.gradients.primary : ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.4)']} 
                            style={styles.answerLabelBadge}
                          >
                            <Text style={[
                              styles.answerLabelText, 
                              { color: isSelected ? '#fff' : C.primary, fontFamily: FONTS.extrabold }
                            ]}>
                              {label}
                            </Text>
                          </LinearGradient>
                          <Text style={[styles.answerText, { color: C.text.primary, fontFamily: FONTS.semibold }]}
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

            {/* ── High-Density Engagement Modules (No Blank Space) ── */}
            <View style={styles.engagementContainer}>
               <Animated.View entering={FadeInUp.delay(800).springify()} style={styles.funFactCard}>
                  <View style={styles.funFactIcon}>
                    <Sparkles size={16} color={C.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.funFactTitle, { color: C.primary, fontFamily: FONTS.bold }]}>FUN FACT</Text>
                    <Text style={[styles.funFactText, { color: C.text.secondary, fontFamily: FONTS.medium }]}>
                      Researchers say quizzing after reading helps memories stick like glue! 🧠✨
                    </Text>
                  </View>
               </Animated.View>

               <Animated.View 
                 entering={ZoomIn.delay(1000).springify()} 
                 style={styles.cheerleaderWrap}
               >
                  <Text style={styles.cheerleaderEmoji}>
                    {selectedAnswer === null ? '🤔' : isCorrect ? '🎉' : '💪'}
                  </Text>
                  <View style={styles.cheerAura} />
               </Animated.View>
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

            <View style={styles.autoAdvanceIndicator}>
              <Sparkles size={14} color={C.primary} style={styles.sparkleIcon} />
              <Text style={[styles.autoAdvanceText, { color: C.text.secondary, fontFamily: FONTS.medium }]}>
                Moving forward...
              </Text>
            </View>
          </Animated.View>
        )}
    </Container>
  );
}

function useStyles(C: any, winWidth: number, isTablet: boolean) {
  return useMemo(() => StyleSheet.create({
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
      marginBottom: SPACING.sm,
    },
    errorTitle: {
      fontSize: 28,
      textAlign: 'center',
    },
    errorMsg: {
      fontSize: FONT_SIZES.md,
      textAlign: 'center',
      lineHeight: 22,
    },
    errorBtn: {
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: BORDER_RADIUS.xl,
      width: '100%',
      marginTop: SPACING.md,
    },
    errorBtnText: {
      fontSize: FONT_SIZES.md,
      textAlign: 'center',
    },
    errorLink: {
      marginTop: SPACING.sm,
      padding: SPACING.sm,
    },

    quizHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.lg,
      paddingBottom: SPACING.md,
      gap: SPACING.md,
    },
    backBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerCenter: {
      flex: 1,
      gap: 6,
    },
    progressTrack: {
      height: 10,
      borderRadius: 5,
      overflow: 'hidden',
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    progressFill: {
      height: '100%',
      borderRadius: 5,
    },
    progressGloss: {
      height: '35%',
      backgroundColor: 'rgba(255,255,255,0.2)',
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
    },
    progressLabel: {
      fontSize: 11,
      letterSpacing: 0.5,
      textAlign: 'center',
    },
    scoreChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1.5,
    },
    scoreChipText: {
      fontSize: 14,
    },

    scrollContent: {
      paddingBottom: 40,
    },
    questionSection: {
      paddingHorizontal: isTablet ? SPACING.xxxl : SPACING.xl,
      paddingTop: isTablet ? SPACING.xxxl : SPACING.lg,
      gap: isTablet ? SPACING.xl : SPACING.lg,
      maxWidth: LAYOUT.maxWidth,
      alignSelf: 'center',
    },
    questionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: SPACING.md,
    },
    questionBadge: {
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: BORDER_RADIUS.pill,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    questionBadgeText: {
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    speakerBtn: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    speakerCircle: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.3)',
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: C.glass.border,
    },
    questionText: {
      fontSize: isTablet ? 38 : 32,
      lineHeight: isTablet ? 48 : 40,
      letterSpacing: -0.5,
    },

    answersGrid: {
      flexDirection: isTablet ? 'row' : 'column',
      flexWrap: isTablet ? 'wrap' : 'nowrap',
      gap: isTablet ? SPACING.xl : SPACING.lg,
      paddingHorizontal: isTablet ? SPACING.xxxl : SPACING.lg,
      maxWidth: LAYOUT.maxWidth,
      alignSelf: 'center',
      width: '100%',
    },
    answerPressable: {
      width: isTablet ? '48.5%' : '100%',
    },
    answerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: SPACING.lg,
      borderRadius: 28,
      gap: SPACING.lg,
      minHeight: 88,
    },
    answerCardActive: {
      ...SHADOWS.lg,
    },
    glassCard: {
      backgroundColor: C.glass.background,
      borderWidth: 1,
      borderColor: C.glass.border,
    },
    answerLabelBadge: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      ...SHADOWS.sm,
    },
    answerLabelText: {
      fontSize: 20,
    },
    answerText: {
      flex: 1,
      fontSize: 18,
      lineHeight: 24,
    },
    answerLabelCorrect: {
      width: 48, height: 48, borderRadius: 24,
      backgroundColor: 'rgba(255,255,255,0.3)',
      alignItems: 'center', justifyContent: 'center',
    },
    answerLabelWrong: {
      width: 48, height: 48, borderRadius: 24,
      backgroundColor: 'rgba(255,255,255,0.3)',
      alignItems: 'center', justifyContent: 'center',
    },

    engagementContainer: {
      marginTop: 40,
      gap: SPACING.xl,
      paddingBottom: 20,
    },
    funFactCard: {
      flexDirection: 'row',
      backgroundColor: 'rgba(255,255,255,0.3)',
      borderRadius: 24,
      padding: SPACING.lg,
      gap: SPACING.md,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    funFactIcon: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.4)',
      alignItems: 'center', justifyContent: 'center',
    },
    funFactTitle: { fontSize: 10, letterSpacing: 1 },
    funFactText: { fontSize: 13, lineHeight: 18 },
    
    cheerleaderWrap: {
      alignSelf: 'center',
      width: 100, height: 100,
      alignItems: 'center', justifyContent: 'center',
    },
    cheerleaderEmoji: { fontSize: 72, zIndex: 1 },
    cheerAura: {
      position: 'absolute',
      width: 120, height: 120,
      borderRadius: 60,
      backgroundColor: 'rgba(255,255,255,0.25)',
    },

    bottomSheet: {
      position: 'absolute',
      bottom: 0, 
      alignSelf: 'center',
      width: '100%',
      maxWidth: LAYOUT.maxWidth,
      padding: isTablet ? SPACING.xxl : SPACING.xl,
      borderTopLeftRadius: isTablet ? 40 : 32,
      borderTopRightRadius: isTablet ? 40 : 32,
      ...SHADOWS.xl,
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.lg,
    },
    feedbackRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    feedbackDot: { width: 12, height: 12, borderRadius: 6 },
    feedbackText: { fontSize: 20 },
    feedbackSub: { fontSize: 14 },
    nextBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.sm,
      paddingVertical: 18,
      borderRadius: BORDER_RADIUS.pill,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.14,
      shadowRadius: 16,
      elevation: 8,
    },
    nextBtnText: { color: '#fff', fontSize: 16 },
    rotating: { transform: [{ rotate: '0deg' }] },

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
    resultAudioBtn: {
      marginBottom: SPACING.sm,
    },
    resultTrophyRing: {
      width: 128,
      height: 128,
      borderRadius: 64,
      alignItems: 'center',
      justifyContent: 'center',
      ...SHADOWS.lg,
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
      paddingHorizontal: isTablet ? SPACING.xxl : SPACING.lg,
      paddingVertical: isTablet ? SPACING.xl : SPACING.md,
      borderRadius: isTablet ? 32 : BORDER_RADIUS.xl,
      ...SHADOWS.sm,
      alignItems: 'center',
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
      maxWidth: isTablet ? 600 : '100%',
      alignSelf: 'center',
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
      paddingHorizontal: 24,
      paddingVertical: 18,
      borderRadius: BORDER_RADIUS.xl,
      ...SHADOWS.md,
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
    autoAdvanceIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: SPACING.md,
      opacity: 0.8,
    },
    autoAdvanceText: {
      fontSize: FONT_SIZES.sm,
      letterSpacing: 0.5,
    },
    sparkleIcon: {
      opacity: 0.6,
    }
  }), [C, winWidth, isTablet]);
}
