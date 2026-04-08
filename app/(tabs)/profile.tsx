import { BehaviorProgressCard } from '@/components/BehaviorProgressCard';
import { Container } from '@/components/Container';
import { QuizAttempt, Story } from '@/types/database';
import { ErrorState } from '@/components/ErrorState';
import { FloatingParticles } from '@/components/FloatingParticles';
import { HeroSkeleton,LoadingSkeleton,Skeleton } from '@/components/LoadingSkeleton';
import { MarqueeText } from '@/components/MarqueeText';
import { MeshBackground } from '@/components/MeshBackground';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { BORDER_RADIUS,BREAKPOINTS,FONTS,LAYOUT,SHADOWS,SPACING } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useUI } from '@/contexts/UIContext';
import { analytics } from '@/services/analyticsService';
import { useEntranceSequence,useGlowPulse,useProgressBar,usePulse } from '@/utils/animations';
import { computeBehaviorProgress } from '@/utils/behaviorProgress';
import { getLanguageFlag } from '@/utils/languageUtils';
import { LinearGradient } from 'expo-linear-gradient';
import { router as expoRouter,useRouter } from 'expo-router';
import {
Award,
BookOpen,
ChevronRight,
Flame,
Moon
} from 'lucide-react-native';
import React,{ useCallback,useEffect,useMemo } from 'react';
import {
Platform,
RefreshControl,
ScrollView,
StyleSheet,
Text,
TouchableOpacity,
View,
useWindowDimensions,
} from 'react-native';
import Animated,{
FadeInDown,
FadeInRight,
FadeInUp,
ZoomIn
} from 'react-native-reanimated';
import { ColorScheme } from '@/constants/themeSchemes';
import { SafeAreaView,useSafeAreaInsets } from 'react-native-safe-area-context';

interface AchievementCardData {
  label: string;
  value: string;
  sub: string;
  gradient: [string, string];
  emoji: string;
}

type ProfileStyles = ReturnType<typeof useStyles>;

function AnimatedAchievementCard({ card, index, styles }: Readonly<{ card: AchievementCardData; index: number; styles: ProfileStyles }>) {
  const entrance = useEntranceSequence(index, 120, 70);
  const glowStyle = useGlowPulse(0.85, 1, 2000 + index * 300);

  return (
    <Animated.View style={[styles.achieveCard, entrance]}>
      <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 28, opacity: 1 }]} />
      <LinearGradient colors={card.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.achieveCardInner}>
        <Animated.Text style={[styles.achieveEmoji, glowStyle]}>{card.emoji}</Animated.Text>
        <Text style={styles.achieveValue}>{card.value}</Text>
        <Text style={styles.achieveLabel}>{card.label}</Text>
        <Text style={styles.achieveSub}>{card.sub}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

function AnimatedLangProgressBar({ pct, primaryColor, delay, styles }: Readonly<{ pct: number; primaryColor: string; delay: number; styles: ProfileStyles }>) {
  const barStyle = useProgressBar(Math.max(pct, 10), 1000, delay);
  return (
    <View style={[styles.langBar, { backgroundColor: primaryColor + '15' }]}>
      <Animated.View style={[styles.langBarFill, { backgroundColor: primaryColor }, barStyle]} />
    </View>
  );
}

const computeQuizStats = (quizAttempts: QuizAttempt[] | null) => {
  const totalQuizzes = quizAttempts?.length || 0;
  const perfectScores = quizAttempts?.filter(q => (q.score / q.total_questions) >= 0.9).length || 0;
  const avgScore =
    totalQuizzes > 0
      ? Math.round(
          quizAttempts!.reduce((sum, a) => sum + (a.score / a.total_questions) * 100, 0) /
            totalQuizzes
        )
      : 0;
  return { totalQuizzes, perfectScores, avgScore };
};

