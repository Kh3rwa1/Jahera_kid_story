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
  withDelay,
  cancelAnimation,
  interpolate,
  Easing as ReEasing,
  FadeInUp,
  FadeInDown,
  FadeInLeft,
  ZoomIn,
  SlideInDown,
} from 'react-native-reanimated';
import { useEffect as useEffectGen } from 'react';
import { profileService, storyService, quizService, familyMemberService, friendService } from '@/services/database';
import { generateAdventureStory, QuotaExceededError, StoryOptions } from '@/services/aiService';
import { generateAudio } from '@/services/audioService';
import { getCurrentContext } from '@/utils/contextUtils';
import { getLocationContext, formatLocationLabel, LocationContext } from '@/services/locationService';
import { Sparkles, BookOpen, Volume2, Circle as HelpCircle, Check, Zap, ChevronLeft, Wand as Wand2, MapPin } from 'lucide-react-native';
import { ErrorState } from '@/components/ErrorState';
import { CharacterManager } from '@/components/CharacterManager';
import { SPACING, BORDER_RADIUS, SHADOWS, FONTS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useApp } from '@/contexts/AppContext';
import { hapticFeedback } from '@/utils/haptics';
import { FamilyMember, Friend } from '@/types/database';

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
  const glow = useSharedValue(selected ? 1 : 0);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0, 0.5]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [0.8, 1.15]) }],
  }));

  useEffectGen(() => {
    glow.value = withSpring(selected ? 1 : 0, { damping: 12 });
  }, [selected]);

  const handlePress = () => {
    scale.value = withSequence(withSpring(0.88, { damping: 10 }), withSpring(1, { damping: 12 }));
    onPress();
    hapticFeedback.light();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1}>
      <ReAnimated.View style={animStyle}>
        <ReAnimated.View style={[StyleSheet.absoluteFill, { borderRadius: BORDER_RADIUS.xl, backgroundColor: theme.gradient[0] }, glowStyle]} />
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

function CtaButton({ gradient, onPress }: { gradient: [string, string]; onPress: () => void }) {
  const shimmerX = useSharedValue(-1);
  const scale = useSharedValue(1);

  useEffectGen(() => {
    shimmerX.value = withRepeat(
      withTiming(1, { duration: 2600, easing: ReEasing.linear }),
      -1, false
    );
    return () => cancelAnimation(shimmerX);
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmerX.value, [-1, 1], [-200, 200]) }],
  }));
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <ReAnimated.View style={scaleStyle}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.96, { damping: 14 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
        activeOpacity={1}
      >
        <LinearGradient colors={gradient} style={styles.ctaButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderRadius: BORDER_RADIUS.xxl }]}>
            <ReAnimated.View style={[styles.ctaShimmer, shimmerStyle]} />
          </View>
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
  );
}

