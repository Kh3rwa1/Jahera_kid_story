import React, { useCallback, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Text,
  useWindowDimensions,
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
} from 'react-native-reanimated';

// Contexts & Constants
import { useApp } from '@/contexts/AppContext';
import { useUI } from '@/contexts/UIContext';
import { useAudio } from '@/contexts/AudioContext';
import { useTheme } from '@/contexts/ThemeContext';
import { BREAKPOINTS, SPACING, FONTS } from '@/constants/theme';

// Components
import { FloatingParticles } from '@/components/FloatingParticles';
import { Sparkles, Clock, ArrowRight, Wand as Wand2, Award, Crown, ChevronRight, Play } from 'lucide-react-native';
import { LoadingSkeleton, Skeleton } from '@/components/LoadingSkeleton';
import { ErrorState } from '@/components/ErrorState';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { MeshBackground } from '@/components/MeshBackground';
import { Container } from '@/components/Container';
import { StatsTicker } from '@/components/StatsTicker';
import { QuickActions } from '@/components/QuickActions';
import { FloatAnim, HeroShimmer, AnimatedStreakChip } from '@/components/HomeVisuals';

// Utils
import { getLanguageFlag } from '@/utils/languageUtils';
import { getTimeOfDay } from '@/utils/contextUtils';
import { getRelativeTime, getSeasonPalette } from '@/utils/dateUtils';
import { talkative } from '@/utils/talkative';
import { usePulse } from '@/utils/animations';
import { randomInt } from '@/utils/secureRandom';

// Styles
import { useHomeStyles } from '@/styles/home.styles';

const DISCOVERY_TAGS = [
  { label: 'Space Adventure', emoji: '🚀', theme: 'Space' },
  { label: 'Dino World', emoji: '🦖', theme: 'Animals' },
  { label: 'Deep Ocean', emoji: '🐳', theme: 'Ocean' },
  { label: 'Magic Kingdom', emoji: '🏰', theme: 'Fantasy' },
  { label: 'Mystery Forest', emoji: '🌲', theme: 'Nature' },
  { label: 'Super Powers', emoji: '⚡', theme: 'Superheroes' },
];

function getGreeting(name: string): { line1: string; line2: string } {
  const tod = getTimeOfDay(new Date());
  const firstName = (name || 'Friend').split(' ')[0];
  switch (tod) {
    case 'morning': return { line1: 'Good morning,', line2: `${firstName} ☀️` };
    case 'afternoon': return { line1: 'Hey there,', line2: `${firstName} 🌈` };
    case 'evening': return { line1: 'Good evening,', line2: `${firstName} 🌙` };
    case 'night': return { line1: 'Sweet dreams,', line2: `${firstName} ⭐` };
    default: return { line1: 'Welcome back,', line2: `${firstName} ✨` };
  }
}