const computeStreak = (stories: Story[] | null) => {
  if (!stories || stories.length === 0) return 0;
  
  const uniqueDays = new Set(
    stories.map(s => new Date(s.generated_at || s.created_at).toDateString())
  );
  
  const sortedDays = Array.from(uniqueDays)
    .map(d => new Date(d as string).getTime())
    .sort((a, b) => b - a);
    
  const todayMs = new Date(new Date().toDateString()).getTime();
  const dayMs = 86400000;
  
  // Refactored nested ternary to independent statement (S3358)
  let startMs: number | null = null;
  if (sortedDays[0] === todayMs) {
    startMs = todayMs;
  } else if (sortedDays[0] === todayMs - dayMs) {
    startMs = todayMs - dayMs;
  }
  
  if (startMs === null) return 0;
  
  let count = 0;
  for (let i = 0; i < sortedDays.length; i++) {
    const expected = startMs - i * dayMs;
    if (sortedDays[i] === expected) {
      count++;
    } else {
      break;
    }
  }
  return count;
};

function ProfileHero({ 
  profile, 
  storiesCount, 
  quizStats, 
  streak, 
  COLORS, 
  styles 
}: Readonly<{ 
  profile: any; 
  storiesCount: number; 
  quizStats: { totalQuizzes: number }; 
  streak: number; 
  COLORS: any; 
  styles: ProfileStyles 
}>) {
  const router = useRouter();
  const avatarPulseStyle = usePulse(0.97, 1.03);
  const streakPinPulseStyle = usePulse(0.92, 1.1);
  const topLanguage = profile.languages?.[0];

  return (
    <Animated.View entering={FadeInDown.delay(200).springify()}>
      <View style={[styles.heroGlass, { backgroundColor: COLORS.cardBackground + '73', borderColor: COLORS.text.light + '20' }]}>
        <LinearGradient
          colors={[COLORS.primary + '20', COLORS.primary + '05']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        
        <View style={styles.heroTop}>
          <Animated.View style={[styles.heroAvatarWrap, avatarPulseStyle]}>
            <ProfileAvatar
              avatarUrl={profile.avatar_url}
              name={profile.kid_name}
              size="large"
              editable
              onPress={() => router.push('/settings/edit-profile')}
            />
            {streak > 0 && (
              <Animated.View entering={ZoomIn.delay(600)} style={[styles.streakPin, streakPinPulseStyle]}>
                <Flame size={10} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.streakPinText}>{streak}</Text>
              </Animated.View>
            )}
          </Animated.View>

          <View style={styles.heroMeta}>
            <Text style={[styles.heroName, { color: COLORS.text.primary }]}>{profile.kid_name}</Text>
            {topLanguage && (
              <View style={[styles.langPill, { backgroundColor: COLORS.primary + '15' }]}>
                <Text style={styles.langPillFlag}>{getLanguageFlag(topLanguage.language_code)}</Text>
                <Text style={[styles.langPillName, { color: COLORS.primary }]}>{topLanguage.language_name}</Text>
                {(profile.languages?.length || 0) > 1 && (
                  <View style={[styles.langPillMore, { backgroundColor: COLORS.primary + '25' }]}>
                    <Text style={[styles.langPillMoreText, { color: COLORS.primary }]}>+{profile.languages.length - 1}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        <View style={[styles.heroStats, { borderTopColor: COLORS.text.light + '12' }]}>
          {[
            { label: 'Stories', value: String(storiesCount), icon: <BookOpen size={13} color={COLORS.primary} /> },
            { label: 'Quizzes', value: String(quizStats.totalQuizzes), icon: <Award size={13} color={COLORS.primary} /> },
            { label: 'Streak', value: `${streak}d`, icon: <Flame size={13} color="#F59E0B" fill="#F59E0B" /> },
          ].map((s, i, arr) => (
            <React.Fragment key={s.label}>
              <View style={styles.heroStat}>
                <View style={[styles.heroStatIcon, { backgroundColor: COLORS.primary + '12' }]}>{s.icon}</View>
                <Text style={[styles.heroStatVal, { color: COLORS.text.primary }]}>{s.value}</Text>
                <Text style={[styles.heroStatLbl, { color: COLORS.text.light }]}>{s.label}</Text>
              </View>
              {i < arr.length - 1 && <View style={[styles.heroStatDiv, { backgroundColor: COLORS.text.light + '15' }]} />}
            </React.Fragment>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

function AchievementSection({ stats, totalWords, COLORS, styles }: Readonly<{ stats: any; totalWords: number; COLORS: any; styles: ProfileStyles }>) {
  return (
    <Animated.View entering={FadeInDown.delay(300).springify()}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionEmoji}>🎖️</Text>
        <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>Achievements</Text>
      </View>
      <View style={styles.achieveRow}>
        {[
          { label: 'Accuracy', value: `${stats.avgScore}%`, sub: 'avg score', gradient: ['#6366F1', '#4F46E5'] as [string, string], emoji: '🎯' },
          { label: 'Perfect', value: String(stats.perfectScores), sub: 'quizzes', gradient: ['#F59E0B', '#D97706'] as [string, string], emoji: '⭐' },
          { label: 'Words', value: totalWords > 999 ? `${(totalWords / 1000).toFixed(1)}k` : String(totalWords), sub: 'read', gradient: ['#10B981', '#059669'] as [string, string], emoji: '📝' },
        ].map((card, i) => (
          <AnimatedAchievementCard key={card.label} card={card} index={i} styles={styles} />
        ))}
      </View>
    </Animated.View>
  );
}

function LearningCurve({ recentQuizzes, stories, COLORS, styles }: Readonly<{ recentQuizzes: any[]; stories: any[]; COLORS: any; styles: ProfileStyles }>) {
  return (
    <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionEmoji}>📈</Text>
        <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>Learning Curve</Text>
        <View style={[styles.sectionBadge, { backgroundColor: COLORS.primary + '18' }]}>
          <Text style={[styles.sectionBadgeText, { color: COLORS.primary }]}>
            {recentQuizzes.length} recent
          </Text>
        </View>
      </View>

      <View style={[styles.listCard, { backgroundColor: COLORS.cardBackground, borderColor: COLORS.text.light + '15', borderWidth: 1 }]}>
        {recentQuizzes.map((attempt, idx) => {
          const pct = Math.round((attempt.score / attempt.total_questions) * 100);
          const isPerfect = pct === 100;
          const isGood = pct >= 70;
          const scoreColor = isPerfect ? COLORS.success : isGood ? COLORS.primary : COLORS.error;
          const matchingStory = (stories || []).find(s => s.id === attempt.story_id);
          const title = matchingStory?.title || 'Story Quiz';
          const isLast = idx === recentQuizzes.length - 1;

          return (
            <View key={attempt.id}>
              <Animated.View
                entering={FadeInDown.delay(450 + idx * 50).springify()}
                style={styles.quizRow}
              >
                <LinearGradient
                  colors={[scoreColor + '20', scoreColor + '08']}
                  style={styles.scorePill}
                >
                  <Text style={[styles.scorePillText, { color: scoreColor }]}>{pct}%</Text>
                </LinearGradient>
                <View style={styles.quizInfo}>
                  <MarqueeText
                    text={title}
                    style={[styles.quizTitle, { color: COLORS.text.primary }]}
                  />
                  <Text style={[styles.quizSub, { color: COLORS.text.secondary }]}>
                    {attempt.score} / {attempt.total_questions} correct
                  </Text>
                </View>
                {isPerfect && <Text style={styles.quizPerfectEmoji}>👑</Text>}
              </Animated.View>
              {!isLast && (
                <View style={[styles.rowDivider, { backgroundColor: COLORS.text.light + '10' }]} />
              )}
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

function MasterySection({ languages, stories, COLORS, styles }: Readonly<{ languages: any[]; stories: any[]; COLORS: any; styles: ProfileStyles }>) {
  return (
    <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionEmoji}>🌎</Text>
        <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>Mastery</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.langScroll}
      >
        {languages?.map((lang, langIdx) => {
          const langCount = (stories || []).filter(s => s.language_code === lang.language_code).length;
          const pct = (stories?.length || 0) > 0 ? Math.round((langCount / stories.length) * 100) : 0;
          return (
            <Animated.View key={lang.id} entering={FadeInRight.delay(550 + langIdx * 100).springify()}>
              <View style={[styles.langCard, { backgroundColor: COLORS.cardBackground, borderColor: COLORS.text.light + '15', borderWidth: 1 }]}>
                <Text style={styles.langFlag}>{getLanguageFlag(lang.language_code)}</Text>
                <Text style={[styles.langName, { color: COLORS.text.primary }]}>{lang.language_name}</Text>
                <Text style={[styles.langCount, { color: COLORS.text.secondary }]}>
                  {langCount} {langCount === 1 ? 'story' : 'stories'}
                </Text>
                <AnimatedLangProgressBar pct={pct} primaryColor={COLORS.primary} delay={700 + langIdx * 100} styles={styles} />
              </View>
            </Animated.View>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

function XPBanner({ streak, COLORS, styles }: Readonly<{ streak: number; COLORS: any; styles: ProfileStyles }>) {
  const router = useRouter();
  return (
    <Animated.View entering={FadeInUp.delay(600).springify()} style={styles.section}>
      <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/(tabs)')}>
        <LinearGradient
          colors={['#8B5CF6', '#EC4899', '#F97316']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.xpCard}
        >
          <View style={styles.xpEmojiRow}>
            <Text style={styles.xpEmoji}>{streak > 0 ? '🔥' : '✨'}</Text>
          </View>
          <View style={styles.xpText}>
            <View style={styles.xpBadge}><Text style={styles.xpBadgeText}>LEGENDARY STREAK</Text></View>
            <Text style={styles.xpTitle}>
              {streak > 0 ? `${streak}-Day Adventure!` : 'Start Your Adventure!'}
            </Text>
            <Text style={styles.xpSub}>
              {streak > 0
                ? "You're crushing it! Every day is a new world waiting to be explored."
                : 'Read a story today and start your journey to become a Master Storyteller!'}
            </Text>
          </View>
          <View style={styles.xpCtaIcon}>
             <ChevronRight size={24} color="#FFFFFF" strokeWidth={3} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { currentTheme } = useTheme();
  const COLORS = currentTheme.colors;
  const { profile, stories, quizAttempts, isLoading, error, refreshAll } = useApp();
  const { wakeUI } = useUI();
  const insets = useSafeAreaInsets();
  const { width: winWidth } = useWindowDimensions();
  const isTablet = winWidth >= BREAKPOINTS.tablet;
  const isDesktop = winWidth >= BREAKPOINTS.desktop;
  const styles = useStyles(COLORS, insets, isTablet, isDesktop);

  const avatarPulseStyle = usePulse(0.97, 1.03);
  const streakPinPulseStyle = usePulse(0.92, 1.1);

  const stats = useMemo(() => computeQuizStats(quizAttempts), [quizAttempts]);
  const streak = useMemo(() => computeStreak(stories), [stories]);

  const recentQuizzes = useMemo(() => (quizAttempts || []).slice(0, 5), [quizAttempts]);

  const behaviorProgress = useMemo(() => computeBehaviorProgress(stories || [], 30), [stories]);

  useEffect(() => {
    analytics.trackBehaviorProgressViewed(behaviorProgress.length);
  }, [behaviorProgress.length]);

  const handleRefresh = useCallback(async () => {
    await refreshAll();
  }, [refreshAll]);

  if (isLoading) {
    return (
      <Container 
        maxWidth 
        gradient 
        gradientColors={COLORS.backgroundGradient}
        safeAreaEdges={['top']}
        scroll
        scrollProps={{
          contentContainerStyle: styles.scroll,
        }}
      >
        <MeshBackground primaryColor={COLORS.primary} />
        <FloatingParticles count={15} />

        <HeroSkeleton />

        <View style={styles.sectionHead}>
          <Skeleton width={120} height={28} borderRadius={8} color="rgba(0,0,0,0.08)" />
        </View>
        <View style={{ marginBottom: 24 }}>
          <LoadingSkeleton type="stats" count={3} />
        </View>

        <View style={styles.sectionHead}>
          <Skeleton width={140} height={28} borderRadius={8} color="rgba(0,0,0,0.08)" />
        </View>
        <View style={{ gap: 12 }}>
          <Skeleton width="100%" height={80} borderRadius={20} color="rgba(0,0,0,0.05)" />
          <Skeleton width="100%" height={80} borderRadius={20} color="rgba(0,0,0,0.05)" />
        </View>
      </Container>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['top']}>
        <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill} />
        <ErrorState
          type="general"
          title="Unable to Load Profile"
          message={error || 'Failed to load your profile data.'}
          onRetry={refreshAll}
          onGoHome={() => router.replace('/')}
        />
      </SafeAreaView>
    );
  }

  const topLanguage = profile.languages?.[0];
  const totalWords = (stories || []).reduce((sum, s) => sum + (s.word_count || 0), 0);
  const primaryColor = COLORS.primary;
  const textColor = COLORS.text.primary;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['top']}>
      <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill} />
      <MeshBackground primaryColor={COLORS.primary} />
      <FloatingParticles count={15} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        onScroll={wakeUI}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={handleRefresh} tintColor={COLORS.primary} />
        }
      >
        <ProfileHero 
          profile={profile}
          storiesCount={stories?.length || 0}
          quizStats={stats}
          streak={streak}
          COLORS={COLORS}
          styles={styles}
        />

        <AchievementSection 
          stats={stats}
          totalWords={totalWords}
          COLORS={COLORS}
          styles={styles}
        />

        <Animated.View entering={FadeInDown.delay(350).springify()}>
          <BehaviorProgressCard progress={behaviorProgress} />
        </Animated.View>

        {recentQuizzes.length > 0 && (
          <LearningCurve 
            recentQuizzes={recentQuizzes}
            stories={stories || []}
            COLORS={COLORS}
            styles={styles}
          />
        )}

        {(profile.languages?.length || 0) > 0 && (
          <MasterySection 
            languages={profile.languages || []}
            stories={stories || []}
            COLORS={COLORS}
            styles={styles}
          />
        )}

        <XPBanner 
          streak={streak}
          COLORS={COLORS}
          styles={styles}
        />

        <Animated.View entering={FadeInUp.delay(650).springify()} style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionEmoji}>🌙</Text>
            <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>Settings</Text>
          </View>
          <View style={[styles.listCard, { backgroundColor: COLORS.cardBackground, borderColor: COLORS.text.light + '15' }]}>
            <TouchableOpacity
              onPress={() => expoRouter.push('/settings/notifications')}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg }}
            >
              <Moon size={20} color={primaryColor} />
              <Text style={{ marginLeft: SPACING.md, fontFamily: FONTS.medium, fontSize: 15, color: textColor }}>
                Bedtime Reminders
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = (C: ColorScheme['colors'], insets: ReturnType<typeof useSafeAreaInsets>, isTablet: boolean, isDesktop: boolean) => {
  return useMemo(() => StyleSheet.create({
    container: { flex: 1 },
    loadingWrap: { padding: SPACING.xl },
    scroll: {
      paddingHorizontal: isTablet ? SPACING.xxl : SPACING.xl,
      paddingTop: SPACING.sm,
      paddingBottom: 120,
      gap: isTablet ? SPACING.xxl : SPACING.xl,
      width: '100%',
      maxWidth: isDesktop ? 1040 : LAYOUT.maxWidth + 120,
      alignSelf: 'center',
    },

    pageHeader: { paddingTop: SPACING.xs },
    pageTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    pageTitleEmoji: { fontSize: isTablet ? 38 : 32 },
    pageTitle: {
      fontSize: isTablet ? 42 : 34,
      fontFamily: FONTS.display,
      letterSpacing: -0.6,
    },

    heroGlass: {
      borderRadius: BORDER_RADIUS.xxl + 8,
      overflow: 'hidden',
      borderWidth: 1,
      ...(Platform.OS === 'ios' ? SHADOWS.md : {}),
    },
    heroTop: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: isTablet ? SPACING.xxl : SPACING.xl,
      paddingBottom: isTablet ? SPACING.xl : SPACING.lg,
      gap: SPACING.xl,
    },
    heroAvatarWrap: { position: 'relative' },
    streakPin: {
      position: 'absolute',
      bottom: -4,
      right: -4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      backgroundColor: '#EF4444',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: BORDER_RADIUS.pill,
      borderWidth: 2,
      borderColor: '#FFFFFF',
      ...SHADOWS.sm,
    },
    streakPinText: { fontSize: 10, fontFamily: FONTS.extrabold, color: '#FFFFFF' },
    heroMeta: { flex: 1, gap: SPACING.xs },
    heroName: {
      fontSize: isTablet ? 50 : 42,
      fontFamily: FONTS.display,
      letterSpacing: -0.8,
      lineHeight: isTablet ? 56 : 48,
    },
    langPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: BORDER_RADIUS.pill,
      marginTop: 4,
    },
    langPillFlag: { fontSize: 16 },
    langPillName: { fontSize: 13, fontFamily: FONTS.extrabold },
    langPillMore: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: BORDER_RADIUS.pill,
    },
    langPillMoreText: { fontSize: 10, fontFamily: FONTS.extrabold },
    editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: 4 },
    editBtnText: { fontSize: 13, fontFamily: FONTS.semibold },

    heroStats: {
      flexDirection: 'row',
      borderTopWidth: 1,
      marginHorizontal: SPACING.xl,
      paddingVertical: SPACING.xl,
    },
    heroStat: { flex: 1, alignItems: 'center', gap: 4 },
    heroStatIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    heroStatVal: { fontSize: isTablet ? 34 : 28, fontFamily: FONTS.display, letterSpacing: -0.4 },
    heroStatLbl: {
      fontSize: 10,
      fontFamily: FONTS.extrabold,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    heroStatDiv: { width: 1, marginVertical: 8, borderRadius: 0.5 },

    sectionHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: SPACING.md,
      paddingHorizontal: 2,
    },
    sectionEmoji: { fontSize: isTablet ? 34 : 28 },
    sectionTitle: {
      fontSize: isTablet ? 30 : 24,
      fontFamily: FONTS.display,
      letterSpacing: -0.3,
      flex: 1,
    },
    sectionBadge: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: BORDER_RADIUS.pill,
    },
    sectionBadgeText: { fontSize: 11, fontFamily: FONTS.extrabold },

    achieveRow: { flexDirection: 'row', gap: isTablet ? SPACING.lg : SPACING.md },
    achieveCard: {
      flex: 1,
      borderRadius: BORDER_RADIUS.xxl,
      overflow: 'hidden',
      ...SHADOWS.md,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    achieveCardInner: {
      alignItems: 'center',
      padding: isTablet ? SPACING.lg : SPACING.md,
      paddingVertical: isTablet ? SPACING.xxl : SPACING.xl + 2,
      gap: 4,
    },
    achieveEmoji: { fontSize: isTablet ? 52 : 44, marginBottom: 8 },
    achieveValue: {
      fontSize: isTablet ? 40 : 32,
      fontFamily: FONTS.display,
      color: '#FFFFFF',
      letterSpacing: -0.6,
    },
    achieveLabel: { fontSize: isTablet ? 15 : 13, fontFamily: FONTS.extrabold, color: 'rgba(255,255,255,0.92)' },
    achieveSub: { fontSize: isTablet ? 11 : 10, fontFamily: FONTS.bold, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' },

    section: { gap: SPACING.sm },

    listCard: {
      borderRadius: BORDER_RADIUS.xxl,
      overflow: 'hidden',
      ...SHADOWS.sm,
      borderWidth: 1,
    },
    quizRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: isTablet ? SPACING.xxl : SPACING.xl,
      paddingVertical: isTablet ? 20 : 16,
      gap: SPACING.lg,
    },
    rowDivider: { height: 1, marginHorizontal: SPACING.xl },
    scorePill: {
      width: isTablet ? 70 : 60,
      height: isTablet ? 50 : 42,
      borderRadius: BORDER_RADIUS.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scorePillText: { fontSize: isTablet ? 16 : 14, fontFamily: FONTS.extrabold },
    quizInfo: { flex: 1, gap: 2 },
    quizTitle: { fontSize: isTablet ? 20 : 17, fontFamily: FONTS.bold, letterSpacing: -0.1 },
    quizSub: { fontSize: isTablet ? 16 : 14, fontFamily: FONTS.medium },
    quizPerfectEmoji: { fontSize: 24 },

    langScroll: { gap: SPACING.md, paddingRight: SPACING.xs },
    langCard: {
      width: isTablet ? 160 : 130,
      padding: isTablet ? SPACING.xl : SPACING.lg,
      borderRadius: BORDER_RADIUS.xxl,
      gap: 4,
      alignItems: 'flex-start',
      ...SHADOWS.sm,
    },
    langFlag: { fontSize: isTablet ? 50 : 44, marginBottom: 6 },
    langName: { fontSize: isTablet ? 18 : 16, fontFamily: FONTS.extrabold, letterSpacing: -0.2 },
    langCount: { fontSize: isTablet ? 14 : 13, fontFamily: FONTS.medium },
    langBar: {
      width: '100%',
      height: 5,
      borderRadius: 2.5,
      marginTop: 6,
      overflow: 'hidden',
    },
    langBarFill: { height: '100%', borderRadius: 2.5 },

    charsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
    charChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderRadius: BORDER_RADIUS.pill,
    },
    charEmoji: { fontSize: 16 },
    charName: { fontSize: 13, fontFamily: FONTS.bold },

    xpCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: isTablet ? 30 : 24,
      borderRadius: 32,
      gap: SPACING.xl,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
      ...SHADOWS.lg,
    },
    xpEmojiRow: { alignItems: 'center' },
    xpEmoji: { fontSize: isTablet ? 74 : 64 },
    xpBadge: { 
      backgroundColor: 'rgba(255,255,255,0.2)', 
      paddingHorizontal: 8, 
      paddingVertical: 3, 
      borderRadius: 6,
      alignSelf: 'flex-start',
      marginBottom: 4,
    },
    xpBadgeText: { fontSize: 9, fontFamily: FONTS.extrabold, color: '#FFFFFF', letterSpacing: 0.5 },
    xpText: { flex: 1, gap: 2 },
    xpTitle: { fontSize: isTablet ? 30 : 24, fontFamily: FONTS.display, color: '#FFFFFF', letterSpacing: -0.4 },
    xpSub: { fontSize: isTablet ? 16 : 14, fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.9)', lineHeight: isTablet ? 24 : 20 },
    xpCtaIcon: {
      width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.25)',
      alignItems: 'center', justifyContent: 'center',
    },
  }), [C, insets, isTablet, isDesktop]);
};
