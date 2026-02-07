import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { profileService, storyService, quizService } from '@/services/database';
import { ProfileWithRelations, QuizAttempt } from '@/types/database';
import { Trophy, Target, BookOpen, Award, Sparkles } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '@/constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalStories, setTotalStories] = useState(0);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const profileId = await AsyncStorage.getItem('profileId');
      if (!profileId) {
        router.replace('/');
        return;
      }

      const [profileData, stories, attempts] = await Promise.all([
        profileService.getWithRelations(profileId),
        storyService.getByProfileId(profileId),
        quizService.getAttemptsByProfileId(profileId),
      ]);

      if (!profileData) {
        router.replace('/');
        return;
      }

      setProfile(profileData);
      setTotalStories(stories?.length || 0);
      setQuizAttempts(attempts || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setIsLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill} />
        <View style={styles.loadingContainer}>
          <Sparkles size={32} color={COLORS.primary} strokeWidth={1.5} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill} />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Failed to load profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalQuizzes = quizAttempts.length;
  const correctAnswers = quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0);
  const totalQuestions = quizAttempts.reduce((sum, attempt) => sum + attempt.total_questions, 0);
  const averageScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const perfectScores = quizAttempts.filter(a => a.score === a.total_questions).length;
  const recentAttempts = quizAttempts.slice(0, 5);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        <View style={styles.topBar}>
          <Text style={styles.pageTitle}>Progress</Text>
          <Text style={styles.pageSubtitle}>Track your learning journey</Text>
        </View>

        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.profileCard}>
          <LinearGradient colors={COLORS.gradients.primary} style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{profile.kid_name.charAt(0).toUpperCase()}</Text>
          </LinearGradient>
          <Text style={styles.profileName}>{profile.kid_name}</Text>
          <Text style={styles.profileSubtext}>{profile.languages.length} languages</Text>
        </Animated.View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <Animated.View entering={FadeInDown.delay(150).springify()} style={[styles.statCard, { backgroundColor: '#E8F8F5' }]}>
              <BookOpen size={22} color={COLORS.primary} strokeWidth={2} />
              <Text style={styles.statValue}>{totalStories}</Text>
              <Text style={styles.statLabel}>Stories</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).springify()} style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
              <Target size={22} color="#4CAF50" strokeWidth={2} />
              <Text style={styles.statValue}>{totalQuizzes}</Text>
              <Text style={styles.statLabel}>Quizzes</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(250).springify()} style={[styles.statCard, { backgroundColor: '#FFF3CD' }]}>
              <Trophy size={22} color="#F59E0B" strokeWidth={2} />
              <Text style={styles.statValue}>{perfectScores}</Text>
              <Text style={styles.statLabel}>Perfect</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300).springify()} style={[styles.statCard, { backgroundColor: '#E8E7FF' }]}>
              <Award size={22} color="#7C6FDC" strokeWidth={2} />
              <Text style={styles.statValue}>{averageScore}%</Text>
              <Text style={styles.statLabel}>Avg Score</Text>
            </Animated.View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Quiz Results</Text>
          {recentAttempts.length === 0 ? (
            <View style={styles.emptyState}>
              <Trophy size={36} color={COLORS.text.light} strokeWidth={1.5} />
              <Text style={styles.emptyText}>No quiz attempts yet</Text>
              <Text style={styles.emptySubtext}>Complete a story quiz to see results here</Text>
            </View>
          ) : (
            <View style={styles.quizList}>
              {recentAttempts.map((attempt, index) => {
                const percentage = Math.round((attempt.score / attempt.total_questions) * 100);
                const isGood = percentage >= 66;
                const isPerfect = percentage === 100;

                return (
                  <Animated.View
                    key={attempt.id}
                    entering={FadeInDown.delay(350 + index * 60).springify()}
                  >
                    <View style={styles.quizCard}>
                      <View
                        style={[
                          styles.quizScoreCircle,
                          {
                            backgroundColor: isPerfect ? '#FFF3CD' : isGood ? '#E8F5E9' : '#FFE5DB',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.quizScoreText,
                            { color: isPerfect ? '#F59E0B' : isGood ? '#4CAF50' : COLORS.primary },
                          ]}
                        >
                          {percentage}%
                        </Text>
                      </View>
                      <View style={styles.quizCardRight}>
                        <Text style={styles.quizCardTitle}>Quiz Result</Text>
                        <Text style={styles.quizCardScore}>
                          {attempt.score} out of {attempt.total_questions} correct
                        </Text>
                        <Text style={styles.quizCardDate}>
                          {new Date(attempt.completed_at).toLocaleDateString()}
                        </Text>
                      </View>
                      {isPerfect && (
                        <View style={styles.perfectBadge}>
                          <Trophy size={16} color="#F59E0B" strokeWidth={2} fill="#F59E0B" />
                        </View>
                      )}
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learning Languages</Text>
          <View style={styles.languagesList}>
            {profile.languages.map(lang => (
              <View key={lang.id} style={styles.languageCard}>
                <Text style={styles.languageFlag}>{lang.language_name.split(' ')[0]}</Text>
                <Text style={styles.languageName}>{lang.language_name}</Text>
              </View>
            ))}
          </View>
        </View>

        {(profile.family_members.length > 0 || profile.friends.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Story Characters</Text>
            {profile.family_members.length > 0 && (
              <View style={styles.characterGroup}>
                <Text style={styles.characterGroupTitle}>Family</Text>
                <View style={styles.characterTags}>
                  {profile.family_members.map(member => (
                    <View key={member.id} style={styles.characterTag}>
                      <Text style={styles.characterTagText}>{member.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {profile.friends.length > 0 && (
              <View style={styles.characterGroup}>
                <Text style={styles.characterGroupTitle}>Friends</Text>
                <View style={styles.characterTags}>
                  {profile.friends.map(friend => (
                    <View key={friend.id} style={styles.characterTag}>
                      <Text style={styles.characterTagText}>{friend.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
  },
  scrollContent: {
    paddingBottom: SPACING.xxxl * 2,
  },
  topBar: {
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  pageTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  pageSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },
  profileCard: {
    backgroundColor: COLORS.cardBackground,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
    padding: SPACING.xxl,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: FONT_WEIGHTS.bold,
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  profileSubtext: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
  },
  section: {
    marginBottom: SPACING.xxl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  statCard: {
    width: '47%',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statValue: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text.primary,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text.secondary,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.light,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  quizList: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  quizCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    position: 'relative',
    ...SHADOWS.xs,
    gap: SPACING.lg,
  },
  quizScoreCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizScoreText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  quizCardRight: {
    flex: 1,
  },
  quizCardTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  quizCardScore: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  quizCardDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.light,
  },
  perfectBadge: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
  },
  languagesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
    ...SHADOWS.xs,
  },
  languageFlag: {
    fontSize: FONT_SIZES.xl,
  },
  languageName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text.primary,
  },
  characterGroup: {
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  characterGroupTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  characterTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  characterTag: {
    backgroundColor: COLORS.cardBackground,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.xs,
  },
  characterTagText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.primary,
    fontWeight: FONT_WEIGHTS.medium,
  },
});
