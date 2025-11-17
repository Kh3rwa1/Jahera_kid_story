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
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Search, Mic, Sparkles, BookOpen, Trophy } from 'lucide-react-native';
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
        colors={COLORS.backgroundGradient}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.topBar, { opacity: fadeIn }]}>
          <View style={styles.greetingSection}>
            <Typography variant="bodyLarge" color="secondary" style={styles.greeting}>
              Hello, {profile?.kid_name || 'Friend'}! 👋
            </Typography>
            <Typography variant="displayMedium" color="primary" style={styles.appTitle}>
              Ready for an Adventure?
            </Typography>
          </View>
          <View style={styles.topBarIcons}>
            <Pressable
              onPress={handleAchievementsPress}
              accessibilityLabel={`Achievements: ${achievementStats.unlocked} unlocked`}
              accessibilityRole="button"
            >
              <LinearGradient colors={COLORS.gradients.sunset} style={styles.achievementBadge}>
                <Trophy size={20} color={COLORS.text.inverse} strokeWidth={2.5} />
                <Typography variant="captionBold" color="inverse" style={styles.achievementText}>
                  {achievementStats.unlocked}
                </Typography>
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>
        <View style={styles.searchContainer}>
          <PremiumCard style={styles.searchInputContainer} shadow="sm" padding={SPACING.md}>
            <Search size={20} color={COLORS.text.secondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a story"
              placeholderTextColor={COLORS.text.light}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </PremiumCard>
          <TouchableOpacity
            style={styles.voiceButton}
            onPress={() => hapticFeedback.light()}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={COLORS.gradients.primary}
              style={styles.voiceButtonGradient}
            >
              <Mic size={20} color={COLORS.text.inverse} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Typography variant="h3" style={styles.sectionTitle}>
            Story Categories
          </Typography>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesGrid}
          >
            {categories.map((category, index) => (
              <PremiumCard
                key={category.id}
                gradient={category.gradient ? category.color : undefined}
                style={styles.categoryBubble}
                onPress={index === 0 ? handleGenerateStory : undefined}
                shadow="lg"
                padding={SPACING.lg}
                accessibilityLabel={`${category.name} category`}
                accessibilityRole="button"
              >
                <Typography variant="displayMedium" style={styles.categoryIcon}>
                  {category.icon}
                </Typography>
                <Typography
                  variant="caption"
                  align="center"
                  color="inverse"
                  style={styles.categoryName}
                >
                  {category.name}
                </Typography>
              </PremiumCard>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Typography variant="h3" style={styles.sectionTitle}>
            Recent Stories
          </Typography>
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
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storiesGrid}
            >
              {recentStories.map((story) => {
                const cardWidth = responsive.isMobile ? 140 : 180;
                return (
                  <PremiumCard
                    key={story.id}
                    style={[styles.storyCard, { width: cardWidth }]}
                    onPress={() => handleStoryPress(story.id)}
                    shadow="md"
                    padding={0}
                    accessibilityLabel={`Story: ${story.title}`}
                    accessibilityRole="button"
                  >
                    <LinearGradient colors={COLORS.gradients.primary} style={styles.storyImagePlaceholder}>
                      <BookOpen size={32} color={COLORS.text.inverse} strokeWidth={1.5} />
                    </LinearGradient>
                    <View style={styles.storyCardContent}>
                      <Typography variant="bodySmall" numberOfLines={2}>
                        {story.title}
                      </Typography>
                    </View>
                  </PremiumCard>
                );
              })}
            </ScrollView>
          )}
        </View>

        {filteredStories.length > 3 && (
          <View style={styles.section}>
            <Typography variant="h3" style={styles.sectionTitle}>
              All Stories
            </Typography>
            {filteredStories.slice(3).map((story) => (
              <PremiumCard
                key={story.id}
                style={styles.listStoryCard}
                onPress={() => handleStoryPress(story.id)}
                shadow="sm"
                padding={0}
                accessibilityLabel={`Story: ${story.title}, ${story.season}, ${story.time_of_day}`}
                accessibilityRole="button"
              >
                <LinearGradient colors={COLORS.gradients.ocean} style={styles.listStoryImage}>
                  <BookOpen size={24} color={COLORS.text.inverse} strokeWidth={1.5} />
                </LinearGradient>
                <View style={styles.listStoryInfo}>
                  <Typography variant="bodyMedium" numberOfLines={1}>
                    {story.title}
                  </Typography>
                  <Typography variant="caption" color="secondary" style={styles.listStoryMeta}>
                    {story.season} • {story.time_of_day}
                  </Typography>
                </View>
              </PremiumCard>
            ))}
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
    paddingBottom: SPACING.xxxl,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  greetingSection: {
    flex: 1,
    gap: SPACING.xs,
  },
  greeting: {
    marginBottom: 2,
    fontWeight: '500' as any,
  },
  appTitle: {
    letterSpacing: -0.5,
  },
  topBarIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md + 2,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.round,
    ...SHADOWS.md,
  },
  achievementText: {
    fontSize: 14,
    fontWeight: '800' as any,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
    gap: SPACING.md,
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text.primary,
  },
  voiceButton: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  voiceButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: SPACING.xxl,
  },
  sectionTitle: {
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  categoriesGrid: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  categoryBubble: {
    width: 100,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.xl,
  },
  categoryIcon: {
    marginBottom: SPACING.sm,
    fontSize: 36,
  },
  categoryName: {
    fontWeight: '700' as any,
    fontSize: 12,
  },
  emptyStateContainer: {
    paddingHorizontal: SPACING.xl,
  },
  storiesGrid: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.lg,
  },
  storyCard: {
    overflow: 'hidden',
    borderRadius: BORDER_RADIUS.xl,
  },
  storyImagePlaceholder: {
    width: '100%',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyCardContent: {
    padding: SPACING.md,
  },
  listStoryCard: {
    flexDirection: 'row',
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    borderRadius: BORDER_RADIUS.lg,
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
  },
  listStoryMeta: {
    textTransform: 'capitalize',
  },
});
