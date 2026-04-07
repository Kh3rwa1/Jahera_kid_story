import { AnimatedPressable } from '@/components/AnimatedPressable';
import { Container } from '@/components/Container';
import { ErrorState } from '@/components/ErrorState';
import { FloatingParticles } from '@/components/FloatingParticles';
import { LoadingSkeleton,Skeleton } from '@/components/LoadingSkeleton';
import { MeshBackground } from '@/components/MeshBackground';
import { BORDER_RADIUS,BREAKPOINTS,FONTS,LAYOUT,SHADOWS,SPACING } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';
import { useAudio } from '@/contexts/AudioContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useUI } from '@/contexts/UIContext';
import { useEntranceSequence,useFloat,usePulse,useRotate,useSpringPress } from '@/utils/animations';
import { getTimeOfDay } from '@/utils/contextUtils';
import { getRelativeTime,getSeasonPalette } from '@/utils/dateUtils';
import { getLanguageFlag } from '@/utils/languageUtils';
import { talkative } from '@/utils/talkative';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect,useRouter } from 'expo-router';
import { ArrowRight,Award,BookOpen,ChevronRight,Clock,Crown,Globe,Play,Sparkles,TrendingUp,Users,Wand as Wand2 } from 'lucide-react-native';
import React,{ useCallback,useEffect,useMemo,useRef } from 'react';
import {
Platform,
RefreshControl,
ScrollView,
StyleProp,
StyleSheet,
Text,
TextStyle,
TouchableOpacity,
View,
ViewStyle,
useWindowDimensions
} from 'react-native';
import Animated,{
Easing,
FadeIn,
FadeInDown,
FadeInRight,
cancelAnimation,
interpolate,
useAnimatedStyle,
useSharedValue,
withRepeat,
withSpring,
withTiming
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const DISCOVERY_TAGS = [
  { label: 'Space Adventure', emoji: '🚀', theme: 'Space' },
  { label: 'Dino World', emoji: '🦖', theme: 'Animals' },
  { label: 'Deep Ocean', emoji: '🐳', theme: 'Ocean' },
  { label: 'Magic Kingdom', emoji: '🏰', theme: 'Fantasy' },
  { label: 'Mystery Forest', emoji: '🌲', theme: 'Nature' },
  { label: 'Super Powers', emoji: '⚡', theme: 'Superheroes' },
];

function getSecureRandomIndex(length: number): number {
  if (length <= 0) return 0;
  if (!globalThis.crypto?.getRandomValues) return 0;
  const randomValues = new Uint32Array(1);
  globalThis.crypto.getRandomValues(randomValues);
  return randomValues[0] % length;
}


function getGreeting(name: string): { line1: string; line2: string } {
  const tod = getTimeOfDay(new Date());
  const firstName = (name || 'Friend').split(' ')[0];
  switch (tod) {
    case 'morning':
      return { line1: 'Good morning,', line2: `${firstName} ☀️` };
    case 'afternoon':
      return { line1: 'Hey there,', line2: `${firstName} 🌈` };
    case 'evening':
      return { line1: 'Good evening,', line2: `${firstName} 🌙` };
    case 'night':
      return { line1: 'Sweet dreams,', line2: `${firstName} ⭐` };
    default:
      return { line1: 'Welcome back,', line2: `${firstName} ✨` };
  }
}

function FloatAnim({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const floatStyle = useFloat(7, 2800, delay);
  return <Animated.View style={floatStyle}>{children}</Animated.View>;
}

function HeroShimmer({ styles }: { styles: { shimmerOverlay: StyleProp<ViewStyle> } }) {
  const x = useSharedValue(-1);
  useEffect(() => {
    x.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(x);
  }, []);
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(x.value, [-1, 1], [-400, 400]) }],
  }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
      <Animated.View style={[styles.shimmerOverlay, shimmerStyle]} />
    </Animated.View>
  );
}

function AnimatedStreakChip({ count, styles }: { count: number; styles: { streakChip: StyleProp<ViewStyle>; streakChipText: StyleProp<TextStyle> } }) {
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);
  const pulseStyle = usePulse(0.95, 1.05);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 120 });
    opacity.value = withTiming(1, { duration: 300 });
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  return (
    <Animated.View style={[styles.streakChip, { backgroundColor: '#FFF3E0' }, style, pulseStyle]}>
      <Animated.Text style={styles.streakChipText}>🔥 {count}</Animated.Text>
    </Animated.View>
  );
}

interface StatsTickerProps {
  stories: number;
  languages: number;
  characters: number;
  primaryColor: string;
  cardBackground: string;
  textPrimary: string;
  textSecondary: string;
  styles: any;
}