export default function GenerateStory() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { currentTheme } = useTheme();
  const themeColors = currentTheme.colors;
  const { subscription, refreshSubscription, refreshStories } = useApp();

  const [phase, setPhase] = useState<Phase>('options');
  const [selectedTheme, setSelectedTheme] = useState('adventure');
  const [selectedMood, setSelectedMood] = useState('exciting');
  const [selectedLength, setSelectedLength] = useState<'short' | 'medium' | 'long'>('short');

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [locationCtx, setLocationCtx] = useState<LocationContext | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);

  const [status, setStatus] = useState('Preparing your adventure...');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isQuotaError, setIsQuotaError] = useState(false);
  const [funFactIndex, setFunFactIndex] = useState(0);
  const [longWait, setLongWait] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const longWaitRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

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
    const profileId = params.profileId as string;
    if (!profileId) return;

    Promise.all([
      familyMemberService.getByProfileId(profileId),
      friendService.getByProfileId(profileId),
    ]).then(([fm, fr]) => {
      if (fm) setFamilyMembers(fm);
      if (fr) setFriends(fr);
    });

    setLocationLoading(true);
    getLocationContext().then(ctx => {
      if (isMountedRef.current) {
        setLocationCtx(ctx);
        setLocationLoading(false);
      }
    });
  }, [params.profileId]);

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

      if (!isMountedRef.current) return;
      setStatus('Loading your profile...');
      setProgress(20);

      const profile = await profileService.getWithRelations(profileId);
      if (!profile) {
        setError('Profile not found. Please make sure you have created a profile first.');
        return;
      }

      if (!isMountedRef.current) return;
      completeStep('profile');
      setStatus('Creating your adventure story...');
      setProgress(40);

      const context = getCurrentContext();
      const options: StoryOptions = {
        theme: selectedTheme,
        mood: selectedMood,
        length: selectedLength,
        locationContext: locationCtx,
      };

      const story = await generateAdventureStory(profile, languageCode, context, options);

      if (!story) {
        setError('Could not generate a story. Please try again.');
        return;
      }

      if (!isMountedRef.current) return;
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
        location_city: locationCtx?.city ?? null,
        location_country: locationCtx?.country ?? null,
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

      if (!isMountedRef.current) return;
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
      await Promise.all([refreshSubscription(), refreshStories()]);

      if (!isMountedRef.current) return;
      setTimeout(() => {
        if (isMountedRef.current) {
          router.replace({ pathname: '/story/playback', params: { storyId: storyRecord.$id } });
        }
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
    setPhase('options');
    setTimeout(() => setPhase('generating'), 50);
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
    const activeStepIndex = steps.findIndex(s => !s.completed);
    const activeStep = activeStepIndex >= 0 ? steps[activeStepIndex] : steps[steps.length - 1];

    return (
      <SafeAreaView style={[styles.generatingScreen, { backgroundColor: themeColors.background }]}>
        <LinearGradient colors={themeColors.backgroundGradient} style={StyleSheet.absoluteFill} />

        <View style={[styles.genAmbientOrb1, { backgroundColor: themeColors.primary + '0C' }]} />
        <View style={[styles.genAmbientOrb2, { backgroundColor: themeColors.gradients.sunset[0] + '08' }]} />

        <View style={styles.generatingContent}>
          <ReAnimated.View entering={ZoomIn.delay(0).springify()} style={styles.orbContainer}>
            <ReAnimated.View style={[styles.orbRingOuter, orbStyle]} />
            <View style={[styles.orbRingMid, { borderColor: themeColors.primary + '18' }]} />
            <ReAnimated.View style={[styles.pulseWrap, pulseAnimStyle]}>
              <LinearGradient
                colors={[...themeColors.gradients.sunset]}
                style={styles.iconCircle}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Wand2 size={48} color="#FFFFFF" strokeWidth={1.5} />
              </LinearGradient>
            </ReAnimated.View>
          </ReAnimated.View>

          <ReAnimated.View entering={FadeInUp.delay(140).springify()} style={styles.genTitleBlock}>
            <Text style={[styles.genTitle, { color: themeColors.text.primary }]}>
              Creating Your Story
            </Text>
            {locationCtx && (
              <View style={[styles.locationBadge, { backgroundColor: themeColors.primary + '10', borderColor: themeColors.primary + '20' }]}>
                <MapPin size={11} color={themeColors.primary} strokeWidth={2.5} />
                <Text style={[styles.locationBadgeText, { color: themeColors.primary }]}>
                  Set in {formatLocationLabel(locationCtx)}
                </Text>
              </View>
            )}
          </ReAnimated.View>

          <ReAnimated.View entering={FadeInUp.delay(200).springify()} style={styles.activeStepChip}>
            <View style={[styles.activeStepDot, { backgroundColor: themeColors.primary }]} />
            <Text style={[styles.activeStepText, { color: themeColors.text.secondary }]}>
              {status}
            </Text>
          </ReAnimated.View>

          <ReAnimated.View entering={FadeInUp.delay(260).springify()} style={styles.progressWrap}>
            <View style={[styles.progressTrack, { backgroundColor: themeColors.text.light + '18' }]}>
              <LinearGradient
                colors={[...themeColors.gradients.sunset]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${progress}%` }]}
              />
              <View style={[styles.progressShimmer, { width: `${progress}%` }]}>
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.25)', 'transparent']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
            </View>
            <Text style={[styles.progressPct, { color: themeColors.primary }]}>{progress}%</Text>
          </ReAnimated.View>

          <ReAnimated.View
            entering={FadeInUp.delay(320).springify()}
            style={[styles.timelineCard, { backgroundColor: themeColors.cardBackground }]}
          >
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isActive = !step.completed && activeStepIndex === i;
              const isPast = step.completed;
              const isFuture = !step.completed && activeStepIndex !== i;

              return (
                <View key={step.id} style={styles.timelineRow}>
                  <View style={styles.timelineLeft}>
                    <View style={[
                      styles.timelineDot,
                      isPast && { backgroundColor: themeColors.success },
                      isActive && { backgroundColor: themeColors.primary },
                      isFuture && { backgroundColor: themeColors.text.light + '20' },
                    ]}>
                      {isPast
                        ? <Check size={11} color="#FFFFFF" strokeWidth={3} />
                        : <Icon size={11} color={isPast || isActive ? '#FFFFFF' : themeColors.text.light} strokeWidth={2} />
                      }
                    </View>
                    {i < steps.length - 1 && (
                      <View style={[
                        styles.timelineConnector,
                        { backgroundColor: isPast ? themeColors.success + '40' : themeColors.text.light + '15' },
                      ]} />
                    )}
                  </View>

                  <View style={[styles.timelineContent, i < steps.length - 1 && { marginBottom: SPACING.md }]}>
                    <Text style={[
                      styles.timelineLabel,
                      isPast && { color: themeColors.text.secondary },
                      isActive && { color: themeColors.text.primary },
                      isFuture && { color: themeColors.text.light },
                    ]}>
                      {step.label}
                    </Text>
                    {isActive && (
                      <ReAnimated.View entering={FadeInLeft.springify()} style={styles.activePulseRow}>
                        {[0, 1, 2].map(j => (
                          <View key={j} style={[styles.activePulseDot, { backgroundColor: themeColors.primary }]} />
                        ))}
                      </ReAnimated.View>
                    )}
                    {isPast && (
                      <ReAnimated.Text entering={FadeInLeft.springify()} style={[styles.stepDoneText, { color: themeColors.success }]}>
                        Done
                      </ReAnimated.Text>
                    )}
                  </View>
                </View>
              );
            })}
          </ReAnimated.View>

          <ReAnimated.View
            entering={FadeInUp.delay(420).springify()}
            style={[styles.funFactCard, { backgroundColor: themeColors.primary + '09', borderColor: themeColors.primary + '18' }]}
          >
            <Sparkles size={14} color={themeColors.primary} strokeWidth={2} />
            <Text style={[styles.funFact, { color: themeColors.text.secondary }]}>
              {FUN_FACTS[funFactIndex]}
            </Text>
          </ReAnimated.View>

          {longWait && (
            <ReAnimated.View entering={SlideInDown.springify()} style={[styles.longWaitCard, { backgroundColor: themeColors.cardBackground }]}>
              <Wand2 size={16} color={themeColors.primary} strokeWidth={2} />
              <Text style={[styles.longWaitText, { color: themeColors.text.secondary }]}>
                Making it extra special — hang tight!
              </Text>
            </ReAnimated.View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const selectedThemeObj = THEMES.find(t => t.id === selectedTheme)!;
  const locationLabel = formatLocationLabel(locationCtx);

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

          <View style={styles.locationPill}>
            <MapPin size={12} color={locationLoading ? '#94A3B8' : locationLabel ? '#0EA5E9' : '#94A3B8'} strokeWidth={2.5} />
            <Text style={[
              styles.locationPillText,
              { color: locationLoading ? '#94A3B8' : locationLabel ? '#0EA5E9' : '#94A3B8' },
            ]}>
              {locationLoading ? 'Locating...' : locationLabel || 'Location unavailable'}
            </Text>
          </View>
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

        <ReAnimated.View entering={FadeInUp.delay(340).springify()} style={styles.section}>
          <CharacterManager
            profileId={params.profileId as string}
            familyMembers={familyMembers}
            friends={friends}
            onFamilyMembersChange={setFamilyMembers}
            onFriendsChange={setFriends}
          />
        </ReAnimated.View>

        <ReAnimated.View entering={FadeInUp.delay(400).springify()} style={styles.ctaSection}>
          {subscription && subscription.plan === 'free' && (
            <View style={styles.quotaRow}>
              <View style={styles.quotaDot} />
              <Text style={styles.quotaText}>
                {subscription.stories_remaining} free {subscription.stories_remaining === 1 ? 'story' : 'stories'} remaining
              </Text>
            </View>
          )}

          <CtaButton
            gradient={selectedThemeObj.gradient}
            onPress={handleStartGeneration}
          />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.pill,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  locationPillText: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
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
    fontSize: 40,
    fontFamily: FONTS.display,
    color: '#0F172A',
    letterSpacing: -0.5,
    lineHeight: 46,
  },
  pageSubtitle: {
    fontSize: 16,
    fontFamily: FONTS.displayMedium,
    color: '#64748B',
    lineHeight: 24,
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
    fontSize: 15,
    fontFamily: FONTS.displayBold,
    color: '#334155',
    letterSpacing: 0.3,
  },
  sectionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.pill,
  },
  sectionBadgeText: {
    fontSize: 12,
    fontFamily: FONTS.displayBold,
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
  themeCardEmoji: { fontSize: 32 },
  themeCardLabel: {
    fontSize: 12,
    fontFamily: FONTS.displayBold,
    color: '#475569',
  },
  themeCardLabelSelected: {
    fontSize: 12,
    fontFamily: FONTS.display,
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
  moodEmoji: { fontSize: 28 },
  moodLabel: { fontSize: 13, fontFamily: FONTS.displayBold },
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
  lengthEmoji: { fontSize: 26 },
  lengthTitle: {
    fontSize: 14,
    fontFamily: FONTS.displayBold,
  },
  lengthWords: {
    fontSize: 11,
    fontFamily: FONTS.displayMedium,
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
    paddingVertical: 20,
    paddingHorizontal: 48,
    gap: SPACING.sm,
  },
  ctaText: {
    fontSize: 20,
    fontFamily: FONTS.display,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  ctaArrow: {
    marginLeft: 4,
  },
  ctaShimmer: {
    position: 'absolute',
    top: 0, bottom: 0,
    width: 60,
    backgroundColor: 'rgba(255,255,255,0.18)',
    transform: [{ skewX: '-20deg' }],
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
    overflow: 'hidden',
  },
  genAmbientOrb1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    top: -80,
    right: -80,
  },
  genAmbientOrb2: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    bottom: 60,
    left: -80,
  },
  generatingContent: {
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
  },
  orbContainer: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xxl,
  },
  orbRingOuter: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.15)',
    borderStyle: 'dashed',
  },
  orbRingMid: {
    position: 'absolute',
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 1.5,
  },
  pulseWrap: { ...SHADOWS.lg },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genTitleBlock: {
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  genTitle: {
    fontSize: 26,
    fontFamily: FONTS.extrabold,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.pill,
    borderWidth: 1,
  },
  locationBadgeText: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
  },
  activeStepChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: SPACING.xl,
  },
  activeStepDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  activeStepText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    lineHeight: 18,
  },
  progressWrap: {
    width: '100%',
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  progressTrack: {
    height: 9,
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 5,
  },
  progressShimmer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressPct: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  timelineCard: {
    width: '100%',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  timelineRow: {
    flexDirection: 'row',
  },
  timelineLeft: {
    alignItems: 'center',
    width: 32,
    marginRight: SPACING.md,
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    minHeight: SPACING.lg,
    marginTop: 3,
    marginBottom: 3,
    borderRadius: 1,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 5,
    gap: 3,
  },
  timelineLabel: {
    fontSize: 13,
    fontFamily: FONTS.semibold,
    lineHeight: 18,
  },
  activePulseRow: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
    marginTop: 2,
  },
  activePulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    opacity: 0.6,
  },
  stepDoneText: {
    fontSize: 11,
    fontFamily: FONTS.semibold,
    marginTop: 1,
  },
  funFactCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  funFact: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONTS.medium,
    lineHeight: 18,
  },
  longWaitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.xs,
  },
  longWaitText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
});
