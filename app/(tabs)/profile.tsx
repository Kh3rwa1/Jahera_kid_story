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
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeInRight,
} from 'react-native-reanimated';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getLanguageFlag } from '@/utils/languageUtils';
import {
  BookOpen,
  Award,
  Target,
  Star,
  Flame,
  TrendingUp,
  Zap,
  ChevronRight,
} from 'lucide-react-native';
import { SPACING, BORDER_RADIUS, SHADOWS, FONTS, FONT_SIZES } from '@/constants/theme';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { ErrorState } from '@/components/ErrorState';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { KidsBubbleBackground } from '@/components/KidsBubbleBackground';

export default function ProfileScreen() {
  const router = useRouter();
  const { currentTheme } = useTheme();
  const COLORS = currentTheme.colors;
  const { profile, stories, quizAttempts, isLoading, error, refreshAll } = useApp();

  const stats = useMemo(() => {
    const totalQuizzes = quizAttempts.length;
    const perfectScores = quizAttempts.filter(a => a.score === a.total_questions).length;
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
    if (stories.length === 0) return 0;
    const uniqueDays = new Set(
      stories.map(s => new Date(s.generated_at || s.$createdAt).toDateString())
    );
    const sortedDays = Array.from(uniqueDays)
      .map(d => new Date(d).getTime())
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

  const recentQuizzes = useMemo(() => quizAttempts.slice(0, 5), [quizAttempts]);

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
  const totalWords = stories.reduce((sum, s) => sum + (s.word_count || 0), 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['top']}>
      <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill} />
      <KidsBubbleBackground bubbleCount={8} cloudCount={2} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={handleRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* ── Page title ── */}
        <Animated.View entering={FadeInDown.delay(20).springify()} style={styles.pageHeader}>
          <View style={styles.pageTitleRow}>
            <Text style={styles.pageTitleEmoji}>🏆</Text>
            <Text style={[styles.pageTitle, { color: COLORS.text.primary }]}>My Progress</Text>
          </View>
        </Animated.View>

        {/* ── Hero banner ── */}
        <Animated.View entering={FadeInDown.delay(60).springify()}>
          <LinearGradient
            colors={[...COLORS.gradients.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroBanner}
          >
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
                  <View style={styles.streakPin}>
                    <Flame size={10} color="#FFFFFF" fill="#FFFFFF" />
                    <Text style={styles.streakPinText}>{streak}</Text>
                  </View>
                )}
              </View>

              <View style={styles.heroMeta}>
                <Text style={styles.heroName}>{profile.kid_name}</Text>
                {topLanguage && (
                  <View style={styles.langPill}>
                    <Text style={styles.langPillFlag}>{getLanguageFlag(topLanguage.language_code)}</Text>
                    <Text style={styles.langPillName}>{topLanguage.language_name}</Text>
                    {profile.languages.length > 1 && (
                      <View style={styles.langPillMore}>
                        <Text style={styles.langPillMoreText}>+{profile.languages.length - 1}</Text>
                      </View>
                    )}
                  </View>
                )}
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => router.push('/settings/edit-profile')}
                  activeOpacity={0.75}
                >
                  <Text style={styles.editBtnText}>Edit Profile</Text>
                  <ChevronRight size={12} color="rgba(255,255,255,0.85)" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.heroStats}>
              {[
                { label: 'Stories', value: String(stories.length), icon: <BookOpen size={13} color="rgba(255,255,255,0.85)" /> },
                { label: 'Quizzes', value: String(stats.totalQuizzes), icon: <Award size={13} color="rgba(255,255,255,0.85)" /> },
                { label: 'Streak', value: `${streak}d`, icon: <Flame size={13} color="#F59E0B" fill="#F59E0B" /> },
              ].map((s, i, arr) => (
                <React.Fragment key={s.label}>
                  <View style={styles.heroStat}>
                    <View style={styles.heroStatIcon}>{s.icon}</View>
                    <Text style={styles.heroStatVal}>{s.value}</Text>
                    <Text style={styles.heroStatLbl}>{s.label}</Text>
                  </View>
                  {i < arr.length - 1 && <View style={styles.heroStatDiv} />}
                </React.Fragment>
              ))}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Section: Achievements ── */}
        <Animated.View entering={FadeInUp.delay(120).springify()}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionEmoji}>🎖️</Text>
            <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>Achievements</Text>
          </View>
          <View style={styles.achieveRow}>
            {[
              {
                label: 'Avg Score',
                value: `${stats.avgScore}%`,
                sub: 'quiz accuracy',
                gradient: [COLORS.primary + 'DD', COLORS.primaryDark + 'DD'] as [string, string],
                icon: <Target size={22} color="#FFFFFF" />,
                emoji: '🎯',
              },
              {
                label: 'Perfect',
                value: String(stats.perfectScores),
                sub: 'flawless runs',
                gradient: ['#F59E0BDD', '#D97706DD'] as [string, string],
                icon: <Star size={22} color="#FFFFFF" />,
                emoji: '⭐',
              },
              {
                label: 'Words',
                value: totalWords > 999 ? `${(totalWords / 1000).toFixed(1)}k` : String(totalWords),
                sub: 'words read',
                gradient: [COLORS.success + 'DD', '#16A34ADD'] as [string, string],
                icon: <TrendingUp size={22} color="#FFFFFF" />,
                emoji: '📝',
              },
            ].map(card => (
              <View key={card.label} style={styles.achieveCard}>
                <LinearGradient
                  colors={card.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.achieveCardInner}
                >
                  <Text style={styles.achieveEmoji}>{card.emoji}</Text>
                  <Text style={styles.achieveValue}>{card.value}</Text>
                  <Text style={styles.achieveLabel}>{card.label}</Text>
                  <Text style={styles.achieveSub}>{card.sub}</Text>
                </LinearGradient>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── Quiz history ── */}
        {recentQuizzes.length > 0 && (
          <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionEmoji}>📝</Text>
              <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>Quiz Results</Text>
              <View style={[styles.sectionBadge, { backgroundColor: COLORS.primary + '18' }]}>
                <Text style={[styles.sectionBadgeText, { color: COLORS.primary }]}>
                  {recentQuizzes.length} recent
                </Text>
              </View>
            </View>

            <View style={[styles.listCard, { backgroundColor: COLORS.cardBackground }]}>
              {recentQuizzes.map((attempt, idx) => {
                const pct = Math.round((attempt.score / attempt.total_questions) * 100);
                const isPerfect = pct === 100;
                const isGood = pct >= 70;
                const scoreColor = isPerfect ? COLORS.success : isGood ? COLORS.primary : COLORS.error;
                const matchingStory = stories.find(s => s.$id === attempt.story_id);
                const title = matchingStory?.title || 'Story Quiz';
                const isLast = idx === recentQuizzes.length - 1;

                return (
                  <View key={attempt.$id}>
                    <Animated.View
                      entering={FadeInUp.delay(240 + idx * 50).springify()}
                      style={styles.quizRow}
                    >
                      <LinearGradient
                        colors={[scoreColor + '25', scoreColor + '10']}
                        style={styles.scorePill}
                      >
                        <Text style={[styles.scorePillText, { color: scoreColor }]}>{pct}%</Text>
                      </LinearGradient>
                      <View style={styles.quizInfo}>
                        <Text style={[styles.quizTitle, { color: COLORS.text.primary }]} numberOfLines={1}>
                          {title}
                        </Text>
                        <Text style={[styles.quizSub, { color: COLORS.text.secondary }]}>
                          {attempt.score} / {attempt.total_questions} correct
                        </Text>
                      </View>
                      {isPerfect && <Text style={styles.quizPerfectEmoji}>⭐</Text>}
                    </Animated.View>
                    {!isLast && (
                      <View style={[styles.rowDivider, { backgroundColor: COLORS.text.primary + '08' }]} />
                    )}
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* ── Languages ── */}
        {profile.languages && profile.languages.length > 0 && (
          <Animated.View entering={FadeInUp.delay(280).springify()} style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionEmoji}>🌍</Text>
              <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>Languages</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.langScroll}
            >
              {profile.languages.map((lang, langIdx) => {
                const langCount = stories.filter(s => s.language_code === lang.language_code).length;
                const pct = stories.length > 0 ? Math.round((langCount / stories.length) * 100) : 0;
                return (
                  <Animated.View key={lang.$id} entering={FadeInRight.delay(300 + langIdx * 70).springify()}>
                    <View style={[styles.langCard, { backgroundColor: COLORS.cardBackground }]}>
                      <Text style={styles.langFlag}>{getLanguageFlag(lang.language_code)}</Text>
                      <Text style={[styles.langName, { color: COLORS.text.primary }]}>{lang.language_name}</Text>
                      <Text style={[styles.langCount, { color: COLORS.text.secondary }]}>
                        {langCount} {langCount === 1 ? 'story' : 'stories'}
                      </Text>
                      <View style={[styles.langBar, { backgroundColor: COLORS.text.primary + '12' }]}>
                        <View
                          style={[
                            styles.langBarFill,
                            { backgroundColor: COLORS.primary, width: `${Math.max(pct, 10)}%` },
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

        {/* ── Story characters ── */}
        {(profile.family_members?.length > 0 || profile.friends?.length > 0) && (
          <Animated.View entering={FadeInUp.delay(360).springify()} style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionEmoji}>🧑‍🤝‍🧑</Text>
              <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>Story Characters</Text>
            </View>
            <View style={styles.charsWrap}>
              {profile.family_members?.map(m => (
                <View key={m.$id} style={[styles.charChip, { backgroundColor: COLORS.primary + '14' }]}>
                  <Text style={styles.charEmoji}>👨‍👩‍👧</Text>
                  <Text style={[styles.charName, { color: COLORS.text.primary }]}>{m.name}</Text>
                </View>
              ))}
              {profile.friends?.map(f => (
                <View key={f.$id} style={[styles.charChip, { backgroundColor: COLORS.info + '14' }]}>
                  <Text style={styles.charEmoji}>🧑‍🤝‍🧑</Text>
                  <Text style={[styles.charName, { color: COLORS.text.primary }]}>{f.name}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* ── Streak / XP card ── */}
        <Animated.View entering={FadeInUp.delay(420).springify()} style={styles.section}>
          <LinearGradient
            colors={[...COLORS.gradients.sunset]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.xpCard}
          >
            <Text style={styles.xpEmoji}>{streak > 0 ? '🔥' : '✨'}</Text>
            <View style={styles.xpText}>
              <Text style={styles.xpTitle}>
                {streak > 0 ? `${streak}-day streak!` : 'Start your streak!'}
              </Text>
              <Text style={styles.xpSub}>
                {streak > 0
                  ? `Amazing! Keep reading every day to grow your streak.`
                  : 'Read a story today to start your daily streak.'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.xpCta}
              onPress={() => router.push('/(tabs)')}
              activeOpacity={0.8}
            >
              <Text style={styles.xpCtaText}>Read</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingWrap: { padding: SPACING.xl },
  scroll: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: 120,
    gap: SPACING.lg,
  },

  pageHeader: { paddingTop: SPACING.xs },
  pageTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pageTitleEmoji: { fontSize: 22 },
  pageTitle: {
    fontSize: 28,
    fontFamily: FONTS.extrabold,
    letterSpacing: -0.6,
  },

  heroBanner: {
    borderRadius: BORDER_RADIUS.xxl,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.xl,
    paddingBottom: SPACING.lg,
    gap: SPACING.lg,
  },
  heroAvatarWrap: { position: 'relative' },
  streakPin: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.pill,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  streakPinText: { fontSize: 9, fontFamily: FONTS.extrabold, color: '#FFFFFF' },
  heroMeta: { flex: 1, gap: SPACING.sm, paddingTop: 4 },
  heroName: {
    fontSize: 26,
    fontFamily: FONTS.extrabold,
    color: '#FFFFFF',
    letterSpacing: -0.6,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.pill,
  },
  langPillFlag: { fontSize: 14 },
  langPillName: { fontSize: 12, fontFamily: FONTS.bold, color: '#FFFFFF' },
  langPillMore: {
    backgroundColor: 'rgba(255,255,255,0.28)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BORDER_RADIUS.pill,
  },
  langPillMoreText: { fontSize: 10, fontFamily: FONTS.extrabold, color: '#FFFFFF' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' },
  editBtnText: { fontSize: 13, fontFamily: FONTS.semibold, color: 'rgba(255,255,255,0.85)' },

  heroStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  heroStat: { flex: 1, alignItems: 'center', gap: 2 },
  heroStatIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  heroStatVal: { fontSize: FONT_SIZES.md, fontFamily: FONTS.extrabold, color: '#FFFFFF' },
  heroStatLbl: {
    fontSize: 10,
    fontFamily: FONTS.semibold,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroStatDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.14)', marginVertical: 4 },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.md,
  },
  sectionEmoji: { fontSize: 20 },
  sectionTitle: {
    fontSize: 20,
    fontFamily: FONTS.extrabold,
    letterSpacing: -0.4,
    flex: 1,
  },
  sectionBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.pill,
  },
  sectionBadgeText: { fontSize: 11, fontFamily: FONTS.bold },

  achieveRow: { flexDirection: 'row', gap: SPACING.sm },
  achieveCard: {
    flex: 1,
    borderRadius: BORDER_RADIUS.xxl,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  achieveCardInner: {
    alignItems: 'center',
    padding: SPACING.md,
    paddingVertical: SPACING.lg,
    gap: 3,
  },
  achieveEmoji: { fontSize: 28, marginBottom: 2 },
  achieveValue: {
    fontSize: 22,
    fontFamily: FONTS.extrabold,
    color: '#FFFFFF',
    letterSpacing: -0.6,
  },
  achieveLabel: { fontSize: 12, fontFamily: FONTS.extrabold, color: 'rgba(255,255,255,0.92)', letterSpacing: 0.1 },
  achieveSub: { fontSize: 10, fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },

  section: { gap: SPACING.sm },

  listCard: {
    borderRadius: BORDER_RADIUS.xxl,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  quizRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 13,
    gap: SPACING.md,
  },
  rowDivider: { height: 1, marginLeft: 56 + SPACING.md + SPACING.lg },
  scorePill: {
    width: 56,
    height: 38,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scorePillText: { fontSize: 13, fontFamily: FONTS.extrabold },
  quizInfo: { flex: 1, gap: 2 },
  quizTitle: { fontSize: 14, fontFamily: FONTS.bold, letterSpacing: -0.1 },
  quizSub: { fontSize: 12, fontFamily: FONTS.medium },
  quizPerfectEmoji: { fontSize: 18 },

  langScroll: { gap: SPACING.md, paddingRight: SPACING.xs },
  langCard: {
    width: 115,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    gap: 4,
    alignItems: 'flex-start',
    ...SHADOWS.sm,
  },
  langFlag: { fontSize: 28, marginBottom: 2 },
  langName: { fontSize: 13, fontFamily: FONTS.extrabold, letterSpacing: -0.1 },
  langCount: { fontSize: 11, fontFamily: FONTS.medium },
  langBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  langBarFill: { height: '100%', borderRadius: 2 },

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
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.xxl,
    gap: SPACING.md,
    ...SHADOWS.lg,
  },
  xpEmoji: { fontSize: 40 },
  xpText: { flex: 1, gap: 3 },
  xpTitle: { fontSize: FONT_SIZES.md, fontFamily: FONTS.extrabold, color: '#FFFFFF', letterSpacing: -0.2 },
  xpSub: { fontSize: 12, fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.78)', lineHeight: 17 },
  xpCta: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  xpCtaText: { fontSize: FONT_SIZES.sm, fontFamily: FONTS.extrabold, color: '#FFFFFF' },
});