function StatsTicker({ stories, languages, characters, primaryColor, cardBackground, textPrimary, textSecondary, styles }: Readonly<StatsTickerProps>) {
  const translateX = useSharedValue(0);
  const halfWidth = useSharedValue(0);
  const ready = useRef(false);

  const baseItems = [
    { value: stories, label: 'Stories', icon: <BookOpen size={13} color={primaryColor} strokeWidth={2} />, color: primaryColor },
    { value: languages, label: 'Languages', icon: <Globe size={13} color="#F59E0B" strokeWidth={2} />, color: '#F59E0B' },
    { value: characters, label: 'Characters', icon: <Users size={13} color="#10B981" strokeWidth={2} />, color: '#10B981' },
  ];
  const items = [...baseItems, ...baseItems, ...baseItems, ...baseItems];

  const startAnimation = useCallback((hw: number) => {
    cancelAnimation(translateX);
    translateX.value = 0;
    const SPEED = 45;
    const duration = (hw / SPEED) * 1000;
    translateX.value = withRepeat(
      withTiming(-hw, { duration, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(220).springify()}
      style={styles.statsTickerWrapper}
    >
      <Animated.View
        style={[styles.statsTickerTrack, animStyle]}
        onLayout={(e) => {
          const totalW = e.nativeEvent.layout.width;
          const hw = totalW / 2;
          if (hw > 0 && !ready.current) {
            ready.current = true;
            halfWidth.value = hw;
            startAnimation(hw);
          }
        }}
      >
        {items.map((s, i) => (
          <View key={i} style={[styles.statsTickerPill, { backgroundColor: cardBackground }]}>
            <View style={[styles.statsTickerIcon, { backgroundColor: s.color + '20' }]}>
              {s.icon}
            </View>
            <Text style={[styles.statsTickerVal, { color: textPrimary }]}>{s.value}</Text>
            <Text style={[styles.statsTickerLbl, { color: textSecondary }]}>{s.label}</Text>
          </View>
        ))}
      </Animated.View>
    </Animated.View>
  );
}

const QuickActionItem = React.memo(function QuickActionItem({ item, index, styles }: { item: { icon: React.ReactNode; label: string; sublabel: string; grad: [string, string]; onPress: () => void; textPrimary: string; textSecondary: string }; index: number; styles: any }) {
  const entranceStyle = useEntranceSequence(index, 160, 60);
  const { style: pressStyle, onPressIn, onPressOut } = useSpringPress();

  return (
    <Animated.View style={[styles.quickItem, entranceStyle]}>
      <Animated.View style={pressStyle}>
        <TouchableOpacity
          onPress={item.onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          activeOpacity={1}
          style={styles.quickCard}
        >
          <LinearGradient colors={item.grad} style={styles.quickIconCircle}>
            {item.icon}
          </LinearGradient>
          <Text style={[styles.quickLabel, { color: item.textPrimary }]}>{item.label}</Text>
          <Text style={[styles.quickSublabel, { color: item.textSecondary }]}>{item.sublabel}</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
});

const QuickActions = React.memo(function QuickActions({ 
  handleLastStory, 
  handleGenerateStory, 
  storiesCount, 
  textPrimary, 
  textSecondary, 
  onLibrary, 
  continueStory,
  activeStoryId,
  isPlaying,
  playPause,
  styles 
}: {
  handleLastStory: () => void;
  handleGenerateStory: () => void;
  storiesCount: number;
  textPrimary: string;
  textSecondary: string;
  onLibrary: () => void;
  continueStory?: { id: string; title: string; progress: number } | null;
  activeStoryId?: string | null;
  isPlaying: boolean;
  playPause: () => Promise<void>;
  styles: any;
}) {
  const { currentTheme } = useTheme();
  const C = currentTheme.colors;

  const isCurrentActive = activeStoryId === continueStory?.id;

  const actions = useMemo(() => [
    { 
      icon: (isCurrentActive && isPlaying) 
        ? <View style={{ width: 26, height: 26, flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
            <View style={{ width: 8, height: 26, backgroundColor: '#FFF', borderRadius: 2 }} />
            <View style={{ width: 8, height: 26, backgroundColor: '#FFF', borderRadius: 2 }} />
          </View>
        : <Play size={26} color="#FFFFFF" fill="#FFFFFF" strokeWidth={0} />, 
      label: isCurrentActive ? (isPlaying ? 'Pause' : 'Resume') : (continueStory ? 'Continue' : 'Play'), 
      sublabel: continueStory ? (continueStory.title.length > 12 ? continueStory.title.substring(0, 10) + '...' : continueStory.title) : 'Last story', 
      grad: (isCurrentActive && isPlaying) ? (['#EC4899', '#8B5CF6'] as [string, string]) : (['#6366F1', '#4F46E5'] as [string, string]), 
      onPress: isCurrentActive ? playPause : handleLastStory, 
      textPrimary, 
      textSecondary 
    },
    { icon: <Sparkles size={26} color="#FFFFFF" strokeWidth={2.5} />, label: 'Create', sublabel: 'New story', grad: ['#F59E0B', '#D97706'] as [string, string], onPress: handleGenerateStory, textPrimary, textSecondary },
    { icon: <TrendingUp size={26} color="#FFFFFF" strokeWidth={2.5} />, label: 'Library', sublabel: `${storiesCount} stories`, grad: ['#10B981', '#059669'] as [string, string], onPress: onLibrary, textPrimary, textSecondary },
  ], [handleLastStory, handleGenerateStory, storiesCount, textPrimary, textSecondary, onLibrary, continueStory, isCurrentActive, isPlaying, playPause]);

  return (
    <View style={styles.quickWrapper}>
      <View style={[styles.quickBg, { backgroundColor: C.cardBackground, borderColor: C.text.light + '15' }]} />
      <View style={styles.quickRow}>
        {actions.map((a, i) => (
          <QuickActionItem key={a.label} item={a} index={i} styles={styles} />
        ))}
      </View>
    </View>
  );
});

export default function HomeScreen() {
  const { width: winWidth } = useWindowDimensions();
  const isTablet = winWidth >= BREAKPOINTS.tablet;
  const isDesktop = winWidth >= BREAKPOINTS.desktop;
  
  const heroActionPulse = usePulse(0.97, 1.05);
  const wizardFloat = useFloat(6, 2000);
  const sparkleRotate = useRotate(8000);
  
  // Dynamic card width for the carousel
  const CARD_W = useMemo(() => {
    if (winWidth >= 1280) return 340;
    if (isDesktop) return 310;
    if (isTablet) return 290;
    return winWidth * 0.72;
  }, [winWidth, isTablet, isDesktop]);

  const router = useRouter();
  const { currentTheme } = useTheme();
  const C = currentTheme.colors;
  const { profile, stories, isLoading, error, refreshAll, subscription, streak } = useApp();
  const { wakeUI } = useUI();
  const { activeStory, isPlaying, playPause, loadAndPlayAudio } = useAudio();

  const styles = useStyles(C, isTablet, isDesktop);

  const isFocused = useIsFocused();
  const [continueStory, setContinueStory] = React.useState<{ id: string; title: string; progress: number } | null>(null);
  const [sound, setSound] = React.useState<Audio.Sound | null>(null);

  // Fetch continue story metadata
  useEffect(() => {
    if (!isFocused || !stories || stories.length === 0) {
      setContinueStory(null);
      return;
    }

    const checkProgress = async () => {
      try {
        const lastId = await AsyncStorage.getItem('last_active_story_id');
        if (lastId) {
          const progressData = await AsyncStorage.getItem(`story_progress_${lastId}`);
          if (progressData) {
            const { position, duration, title } = JSON.parse(progressData);
            // If it's between 1% and 98% complete, it's a good candidate for "Continue"
            const pct = duration > 0 ? (position / duration) * 100 : 0;
            if (pct > 1 && pct < 98) {
              setContinueStory((prev) => {
                if (prev?.id === lastId && Math.abs(prev.progress - pct) < 0.1) return prev;
                return { id: lastId, title, progress: pct };
              });
            } else {
              setContinueStory((prev) => prev === null ? prev : null);
            }
          }
        }
      } catch (e) {
        console.warn('[home] Error checking story progress:', e);
      }
    };

    checkProgress();
  }, [isFocused, stories]);

  useEffect(() => {
    return () => {
      if (sound) { sound.unloadAsync().catch(() => {}); }
    };
  }, [sound]);

  // Welcome Narration
  useEffect(() => {
    if (profile && !isLoading) {
      const greeting = getGreeting(profile.kid_name || 'Friend');
      const text = `${greeting.line1} ${profile.kid_name || 'my friend'}! Ready for a new story?`;
      const timer = setTimeout(() => talkative.speak(text, profile.primary_language || 'en'), 1500);
      return () => clearTimeout(timer);
    }
  }, [profile?.id, isLoading]);

  const handleRefresh = useCallback(async () => { await refreshAll(); }, [refreshAll]);

  const handleGenerateStory = useCallback(async () => {
    if (!profile) return;
    talkative.speak("Let's make some magic!", profile.primary_language || 'en');
    router.push({ pathname: '/story/generate', params: { profileId: profile.id, languageCode: profile.primary_language } });
  }, [profile, router]);

  const handleStoryPress = useCallback((storyId: string) => {
    router.push({ pathname: '/story/playback', params: { storyId } });
  }, [router]);

  const handleLastStory = useCallback(() => {
    // If it's already active, just play it
    if (activeStory && continueStory && activeStory.id === continueStory.id) {
      playPause();
      return;
    }

    if (continueStory) {
      // Find the full story object
      const fullStory = stories.find(s => s.id === continueStory.id);
      if (fullStory) {
        loadAndPlayAudio(fullStory);
      } else {
        handleStoryPress(continueStory.id);
      }
    } else if (stories && stories.length > 0) {
      loadAndPlayAudio(stories[0]);
    }
  }, [continueStory, stories, handleStoryPress, activeStory, playPause, loadAndPlayAudio]);

  const handleRandomStory = useCallback(() => {
    if (stories && stories.length > 0) {
      const randomIndex = getSecureRandomIndex(stories.length);
      handleStoryPress(stories[randomIndex].id);
    } else {
      // For new users, "Surprise Me" means "Make a random story"
      router.push({ 
        pathname: '/story/generate', 
        params: { 
          profileId: profile?.id, 
          languageCode: profile?.primary_language,
          surprise: 'true' 
        } 
      });
    }
  }, [stories, handleStoryPress, profile, router]);

  const recentStories = useMemo(() => (stories || []).slice(0, 10), [stories]);

  if (isLoading) {
    return (
      <Container 
        maxWidth 
        gradient 
        gradientColors={C.backgroundGradient}
        safeAreaEdges={['top']}
        scroll
        scrollProps={{
          contentContainerStyle: styles.scrollContent
        }}
      >
        <MeshBackground primaryColor={C.primary} />
        <FloatingParticles count={15} />

        {/* Header Skeleton */}
        <View style={styles.topBar}>
          <Skeleton width={180} height={32} borderRadius={8} color="rgba(0,0,0,0.08)" />
          <View style={styles.topBarRight}>
            <Skeleton width={60} height={32} borderRadius={16} color="rgba(0,0,0,0.05)" />
          </View>
        </View>

        {/* Hero Skeleton */}
        <View style={styles.heroWrap}>
          <Skeleton width="100%" height={240} borderRadius={32} color="rgba(0,0,0,0.08)" />
        </View>

        {/* Quick Actions Skeleton */}
        <View style={styles.section}>
          <LoadingSkeleton type="quick-actions" count={1} />
        </View>

        {/* Stats Skeleton */}
        <View style={styles.section}>
          <Skeleton width="100%" height={50} borderRadius={25} color="rgba(0,0,0,0.04)" />
        </View>

        {/* Discovery Skeleton */}
        <View style={styles.section}>
           <Skeleton width={150} height={20} borderRadius={4} style={{ marginBottom: 12 }} color="rgba(0,0,0,0.08)" />
           <View style={{ flexDirection: 'row', gap: 12 }}>
              <Skeleton width={120} height={40} borderRadius={20} color="rgba(0,0,0,0.05)" />
              <Skeleton width={120} height={40} borderRadius={20} color="rgba(0,0,0,0.05)" />
              <Skeleton width={120} height={40} borderRadius={20} color="rgba(0,0,0,0.05)" />
           </View>
        </View>

        {/* Stories Skeleton */}
        <View style={styles.section}>
           <Skeleton width={120} height={24} borderRadius={4} style={{ marginBottom: 16 }} color="rgba(0,0,0,0.1)" />
           <View style={{ flexDirection: 'row', gap: 16 }}>
              <LoadingSkeleton type="card" count={3} />
           </View>
        </View>
      </Container>
    );
  }

  if (error || !profile) {
    if (!profile && !error) {
      return <Redirect href="/onboarding/language-selection" />;
    }
    
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: C.background }]} edges={['top']}>
        <LinearGradient colors={C.backgroundGradient} style={StyleSheet.absoluteFill} />
        <ErrorState type="general" title="Unable to Load" message={error || 'Failed to load your profile.'} onRetry={refreshAll} onGoHome={() => router.replace('/')} />
      </SafeAreaView>
    );
  }

  const { line1, line2 } = getGreeting(profile.kid_name || 'Friend');
  const storiesLeft = subscription?.stories_remaining ?? 0;
  const isPro = subscription?.plan !== 'free';

  return (
    <Container 
      maxWidth 
      gradient 
      gradientColors={C.backgroundGradient}
      safeAreaEdges={['top']}
      scroll
      scrollProps={{
        onScroll: wakeUI,
        scrollEventThrottle: 16,
        refreshControl: <RefreshControl refreshing={false} onRefresh={handleRefresh} tintColor={C.primary} />,
        contentContainerStyle: styles.scrollContent
      }}
    >
      <MeshBackground primaryColor={C.primary} />
      <FloatingParticles count={15} />

      {/* ─── TOP BAR ─── */}
      <Animated.View entering={FadeIn.delay(40)} style={[styles.topBar, { backgroundColor: C.cardBackground + '90' }]}>
        <TouchableOpacity style={styles.avatarRow} onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.85}>
          <View style={styles.greetBlock}>
            <Text style={[styles.greetLine2, { color: C.text.primary, fontSize: isTablet ? 28 : 24 }]} numberOfLines={1}>
              <Text style={{ fontFamily: FONTS.displayMedium, color: C.text.secondary }}>{line1} </Text>
              {line2}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.topBarRight}>
          {streak && streak.current_streak > 0 && <AnimatedStreakChip count={streak.current_streak} styles={styles} />}
        </View>
      </Animated.View>

      {/* ─── HERO SECTION ─── */}
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.heroWrap}>
        <TouchableOpacity activeOpacity={0.97} onPress={handleRandomStory}>
          <LinearGradient colors={[C.primary, C.primaryDark] as [string, string]} style={styles.heroCard}>
            <HeroShimmer styles={styles} />
            <View style={[styles.orb, styles.orbTL, { backgroundColor: 'rgba(255,255,255,0.12)' }]} />
            <View style={[styles.orb, styles.orbBR, { backgroundColor: 'rgba(0,0,0,0.06)' }]} />
            
            <View style={styles.heroBodyInner}>
              <View style={styles.heroMain}>
                <View style={styles.heroBadge}>
                  <Sparkles size={isTablet ? 14 : 12} color="#FFF" />
                  <Text style={styles.heroBadgeText}>Create a Story</Text>
                </View>
                <Text style={styles.heroH1}>Magic Story Maker</Text>
                <Text style={styles.heroSub}>Let's weave a wonderful tale together!</Text>
                
                <Animated.View style={[styles.heroActionBtn, heroActionPulse]}>
                  <Wand2 size={isTablet ? 18 : 16} color="#0F172A" />
                  <Text style={styles.heroActionBtnText}>Surprise Me</Text>
                </Animated.View>
              </View>

              <View style={styles.heroVisual}>
                <Animated.Text style={[styles.heroLargeEmoji, wizardFloat]}>🧙‍♂️</Animated.Text>
                <Animated.View style={[styles.heroSparkleTrack, sparkleRotate]}>
                  <Text style={styles.heroSpk}>✨</Text>
                </Animated.View>
              </View>
            </View>

            <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.08)']} style={styles.heroStrip}>
              <View style={styles.heroStripItem}>
                <Clock size={isTablet ? 14 : 12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.heroStripText}>2 min story</Text>
              </View>
              <View style={styles.heroStripDot} />
              <View style={styles.heroStripItem}>
                <Award size={isTablet ? 14 : 12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.heroStripText}>Earn badges</Text>
              </View>
            </LinearGradient>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* ─── QUICK ACTIONS ─── */}
      <QuickActions 
        handleLastStory={handleLastStory} 
        handleGenerateStory={handleGenerateStory}
        storiesCount={stories?.length || 0}
        textPrimary={C.text.primary}
        textSecondary={C.text.secondary}
        onLibrary={() => router.push('/(tabs)/history')}
        continueStory={continueStory}
        activeStoryId={activeStory?.id}
        isPlaying={isPlaying}
        playPause={playPause}
        styles={styles}
      />

      {/* ─── STATS TICKER ─── */}
      <StatsTicker 
        stories={stories?.length || 0}
        languages={4}
        characters={(profile.family_members?.length || 0) + (profile.friends?.length || 0)}
        primaryColor={C.primary}
        cardBackground={C.cardBackground}
        textPrimary={C.text.primary}
        textSecondary={C.text.secondary}
        styles={styles}
      />

      {/* ─── DISCOVERY SECTION ─── */}
      <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.discoverySection}>
        <Text style={[styles.discoveryTitle, { color: C.text.light }]}>DISCOVER ADVENTURES</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.discoveryScroll}
        >
          {DISCOVERY_TAGS.map((tag, i) => (
            <TouchableOpacity
              key={tag.label}
              onPress={handleGenerateStory}
              activeOpacity={0.7}
              style={[styles.discoveryChip, { backgroundColor: C.cardBackground, borderColor: C.text.light + '15' }]}
            >
              <Text style={styles.discoveryEmoji}>{tag.emoji}</Text>
              <Text style={[styles.discoveryLabel, { color: C.text.primary }]}>{tag.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* ─── RECENT STORIES ─── */}
      <View style={styles.section}>
        <View style={styles.secHeader}>
          <Text style={[styles.secTitle, { color: C.text.primary }]}>Recent Stories</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/history')} style={[styles.seeAllBtn, { backgroundColor: C.primary + '10' }]}>
            <Text style={[styles.seeAllText, { color: C.primary }]}>See All</Text>
            <ArrowRight size={13} color={C.primary} strokeWidth={3} />
          </TouchableOpacity>
        </View>

        {recentStories.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={[styles.emptyCard, { backgroundColor: C.cardBackground }]}>
              <View style={styles.emptyIconRing}>
                <Text style={styles.emptyEmoji}>✨</Text>
              </View>
              <Text style={[styles.emptyTitle, { color: C.text.primary }]}>No stories yet!</Text>
              <Text style={[styles.emptySub, { color: C.text.secondary }]}>Create your first adventure story{'\n'}with {profile.kid_name}.</Text>
              <TouchableOpacity
                onPress={handleGenerateStory}
                activeOpacity={0.8}
              >
                <LinearGradient colors={[C.primary, C.primaryDark] as [string, string]} style={styles.emptyAction} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Sparkles size={18} color="#FFFFFF" />
                  <Text style={styles.emptyActionText}>Start Creating</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carousel}
            snapToInterval={CARD_W + SPACING.md}
            decelerationRate="fast"
          >
            {recentStories?.map((story, i) => {
              const palette = getSeasonPalette(story.season, C.primary, story.theme);
              return (
                <Animated.View key={story.id} entering={FadeInRight.delay(400 + i * 100).springify()}>
                  <AnimatedPressable onPress={() => handleStoryPress(story.id)} style={{ width: CARD_W }}>
                    <View style={[styles.storyCard, { backgroundColor: C.cardBackground, height: isTablet ? 280 : 260 }]}>
                      <LinearGradient colors={palette.colors} style={styles.storyArt}>
                        <Text style={styles.storyArtEmoji}>{story.theme === 'Space' ? '🚀' : story.theme === 'Animals' ? '🦁' : '📖'}</Text>
                        <View style={styles.storyBadgesTop}>
                          <View style={styles.storyFlagBadge}>
                            <Text style={styles.storyFlag}>{getLanguageFlag(story.language_code)}</Text>
                          </View>
                        </View>
                        {story.audio_url && (
                            <View style={[styles.storyPlayBtn, { backgroundColor: 'rgba(255,255,255,0.9)' }]}>
                              <Play size={14} color={palette.accent} fill={palette.accent} />
                            </View>
                        )}
                      </LinearGradient>
                      <View style={styles.storyContent}>
                        <Text style={[styles.storyTitle, { color: C.text.primary }]} numberOfLines={2}>
                          {story.title}
                        </Text>
                        <View style={styles.storyMeta}>
                          <View style={[styles.seasonTag, { backgroundColor: palette.colors[0] + '15' }]}>
                            <Text style={[styles.seasonTagText, { color: palette.accent }]}>{story.season || 'Story'}</Text>
                          </View>
                          <Text style={[styles.storyMetaText, { color: C.text.light }]}>
                            {getRelativeTime(story.generated_at)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </AnimatedPressable>
                </Animated.View>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* ─── PREMIUM UPGRADE ─── */}
      {!isPro && (
        <Animated.View entering={FadeInDown.delay(600).springify()}>
          <TouchableOpacity
            onPress={() => router.push('/paywall')}
            activeOpacity={0.9}
            style={styles.premiumBannerWrap}
          >
            <LinearGradient colors={['#1E293B', '#0F172A']} style={styles.premiumBanner}>
              <View style={styles.premiumGlowRow}>
                <View style={styles.premiumIconBox}>
                  <Crown size={24} color="#F59E0B" strokeWidth={2} />
                </View>
                <View style={styles.premiumBody}>
                  <Text style={styles.premiumTitle}>Unlock Pro Features</Text>
                  <Text style={styles.premiumDesc}>Unlimited high-quality stories, voices, and creative themes.</Text>
                </View>
                <View style={styles.premiumAction}>
                  <Text style={styles.premiumActionText}>GO PRO</Text>
                  <ChevronRight size={14} color="#0F172A" strokeWidth={3} />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}

    </Container>
  );
}

const useStyles = (C: any, isTablet: boolean, isDesktop: boolean) => {
  return useMemo(() => StyleSheet.create({
    root: { flex: 1 },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 100 },
    loadingWrap: { padding: SPACING.xl, gap: SPACING.xl },

    /* Navigation Bar */
    topBar: {
      paddingHorizontal: isTablet ? SPACING.xxl : SPACING.xl,
      paddingTop: isTablet ? SPACING.xl : SPACING.lg,
      paddingBottom: SPACING.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    avatarRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
    avatarContainer: { position: 'relative' },
    avatarStatus: {
      position: 'absolute', bottom: 1, right: 1,
      width: 12, height: 12, borderRadius: 6,
      borderWidth: 2, borderColor: '#FFFFFF',
    },
    greetBlock: { gap: 0 },
    greetLine1: { fontSize: isTablet ? 15 : 13, fontFamily: FONTS.displayMedium, opacity: 0.8 },
    greetLine2: { fontSize: isTablet ? 36 : 30, fontFamily: FONTS.display, letterSpacing: -0.8 },
    topBarRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    iconBtn: {
      width: isTablet ? 52 : 44, height: isTablet ? 52 : 44, borderRadius: isTablet ? 26 : 22,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1.5,
      ...SHADOWS.xs,
    },
    streakChip: {
      paddingHorizontal: 12, paddingVertical: 8,
      borderRadius: BORDER_RADIUS.pill,
      flexDirection: 'row', alignItems: 'center',
      ...SHADOWS.xs,
    },
    streakChipText: { fontSize: 16, fontFamily: FONTS.displayBold, color: '#F97316' },

    /* Hero Section */
    heroWrap: { 
      paddingHorizontal: isTablet ? SPACING.xxl : SPACING.xl, 
      marginBottom: isTablet ? SPACING.xxxl : SPACING.xxl, 
      marginTop: isTablet ? SPACING.xl : SPACING.md,
      maxWidth: LAYOUT.maxWidth,
      alignSelf: 'center',
      width: '100%',
    },
    heroCard: {
      borderRadius: 36,
      minHeight: isTablet ? 300 : 220,
      overflow: 'hidden',
      position: 'relative',
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.15)',
      ...SHADOWS.lg,
    },
    orb: { position: 'absolute', borderRadius: 999 },
    orbTL: { width: 160, height: 160, top: -40, left: -40 },
    orbBR: { width: 200, height: 200, bottom: -60, right: -60 },
    heroBodyInner: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: isTablet ? SPACING.xxxl + 8 : SPACING.xxl,
      paddingBottom: isTablet ? SPACING.xxl : SPACING.lg,
      gap: isTablet ? SPACING.xxl : SPACING.lg,
      zIndex: 2,
    },
    heroMain: { flex: 1, gap: isTablet ? SPACING.md : SPACING.sm },
    heroBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 10, paddingVertical: 6,
      borderRadius: BORDER_RADIUS.pill,
      backgroundColor: 'rgba(255,255,255,0.22)',
      alignSelf: 'flex-start',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
      marginBottom: 4,
    },
    heroBadgeText: { fontSize: isTablet ? 12 : 10, fontFamily: FONTS.displayBold, color: '#FFFFFF', letterSpacing: 0.5, textTransform: 'uppercase' },
    heroH1: { fontSize: isTablet ? 56 : 42, fontFamily: FONTS.display, color: '#FFFFFF', letterSpacing: -1.2, lineHeight: isTablet ? 56 : 42 },
    heroSub: { fontSize: isTablet ? 18 : 15, fontFamily: FONTS.displayMedium, color: 'rgba(255,255,255,0.92)', lineHeight: isTablet ? 24 : 20 },
    heroActionBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 7,
      backgroundColor: '#FFFFFF',
      paddingHorizontal: isTablet ? 24 : 18, paddingVertical: isTablet ? 16 : 13,
      borderRadius: BORDER_RADIUS.pill,
      marginTop: 12,
      alignSelf: 'flex-start',
      ...SHADOWS.md,
    },
    heroActionBtnText: { fontSize: isTablet ? 18 : 16, fontFamily: FONTS.displayBold, color: '#0F172A' },
    heroVisual: { alignItems: 'center', justifyContent: 'center', paddingRight: isTablet ? 20 : 0 },
    heroLargeEmoji: { fontSize: isTablet ? 100 : 72 },
    heroSparkleTrack: { position: 'absolute', width: '100%', height: '100%', alignItems: 'center' },
    heroSpk: { fontSize: isTablet ? 28 : 20, position: 'absolute', top: 0, right: -15 },
    heroStrip: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: isTablet ? SPACING.xxxl : SPACING.xxl, paddingVertical: 14,
      gap: SPACING.lg,
      zIndex: 1,
    },
    heroStripItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    heroStripText: { fontSize: isTablet ? 14 : 13, fontFamily: FONTS.displayMedium, color: 'rgba(255,255,255,0.85)' },
    heroStripDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)' },

    /* Quick actions */
    quickWrapper: {
      marginHorizontal: isTablet ? SPACING.xxl : SPACING.xl,
      marginBottom: isTablet ? SPACING.xxxl : SPACING.xxl,
      position: 'relative',
    },
    quickBg: {
      position: 'absolute',
      left: 0, right: 0, top: 0, bottom: 0,
      borderRadius: BORDER_RADIUS.xxl,
      borderWidth: 1.5,
      ...SHADOWS.sm,
    },
    quickRow: {
      flexDirection: 'row',
      paddingVertical: isTablet ? SPACING.xl : SPACING.lg,
      paddingHorizontal: isTablet ? SPACING.xl : SPACING.md,
      gap: isTablet ? SPACING.xl : SPACING.xs,
    },
    quickItem: { flex: 1 },
    quickCard: {
      alignItems: 'center',
      gap: isTablet ? 12 : 8,
      paddingVertical: SPACING.md,
    },
    quickIconCircle: {
      width: isTablet ? 72 : 60, height: isTablet ? 72 : 60, borderRadius: isTablet ? 36 : 30,
      alignItems: 'center', justifyContent: 'center',
      ...SHADOWS.md,
    },
    quickLabel: { fontSize: isTablet ? 17 : 16, fontFamily: FONTS.displayBold, textAlign: 'center' },
    quickSublabel: { fontSize: isTablet ? 13 : 12, fontFamily: FONTS.displayMedium, textAlign: 'center', opacity: 0.7 },

    /* Stats Ticker */
    statsTickerWrapper: {
      overflow: 'hidden',
      marginBottom: isTablet ? SPACING.xxxl : SPACING.xxl,
      height: isTablet ? 90 : 70,
      justifyContent: 'center',
    },
    statsTickerTrack: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
      paddingHorizontal: SPACING.md,
    },
    statsTickerPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: isTablet ? 28 : 20,
      paddingVertical: isTablet ? 18 : 14,
      borderRadius: BORDER_RADIUS.pill,
      gap: 12,
      ...SHADOWS.sm,
    },
    statsTickerIcon: {
      width: isTablet ? 44 : 34, height: isTablet ? 44 : 34, borderRadius: isTablet ? 22 : 17,
      alignItems: 'center', justifyContent: 'center',
    },
    statsTickerVal: { fontSize: isTablet ? 24 : 20, fontFamily: FONTS.display, letterSpacing: -0.3 },
    statsTickerLbl: { fontSize: isTablet ? 16 : 14, fontFamily: FONTS.displayMedium },

    /* Discovery Section */
    discoverySection: { marginBottom: isTablet ? SPACING.xxl : SPACING.xl + 4 },
    discoveryTitle: { 
      fontSize: isTablet ? 15 : 14, 
      fontFamily: FONTS.displayBold, 
      paddingHorizontal: isTablet ? SPACING.xxl : SPACING.xl, 
      marginBottom: SPACING.md, 
      letterSpacing: 1.2, 
      opacity: 0.8 
    },
    discoveryScroll: { paddingHorizontal: isTablet ? SPACING.xxl : SPACING.xl, gap: SPACING.md },
    discoveryChip: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: isTablet ? 22 : 18, paddingVertical: isTablet ? 18 : 16,
      borderRadius: BORDER_RADIUS.pill,
      borderWidth: 1.5,
      ...SHADOWS.sm,
      // Frosted glass effect
      ...(Platform.OS !== 'web' ? { shadowColor: C.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 } : {}),
    },
    discoveryEmoji: { fontSize: isTablet ? 24 : 22 },
    discoveryLabel: { fontSize: isTablet ? 18 : 16, fontFamily: FONTS.displayBold },

    /* Sections */
    section: { marginBottom: isTablet ? SPACING.xxxl : SPACING.xxl },
    secHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: isTablet ? SPACING.xxl : SPACING.xl, marginBottom: SPACING.lg,
    },
    secTitle: { fontSize: isTablet ? 32 : 28, fontFamily: FONTS.display, letterSpacing: -0.6 },
    seeAllBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingHorizontal: 16, paddingVertical: 9, borderRadius: BORDER_RADIUS.pill,
    },
    seeAllText: { fontSize: 15, fontFamily: FONTS.displayBold },

    /* Carousel */
    carousel: { paddingHorizontal: isTablet ? SPACING.xxl : SPACING.xl, gap: SPACING.md },
    storyCard: {
      borderRadius: 28, overflow: 'hidden', ...SHADOWS.md,
      borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.06)',
    },
    storyArt: { width: '100%', height: isTablet ? 170 : 155, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    storyArtEmoji: { fontSize: isTablet ? 80 : 68 },
    storyBadgesTop: { position: 'absolute', top: 12, left: 12 },
    storyFlagBadge: { width: isTablet ? 44 : 36, height: isTablet ? 44 : 36, borderRadius: isTablet ? 22 : 18, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center', ...SHADOWS.xs },
    storyFlag: { fontSize: isTablet ? 22 : 18 },
    storyPlayBtn: {
      position: 'absolute', bottom: 12, right: 12,
      width: isTablet ? 44 : 36, height: isTablet ? 44 : 36, borderRadius: isTablet ? 22 : 18,
      alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm,
    },
    storyContent: { padding: SPACING.lg, gap: 8 },
    storyTitle: { fontSize: isTablet ? 20 : 18, fontFamily: FONTS.displayBold, lineHeight: isTablet ? 26 : 24 },
    storyMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    seasonTag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: BORDER_RADIUS.pill },
    seasonTagText: { fontSize: 13, fontFamily: FONTS.displayBold },
    storyMetaText: { fontSize: 13, fontFamily: FONTS.displayMedium },

    /* Empty state */
    emptyWrap: { paddingHorizontal: isTablet ? SPACING.xxl : SPACING.xl },
    emptyCard: { borderRadius: 32, padding: isTablet ? 60 : SPACING.xxxl, alignItems: 'center', gap: SPACING.lg, ...SHADOWS.sm, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
    emptyIconRing: { width: isTablet ? 120 : 90, height: isTablet ? 120 : 90, borderRadius: isTablet ? 60 : 45, backgroundColor: '#FFF9E6', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FBBF2430' },
    emptyEmoji: { fontSize: isTablet ? 60 : 44 },
    emptyTitle: { fontSize: isTablet ? 32 : 24, fontFamily: FONTS.display, letterSpacing: -0.5 },
    emptySub: { fontSize: isTablet ? 18 : 14, fontFamily: FONTS.displayMedium, textAlign: 'center', lineHeight: isTablet ? 26 : 22, opacity: 0.7 },
    emptyAction: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 32, paddingVertical: 18, borderRadius: BORDER_RADIUS.pill, marginTop: 12, ...SHADOWS.md },
    emptyActionText: { fontSize: 18, fontFamily: FONTS.displayBold, color: '#FFFFFF' },

    /* Premium Banner */
    premiumBannerWrap: { paddingHorizontal: isTablet ? SPACING.xxl : SPACING.xl, marginBottom: SPACING.xxxl },
    premiumBanner: {
      borderRadius: 24, padding: isTablet ? SPACING.xxl : SPACING.xl, overflow: 'hidden', ...SHADOWS.lg,
    },
    premiumGlowRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg },
    premiumIconBox: { width: isTablet ? 64 : 50, height: isTablet ? 64 : 50, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    premiumBody: { flex: 1, gap: 4 },
    premiumTitle: { fontSize: isTablet ? 24 : 18, fontFamily: FONTS.display, color: '#FFFFFF' },
    premiumDesc: { fontSize: isTablet ? 14 : 12, fontFamily: FONTS.displayMedium, color: 'rgba(255,255,255,0.7)', lineHeight: 18 },
    premiumAction: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: BORDER_RADIUS.pill },
    premiumActionText: { fontSize: 13, fontFamily: FONTS.extrabold, color: '#0F172A' },

    shimmerOverlay: {
      position: 'absolute', top: 0, bottom: 0, width: 80,
      backgroundColor: 'rgba(255,255,255,0.15)',
      transform: [{ skewX: '-25deg' }],
    },
  }), [C, isTablet, isDesktop]);
};
