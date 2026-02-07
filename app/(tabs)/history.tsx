import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { storyService } from '@/services/database';
import { Story } from '@/types/database';
import { getLanguageFlag, getLanguageNativeName } from '@/utils/languageUtils';
import { BookOpen, Trash2, Play } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '@/constants/theme';
import { ConfirmDialog } from '@/components/ConfirmDialog';

const STORY_COLORS = ['#4ECDC4', '#FF9B71', '#85C1E2', '#FFB86F', '#A8E6CF', '#FF8FA3'];

export default function HistoryScreen() {
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadStories();
    }, [])
  );

  const loadStories = async () => {
    try {
      const profileId = await AsyncStorage.getItem('profileId');
      if (!profileId) {
        setIsLoading(false);
        return;
      }
      const data = await storyService.getByProfileId(profileId);
      if (data) setStories(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading stories:', error);
      setIsLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadStories();
    setIsRefreshing(false);
  }, []);

  const confirmDelete = async () => {
    if (!deleteId) return;
    const success = await storyService.delete(deleteId);
    if (success) {
      setStories(stories.filter(s => s.id !== deleteId));
    }
    setDeleteId(null);
  };

  const handlePlayStory = useCallback(
    (storyId: string) => {
      router.push({ pathname: '/story/playback', params: { storyId } });
    },
    [router]
  );

  const languages = Array.from(new Set(stories.map(s => s.language_code)));
  const filteredStories = selectedLanguage
    ? stories.filter(s => s.language_code === selectedLanguage)
    : stories;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill} />

      <View style={styles.topBar}>
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text style={styles.pageTitle}>My Library</Text>
          <Text style={styles.pageSubtitle}>{stories.length} stories created</Text>
        </Animated.View>
      </View>

      {languages.length > 1 && (
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.languageFilter}
            contentContainerStyle={styles.languageFilterContent}
          >
            <TouchableOpacity
              style={[styles.filterChip, !selectedLanguage && styles.filterChipActive]}
              onPress={() => setSelectedLanguage(null)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, !selectedLanguage && styles.filterChipTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {languages.map(lang => (
              <TouchableOpacity
                key={lang}
                style={[styles.filterChip, selectedLanguage === lang && styles.filterChipActive]}
                onPress={() => setSelectedLanguage(lang)}
                activeOpacity={0.7}
              >
                <Text style={styles.filterChipFlag}>{getLanguageFlag(lang)}</Text>
                <Text
                  style={[
                    styles.filterChipText,
                    selectedLanguage === lang && styles.filterChipTextActive,
                  ]}
                >
                  {getLanguageNativeName(lang)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}

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
        {filteredStories.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <BookOpen size={44} color={COLORS.primary} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyStateText}>
              {isLoading ? 'Loading...' : 'No stories yet'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Create your first story from the home screen
            </Text>
          </View>
        ) : (
          <View style={styles.storiesGrid}>
            {filteredStories.map((story, index) => (
              <Animated.View
                key={story.id}
                entering={FadeInUp.delay(100 + index * 60).springify()}
                style={styles.storyCardWrap}
              >
                <TouchableOpacity
                  style={styles.storyCard}
                  onPress={() => handlePlayStory(story.id)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[STORY_COLORS[index % STORY_COLORS.length], STORY_COLORS[index % STORY_COLORS.length] + 'CC']}
                    style={styles.storyImagePlaceholder}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Play size={28} color="#FFFFFF" strokeWidth={1.5} fill="#FFFFFF" />
                    <TouchableOpacity
                      style={styles.deleteIconButton}
                      onPress={() => setDeleteId(story.id)}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </LinearGradient>

                  <View style={styles.storyCardContent}>
                    <View style={styles.storyCardHeader}>
                      <Text style={styles.languageBadge}>{getLanguageFlag(story.language_code)}</Text>
                    </View>
                    <Text style={styles.storyCardTitle} numberOfLines={2}>
                      {story.title}
                    </Text>
                    <Text style={styles.storyMetaText}>
                      {story.season} {story.time_of_day ? `\u00B7 ${story.time_of_day}` : ''}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>

      <ConfirmDialog
        visible={!!deleteId}
        title="Delete Story"
        message="Are you sure you want to delete this story? This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        destructive
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
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
  languageFilter: {
    marginBottom: SPACING.md,
  },
  languageFilterContent: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.cardBackground,
    gap: SPACING.xs,
    ...SHADOWS.xs,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipFlag: {
    fontSize: FONT_SIZES.lg,
  },
  filterChipText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text.primary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: SPACING.xxxl * 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: SPACING.xl,
  },
  emptyIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.md,
  },
  emptyStateText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  emptyStateSubtext: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  storiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  storyCardWrap: {
    width: '47%',
  },
  storyCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  storyImagePlaceholder: {
    width: '100%',
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  deleteIconButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyCardContent: {
    padding: SPACING.md,
  },
  storyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  languageBadge: {
    fontSize: FONT_SIZES.lg,
  },
  storyCardTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
    lineHeight: 18,
    minHeight: 36,
  },
  storyMetaText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
    textTransform: 'capitalize',
  },
});
