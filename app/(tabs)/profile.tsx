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
    let count = 0;
    const todayMs = new Date(new Date().toDateString()).getTime();
    const dayMs = 86400000;
    for (let i = 0; i < sortedDays.length; i++) {
      const expected = todayMs - i * dayMs;
      if (sortedDays[i] === expected) {
        count++;
      } else if (i === 0 && sortedDays[i] === todayMs - dayMs) {
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={handleRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* ── Hero banner ── */}
        <Animated.View entering={FadeInDown.delay(40).springify()}>
          <LinearGradient
            colors={COLORS.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroBanner}
          >
            {/* Avatar + name */}
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
                    <Flame size={11} color="#FFFFFF" fill="#FFFFFF" />
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
                  <ChevronRight size={13} color="rgba(255,255,255,0.85)" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick stats */}
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

        {/* ── Achievement cards row ── */}
        <Animated.View entering={FadeInUp.delay(120).springify()} style={styles.achieveRow}>
          {[
            {
              label: 'Avg Score',
              value: `${stats.avgScore}%`,
              sub: 'quiz accuracy',
              color: COLORS.primary,
              bg: COLORS.primary + '12',
              icon: <Target size={18} color={COLORS.primary} />,
            },
            {
              label: 'Perfect',
              value: String(stats.perfectScores),
              sub: 'flawless runs',
              color: '#F59E0B',
              bg: '#F59E0B12',
              icon: <Star size={18} color="#F59E0B" />,
            },
            {
              label: 'Words',
              value: totalWords > 999 ? `${(totalWords / 1000).toFixed(1)}k` : String(totalWords),
              sub: 'words read',
              color: COLORS.success,
              bg: COLORS.success + '12',
              icon: <TrendingUp size={18} color={COLORS.success} />,
            },
          ].map(card => (
            <View key={card.label} style={[styles.achieveCard, { backgroundColor: COLORS.cardBackground }]}>
              <View style={[styles.achieveIconBox, { backgroundColor: card.bg }]}>
                {card.icon}
              </View>
              <Text style={[styles.achieveValue, { color: COLORS.text.primary }]}>{card.value}</Text>
              <Text style={[styles.achieveLabel, { color: card.color }]}>{card.label}</Text>
              <Text style={[styles.achieveSub, { color: COLORS.text.secondary }]}>{card.sub}</Text>
            </View>
          ))}
        </Animated.View>

        {/* ── Quiz history ── */}
        {recentQuizzes.length > 0 && (
          <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>Quiz Results</Text>
              <View style={[styles.sectionBadge, { backgroundColor: COLORS.primary + '15' }]}>
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
                      <View style={[styles.scorePill, { backgroundColor: scoreColor + '18' }]}>
                        <Text style={[styles.scorePillText, { color: scoreColor }]}>{pct}%</Text>
                      </View>
                      <View style={styles.quizInfo}>
                        <Text style={[styles.quizTitle, { color: COLORS.text.primary }]} numberOfLines={1}>
                          {title}
                        </Text>
                        <Text style={[styles.quizSub, { color: COLORS.text.secondary }]}>
                          {attempt.score} / {attempt.total_questions} correct
                        </Text>
                      </View>
                      {isPerfect && <Star size={15} color="#F59E0B" fill="#F59E0B" />}
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
                      {/* Mini progress bar */}
                      <View style={[styles.langBar, { backgroundColor: COLORS.text.primary + '10' }]}>
                        <View
                          style={[
                            styles.langBarFill,
                            { backgroundColor: COLORS.primary, width: `${Math.max(pct, 8)}%` },
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
              <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>Story Characters</Text>
            </View>
            <View style={styles.charsWrap}>
              {profile.family_members?.map(m => (
                <View key={m.$id} style={[styles.charChip, { backgroundColor: COLORS.primary + '12' }]}>
                  <Text style={styles.charEmoji}>👨‍👩‍👧</Text>
                  <Text style={[styles.charName, { color: COLORS.text.primary }]}>{m.name}</Text>
                </View>
              ))}
              {profile.friends?.map(f => (
                <View key={f.$id} style={[styles.charChip, { backgroundColor: COLORS.info + '12' }]}>
                  <Text style={styles.charEmoji}>🧑‍🤝‍🧑</Text>
                  <Text style={[styles.charName, { color: COLORS.text.primary }]}>{f.name}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* ── Level / XP card ── */}
        <Animated.View entering={FadeInUp.delay(420).springify()} style={styles.section}>
          <LinearGradient
            colors={[COLORS.gradients.sunset[0] + 'EE', COLORS.gradients.sunset[1] + 'EE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.xpCard}
          >
            <View style={styles.xpLeft}>
              <View style={styles.xpIconBox}>
                <Zap size={20} color="#F59E0B" fill="#F59E0B" />
              </View>
              <View>
                <Text style={styles.xpTitle}>Keep the streak going!</Text>
                <Text style={styles.xpSub}>
                  {streak > 0
                    ? `You're on a ${streak}-day streak — amazing!`
                    : 'Read a story today to start your streak.'}
                </Text>
              </View>
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
    paddingTop: SPACING.md,
    paddingBottom: 120,
    gap: SPACING.lg,
  },

  /* Hero */
  heroBanner: {
    borderRadius: BORDER_RADIUS.xl,
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
  streakPinText: {
    fontSize: 9,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  heroMeta: { flex: 1, gap: SPACING.sm, paddingTop: 4 },
  heroName: {
    fontSize: 24,
    fontFamily: FONTS.extrabold,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.pill,
  },
  langPillFlag: { fontSize: 14 },
  langPillName: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
    color: '#FFFFFF',
  },
  langPillMore: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BORDER_RADIUS.pill,
  },
  langPillMoreText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-start',
  },
  editBtnText: {
    fontSize: 13,
    fontFamily: FONTS.semibold,
    color: 'rgba(255,255,255,0.85)',
  },
  heroStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    marginHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  heroStat: { flex: 1, alignItems: 'center', gap: 2 },
  heroStatIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  heroStatVal: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  heroStatLbl: {
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroStatDiv: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginVertical: 4,
  },

  /* Achievement cards */
  achieveRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  achieveCard: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    gap: 3,
    ...SHADOWS.xs,
  },
  achieveIconBox: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  achieveValue: {
    fontSize: 20,
    fontFamily: FONTS.extrabold,
    letterSpacing: -0.5,
  },
  achieveLabel: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    letterSpacing: 0.1,
  },
  achieveSub: {
    fontSize: 10,
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },

  /* Sections */
  section: { gap: SPACING.sm },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    letterSpacing: -0.2,
    flex: 1,
  },
  sectionBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.pill,
  },
  sectionBadgeText: {
    fontSize: 11,
    fontFamily: FONTS.semibold,
  },

  /* Quiz list */
  listCard: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.xs,
  },
  quizRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 13,
    gap: SPACING.md,
  },
  rowDivider: {
    height: 1,
    marginLeft: 52 + SPACING.md + SPACING.lg,
  },
  scorePill: {
    width: 52,
    height: 36,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scorePillText: {
    fontSize: 13,
    fontFamily: FONTS.bold,
  },
  quizInfo: { flex: 1, gap: 2 },
  quizTitle: {
    fontSize: 14,
    fontFamily: FONTS.semibold,
    letterSpacing: -0.1,
  },
  quizSub: { fontSize: 12, fontFamily: FONTS.regular },

  /* Languages */
  langScroll: { gap: SPACING.md, paddingRight: SPACING.xs },
  langCard: {
    width: 110,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    gap: 3,
    alignItems: 'flex-start',
    ...SHADOWS.xs,
  },
  langFlag: { fontSize: 24, marginBottom: 2 },
  langName: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    letterSpacing: -0.1,
  },
  langCount: { fontSize: 11, fontFamily: FONTS.regular },
  langBar: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  langBarFill: { height: '100%', borderRadius: 2 },

  /* Characters */
  charsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  charChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.pill,
  },
  charEmoji: { fontSize: 16 },
  charName: { fontSize: 13, fontFamily: FONTS.semibold },

  /* XP / streak nudge */
  xpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.md,
    ...SHADOWS.md,
  },
  xpLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  xpIconBox: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  xpTitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  xpSub: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 1,
    maxWidth: 180,
  },
  xpCta: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  xpCtaText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
});