export default function HomeScreen() {
  const { width: winWidth } = useWindowDimensions();
  const isTablet = winWidth >= BREAKPOINTS.tablet;
  const isDesktop = winWidth >= BREAKPOINTS.desktop;
  
  const heroActionPulse = usePulse(0.97, 1.05);
  
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

  const styles = useHomeStyles(C, isTablet, isDesktop);
  const isFocused = useIsFocused();
  const [continueStory, setContinueStory] = React.useState<{ id: string; title: string; progress: number } | null>(null);

  // Fetch continue story metadata
  useEffect(() => {
    if (!isFocused || !stories || stories.length === 0) {
      setContinueStory(null);
      return;
    }

    const checkProgress = async () => {
      try {
        const lastId = await AsyncStorage.getItem('last_active_story_id');
        if (!lastId) return;

        const progressData = await AsyncStorage.getItem(`story_progress_${lastId}`);
        if (!progressData) return;

        const { position, duration, title } = JSON.parse(progressData);
        const pct = duration > 0 ? (position / duration) * 100 : 0;
        
        if (pct > 1 && pct < 98) {
          setContinueStory(prev => (prev?.id === lastId && Math.abs(prev.progress - pct) < 0.1) ? prev : { id: lastId, title, progress: pct });
        } else {
          setContinueStory(null);
        }
      } catch (e) {
        // Silent fail for progress check to avoid UI noise
      }
    };

    checkProgress();
  }, [isFocused, stories]);

  // Welcome Narration
  useEffect(() => {
    if (profile && !isLoading && isFocused) {
      const greeting = getGreeting(profile.kid_name || 'Friend');
      const text = `${greeting.line1} ${profile.kid_name || 'my friend'}! Ready for a new story?`;
      const timer = setTimeout(() => talkative.speak(text, profile.primary_language || 'en'), 1500);
      return () => clearTimeout(timer);
    }
  }, [profile?.id, isLoading, isFocused]);

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
    if (activeStory && continueStory && activeStory.id === continueStory.id) {
      playPause();
      return;
    }

    if (continueStory) {
      const fullStory = stories.find(s => s.id === continueStory.id);
      if (fullStory) loadAndPlayAudio(fullStory); else handleStoryPress(continueStory.id);
    } else if (stories && stories.length > 0) {
      loadAndPlayAudio(stories[0]);
    }
  }, [continueStory, stories, handleStoryPress, activeStory, playPause, loadAndPlayAudio]);

  const handleRandomStory = useCallback(() => {
    if (stories && stories.length > 0) {
      const randomIndex = randomInt(stories.length);
      handleStoryPress(stories[randomIndex].id);
    } else {
      router.push({ 
        pathname: '/story/generate', 
        params: { profileId: profile?.id, languageCode: profile?.primary_language, surprise: 'true' } 
      });
    }
  }, [stories, handleStoryPress, profile, router]);

  const recentStories = useMemo(() => (stories || []).slice(0, 10), [stories]);

  if (isLoading) {
    return (
      <Container maxWidth gradient gradientColors={C.backgroundGradient} safeAreaEdges={['top']} scroll scrollProps={{ contentContainerStyle: styles.scrollContent }}>
        <MeshBackground primaryColor={C.primary} />
        <View style={styles.topBar}>
          <Skeleton width={180} height={32} borderRadius={8} color="rgba(0,0,0,0.08)" />
          <View style={styles.topBarRight}><Skeleton width={60} height={32} borderRadius={16} color="rgba(0,0,0,0.05)" /></View>
        </View>
        <View style={styles.heroWrap}><Skeleton width="100%" height={240} borderRadius={32} color="rgba(0,0,0,0.08)" /></View>
        <View style={styles.section}><LoadingSkeleton type="quick-actions" count={1} /></View>
        <View style={styles.section}><Skeleton width="100%" height={50} borderRadius={25} color="rgba(0,0,0,0.04)" /></View>
        <View style={styles.section}>
           <Skeleton width={150} height={20} borderRadius={4} style={{ marginBottom: 12 }} color="rgba(0,0,0,0.08)" />
           <View style={{ flexDirection: 'row', gap: 12 }}><Skeleton width={120} height={40} borderRadius={20} color="rgba(0,0,0,0.05)" /><Skeleton width={120} height={40} borderRadius={20} color="rgba(0,0,0,0.05)" /></View>
        </View>
      </Container>
    );
  }

  if (error || !profile) {
    if (!profile && !error) return <Redirect href="/onboarding/consent" />;
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: C.background }]} edges={['top']}>
        <LinearGradient colors={C.backgroundGradient} style={StyleSheet.absoluteFill} />
        <ErrorState type="general" title="Unable to Load" message={error || 'Failed to load profile.'} onRetry={refreshAll} onGoHome={() => router.replace('/')} />
      </SafeAreaView>
    );
  }

  const { line1, line2 } = getGreeting(profile.kid_name || 'Friend');
  const isPro = subscription?.plan !== 'free';

  return (
    <Container maxWidth gradient gradientColors={C.backgroundGradient} safeAreaEdges={['top']} scroll scrollProps={{ onScroll: wakeUI, scrollEventThrottle: 16, refreshControl: <RefreshControl refreshing={false} onRefresh={handleRefresh} tintColor={C.primary} />, contentContainerStyle: styles.scrollContent }}>
      <MeshBackground primaryColor={C.primary} />
      <FloatingParticles count={15} />

      <Animated.View entering={FadeIn.delay(40)} style={[styles.topBar, { backgroundColor: C.cardBackground + '90' }]}>
        <TouchableOpacity style={styles.avatarRow} onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.85}>
          <View style={styles.greetBlock}>
            <Text style={[styles.greetLine2, { color: C.text.primary, fontSize: isTablet ? 28 : 24 }]} numberOfLines={1}>
              <Text style={{ fontFamily: FONTS.displayMedium, color: C.text.secondary }}>{line1} </Text>{line2}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.topBarRight}>
          {streak && streak.current_streak > 0 && <AnimatedStreakChip count={streak.current_streak} styles={styles} />}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.heroWrap}>
        <TouchableOpacity activeOpacity={0.97} onPress={handleRandomStory}>
          <LinearGradient colors={[C.primary, C.primaryDark] as [string, string]} style={styles.heroCard}>
            <HeroShimmer styles={styles} />
            <View style={[styles.orb, styles.orbTL, { backgroundColor: 'rgba(255,255,255,0.12)' }]} /><View style={[styles.orb, styles.orbBR, { backgroundColor: 'rgba(0,0,0,0.06)' }]} />
            <View style={styles.heroBodyInner}>
              <View style={styles.heroMain}>
                <View style={styles.heroBadge}><Sparkles size={isTablet ? 14 : 12} color="#FFF" /><Text style={styles.heroBadgeText}>Create Story</Text></View><Text style={[styles.heroSub, { opacity: 0.9 }]}>Choose a learning goal 🎯</Text>
                <Text style={styles.heroH1}>Magic Story Maker</Text>
                <Text style={styles.heroSub}>Personalized stories that shape behavior, build confidence, and spark imagination</Text>
                <Animated.View style={[styles.heroActionBtn, heroActionPulse]}><Wand2 size={isTablet ? 18 : 16} color="#0F172A" /><Text style={styles.heroActionBtnText}>Quick Story ⚡</Text></Animated.View>
              </View>
              <View style={styles.heroVisual}><FloatAnim><Text style={styles.heroLargeEmoji}>🧙‍♂️</Text></FloatAnim></View>
            </View>
            <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.08)']} style={styles.heroStrip}>
              <View style={styles.heroStripItem}><Clock size={isTablet ? 14 : 12} color="rgba(255,255,255,0.8)" /><Text style={styles.heroStripText}>2 min story</Text></View>
              <View style={styles.heroStripDot} /><View style={styles.heroStripItem}><Award size={isTablet ? 14 : 12} color="rgba(255,255,255,0.8)" /><Text style={styles.heroStripText}>Earn badges</Text></View>
            </LinearGradient>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <QuickActions handleLastStory={handleLastStory} handleGenerateStory={handleGenerateStory} storiesCount={stories?.length || 0} textPrimary={C.text.primary} textSecondary={C.text.secondary} onLibrary={() => router.push('/(tabs)/history')} continueStory={continueStory} activeStoryId={activeStory?.id} isPlaying={isPlaying} playPause={playPause} styles={styles} />
      <StatsTicker stories={stories?.length || 0} languages={4} characters={(profile.family_members?.length || 0) + (profile.friends?.length || 0)} primaryColor={C.primary} cardBackground={C.cardBackground} textPrimary={C.text.primary} textSecondary={C.text.secondary} styles={styles} />

      <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.discoverySection}>
        <Text style={[styles.discoveryTitle, { color: C.text.light }]}>DISCOVER ADVENTURES</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.discoveryScroll}>
          {DISCOVERY_TAGS.map((tag) => (
            <TouchableOpacity key={tag.label} onPress={handleGenerateStory} activeOpacity={0.7} style={[styles.discoveryChip, { backgroundColor: C.cardBackground, borderColor: C.text.light + '15' }]}>
              <Text style={styles.discoveryEmoji}>{tag.emoji}</Text><Text style={[styles.discoveryLabel, { color: C.text.primary }]}>{tag.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      <View style={styles.section}>
        <View style={styles.secHeader}>
          <Text style={[styles.secTitle, { color: C.text.primary }]}>Recent Stories</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/history')} style={[styles.seeAllBtn, { backgroundColor: C.primary + '10' }]}><Text style={[styles.seeAllText, { color: C.primary }]}>See All</Text><ArrowRight size={13} color={C.primary} strokeWidth={3} /></TouchableOpacity>
        </View>
        {recentStories.length === 0 ? (
          <View style={styles.emptyWrap}><View style={[styles.emptyCard, { backgroundColor: C.cardBackground }]}><View style={styles.emptyIconRing}><Text style={styles.emptyEmoji}>✨</Text></View><Text style={[styles.emptyTitle, { color: C.text.primary }]}>No stories yet!</Text><Text style={[styles.emptySub, { color: C.text.secondary }]}>Create your first adventure story with {profile.kid_name}.</Text><TouchableOpacity onPress={handleGenerateStory} activeOpacity={0.8}><LinearGradient colors={[C.primary, C.primaryDark] as [string, string]} style={styles.emptyAction} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}><Sparkles size={18} color="#FFFFFF" /><Text style={styles.emptyActionText}>Start Creating</Text></LinearGradient></TouchableOpacity></View></View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel} snapToInterval={CARD_W + SPACING.md} decelerationRate="fast">
            {recentStories?.map((story, i) => {
              const palette = getSeasonPalette(story.season, C.primary, story.theme);
              return (
                <Animated.View key={story.id} entering={FadeInRight.delay(400 + i * 100).springify()}>
                  <AnimatedPressable onPress={() => handleStoryPress(story.id)} style={{ width: CARD_W }}>
                    <View style={[styles.storyCard, { backgroundColor: C.cardBackground, height: isTablet ? 280 : 260 }]}>
                      <LinearGradient colors={palette.colors} style={styles.storyArt}>
                        <Text style={styles.storyArtEmoji}>{story.theme === 'Space' ? '🚀' : story.theme === 'Animals' ? '🦁' : '📖'}</Text>
                        <View style={styles.storyBadgesTop}><View style={styles.storyFlagBadge}><Text style={styles.storyFlag}>{getLanguageFlag(story.language_code)}</Text></View></View>
                        {story.audio_url && <View style={[styles.storyPlayBtn, { backgroundColor: 'rgba(255,255,255,0.9)' }]}><Play size={14} color={palette.accent} fill={palette.accent} /></View>}
                      </LinearGradient>
                      <View style={styles.storyContent}><Text style={[styles.storyTitle, { color: C.text.primary }]} numberOfLines={2}>{story.title}</Text><View style={styles.storyMeta}><View style={[styles.seasonTag, { backgroundColor: palette.colors[0] + '15' }]}><Text style={[styles.seasonTagText, { color: palette.accent }]}>{story.season || 'Story'}</Text></View><Text style={[styles.storyMetaText, { color: C.text.light }]}>{getRelativeTime(story.generated_at)}</Text></View></View>
                    </View>
                  </AnimatedPressable>
                </Animated.View>
              );
            })}
          </ScrollView>
        )}
      </View>

      {!isPro && (
        <Animated.View entering={FadeInDown.delay(600).springify()}>
          <TouchableOpacity onPress={() => router.push('/paywall')} activeOpacity={0.9} style={styles.premiumBannerWrap}>
            <LinearGradient colors={['#1E293B', '#0F172A']} style={styles.premiumBanner}>
              <View style={styles.premiumGlowRow}>
                <View style={styles.premiumIconBox}><Crown size={24} color="#F59E0B" strokeWidth={2} /></View>
                <View style={styles.premiumBody}><Text style={styles.premiumTitle}>Unlock Pro Features</Text><Text style={styles.premiumDesc}>Unlimited high-quality stories, voices, and creative themes.</Text></View>
                <View style={styles.premiumAction}><Text style={styles.premiumActionText}>GO PRO</Text><ChevronRight size={14} color="#0F172A" strokeWidth={3} /></View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}
    </Container>
  );
}
