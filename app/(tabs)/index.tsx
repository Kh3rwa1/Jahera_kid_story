import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Sparkles, BookOpen, RefreshCw, MapPin, Star, ChevronRight } from 'lucide-react-native';
import { profileService, storyService } from '@/services/database';
import { ProfileWithRelations, Story } from '@/types/database';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT_SIZES, FONT_WEIGHTS } from '@/constants/theme';
import { Typography } from '@/components/Typography';
import { PremiumCard } from '@/components/PremiumCard';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { useResponsive } from '@/hooks/useResponsive';

export default function HomeScreen() {
  const router = useRouter();
  const responsive = useResponsive();
  const [profile, setProfile] = useState<ProfileWithRelations | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
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

      const [profileData, storiesData] = await Promise.all([
        profileService.getWithRelations(profileId),
        storyService.getByProfileId(profileId),
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
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load your data. Please try again.');
      setIsLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  }, []);

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
      router.push({
        pathname: '/story/playback',
        params: { storyId },
      });
    },
    [router]
  );

  const recentStories = useMemo(() => stories.slice(0, 4), [stories]);
  const olderStories = useMemo(() => stories.slice(4), [stories]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill} />
        <View style={styles.loadingContent}>
          <LoadingSkeleton type="card" count={3} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill} />
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill} />
      <ScrollView
        style={styles.scrollContainer}
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
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
          <View style={styles.userSection}>
            <View style={styles.avatarContainer}>
              <LinearGradient colors={COLORS.gradients.primary} style={styles.avatarGradient}>
                <Typography variant="h2" color="inverse">
                  {profile?.kid_name?.charAt(0) || '?'}
                </Typography>
              </LinearGradient>
            </View>
            <View style={styles.greetingContainer}>
              <Typography variant="caption" color="secondary">
                Welcome back
              </Typography>
              <Typography variant="h4" color="primary">
                {profile?.kid_name || 'Friend'}
              </Typography>
            </View>
          </View>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            activeOpacity={0.7}
          >
            <RefreshCw size={20} color={COLORS.text.primary} strokeWidth={2} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.heroSection}>
          <PremiumCard
            style={styles.heroCard}
            shadow="xl"
            padding={0}
            onPress={handleGenerateStory}
          >
            <LinearGradient
              colors={['#D5F2ED', '#B8EAE0']}
              style={styles.heroCardGradient}
            >
              <View style={styles.heroContent}>
                <View style={styles.heroIllustration}>
                  <Typography style={styles.heroEmoji}>✨</Typography>
                </View>
                <View style={styles.heroTextContainer}>
                  <Typography variant="h3" color="primary" style={styles.heroTitle}>
                    Create a New Story
                  </Typography>
                  <Typography variant="bodySmall" color="secondary">
                    Generate a personalized adventure
                  </Typography>
                </View>
                <View style={styles.heroButton}>
                  <LinearGradient
                    colors={COLORS.gradients.primary}
                    style={styles.heroButtonGradient}
                  >
                    <Sparkles size={18} color={COLORS.text.inverse} strokeWidth={2.5} />
                  </LinearGradient>
                </View>
              </View>
            </LinearGradient>
          </PremiumCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).springify()}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#E8F8F5' }]}>
                <BookOpen size={18} color={COLORS.primary} strokeWidth={2} />
              </View>
              <Typography variant="h4" color="primary">{stories.length}</Typography>
              <Typography variant="caption" color="secondary">Stories</Typography>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#FFF3CD' }]}>
                <Star size={18} color="#F59E0B" strokeWidth={2} />
              </View>
              <Typography variant="h4" color="primary">
                {profile?.languages?.length || 0}
              </Typography>
              <Typography variant="caption" color="secondary">Languages</Typography>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#E8E7FF' }]}>
                <Sparkles size={18} color="#7C6FDC" strokeWidth={2} />
              </View>
              <Typography variant="h4" color="primary">
                {(profile?.family_members?.length || 0) + (profile?.friends?.length || 0)}
              </Typography>
              <Typography variant="caption" color="secondary">Characters</Typography>
            </View>
          </View>
        </Animated.View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Typography variant="h3" color="primary">
              Your Stories
            </Typography>
            {stories.length > 4 && (
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/history')}
                style={styles.viewAllButton}
              >
                <Typography variant="bodySmall" color="secondary">
                  View All
                </Typography>
                <ChevronRight size={16} color={COLORS.text.secondary} />
              </TouchableOpacity>
            )}
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
                  COLORS.categoryColors.blueGradient,
                  COLORS.categoryColors.greenGradient,
                ];
                const gradient = gradients[index % gradients.length];

                return (
                  <Animated.View
                    key={story.id}
                    entering={FadeInUp.delay(400 + index * 80).springify()}
                    style={styles.storyCardWrap}
                  >
                    <PremiumCard
                      style={styles.storyCard}
                      onPress={() => handleStoryPress(story.id)}
                      shadow="lg"
                      padding={0}
                    >
                      <LinearGradient colors={gradient} style={styles.storyImage}>
                        <BookOpen size={36} color={COLORS.text.inverse} strokeWidth={1.5} />
                      </LinearGradient>
                      <View style={styles.storyCardContent}>
                        <Typography variant="bodyMedium" numberOfLines={2} style={styles.storyTitle}>
                          {story.title}
                        </Typography>
                        <View style={styles.storyMeta}>
                          <View style={styles.storyLocation}>
                            <MapPin size={12} color={COLORS.text.secondary} strokeWidth={2} />
                            <Typography variant="caption" color="secondary" numberOfLines={1}>
                              {story.season || 'Adventure'}
                            </Typography>
                          </View>
                        </View>
                      </View>
                    </PremiumCard>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </View>

        {olderStories.length > 0 && (
          <View style={styles.section}>
            <Typography variant="h3" color="primary" style={styles.sectionTitleInline}>
              More Stories
            </Typography>
            <View style={styles.allStoriesContainer}>
              {olderStories.map((story, index) => {
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
                      <BookOpen size={22} color={COLORS.text.inverse} strokeWidth={1.5} />
                    </LinearGradient>
                    <View style={styles.listStoryInfo}>
                      <Typography variant="bodyMedium" numberOfLines={1}>
                        {story.title}
                      </Typography>
                      <View style={styles.listStoryMeta}>
                        <MapPin size={12} color={COLORS.text.secondary} strokeWidth={2} />
                        <Typography variant="caption" color="secondary">
                          {story.season} {story.time_of_day ? `\u00B7 ${story.time_of_day}` : ''}
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
    width: 52,
    height: 52,
    borderRadius: 26,
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
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  heroSection: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  heroCard: {
    borderRadius: BORDER_RADIUS.xxl,
    overflow: 'hidden',
  },
  heroCardGradient: {
    padding: SPACING.xl,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIllustration: {
    marginRight: SPACING.lg,
  },
  heroEmoji: {
    fontSize: 48,
  },
  heroTextContainer: {
    flex: 1,
    gap: SPACING.xs,
  },
  heroTitle: {
    fontWeight: '700',
  },
  heroButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  heroButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xxl,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: SPACING.sm,
  },
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
  sectionTitleInline: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  storiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  storyCardWrap: {
    width: '47%',
  },
  storyCard: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  storyImage: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyCardContent: {
    padding: SPACING.md,
    backgroundColor: COLORS.cardBackground,
  },
  storyTitle: {
    fontWeight: '600',
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
  emptyStateContainer: {
    paddingHorizontal: SPACING.xl,
  },
  allStoriesContainer: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  listStoryCard: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: BORDER_RADIUS.xl,
  },
  listStoryImage: {
    width: 72,
    height: 72,
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
