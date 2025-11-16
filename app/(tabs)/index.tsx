import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Animated,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Search, Mic, Sparkles, BookOpen, Trophy, Share2 } from 'lucide-react-native';
import { profileService, storyService } from '@/services/database';
import { ProfileWithRelations, Story } from '@/types/database';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '@/constants/theme';
import { PremiumCard } from '@/components/PremiumCard';
import { useFadeIn, useSlideInUp } from '@/utils/animations';
import { hapticFeedback } from '@/utils/haptics';
import { analytics } from '@/services/analyticsService';
import { achievementService, Achievement } from '@/services/achievementService';
import { AchievementModal } from '@/components/AchievementModal';
import { appRating } from '@/utils/appRating';

export default function HomeScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileWithRelations | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
        router.replace('/');
        return;
      }

      const [profileData, storiesData, stats] = await Promise.all([
        profileService.getWithRelations(profileId),
        storyService.getByProfileId(profileId),
        achievementService.getAchievementStats(),
      ]);

      if (!profileData) {
        router.replace('/');
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
    // Navigate to achievements screen (to be created)
    router.push('/achievements' as any);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load profile</Text>
      </View>
    );
  }

  const categories = [
    { id: 1, name: 'New Story', icon: '✨', color: COLORS.categoryColors.green },
    { id: 2, name: 'Adventure', icon: '🚀', color: COLORS.categoryColors.teal },
    { id: 3, name: 'Animals', icon: '🦁', color: COLORS.categoryColors.peach },
    { id: 4, name: 'Friends', icon: '🎭', color: COLORS.categoryColors.purple },
  ];

  const recentStories = stories.slice(0, 3);

  return (
    <>
      <LinearGradient
        colors={COLORS.backgroundGradient as any}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.topBar, { opacity: fadeIn }]}>
          <View>
            <Text style={styles.greeting}>Hello, {profile?.kid_name || 'Friend'}! 👋</Text>
            <Text style={styles.appTitle}>Jahera</Text>
          </View>
          <View style={styles.topBarIcons}>
            <TouchableOpacity onPress={handleAchievementsPress}>
              <LinearGradient
                colors={COLORS.gradients.sunset as any}
                style={styles.achievementBadge}
              >
                <Trophy size={18} color={COLORS.text.inverse} />
                <Text style={styles.achievementText}>{achievementStats.unlocked}</Text>
              </LinearGradient>
            </TouchableOpacity>
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
              colors={COLORS.gradients.primary as any}
              style={styles.voiceButtonGradient}
            >
              <Mic size={20} color={COLORS.text.inverse} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Story Categories</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category, index) => (
              <PremiumCard
                key={category.id}
                gradient={index === 0 ? (COLORS.gradients.sunset as any) : undefined}
                style={[
                  styles.categoryBubble,
                  !COLORS.gradients.sunset && { backgroundColor: category.color },
                ]}
                onPress={index === 0 ? handleGenerateStory : undefined}
                shadow="md"
                padding={SPACING.md}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={[styles.categoryName, index === 0 && { color: COLORS.text.inverse }]}>
                  {category.name}
                </Text>
              </PremiumCard>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Stories</Text>
          <View style={styles.storiesGrid}>
            {recentStories.length === 0 ? (
              <PremiumCard
                style={styles.emptyStoryCard}
                onPress={handleGenerateStory}
                shadow="lg"
                padding={SPACING.xl}
              >
                <Sparkles size={40} color={COLORS.primary} strokeWidth={1.5} />
                <Text style={styles.emptyStoryText}>Create Your First Story!</Text>
                <Text style={styles.emptyStorySubtext}>Tap to generate</Text>
              </PremiumCard>
            ) : (
              recentStories.map((story, index) => (
                <PremiumCard
                  key={story.id}
                  style={styles.storyCard}
                  onPress={() => handleStoryPress(story.id)}
                  shadow="md"
                  padding={0}
                >
                  <LinearGradient
                    colors={['#FF9B71', '#FF7A50'] as any}
                    style={styles.storyImagePlaceholder}
                  >
                    <BookOpen size={32} color="#FFFFFF" strokeWidth={1.5} />
                  </LinearGradient>
                  <Text style={styles.storyCardTitle} numberOfLines={2}>
                    {story.title}
                  </Text>
                </PremiumCard>
              ))
            )}
          </View>
        </View>

        {stories.length > 3 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All Stories</Text>
            {stories.slice(3).map((story, index) => (
              <PremiumCard
                key={story.id}
                style={styles.listStoryCard}
                onPress={() => handleStoryPress(story.id)}
                shadow="sm"
                padding={0}
              >
                <LinearGradient
                  colors={['#7FCCB5', '#66B89F'] as any}
                  style={styles.listStoryImage}
                >
                  <BookOpen size={24} color="#FFFFFF" strokeWidth={1.5} />
                </LinearGradient>
                <View style={styles.listStoryInfo}>
                  <Text style={styles.listStoryTitle} numberOfLines={1}>
                    {story.title}
                  </Text>
                  <Text style={styles.listStoryMeta}>
                    {story.season} • {story.time_of_day}
                  </Text>
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
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxxl,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  greeting: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  appTitle: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.extrabold,
    color: COLORS.primary,
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    ...SHADOWS.sm,
  },
  achievementText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text.inverse,
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
    fontSize: FONT_SIZES.md,
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
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  categoriesGrid: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.lg,
  },
  categoryBubble: {
    width: 80,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIcon: {
    fontSize: 36,
    marginBottom: SPACING.sm,
  },
  categoryName: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  storiesGrid: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.lg,
  },
  emptyStoryCard: {
    flex: 1,
    aspectRatio: 0.75,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
    borderStyle: 'dashed',
  },
  emptyStoryText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text.primary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  emptyStorySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  storyCard: {
    width: 140,
    overflow: 'hidden',
  },
  storyImagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#FF9B71',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyCardTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text.primary,
    padding: SPACING.md,
    lineHeight: 18,
  },
  listStoryCard: {
    flexDirection: 'row',
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  listStoryImage: {
    width: 80,
    height: 80,
    backgroundColor: '#7FCCB5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listStoryInfo: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  listStoryTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  listStoryMeta: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    textTransform: 'capitalize',
  },
});
