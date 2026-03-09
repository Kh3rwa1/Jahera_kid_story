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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STORY_CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.6, 240);

function getGreeting(name: string): { greeting: string; subtitle: string } {
  const tod = getTimeOfDay(new Date());
  switch (tod) {
    case 'morning':
      return { greeting: `Good morning, ${name}!`, subtitle: 'Ready for a sunny adventure?' };
    case 'afternoon':
      return { greeting: `Good afternoon, ${name}!`, subtitle: 'Time for a new tale!' };
    case 'evening':
      return { greeting: `Good evening, ${name}!`, subtitle: 'How about a bedtime story?' };
    case 'night':
      return { greeting: `Hey there, ${name}!`, subtitle: 'A dreamy story awaits...' };
    default:
      return { greeting: `Welcome back, ${name}!`, subtitle: 'Your next story awaits' };
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

const SEASON_GRADIENTS: Record<string, string[]> = {
  spring: ['#C6F6D5', '#9AE6B4', '#68D391'],
  summer: ['#FEFCBF', '#FAF089', '#F6E05E'],
  fall: ['#FEEBC8', '#FBD38D', '#F6AD55'],
  winter: ['#BEE3F8', '#90CDF4', '#63B3ED'],
};

function HeroBobAnimation({ children }: { children: React.ReactNode }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(-4, { duration: 2000 }),
          withTiming(4, { duration: 2000 })
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

export default function HomeScreen() {
  const router = useRouter();
  const { currentTheme } = useTheme();
  const COLORS = currentTheme.colors;
  const { profile, stories, isLoading, error, refreshAll } = useApp();

  const handleRefresh = useCallback(async () => {
    await refreshAll();
  }, [refreshAll]);

  const handleGenerateStory = useCallback(() => {
    if (!profile) return;
    router.push({
      pathname: '/story/generate',
      params: {
        profileId: profile.id,
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
      handleStoryPress(stories[0].id);
    }
  }, [stories, handleStoryPress]);

  const handleRandomStory = useCallback(() => {
    if (stories.length > 0) {
      const idx = Math.floor(Math.random() * stories.length);
      handleStoryPress(stories[idx].id);
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

  const { greeting, subtitle } = getGreeting(profile.kid_name || 'Friend');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['top']}>
      <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill} />
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={handleRefresh} tintColor={COLORS.primary} />
        }
      >
        <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.header}>
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
              <Text style={[styles.greetingText, { color: COLORS.text.primary }]}>{greeting}</Text>
              <Text style={[styles.subtitleText, { color: COLORS.text.secondary }]}>{subtitle}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.settingsButton, { backgroundColor: COLORS.text.light + '12' }]}
            onPress={() => router.push('/(tabs)/settings')}
            activeOpacity={0.7}
          >
            <Settings size={20} color={COLORS.text.secondary} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(150).springify()} style={styles.heroSection}>
          <HeroBobAnimation>
            <AnimatedPressable onPress={handleGenerateStory} scaleDown={0.97}>
              <LinearGradient
                colors={COLORS.gradients.sunset}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCard}
              >
                <View style={styles.heroContent}>
                  <View style={styles.heroLeft}>
                    <Text style={styles.heroTitle}>Create a New Story</Text>
                    <Text style={styles.heroSubtitle}>
                      AI-powered, personalized just for {profile.kid_name}
                    </Text>
                    <View style={styles.heroBadge}>
                      <Sparkles size={14} color="#FFFFFF" />
                      <Text style={styles.heroBadgeText}>Generate</Text>
                    </View>
                  </View>
                  <View style={styles.heroIconWrap}>
                    <Text style={styles.heroEmoji}>&#10024;</Text>
                  </View>
                </View>
              </LinearGradient>
            </AnimatedPressable>
          </HeroBobAnimation>
        </Animated.View>

        {stories.length > 0 && (
          <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.quickActions}>
            <AnimatedPressable
              style={[styles.quickActionPill, { backgroundColor: COLORS.cardBackground }]}
              onPress={handleLastStory}
              scaleDown={0.95}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: COLORS.primary + '15' }]}>
                <Play size={14} color={COLORS.primary} />
              </View>
              <Text style={[styles.quickActionLabel, { color: COLORS.text.primary }]}>Continue</Text>
            </AnimatedPressable>

            <AnimatedPressable
              style={[styles.quickActionPill, { backgroundColor: COLORS.cardBackground }]}
              onPress={handleRandomStory}
              scaleDown={0.95}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: COLORS.warning + '15' }]}>
                <Shuffle size={14} color={COLORS.warning} />
              </View>
              <Text style={[styles.quickActionLabel, { color: COLORS.text.primary }]}>Random</Text>
            </AnimatedPressable>

            <AnimatedPressable
              style={[styles.quickActionPill, { backgroundColor: COLORS.cardBackground }]}
              onPress={() => router.push('/settings/edit-profile')}
              scaleDown={0.95}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: COLORS.info + '15' }]}>
                <Globe size={14} color={COLORS.info} />
              </View>
              <Text style={[styles.quickActionLabel, { color: COLORS.text.primary }]}>Languages</Text>
            </AnimatedPressable>
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(250).springify()}>
          <View style={[styles.statsRow, { backgroundColor: COLORS.cardBackground }]}>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => router.push('/(tabs)/history')}
              activeOpacity={0.7}
            >
              <View style={[styles.statIcon, { backgroundColor: COLORS.primary + '18' }]}>
                <BookOpen size={18} color={COLORS.primary} strokeWidth={2} />
              </View>
              <Text style={[styles.statValue, { color: COLORS.text.primary }]}>{stories.length}</Text>
              <Text style={[styles.statLabel, { color: COLORS.text.secondary }]}>Stories</Text>
            </TouchableOpacity>
            <View style={[styles.statDivider, { backgroundColor: COLORS.text.light + '30' }]} />
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => router.push('/settings/edit-profile')}
              activeOpacity={0.7}
            >
              <View style={[styles.statIcon, { backgroundColor: COLORS.warning + '18' }]}>
                <Globe size={18} color={COLORS.warning} strokeWidth={2} />
              </View>
              <Text style={[styles.statValue, { color: COLORS.text.primary }]}>
                {profile.languages?.length || 0}
              </Text>
              <Text style={[styles.statLabel, { color: COLORS.text.secondary }]}>Languages</Text>
            </TouchableOpacity>
            <View style={[styles.statDivider, { backgroundColor: COLORS.text.light + '30' }]} />
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => router.push('/settings/edit-profile')}
              activeOpacity={0.7}
            >
              <View style={[styles.statIcon, { backgroundColor: COLORS.info + '18' }]}>
                <Users size={18} color={COLORS.info} strokeWidth={2} />
              </View>
              <Text style={[styles.statValue, { color: COLORS.text.primary }]}>
                {(profile.family_members?.length || 0) + (profile.friends?.length || 0)}
              </Text>
              <Text style={[styles.statLabel, { color: COLORS.text.secondary }]}>Characters</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>Recent Stories</Text>
            {stories.length > 4 && (
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/history')}
                style={styles.viewAllButton}
              >
                <Text style={[styles.viewAllText, { color: COLORS.primary }]}>View All</Text>
                <ChevronRight size={16} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>

          {recentStories.length === 0 ? (
            <Animated.View entering={FadeInUp.delay(350).springify()} style={styles.emptyContainer}>
              <View style={[styles.emptyCard, { backgroundColor: COLORS.cardBackground }]}>
                <View style={[styles.emptyIconWrap, { backgroundColor: COLORS.primary + '12' }]}>
                  <BookOpen size={40} color={COLORS.primary} strokeWidth={1.5} />
                </View>
                <Text style={[styles.emptyTitle, { color: COLORS.text.primary }]}>No Stories Yet</Text>
                <Text style={[styles.emptySubtitle, { color: COLORS.text.secondary }]}>
                  Tap the button above to create your first magical story!
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
                const flag = getLanguageFlag(story.language_code);

                return (
                  <Animated.View
                    key={story.id}
                    entering={FadeInRight.delay(300 + index * 60).springify()}
                  >
                    <AnimatedPressable
                      style={[
                        styles.storyCard,
                        { backgroundColor: COLORS.cardBackground, width: STORY_CARD_WIDTH },
                      ]}
                      onPress={() => handleStoryPress(story.id)}
                      scaleDown={0.95}
                    >
                      <LinearGradient colors={seasonGradient} style={styles.storyImage}>
                        <BookOpen size={28} color="rgba(0,0,0,0.2)" strokeWidth={1.5} />
                        <View style={styles.storyBadgeRow}>
                          <View style={styles.flagBadge}>
                            <Text style={styles.flagText}>{flag}</Text>
                          </View>
                          {story.audio_url && (
                            <View style={styles.audioBadge}>
                              <Volume2 size={10} color="#FFFFFF" />
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
                          <Clock size={11} color={COLORS.text.light} />
                          <Text style={[styles.storyMetaText, { color: COLORS.text.light }]}>
                            {getRelativeTime(story.generated_at || story.created_at)}
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

        {profile.languages?.length > 1 && (
          <Animated.View entering={FadeInUp.delay(450).springify()} style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: COLORS.text.primary, paddingHorizontal: SPACING.xl },
              ]}
            >
              Your Languages
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.languagesRow}
            >
              {profile.languages.map((lang, langIndex) => {
                const langStoryCount = stories.filter(
                  s => s.language_code === lang.language_code
                ).length;
                const maxLangCount = Math.max(
                  1,
                  ...profile.languages.map(
                    l => stories.filter(s => s.language_code === l.language_code).length
                  )
                );
                const progress = langStoryCount / maxLangCount;

                return (
                  <Animated.View
                    key={lang.id}
                    entering={FadeInRight.delay(500 + langIndex * 80).springify()}
                  >
                    <View style={[styles.langCard, { backgroundColor: COLORS.cardBackground }]}>
                      <Text style={styles.langFlag}>{getLanguageFlag(lang.language_code)}</Text>
                      <Text style={[styles.langName, { color: COLORS.text.primary }]}>
                        {lang.language_name}
                      </Text>
                      <Text style={[styles.langCount, { color: COLORS.text.secondary }]}>
                        {langStoryCount} {langStoryCount === 1 ? 'story' : 'stories'}
                      </Text>
                      <View
                        style={[styles.langProgressBg, { backgroundColor: COLORS.text.light + '20' }]}
                      >
                        <View
                          style={[
                            styles.langProgressFill,
                            {
                              backgroundColor: COLORS.primary,
                              width: `${Math.max(8, progress * 100)}%`,
                            },
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

        {(profile.family_members?.length > 0 || profile.friends?.length > 0) && (
          <Animated.View entering={FadeInUp.delay(550).springify()} style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: COLORS.text.primary, paddingHorizontal: SPACING.xl },
              ]}
            >
              Story Characters
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.charactersRow}
            >
              {profile.family_members?.map(m => {
                const initial = m.name.charAt(0).toUpperCase();
                return (
                  <View
                    key={m.id}
                    style={[styles.characterCard, { backgroundColor: COLORS.cardBackground }]}
                  >
                    <View style={[styles.characterAvatar, { backgroundColor: COLORS.primary + '18' }]}>
                      <Text style={[styles.characterAvatarText, { color: COLORS.primary }]}>
                        {initial}
                      </Text>
                    </View>
                    <Text
                      style={[styles.characterName, { color: COLORS.text.primary }]}
                      numberOfLines={1}
                    >
                      {m.name}
                    </Text>
                    <Text style={[styles.characterRole, { color: COLORS.text.light }]}>Family</Text>
                  </View>
                );
              })}
              {profile.friends?.map(f => {
                const initial = f.name.charAt(0).toUpperCase();
                return (
                  <View
                    key={f.id}
                    style={[styles.characterCard, { backgroundColor: COLORS.cardBackground }]}
                  >
                    <View style={[styles.characterAvatar, { backgroundColor: COLORS.info + '18' }]}>
                      <Text style={[styles.characterAvatarText, { color: COLORS.info }]}>
                        {initial}
                      </Text>
                    </View>
                    <Text
                      style={[styles.characterName, { color: COLORS.text.primary }]}
                      numberOfLines={1}
                    >
                      {f.name}
                    </Text>
                    <Text style={[styles.characterRole, { color: COLORS.text.light }]}>Friend</Text>
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
  scrollContent: { paddingBottom: 100 },
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
  greetingContainer: { flex: 1, gap: 2 },
  greetingText: { fontSize: 20, fontFamily: FONTS.bold },
  subtitleText: { fontSize: 13, fontFamily: FONTS.medium },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSection: { paddingHorizontal: SPACING.xl, marginBottom: SPACING.lg },
  heroCard: {
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.xl,
    minHeight: 140,
    justifyContent: 'center',
    ...SHADOWS.lg,
  },
  heroContent: { flexDirection: 'row', alignItems: 'center' },
  heroLeft: { flex: 1, gap: SPACING.sm },
  heroTitle: { fontSize: 22, fontFamily: FONTS.bold, color: '#FFFFFF' },
  heroSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.pill,
    marginTop: SPACING.xs,
  },
  heroBadgeText: { fontSize: 13, fontFamily: FONTS.bold, color: '#FFFFFF' },
  heroIconWrap: { marginLeft: SPACING.md },
  heroEmoji: { fontSize: 56 },
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
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.xs,
  },
  quickActionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xxl,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: { fontSize: 20, fontFamily: FONTS.bold },
  statLabel: { fontSize: 12, fontFamily: FONTS.medium },
  statDivider: { width: 1, marginVertical: SPACING.sm },
  section: { marginBottom: SPACING.xxl },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  sectionTitle: { fontSize: 20, fontFamily: FONTS.bold },
  viewAllButton: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { fontSize: 14, fontFamily: FONTS.semibold },
  emptyContainer: { paddingHorizontal: SPACING.xl },
  emptyCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xxxl,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: { fontSize: 18, fontFamily: FONTS.bold, marginBottom: SPACING.sm },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 20,
  },
  storiesCarousel: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  storyCard: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  storyImage: {
    width: '100%',
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  storyBadgeRow: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flagBadge: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 12,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagText: { fontSize: 14 },
  audioBadge: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyCardContent: { padding: SPACING.md },
  storyTitle: {
    fontSize: 14,
    fontFamily: FONTS.semibold,
    marginBottom: 6,
    lineHeight: 18,
    minHeight: 36,
  },
  storyMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  storyMetaText: { fontSize: 11, fontFamily: FONTS.medium },
  languagesRow: { paddingHorizontal: SPACING.xl, gap: SPACING.md, paddingTop: SPACING.sm },
  langCard: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    gap: 4,
    minWidth: 110,
    ...SHADOWS.xs,
  },
  langFlag: { fontSize: 24 },
  langName: { fontSize: 13, fontFamily: FONTS.semibold },
  langCount: { fontSize: 11, fontFamily: FONTS.regular },
  langProgressBg: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  langProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  charactersRow: { paddingHorizontal: SPACING.xl, gap: SPACING.md, paddingTop: SPACING.sm },
  characterCard: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: 6,
    minWidth: 90,
    ...SHADOWS.xs,
  },
  characterAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterAvatarText: {
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  characterName: {
    fontSize: 13,
    fontFamily: FONTS.semibold,
    maxWidth: 80,
    textAlign: 'center',
  },
  characterRole: { fontSize: 10, fontFamily: FONTS.regular },
});
