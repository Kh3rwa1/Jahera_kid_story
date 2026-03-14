import { useCallback, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Text,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import {
  Sparkles,
  BookOpen,
  ChevronRight,
  Globe,
  Users,
  Volume2,
  Clock,
  Play,
  Shuffle,
  Settings,
  Flame,
  Zap,
  Crown,
  Star,
} from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, SHADOWS, FONTS } from '@/constants/theme';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { ErrorState } from '@/components/ErrorState';
import { getLanguageFlag } from '@/utils/languageUtils';
import { getTimeOfDay } from '@/utils/contextUtils';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { KidsBubbleBackground } from '@/components/KidsBubbleBackground';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STORY_CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.62, 250);

function getGreeting(name: string): { greeting: string; subtitle: string; emoji: string } {
  const tod = getTimeOfDay(new Date());
  switch (tod) {
    case 'morning':
      return { greeting: `Good morning, ${name}!`, subtitle: 'Ready for a sunny adventure?', emoji: '☀️' };
    case 'afternoon':
      return { greeting: `Hey ${name}!`, subtitle: 'Time for a new tale!', emoji: '🌈' };
    case 'evening':
      return { greeting: `Good evening, ${name}!`, subtitle: 'How about a bedtime story?', emoji: '🌙' };
    case 'night':
      return { greeting: `Hey ${name}!`, subtitle: 'A dreamy story awaits...', emoji: '⭐' };
    default:
      return { greeting: `Welcome back, ${name}!`, subtitle: 'Your next story awaits!', emoji: '✨' };
  }
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const SEASON_GRADIENTS: Record<string, readonly [string, string, string]> = {
  spring: ['#C6F6D5', '#9AE6B4', '#68D391'],
  summer: ['#FEFCBF', '#FAF089', '#F6E05E'],
  fall: ['#FEEBC8', '#FBD38D', '#F6AD55'],
  winter: ['#BEE3F8', '#90CDF4', '#63B3ED'],
};

const SEASON_EMOJIS: Record<string, string> = {
  spring: '🌸',
  summer: '☀️',
  fall: '🍂',
  winter: '❄️',
};

function WaveHandEmoji() {
  const rotate = useSharedValue(0);

  useEffect(() => {
    rotate.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(18, { duration: 200 }),
          withTiming(-10, { duration: 200 }),
          withTiming(14, { duration: 180 }),
          withTiming(-6, { duration: 180 }),
          withTiming(0, { duration: 200 }),
          withTiming(0, { duration: 1800 })
        ),
        -1,
        false
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  return <Animated.Text style={[styles.waveEmoji, style]}>👋</Animated.Text>;
}

function HeroBobAnimation({ children }: { children: React.ReactNode }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 2200 }),
          withTiming(6, { duration: 2200 })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

function StarSparkle({ delay, x, y }: { delay: number; x: number; y: number }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    const loop = () => {
      scale.value = withDelay(delay, withRepeat(
        withSequence(
          withSpring(1, { damping: 6, stiffness: 300 }),
          withTiming(0, { duration: 600 }),
          withTiming(0, { duration: 1200 })
        ),
        -1,
        false
      ));
      opacity.value = withDelay(delay, withRepeat(
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0, { duration: 600 }),
          withTiming(0, { duration: 1200 })
        ),
        -1,
        false
      ));
      rotate.value = withRepeat(withTiming(360, { duration: 3000 }), -1, false);
    };
    loop();
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.starSparkle, { left: x, top: y }, style]}>
      <Star size={10} color="#FFD700" fill="#FFD700" />
    </Animated.View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { currentTheme } = useTheme();
  const COLORS = currentTheme.colors;
  const { profile, stories, isLoading, error, refreshAll, subscription, streak } = useApp();

  const handleRefresh = useCallback(async () => {
    await refreshAll();
  }, [refreshAll]);

  const handleGenerateStory = useCallback(() => {
    if (!profile) return;
    router.push({
      pathname: '/story/generate',
      params: {
        profileId: profile.$id,
        languageCode: profile.primary_language,
      },
    });
  }, [profile, router]);

  const handleStoryPress = useCallback(
    (storyId: string) => {
      router.push({ pathname: '/story/playback', params: { storyId } });
    },
    [router]
  );

  const handleLastStory = useCallback(() => {
    if (stories.length > 0) {
      handleStoryPress(stories[0].$id);
    }
  }, [stories, handleStoryPress]);

  const handleRandomStory = useCallback(() => {
    if (stories.length > 0) {
      const idx = Math.floor(Math.random() * stories.length);
      handleStoryPress(stories[idx].$id);
    }
  }, [stories, handleStoryPress]);

  const recentStories = useMemo(() => stories.slice(0, 8), [stories]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['top']}>
        <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill} />
        <View style={styles.loadingContent}>
          <LoadingSkeleton type="card" count={3} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['top']}>
        <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill} />
        <ErrorState
          type="general"
          title="Unable to Load Data"
          message={error || 'Failed to load your profile.'}
          onRetry={refreshAll}
          onGoHome={() => router.replace('/')}
        />
      </SafeAreaView>
    );
  }

  const { greeting, subtitle, emoji } = getGreeting(profile.kid_name || 'Friend');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['top']}>
      <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill} />
      <KidsBubbleBackground bubbleCount={10} cloudCount={3} />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={handleRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* ── Header ── */}
        <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.header}>
          <TouchableOpacity
            style={styles.userSection}
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <ProfileAvatar
              avatarUrl={profile.avatar_url}
              name={profile.kid_name}
              size="small"
            />
            <View style={styles.greetingContainer}>
              <View style={styles.greetingRow}>
                <WaveHandEmoji />
                <Text style={[styles.greetingText, { color: COLORS.text.primary }]}>{greeting}</Text>
              </View>
              <View style={styles.metaBadgesRow}>
                <Text style={[styles.subtitleText, { color: COLORS.text.secondary }]}>{subtitle}</Text>
                {streak && streak.current_streak > 0 && (
                  <View style={styles.streakBadgeInline}>
                    <Flame size={11} color="#F59E0B" />
                    <Text style={[styles.streakBadgeText, { color: '#F59E0B' }]}>
                      {streak.current_streak}d
                    </Text>
                  </View>
                )}
                {subscription?.plan !== 'free' && (
                  <View style={[styles.proBadgeInline, { backgroundColor: COLORS.warning + '22' }]}>
                    <Crown size={10} color={COLORS.warning} />
                    <Text style={[styles.proBadgeInlineText, { color: COLORS.warning }]}>PRO</Text>
                  </View>
                )}
                {subscription?.plan === 'free' && subscription.stories_remaining <= 1 && (
                  <TouchableOpacity
                    onPress={() => router.push('/paywall')}
                    style={[styles.upgradeNudge, { backgroundColor: COLORS.primary + '18' }]}
                  >
                    <Zap size={10} color={COLORS.primary} />
                    <Text style={[styles.upgradeNudgeText, { color: COLORS.primary }]}>
                      {subscription.stories_remaining === 0 ? 'Upgrade' : `${subscription.stories_remaining} left`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.settingsButton, { backgroundColor: COLORS.cardBackground }]}
            onPress={() => router.push('/(tabs)/settings')}
            activeOpacity={0.7}
          >
            <Settings size={20} color={COLORS.text.secondary} />
          </TouchableOpacity>
        </Animated.View>

        {/* ── Hero card ── */}
        <Animated.View entering={FadeInUp.delay(120).springify()} style={styles.heroSection}>
          <HeroBobAnimation>
            <AnimatedPressable onPress={handleGenerateStory} scaleDown={0.96}>
              <LinearGradient
                colors={COLORS.gradients.sunset}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCard}
              >
                <StarSparkle delay={200} x={20} y={12} />
                <StarSparkle delay={900} x={SCREEN_WIDTH * 0.35} y={20} />
                <StarSparkle delay={500} x={24} y={60} />

                <View style={styles.heroContent}>
                  <View style={styles.heroLeft}>
                    <Text style={styles.heroTitle}>Create a{'\n'}New Story</Text>
                    <Text style={styles.heroSubtitle}>
                      AI-powered magic, just for{'\n'}{profile.kid_name}
                    </Text>
                    <View style={styles.heroCta}>
                      <Sparkles size={15} color="#FFFFFF" />
                      <Text style={styles.heroCtaText}>Generate Magic ✨</Text>
                    </View>
                  </View>
                  <View style={styles.heroIconWrap}>
                    <Text style={styles.heroEmoji}>🧙‍♂️</Text>
                    <Text style={styles.heroEmojiSmall}>✨</Text>
                  </View>
                </View>
              </LinearGradient>
            </AnimatedPressable>
          </HeroBobAnimation>
        </Animated.View>

        {/* ── Quick Actions ── */}
        {stories.length > 0 && (
          <Animated.View entering={FadeInUp.delay(180).springify()} style={styles.quickActions}>
            {[
              { icon: <Play size={15} color={COLORS.primary} />, label: 'Continue', bg: COLORS.primary + '18', onPress: handleLastStory },
              { icon: <Shuffle size={15} color='#F59E0B' />, label: 'Random', bg: '#F59E0B18', onPress: handleRandomStory },
              { icon: <Globe size={15} color={COLORS.info} />, label: 'Languages', bg: COLORS.info + '18', onPress: () => router.push('/settings/edit-profile') },
            ].map(action => (
              <AnimatedPressable
                key={action.label}
                style={[styles.quickActionPill, { backgroundColor: COLORS.cardBackground }]}
                onPress={action.onPress}
                scaleDown={0.93}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.bg }]}>
                  {action.icon}
                </View>
                <Text style={[styles.quickActionLabel, { color: COLORS.text.primary }]}>{action.label}</Text>
              </AnimatedPressable>
            ))}
          </Animated.View>
        )}

        {/* ── Stats ── */}
        <Animated.View entering={FadeInUp.delay(220).springify()}>
          <View style={styles.statsRow}>
            {[
              { icon: <BookOpen size={20} color={COLORS.primary} strokeWidth={2} />, value: stories.length, label: 'Stories', bg: COLORS.primary + '15', onPress: () => router.push('/(tabs)/history') },
              { icon: <Globe size={20} color='#F59E0B' strokeWidth={2} />, value: profile.languages?.length || 0, label: 'Languages', bg: '#F59E0B15', onPress: () => router.push('/settings/edit-profile') },
              { icon: <Users size={20} color={COLORS.info} strokeWidth={2} />, value: (profile.family_members?.length || 0) + (profile.friends?.length || 0), label: 'Characters', bg: COLORS.info + '15', onPress: () => router.push('/settings/edit-profile') },
            ].map((stat, i, arr) => (
              <View key={stat.label} style={styles.statItemWrap}>
                <TouchableOpacity
                  style={[styles.statCard, { backgroundColor: COLORS.cardBackground }]}
                  onPress={stat.onPress}
                  activeOpacity={0.8}
                >
                  <View style={[styles.statIconCircle, { backgroundColor: stat.bg }]}>
                    {stat.icon}
                  </View>
                  <Text style={[styles.statValue, { color: COLORS.text.primary }]}>{stat.value}</Text>
                  <Text style={[styles.statLabel, { color: COLORS.text.secondary }]}>{stat.label}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── Recent Stories ── */}
        <View style={styles.section}>
          <Animated.View entering={FadeInUp.delay(280).springify()} style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionEmoji}>📖</Text>
              <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>Recent Stories</Text>
            </View>
            {stories.length > 4 && (
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/history')}
                style={[styles.viewAllButton, { backgroundColor: COLORS.primary + '12' }]}
              >
                <Text style={[styles.viewAllText, { color: COLORS.primary }]}>See All</Text>
                <ChevronRight size={14} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </Animated.View>

          {recentStories.length === 0 ? (
            <Animated.View entering={FadeInUp.delay(340).springify()} style={styles.emptyContainer}>
              <View style={[styles.emptyCard, { backgroundColor: COLORS.cardBackground }]}>
                <Text style={styles.emptyEmoji}>🌟</Text>
                <Text style={[styles.emptyTitle, { color: COLORS.text.primary }]}>No Stories Yet!</Text>
                <Text style={[styles.emptySubtitle, { color: COLORS.text.secondary }]}>
                  Tap the magic button above to create your first story!
                </Text>
              </View>
            </Animated.View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storiesCarousel}
              decelerationRate="fast"
              snapToInterval={STORY_CARD_WIDTH + SPACING.md}
            >
              {recentStories.map((story, index) => {
                const seasonGradient = SEASON_GRADIENTS[story.season] || SEASON_GRADIENTS.spring;
                const seasonEmoji = SEASON_EMOJIS[story.season] || '📖';
                const flag = getLanguageFlag(story.language_code);

                return (
                  <Animated.View
                    key={story.$id}
                    entering={FadeInRight.delay(300 + index * 55).springify()}
                  >
                    <AnimatedPressable
                      style={[
                        styles.storyCard,
                        { backgroundColor: COLORS.cardBackground, width: STORY_CARD_WIDTH },
                      ]}
                      onPress={() => handleStoryPress(story.$id)}
                      scaleDown={0.94}
                    >
                      <LinearGradient colors={seasonGradient} style={styles.storyImage}>
                        <Text style={styles.storySeasonBig}>{seasonEmoji}</Text>
                        <View style={styles.storyBadgeRow}>
                          <View style={styles.flagBadge}>
                            <Text style={styles.flagText}>{flag}</Text>
                          </View>
                          <View style={[styles.playCircle, { backgroundColor: 'rgba(255,255,255,0.7)' }]}>
                            <Play size={11} color="rgba(0,0,0,0.5)" fill="rgba(0,0,0,0.4)" strokeWidth={0} />
                          </View>
                          {story.audio_url && (
                            <View style={styles.audioBadge}>
                              <Volume2 size={9} color="#FFFFFF" />
                            </View>
                          )}
                        </View>
                      </LinearGradient>
                      <View style={styles.storyCardContent}>
                        <Text
                          style={[styles.storyTitle, { color: COLORS.text.primary }]}
                          numberOfLines={2}
                        >
                          {story.title}
                        </Text>
                        <View style={styles.storyMeta}>
                          <Clock size={10} color={COLORS.text.light} />
                          <Text style={[styles.storyMetaText, { color: COLORS.text.light }]}>
                            {getRelativeTime(story.generated_at || story.$createdAt)}
                          </Text>
                        </View>
                      </View>
                    </AnimatedPressable>
                  </Animated.View>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* ── Languages ── */}
        {profile.languages?.length > 1 && (
          <Animated.View entering={FadeInUp.delay(420).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionEmoji}>🌍</Text>
                <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>Your Languages</Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.languagesRow}
            >
              {profile.languages.map((lang, langIndex) => {
                const langStoryCount = stories.filter(s => s.language_code === lang.language_code).length;
                const maxLangCount = Math.max(
                  1,
                  ...profile.languages.map(l => stories.filter(s => s.language_code === l.language_code).length)
                );
                const progress = langStoryCount / maxLangCount;

                return (
                  <Animated.View
                    key={lang.$id}
                    entering={FadeInRight.delay(480 + langIndex * 70).springify()}
                  >
                    <View style={[styles.langCard, { backgroundColor: COLORS.cardBackground }]}>
                      <Text style={styles.langFlag}>{getLanguageFlag(lang.language_code)}</Text>
                      <Text style={[styles.langName, { color: COLORS.text.primary }]}>
                        {lang.language_name}
                      </Text>
                      <Text style={[styles.langCount, { color: COLORS.text.secondary }]}>
                        {langStoryCount} {langStoryCount === 1 ? 'story' : 'stories'}
                      </Text>
                      <View style={[styles.langProgressBg, { backgroundColor: COLORS.text.light + '25' }]}>
                        <View
                          style={[
                            styles.langProgressFill,
                            { backgroundColor: COLORS.primary, width: `${Math.max(10, progress * 100)}%` },
                          ]}
                        />
                      </View>
                    </View>
                  </Animated.View>
                );
              })}
            </ScrollView>
          </Animated.View>
        )}

        {/* ── Characters ── */}
        {(profile.family_members?.length > 0 || profile.friends?.length > 0) && (
          <Animated.View entering={FadeInUp.delay(520).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionEmoji}>🧑‍🤝‍🧑</Text>
                <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>Story Characters</Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.charactersRow}
            >
              {profile.family_members?.map(m => {
                const initial = m.name.charAt(0).toUpperCase();
                return (
                  <View
                    key={m.$id}
                    style={[styles.characterCard, { backgroundColor: COLORS.cardBackground }]}
                  >
                    <LinearGradient
                      colors={[COLORS.primary + '30', COLORS.primary + '10']}
                      style={styles.characterAvatar}
                    >
                      <Text style={[styles.characterAvatarText, { color: COLORS.primary }]}>
                        {initial}
                      </Text>
                    </LinearGradient>
                    <Text
                      style={[styles.characterName, { color: COLORS.text.primary }]}
                      numberOfLines={1}
                    >
                      {m.name}
                    </Text>
                    <View style={[styles.characterRolePill, { backgroundColor: COLORS.primary + '15' }]}>
                      <Text style={[styles.characterRole, { color: COLORS.primary }]}>Family</Text>
                    </View>
                  </View>
                );
              })}
              {profile.friends?.map(f => {
                const initial = f.name.charAt(0).toUpperCase();
                return (
                  <View
                    key={f.$id}
                    style={[styles.characterCard, { backgroundColor: COLORS.cardBackground }]}
                  >
                    <LinearGradient
                      colors={[COLORS.info + '30', COLORS.info + '10']}
                      style={styles.characterAvatar}
                    >
                      <Text style={[styles.characterAvatarText, { color: COLORS.info }]}>
                        {initial}
                      </Text>
                    </LinearGradient>
                    <Text
                      style={[styles.characterName, { color: COLORS.text.primary }]}
                      numberOfLines={1}
                    >
                      {f.name}
                    </Text>
                    <View style={[styles.characterRolePill, { backgroundColor: COLORS.info + '15' }]}>
                      <Text style={[styles.characterRole, { color: COLORS.info }]}>Friend</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingBottom: 110 },
  loadingContent: { padding: SPACING.xl, gap: SPACING.md },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  userSection: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
  greetingContainer: { flex: 1, gap: 3 },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  waveEmoji: { fontSize: 18 },
  greetingText: { fontSize: 19, fontFamily: FONTS.extrabold, letterSpacing: -0.3, flex: 1 },
  subtitleText: { fontSize: 12, fontFamily: FONTS.medium },
  metaBadgesRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, flexWrap: 'wrap' },
  streakBadgeInline: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  streakBadgeText: { fontSize: 11, fontFamily: FONTS.bold },
  proBadgeInline: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: BORDER_RADIUS.pill,
  },
  proBadgeInlineText: { fontSize: 10, fontFamily: FONTS.extrabold },
  upgradeNudge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: BORDER_RADIUS.pill,
  },
  upgradeNudgeText: { fontSize: 10, fontFamily: FONTS.bold },
  settingsButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.xs,
  },

  heroSection: { paddingHorizontal: SPACING.xl, marginBottom: SPACING.lg },
  heroCard: {
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.xxl,
    minHeight: 175,
    justifyContent: 'center',
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  starSparkle: {
    position: 'absolute',
  },
  heroContent: { flexDirection: 'row', alignItems: 'center' },
  heroLeft: { flex: 1, gap: SPACING.sm },
  heroTitle: {
    fontSize: 30,
    fontFamily: FONTS.extrabold,
    color: '#FFFFFF',
    letterSpacing: -0.8,
    lineHeight: 34,
  },
  heroSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.semibold,
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 19,
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.28)',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 9,
    borderRadius: BORDER_RADIUS.pill,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  heroCtaText: { fontSize: 14, fontFamily: FONTS.extrabold, color: '#FFFFFF' },
  heroIconWrap: { marginLeft: SPACING.md, alignItems: 'center' },
  heroEmoji: { fontSize: 68 },
  heroEmojiSmall: { fontSize: 24, marginTop: -8 },

  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  quickActionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.xs,
  },
  quickActionIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: { fontSize: 12, fontFamily: FONTS.bold },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xxl,
    gap: SPACING.sm,
  },
  statItemWrap: { flex: 1 },
  statCard: {
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    gap: 4,
    ...SHADOWS.sm,
  },
  statIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: { fontSize: 22, fontFamily: FONTS.extrabold, letterSpacing: -0.5 },
  statLabel: { fontSize: 11, fontFamily: FONTS.semibold },

  section: { marginBottom: SPACING.xxl },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionEmoji: { fontSize: 20 },
  sectionTitle: { fontSize: 22, fontFamily: FONTS.extrabold, letterSpacing: -0.5 },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.pill,
  },
  viewAllText: { fontSize: 13, fontFamily: FONTS.bold },

  emptyContainer: { paddingHorizontal: SPACING.xl },
  emptyCard: {
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.xxxl,
    alignItems: 'center',
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  emptyEmoji: { fontSize: 52, marginBottom: 4 },
  emptyTitle: { fontSize: 20, fontFamily: FONTS.extrabold, letterSpacing: -0.4 },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    textAlign: 'center',
    lineHeight: 21,
  },

  storiesCarousel: { paddingHorizontal: SPACING.xl, gap: SPACING.md },
  storyCard: {
    borderRadius: BORDER_RADIUS.xxl,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  storyImage: {
    width: '100%',
    height: 145,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  storySeasonBig: {
    fontSize: 44,
  },
  storyBadgeRow: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  flagBadge: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 14,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagText: { fontSize: 15 },
  playCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioBadge: {
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: 10,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto' as any,
  },
  storyCardContent: { padding: SPACING.md, paddingTop: SPACING.sm },
  storyTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    marginBottom: 5,
    lineHeight: 19,
    minHeight: 38,
    letterSpacing: -0.1,
  },
  storyMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  storyMetaText: { fontSize: 11, fontFamily: FONTS.medium },

  languagesRow: { paddingHorizontal: SPACING.xl, gap: SPACING.md, paddingTop: SPACING.xs },
  langCard: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    gap: 4,
    minWidth: 115,
    ...SHADOWS.sm,
  },
  langFlag: { fontSize: 28 },
  langName: { fontSize: 13, fontFamily: FONTS.bold },
  langCount: { fontSize: 11, fontFamily: FONTS.medium },
  langProgressBg: {
    width: '100%',
    height: 5,
    borderRadius: 3,
    marginTop: 4,
    overflow: 'hidden',
  },
  langProgressFill: { height: '100%', borderRadius: 3 },

  charactersRow: { paddingHorizontal: SPACING.xl, gap: SPACING.sm, paddingTop: SPACING.xs },
  characterCard: {
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    gap: 5,
    minWidth: 88,
    ...SHADOWS.sm,
  },
  characterAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterAvatarText: { fontSize: 20, fontFamily: FONTS.extrabold },
  characterName: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    maxWidth: 80,
    textAlign: 'center',
  },
  characterRolePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.pill,
  },
  characterRole: { fontSize: 10, fontFamily: FONTS.bold },
});
