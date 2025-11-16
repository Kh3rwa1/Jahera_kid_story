import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Search, Mic, Sparkles, BookOpen, Users, Heart } from 'lucide-react-native';
import { profileService, storyService } from '@/services/database';
import { ProfileWithRelations, Story } from '@/types/database';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '@/constants/theme';
import { useCallback } from 'react';

export default function HomeScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileWithRelations | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

      const [profileData, storiesData] = await Promise.all([
        profileService.getWithRelations(profileId),
        storyService.getByProfileId(profileId),
      ]);

      if (!profileData) {
        router.replace('/');
        return;
      }

      setProfile(profileData);
      setStories(storiesData || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setIsLoading(false);
    }
  };

  const handleGenerateStory = () => {
    if (!profile) return;

    router.push({
      pathname: '/story/generate',
      params: {
        profileId: profile.id,
        languageCode: profile.primary_language,
      },
    });
  };

  const handleStoryPress = (storyId: string) => {
    router.push({
      pathname: '/story/playback',
      params: { storyId },
    });
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      <View style={styles.topBar}>
        <Text style={styles.appTitle}>DreamTales</Text>
        <View style={styles.topBarIcons}>
          <View style={styles.coinBadge}>
            <Text style={styles.coinText}>00</Text>
          </View>
          <TouchableOpacity style={styles.notificationIcon}>
            <View style={styles.notificationDot} />
            <Text style={styles.notificationIconText}>🔔</Text>
          </TouchableOpacity>
        </View>
      </View>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color={COLORS.text.secondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a story"
              placeholderTextColor={COLORS.text.light}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.voiceButton}>
            <Mic size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Story Categories</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category, index) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryBubble, { backgroundColor: category.color }]}
                onPress={index === 0 ? handleGenerateStory : undefined}
                activeOpacity={0.7}>
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Stories</Text>
          <View style={styles.storiesGrid}>
            {recentStories.length === 0 ? (
              <TouchableOpacity style={styles.emptyStoryCard} onPress={handleGenerateStory}>
                <Sparkles size={40} color={COLORS.primary} strokeWidth={1.5} />
                <Text style={styles.emptyStoryText}>Create Your First Story!</Text>
                <Text style={styles.emptyStorySubtext}>Tap to generate</Text>
              </TouchableOpacity>
            ) : (
              recentStories.map(story => (
                <TouchableOpacity
                  key={story.id}
                  style={styles.storyCard}
                  onPress={() => handleStoryPress(story.id)}
                  activeOpacity={0.8}>
                  <View style={styles.storyImagePlaceholder}>
                    <BookOpen size={32} color="#FFFFFF" strokeWidth={1.5} />
                  </View>
                  <Text style={styles.storyCardTitle} numberOfLines={2}>
                    {story.title}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        {stories.length > 3 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All Stories</Text>
            {stories.slice(3).map(story => (
              <TouchableOpacity
                key={story.id}
                style={styles.listStoryCard}
                onPress={() => handleStoryPress(story.id)}
                activeOpacity={0.8}>
                <View style={styles.listStoryImage}>
                  <BookOpen size={24} color="#FFFFFF" strokeWidth={1.5} />
                </View>
                <View style={styles.listStoryInfo}>
                  <Text style={styles.listStoryTitle} numberOfLines={1}>
                    {story.title}
                  </Text>
                  <Text style={styles.listStoryMeta}>
                    {story.season} • {story.time_of_day}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
    </ScrollView>
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
    backgroundColor: COLORS.background,
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
    backgroundColor: COLORS.background,
  },
  appTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text.primary,
  },
  topBarIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  coinBadge: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
  },
  coinText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text.primary,
  },
  notificationIcon: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#85C1E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  notificationIconText: {
    fontSize: FONT_SIZES.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
    gap: SPACING.md,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
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
    backgroundColor: COLORS.primary,
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
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  categoryName: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
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
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
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
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
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
    backgroundColor: COLORS.cardBackground,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
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
