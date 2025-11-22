import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  Pressable,
  Platform,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Search, Mic, Sparkles, BookOpen, Trophy, RefreshCw, MapPin, Star } from 'lucide-react-native';
import { profileService, storyService } from '@/services/database';
import { ProfileWithRelations, Story } from '@/types/database';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import { Container } from '@/components/Container';
import { Typography } from '@/components/Typography';
import { PremiumCard } from '@/components/PremiumCard';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { useFadeIn, useSlideInUp } from '@/utils/animations';
import { hapticFeedback } from '@/utils/haptics';
import { useResponsive } from '@/hooks/useResponsive';
import { analytics } from '@/services/analyticsService';
import { achievementService, Achievement } from '@/services/achievementService';
import { AchievementModal } from '@/components/AchievementModal';
import { appRating } from '@/utils/appRating';

export default function HomeScreen() {
  const router = useRouter();
  const responsive = useResponsive();
  const [profile, setProfile] = useState<ProfileWithRelations | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);
  const [achievementStats, setAchievementStats] = useState({ total: 0, unlocked: 0, percentage: 0 });

  const fadeIn = useFadeIn();

  useFocusEffect(
    useCallback(() => {
      loadData();
      analytics.screen('Home');
      checkForRating();
    }, [])
  );

  const loadData = async () => {
    try {
      const profileId = await AsyncStorage.getItem('profileId');

      if (!profileId) {
        setIsLoading(false);
        setTimeout(() => {
          router.replace('/');
        }, 100);
        return;
      }

      const [profileData, storiesData, stats] = await Promise.all([
        profileService.getWithRelations(profileId),
        storyService.getByProfileId(profileId),
        achievementService.getAchievementStats(),
      ]);

      if (!profileData) {
        setIsLoading(false);
        await AsyncStorage.removeItem('profileId');
        setTimeout(() => {
          router.replace('/');
        }, 100);
        return;
      }

      setProfile(profileData);
      setStories(storiesData || []);
      setAchievementStats(stats);
      setIsLoading(false);

      // Load achievements
      await achievementService.loadAchievements();
    } catch (error) {
      console.error('Error loading data:', error);
      analytics.trackError(error as Error, { screen: 'Home', action: 'loadData' });
      setError('Failed to load your data. Please try again.');
      setIsLoading(false);
    }
  };

  const checkForRating = async () => {
    await appRating.loadRatingData();
    setTimeout(() => {
      appRating.showRatingPrompt();
    }, 2000);
  };

  const handleGenerateStory = async () => {
    if (!profile) return;

    await hapticFeedback.medium();
    analytics.track('generate_story_initiated', { from: 'home_screen' });

    router.push({
      pathname: '/story/generate',
      params: {
        profileId: profile.id,
        languageCode: profile.primary_language,
      },
    });
  };

  const handleStoryPress = async (storyId: string) => {
    await hapticFeedback.light();
    analytics.track('story_opened', { story_id: storyId, from: 'home_screen' });

    router.push({
      pathname: '/story/playback',
      params: { storyId },
    });
  };

  const handleAchievementsPress = () => {
    hapticFeedback.light();
    analytics.track('achievements_viewed');
    // TODO: Navigate to achievements screen when created
    // router.push('/achievements');
  };

  // Filter stories based on search query
  const filteredStories = useMemo(() => {
    if (!searchQuery.trim()) {
      return stories;
    }

    const query = searchQuery.toLowerCase().trim();
    return stories.filter(
      (story) =>
        story.title.toLowerCase().includes(query) ||
        story.season?.toLowerCase().includes(query) ||
        story.time_of_day?.toLowerCase().includes(query)
    );
  }, [stories, searchQuery]);

  const categories = useMemo(
    () => [
      { id: 1, name: 'Create Story', icon: '✨', color: COLORS.gradients.sunset, gradient: true },
      { id: 2, name: 'Adventure', icon: '🚀', color: COLORS.categoryColors.tealGradient, gradient: true },
      { id: 3, name: 'Animals', icon: '🦁', color: COLORS.categoryColors.peachGradient, gradient: true },
      { id: 4, name: 'Friends', icon: '👫', color: COLORS.categoryColors.purpleGradient, gradient: true },
      { id: 5, name: 'Fantasy', icon: '🧙', color: COLORS.gradients.magic, gradient: true },
    ],
    []
  );

  const recentStories = useMemo(() => filteredStories.slice(0, 3), [filteredStories]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill}>
          <View style={styles.loadingContent}>
            <LoadingSkeleton type="card" count={4} />
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill}>
          <ErrorState
            type="general"
            title="Unable to Load Data"
            message={error || 'Failed to load your profile. Please try again.'}
            onRetry={() => {
              setError(null);
              setIsLoading(true);
              loadData();
            }}
            onGoHome={() => router.replace('/')}
          />
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={COLORS.mintBackgroundGradient}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Header with Avatar */}
        <Animated.View style={[styles.header, { opacity: fadeIn }]}>
          <View style={styles.userSection}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={COLORS.gradients.sunset}
                style={styles.avatarGradient}
              >
                <Typography variant="h2" color="inverse">
                  {profile?.kid_name?.charAt(0) || '😊'}
                </Typography>
              </LinearGradient>
            </View>
            <View style={styles.greetingContainer}>
              <Typography variant="caption" color="secondary" style={styles.welcomeText}>
                Welcome back 👋
              </Typography>
              <Typography variant="h4" color="primary" style={styles.userName}>
                {profile?.kid_name || 'Friend'}
              </Typography>
            </View>
          </View>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => {
              hapticFeedback.light();
              loadData();
            }}
            activeOpacity={0.7}
          >
            <RefreshCw size={20} color={COLORS.text.primary} strokeWidth={2} />
          </TouchableOpacity>
        </Animated.View>

        {/* Hero Feature Card */}
        <View style={styles.heroSection}>
          <PremiumCard
            style={styles.heroCard}
            shadow="lg"
            padding={0}
            onPress={handleGenerateStory}
          >
            <LinearGradient
              colors={['#D5F2ED', '#B8EAE0']}
              style={styles.heroCardGradient}
            >
              <View style={styles.heroContent}>
                <View style={styles.heroIllustration}>
                  <Typography style={styles.heroEmoji}>👧🏻</Typography>
                  <View style={styles.decorativeElements}>
                    <Typography style={styles.decorativeEmoji}>🌿</Typography>
                    <Typography style={[styles.decorativeEmoji, styles.decorativeEmoji2]}>✨</Typography>
                    <Typography style={[styles.decorativeEmoji, styles.decorativeEmoji3]}>🦋</Typography>
                  </View>
                </View>

                <View style={styles.heroTextContainer}>
                  <Typography variant="h3" color="primary" style={styles.heroTitle}>
                    Explore The Beauty
                  </Typography>
                  <Typography variant="bodySmall" color="secondary" style={styles.heroSubtitle}>
                    Get special stories & adventures
                  </Typography>
                </View>

                <View style={styles.heroButton}>
                  <LinearGradient
                    colors={COLORS.gradients.sunset}
                    style={styles.heroButtonGradient}
                  >
                    <Sparkles size={18} color={COLORS.text.inverse} strokeWidth={2.5} />
                  </LinearGradient>
                </View>
              </View>
            </LinearGradient>
          </PremiumCard>
        </View>

        {/* Popular Now Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Typography variant="h3" color="primary" style={styles.sectionTitle}>
              Popular Now
            </Typography>
            <TouchableOpacity onPress={() => hapticFeedback.light()}>
              <Typography variant="bodySmall" color="secondary" style={styles.viewAllText}>
                View All
              </Typography>
            </TouchableOpacity>
          </View>

          {recentStories.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <EmptyState
                type="stories"
                title="No Stories Yet"
                description="Start your journey by creating your first magical story!"
                action={{
                  label: 'Create Story',
                  onPress: handleGenerateStory,
                }}
              />
            </View>
          ) : (
            <View style={styles.storiesContainer}>
              {recentStories.map((story, index) => {
                const gradients = [
                  COLORS.categoryColors.tealGradient,
                  COLORS.categoryColors.peachGradient,
                  COLORS.categoryColors.purpleGradient,
                ];
                const gradient = gradients[index % gradients.length];

                return (
                  <PremiumCard
                    key={story.id}
                    style={styles.storyCard}
                    onPress={() => handleStoryPress(story.id)}
                    shadow="md"
                    padding={0}
                  >
                    <LinearGradient
                      colors={gradient}
                      style={styles.storyImage}
                    >
                      <BookOpen size={40} color={COLORS.text.inverse} strokeWidth={1.5} />
                    </LinearGradient>

                    <View style={styles.storyCardContent}>
                      <Typography variant="bodyMedium" numberOfLines={2} style={styles.storyTitle}>
                        {story.title}
                      </Typography>

                      <View style={styles.storyMeta}>
                        <View style={styles.storyLocation}>
                          <MapPin size={14} color={COLORS.text.secondary} strokeWidth={2} />
                          <Typography variant="caption" color="secondary" numberOfLines={1}>
                            {story.season || 'Adventure'}
                          </Typography>
                        </View>

                        <View style={styles.storyRating}>
                          <Star size={14} color="#FFD700" fill="#FFD700" strokeWidth={0} />
                          <Typography variant="caption" color="secondary">
                            4.8
                          </Typography>
                        </View>
                      </View>
                    </View>
                  </PremiumCard>
                );
              })}
            </View>
          )}
        </View>

        {/* All Stories */}
        {filteredStories.length > 3 && (
          <View style={styles.section}>
            <Typography variant="h3" color="primary" style={styles.sectionTitle}>
              All Stories
            </Typography>
            <View style={styles.allStoriesContainer}>
              {filteredStories.slice(3).map((story, index) => {
                const gradients = [
                  COLORS.categoryColors.blueGradient,
                  COLORS.categoryColors.greenGradient,
                  COLORS.accent.lavenderGradient,
                ];
                const gradient = gradients[index % gradients.length];

                return (
                  <PremiumCard
                    key={story.id}
                    style={styles.listStoryCard}
                    onPress={() => handleStoryPress(story.id)}
                    shadow="sm"
                    padding={0}
                  >
                    <LinearGradient colors={gradient} style={styles.listStoryImage}>
                      <BookOpen size={24} color={COLORS.text.inverse} strokeWidth={1.5} />
                    </LinearGradient>
                    <View style={styles.listStoryInfo}>
                      <Typography variant="bodyMedium" numberOfLines={1}>
                        {story.title}
                      </Typography>
                      <View style={styles.listStoryMeta}>
                        <MapPin size={12} color={COLORS.text.secondary} strokeWidth={2} />
                        <Typography variant="caption" color="secondary">
                          {story.season} • {story.time_of_day}
                        </Typography>
                      </View>
                    </View>
                  </PremiumCard>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      <AchievementModal
        visible={!!unlockedAchievement}
        achievement={unlockedAchievement}
        onClose={() => setUnlockedAchievement(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContent: {
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxxl * 2,
  },

  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  avatarGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingContainer: {
    gap: 2,
  },
  welcomeText: {
    fontWeight: '500' as any,
  },
  userName: {
    fontWeight: '700' as any,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },

  // Hero Card styles
  heroSection: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xxl,
  },
  heroCard: {
    borderRadius: BORDER_RADIUS.xxl,
    overflow: 'hidden',
  },
  heroCardGradient: {
    padding: SPACING.xl,
    minHeight: 200,
  },
  heroContent: {
    position: 'relative',
  },
  heroIllustration: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    position: 'relative',
  },
  heroEmoji: {
    fontSize: 80,
  },
  decorativeElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  decorativeEmoji: {
    fontSize: 24,
    position: 'absolute',
    top: 10,
    left: 20,
  },
  decorativeEmoji2: {
    top: 30,
    right: 30,
    left: 'auto' as any,
  },
  decorativeEmoji3: {
    bottom: 10,
    left: 40,
    top: 'auto' as any,
  },
  heroTextContainer: {
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  heroTitle: {
    fontWeight: '800' as any,
  },
  heroSubtitle: {
    fontWeight: '500' as any,
  },
  heroButton: {
    alignSelf: 'flex-end',
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  heroButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section styles
  section: {
    marginBottom: SPACING.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontWeight: '700' as any,
  },
  viewAllText: {
    fontWeight: '600' as any,
  },

  // Stories Container
  storiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  storyCard: {
    width: '47%',
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  storyImage: {
    width: '100%',
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyCardContent: {
    padding: SPACING.md,
    backgroundColor: COLORS.cardBackground,
  },
  storyTitle: {
    fontWeight: '600' as any,
    marginBottom: SPACING.xs,
  },
  storyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storyLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  storyRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // Empty state
  emptyStateContainer: {
    paddingHorizontal: SPACING.xl,
  },

  // All Stories
  allStoriesContainer: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  listStoryCard: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.sm,
  },
  listStoryImage: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listStoryInfo: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.cardBackground,
  },
  listStoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
