import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeInRight,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useEntranceSequence, useProgressBar, useGlowPulse } from '@/utils/animations';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getLanguageFlag } from '@/utils/languageUtils';
import {
  BookOpen,
  Award,
  Flame,
  Zap,
  ChevronRight,
} from 'lucide-react-native';
import { SPACING, BORDER_RADIUS, SHADOWS, FONTS, FONT_SIZES } from '@/constants/theme';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { ErrorState } from '@/components/ErrorState';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { MeshBackground } from '@/components/MeshBackground';
import { MarqueeText } from '@/components/MarqueeText';

function AnimatedAchievementCard({ card, index, styles }: { card: any; index: number; styles: any }) {
  const entrance = useEntranceSequence(index, 120, 70);
  const scale = useSharedValue(1);
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

function AnimatedLangProgressBar({ pct, primaryColor, delay, styles }: { pct: number; primaryColor: string; delay: number; styles: any }) {
  const barStyle = useProgressBar(Math.max(pct, 10), 1000, delay);
  return (
    <View style={[styles.langBar, { backgroundColor: primaryColor + '15' }]}>
      <Animated.View style={[styles.langBarFill, { backgroundColor: primaryColor }, barStyle]} />
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { currentTheme } = useTheme();
  const COLORS = currentTheme.colors;
  const { profile, stories, quizAttempts, isLoading, error, refreshAll } = useApp();
  const insets = useSafeAreaInsets();
  const styles = useStyles(COLORS, insets);

  const stats = useMemo(() => {
    const totalQuizzes = quizAttempts?.length || 0;
    const perfectScores = quizAttempts?.filter(q => (q.score / q.total_questions) >= 0.9).length || 0;
    const avgScore =
      totalQuizzes > 0
        ? Math.round(
            quizAttempts.reduce((sum, a) => sum + (a.score / a.total_questions) * 100, 0) /
              totalQuizzes
          )
        : 0;
    return { totalQuizzes, perfectScores, avgScore };
  }, [quizAttempts]);

  const streak = useMemo(() => {
    if (!stories || stories.length === 0) return 0;
    const uniqueDays = new Set(
      stories.map(s => new Date(s.generated_at || s.created_at).toDateString())
    );
    const sortedDays = Array.from(uniqueDays)
      .map(d => new Date(d as string).getTime())
      .sort((a, b) => b - a);
    const todayMs = new Date(new Date().toDateString()).getTime();
    const dayMs = 86400000;
    const startMs = sortedDays[0] === todayMs ? todayMs : (sortedDays[0] === todayMs - dayMs ? todayMs - dayMs : null);
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
  }, [stories]);

  const recentQuizzes = useMemo(() => (quizAttempts || []).slice(0, 5), [quizAttempts]);

  const handleRefresh = useCallback(async () => {
    await refreshAll();
  }, [refreshAll]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['top']}>
        <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill} />
        <View style={styles.loadingWrap}>
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['top']}>
      <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill} />
      <MeshBackground primaryColor={COLORS.primary} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={handleRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* ── Page title ── */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.pageHeader}>
          <View style={styles.pageTitleRow}>
            <Text style={styles.pageTitleEmoji}>🏆</Text>
            <Text style={[styles.pageTitle, { color: COLORS.text.primary }]}>My Progress</Text>
          </View>
        </Animated.View>

        {/* ── Hero Glasmorphic Banner ── */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={[styles.heroGlass, { backgroundColor: COLORS.cardBackground + '73', borderColor: COLORS.text.light + '20' }]}>
            <LinearGradient
              colors={[COLORS.primary + '20', COLORS.primary + '05']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            
            <View style={styles.heroTop}>
              <View style={styles.heroAvatarWrap}>
                <ProfileAvatar
                  avatarUrl={profile.avatar_url}
                  name={profile.kid_name}
                  size="large"
                  editable
                  onPress={() => router.push('/settings/edit-profile')}
                />
                {streak > 0 && (
                  <Animated.View entering={ZoomIn.delay(600)} style={styles.streakPin}>
                    <Flame size={10} color="#FFFFFF" fill="#FFFFFF" />
                    <Text style={styles.streakPinText}>{streak}</Text>
                  </Animated.View>
                )}
              </View>

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
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => router.push('/settings/edit-profile')}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.editBtnText, { color: COLORS.text.secondary }]}>Edit Profile</Text>
                  <ChevronRight size={12} color={COLORS.text.light} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.heroStats, { borderTopColor: COLORS.text.light + '12' }]}>
              {[
                { label: 'Stories', value: String(stories?.length || 0), icon: <BookOpen size={13} color={COLORS.primary} /> },
                { label: 'Quizzes', value: String(stats.totalQuizzes), icon: <Award size={13} color={COLORS.primary} /> },
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

        {/* ── Section: Achievements ── */}
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

        {/* ── Quiz history ── */}
        {(recentQuizzes?.length || 0) > 0 && (
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
        )}

        {/* ── Languages ── */}
        {(profile.languages?.length || 0) > 0 && (
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
              {profile.languages?.map((lang, langIdx) => {
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
        )}

        {/* ── XP / Streak Card ── */}
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
                    ? `You're crushing it! Every day is a new world waiting to be explored.`
                    : 'Read a story today and start your journey to become a Master Storyteller!'}
                </Text>
              </View>
              <View style={styles.xpCtaIcon}>
                 <ChevronRight size={24} color="#FFFFFF" strokeWidth={3} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = (C: any, insets: any) => {
  return useMemo(() => StyleSheet.create({
    container: { flex: 1 },
    loadingWrap: { padding: SPACING.xl },
    scroll: {
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.sm,
      paddingBottom: 120,
      gap: SPACING.xl,
    },

    pageHeader: { paddingTop: SPACING.xs },
    pageTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    pageTitleEmoji: { fontSize: 24 },
    pageTitle: {
      fontSize: 34,
      fontFamily: FONTS.display,
      letterSpacing: -0.6,
    },

    heroGlass: {
      borderRadius: BORDER_RADIUS.xxl + 8,
      overflow: 'hidden',
      borderWidth: 1,
      ...SHADOWS.md,
    },
    heroTop: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: SPACING.xl,
      paddingBottom: SPACING.lg,
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
      fontSize: 36,
      fontFamily: FONTS.display,
      letterSpacing: -0.8,
      lineHeight: 40,
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
    heroStatVal: { fontSize: 22, fontFamily: FONTS.display, letterSpacing: -0.4 },
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
    },
    sectionEmoji: { fontSize: 22 },
    sectionTitle: {
      fontSize: 22,
      fontFamily: FONTS.display,
      letterSpacing: -0.4,
      flex: 1,
    },
    sectionBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: BORDER_RADIUS.pill,
    },
    sectionBadgeText: { fontSize: 11, fontFamily: FONTS.extrabold },

    achieveRow: { flexDirection: 'row', gap: SPACING.md },
    achieveCard: {
      flex: 1,
      borderRadius: BORDER_RADIUS.xxl,
      overflow: 'hidden',
      ...SHADOWS.md,
    },
    achieveCardInner: {
      alignItems: 'center',
      padding: SPACING.md,
      paddingVertical: SPACING.xl,
      gap: 2,
    },
    achieveEmoji: { fontSize: 32, marginBottom: 4 },
    achieveValue: {
      fontSize: 24,
      fontFamily: FONTS.display,
      color: '#FFFFFF',
      letterSpacing: -0.6,
    },
    achieveLabel: { fontSize: 12, fontFamily: FONTS.extrabold, color: 'rgba(255,255,255,0.92)' },
    achieveSub: { fontSize: 10, fontFamily: FONTS.bold, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' },

    section: { gap: SPACING.sm },

    listCard: {
      borderRadius: BORDER_RADIUS.xxl + 4,
      overflow: 'hidden',
      ...SHADOWS.sm,
    },
    quizRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.xl,
      paddingVertical: 16,
      gap: SPACING.lg,
    },
    rowDivider: { height: 1, marginHorizontal: SPACING.xl },
    scorePill: {
      width: 60,
      height: 42,
      borderRadius: BORDER_RADIUS.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scorePillText: { fontSize: 14, fontFamily: FONTS.extrabold },
    quizInfo: { flex: 1, gap: 2 },
    quizTitle: { fontSize: 15, fontFamily: FONTS.bold, letterSpacing: -0.1 },
    quizSub: { fontSize: 13, fontFamily: FONTS.medium },
    quizPerfectEmoji: { fontSize: 20 },

    langScroll: { gap: SPACING.md, paddingRight: SPACING.xs },
    langCard: {
      width: 130,
      padding: SPACING.lg,
      borderRadius: BORDER_RADIUS.xxl,
      gap: 4,
      alignItems: 'flex-start',
      ...SHADOWS.sm,
    },
    langFlag: { fontSize: 32, marginBottom: 4 },
    langName: { fontSize: 14, fontFamily: FONTS.extrabold, letterSpacing: -0.2 },
    langCount: { fontSize: 11, fontFamily: FONTS.medium },
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
      padding: 24,
      borderRadius: 32,
      gap: SPACING.xl,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
      ...SHADOWS.lg,
    },
    xpEmojiRow: { alignItems: 'center' },
    xpEmoji: { fontSize: 52 },
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
    xpTitle: { fontSize: 24, fontFamily: FONTS.display, color: '#FFFFFF', letterSpacing: -0.4 },
    xpSub: { fontSize: 14, fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.9)', lineHeight: 20 },
    xpCtaIcon: {
      width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.25)',
      alignItems: 'center', justifyContent: 'center',
    },
  }), [C, insets]);
};
