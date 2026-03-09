import { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, FadeInRight } from 'react-native-reanimated';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getLanguageFlag } from '@/utils/languageUtils';
import { BookOpen, Award, Target, Star, Flame, CreditCard as Edit3 } from 'lucide-react-native';
import { SPACING, BORDER_RADIUS, SHADOWS, FONTS } from '@/constants/theme';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { ErrorState } from '@/components/ErrorState';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { ProfileAvatar } from '@/components/ProfileAvatar';

export default function ProfileScreen() {
  const router = useRouter();
  const { currentTheme } = useTheme();
  const COLORS = currentTheme.colors;
  const { profile, stories, quizAttempts, isLoading, error, refreshAll } = useApp();

  const stats = useMemo(() => {
    const totalQuizzes = quizAttempts.length;
    const perfectScores = quizAttempts.filter(a => a.score === a.total_questions).length;
    const avgScore = totalQuizzes > 0
      ? Math.round(quizAttempts.reduce((sum, a) => sum + (a.score / a.total_questions) * 100, 0) / totalQuizzes)
      : 0;
    return { totalQuizzes, perfectScores, avgScore };
  }, [quizAttempts]);

  const streak = useMemo(() => {
    if (stories.length === 0) return 0;
    const uniqueDays = new Set(
      stories.map(s => new Date(s.generated_at || s.created_at).toDateString())
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
          title="Unable to Load Profile"
          message={error || 'Failed to load your profile data.'}
          onRetry={refreshAll}
          onGoHome={() => router.replace('/')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['top']}>
      <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={handleRefresh} tintColor={COLORS.primary} />
        }
      >
        <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.profileHeader}>
          <View style={styles.avatarRow}>
            <ProfileAvatar
              avatarUrl={profile.avatar_url}
              name={profile.kid_name}
              size="medium"
              editable
              onPress={() => router.push('/settings/edit-profile')}
            />
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: COLORS.text.primary }]}>{profile.kid_name}</Text>
              <View style={styles.profileMetaRow}>
                <View style={styles.streakBadge}>
                  <Flame size={14} color="#F59E0B" />
                  <Text style={[styles.streakText, { color: COLORS.text.secondary }]}>{streak} day streak</Text>
                </View>
              </View>
            </View>
            <AnimatedPressable
              style={[styles.editButton, { backgroundColor: COLORS.primary + '15' }]}
              onPress={() => router.push('/settings/edit-profile')}
              scaleDown={0.85}
            >
              <Edit3 size={18} color={COLORS.primary} />
            </AnimatedPressable>
          </View>
        </Animated.View>

        <View style={styles.statsGrid}>
          <Animated.View entering={FadeInUp.delay(160).springify()} style={[styles.statCard, { backgroundColor: COLORS.cardBackground }]}>
            <View style={[styles.statIconWrap, { backgroundColor: COLORS.primary + '15' }]}>
              <BookOpen size={20} color={COLORS.primary} />
            </View>
            <Text style={[styles.statCardValue, { color: COLORS.text.primary }]}>{stories.length}</Text>
            <Text style={[styles.statCardLabel, { color: COLORS.text.secondary }]}>Stories</Text>
          </Animated.View>
          <Animated.View entering={FadeInUp.delay(220).springify()} style={[styles.statCard, { backgroundColor: COLORS.cardBackground }]}>
            <View style={[styles.statIconWrap, { backgroundColor: COLORS.success + '15' }]}>
              <Award size={20} color={COLORS.success} />
            </View>
            <Text style={[styles.statCardValue, { color: COLORS.text.primary }]}>{stats.totalQuizzes}</Text>
            <Text style={[styles.statCardLabel, { color: COLORS.text.secondary }]}>Quizzes</Text>
          </Animated.View>
          <Animated.View entering={FadeInUp.delay(280).springify()} style={[styles.statCard, { backgroundColor: COLORS.cardBackground }]}>
            <View style={[styles.statIconWrap, { backgroundColor: '#F59E0B15' }]}>
              <Star size={20} color="#F59E0B" />
            </View>
            <Text style={[styles.statCardValue, { color: COLORS.text.primary }]}>{stats.perfectScores}</Text>
            <Text style={[styles.statCardLabel, { color: COLORS.text.secondary }]}>Perfect</Text>
          </Animated.View>
          <Animated.View entering={FadeInUp.delay(340).springify()} style={[styles.statCard, { backgroundColor: COLORS.cardBackground }]}>
            <View style={[styles.statIconWrap, { backgroundColor: COLORS.info + '15' }]}>
              <Target size={20} color={COLORS.info} />
            </View>
            <Text style={[styles.statCardValue, { color: COLORS.text.primary }]}>{stats.avgScore}%</Text>
            <Text style={[styles.statCardLabel, { color: COLORS.text.secondary }]}>Average</Text>
          </Animated.View>
        </View>

        {recentQuizzes.length > 0 && (
          <Animated.View entering={FadeInUp.delay(280).springify()} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>Recent Quiz Results</Text>
            <View style={styles.quizList}>
              {recentQuizzes.map((attempt, qIdx) => {
                const pct = Math.round((attempt.score / attempt.total_questions) * 100);
                const isPerfect = pct === 100;
                const matchingStory = stories.find(s => s.id === attempt.story_id);
                const title = matchingStory?.title || 'Quiz';
                return (
                  <Animated.View
                    key={attempt.id}
                    entering={FadeInUp.delay(320 + qIdx * 60).springify()}
                    style={[styles.quizRow, { backgroundColor: COLORS.cardBackground }]}
                  >
                    <View style={[styles.quizScoreCircle, {
                      backgroundColor: isPerfect ? COLORS.success + '15' : COLORS.primary + '15',
                    }]}>
                      <Text style={[styles.quizScoreText, {
                        color: isPerfect ? COLORS.success : COLORS.primary,
                      }]}>{pct}%</Text>
                    </View>
                    <View style={styles.quizDetails}>
                      <Text style={[styles.quizTitle, { color: COLORS.text.primary }]} numberOfLines={1}>
                        {title}
                      </Text>
                      <Text style={[styles.quizSubtitle, { color: COLORS.text.secondary }]}>
                        {attempt.score}/{attempt.total_questions} correct
                      </Text>
                    </View>
                    {isPerfect && <Star size={16} color="#F59E0B" fill="#F59E0B" />}
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {profile.languages && profile.languages.length > 0 && (
          <Animated.View entering={FadeInUp.delay(380).springify()} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>Learning Languages</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.langRow}>
              {profile.languages.map((lang, langIdx) => {
                const langCount = stories.filter(s => s.language_code === lang.language_code).length;
                return (
                  <Animated.View key={lang.id} entering={FadeInRight.delay(420 + langIdx * 70).springify()}>
                    <View style={[styles.langChip, { backgroundColor: COLORS.cardBackground }]}>
                      <Text style={styles.langFlag}>{getLanguageFlag(lang.language_code)}</Text>
                      <Text style={[styles.langName, { color: COLORS.text.primary }]}>{lang.language_name}</Text>
                      <Text style={[styles.langStories, { color: COLORS.text.light }]}>{langCount} stories</Text>
                    </View>
                  </Animated.View>
                );
              })}
            </ScrollView>
          </Animated.View>
        )}

        {(profile.family_members?.length > 0 || profile.friends?.length > 0) && (
          <Animated.View entering={FadeInUp.delay(480).springify()} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>Story Characters</Text>
            <View style={styles.charactersGrid}>
              {profile.family_members?.map(m => (
                <View key={m.id} style={[styles.characterBadge, { backgroundColor: COLORS.primary + '12' }]}>
                  <Text style={styles.characterEmoji}>👨‍👩‍👧</Text>
                  <Text style={[styles.characterNameText, { color: COLORS.text.primary }]}>{m.name}</Text>
                </View>
              ))}
              {profile.friends?.map(f => (
                <View key={f.id} style={[styles.characterBadge, { backgroundColor: COLORS.info + '12' }]}>
                  <Text style={styles.characterEmoji}>🧑‍🤝‍🧑</Text>
                  <Text style={[styles.characterNameText, { color: COLORS.text.primary }]}>{f.name}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContent: { padding: SPACING.xl },
  scrollContent: { paddingBottom: 100 },
  profileHeader: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, marginBottom: SPACING.xl },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: 22, fontFamily: FONTS.bold },
  profileMetaRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streakText: { fontSize: 13, fontFamily: FONTS.semibold },
  editButton: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row', paddingHorizontal: SPACING.xl,
    gap: SPACING.sm, marginBottom: SPACING.xxl,
  },
  statCard: {
    flex: 1, alignItems: 'center', paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg, gap: 6, ...SHADOWS.xs,
  },
  statIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  statCardValue: { fontSize: 20, fontFamily: FONTS.bold },
  statCardLabel: { fontSize: 11, fontFamily: FONTS.medium },
  section: { marginBottom: SPACING.xxl },
  sectionTitle: {
    fontSize: 18, fontFamily: FONTS.bold,
    paddingHorizontal: SPACING.xl, marginBottom: SPACING.md,
  },
  quizList: { paddingHorizontal: SPACING.xl, gap: SPACING.sm },
  quizRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: SPACING.md, borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.md, ...SHADOWS.xs,
  },
  quizScoreCircle: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  quizScoreText: { fontSize: 14, fontFamily: FONTS.bold },
  quizDetails: { flex: 1, gap: 2 },
  quizTitle: { fontSize: 14, fontFamily: FONTS.semibold },
  quizSubtitle: { fontSize: 12, fontFamily: FONTS.regular },
  langRow: { paddingHorizontal: SPACING.xl, gap: SPACING.sm },
  langChip: {
    alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg, gap: 4, minWidth: 90, ...SHADOWS.xs,
  },
  langFlag: { fontSize: 22 },
  langName: { fontSize: 12, fontFamily: FONTS.semibold },
  langStories: { fontSize: 10, fontFamily: FONTS.regular },
  charactersGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: SPACING.xl, gap: SPACING.sm,
  },
  characterBadge: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.pill,
  },
  characterEmoji: { fontSize: 16 },
  characterNameText: { fontSize: 13, fontFamily: FONTS.semibold },
});
