import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storyService } from '@/services/database';
import { Story } from '@/types/database';
import { getLanguageFlag, getLanguageNativeName } from '@/utils/languageUtils';
import { BookOpen, Trash2, Play } from 'lucide-react-native';
import { useCallback } from 'react';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '@/constants/theme';

export default function HistoryScreen() {
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

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

      if (data) {
        setStories(data);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading stories:', error);
      setIsLoading(false);
    }
  };

  const handleDeleteStory = (storyId: string) => {
    Alert.alert('Delete Story', 'Are you sure you want to delete this story?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const success = await storyService.delete(storyId);
          if (success) {
            setStories(stories.filter(s => s.id !== storyId));
          }
        },
      },
    ]);
  };

  const handlePlayStory = (storyId: string) => {
    router.push({
      pathname: '/story/playback',
      params: { storyId },
    });
  };

  const getUniqueLanguages = (): string[] => {
    const languages = new Set(stories.map(s => s.language_code));
    return Array.from(languages);
  };

  const filteredStories = selectedLanguage
    ? stories.filter(s => s.language_code === selectedLanguage)
    : stories;

  const languages = getUniqueLanguages();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.pageTitle}>My Library</Text>
          <Text style={styles.pageSubtitle}>{stories.length} stories</Text>
        </View>
      </View>

      {languages.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.languageFilter}
          contentContainerStyle={styles.languageFilterContent}>
          <TouchableOpacity
            style={[styles.filterChip, !selectedLanguage && styles.filterChipActive]}
            onPress={() => setSelectedLanguage(null)}
            activeOpacity={0.7}>
            <Text style={[styles.filterChipText, !selectedLanguage && styles.filterChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {languages.map(lang => (
            <TouchableOpacity
              key={lang}
              style={[styles.filterChip, selectedLanguage === lang && styles.filterChipActive]}
              onPress={() => setSelectedLanguage(lang)}
              activeOpacity={0.7}>
              <Text style={styles.filterChipFlag}>{getLanguageFlag(lang)}</Text>
              <Text
                style={[
                  styles.filterChipText,
                  selectedLanguage === lang && styles.filterChipTextActive,
                ]}>
                {getLanguageNativeName(lang)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
        {filteredStories.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <BookOpen size={48} color={COLORS.primary} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyStateText}>No stories yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Create your first story from the home screen
            </Text>
          </View>
        ) : (
          <View style={styles.storiesGrid}>
            {filteredStories.map((story, index) => (
              <TouchableOpacity
                key={story.id}
                style={styles.storyCard}
                onPress={() => handlePlayStory(story.id)}
                activeOpacity={0.8}>
                <View style={[
                  styles.storyImagePlaceholder,
                  { backgroundColor: getStoryColor(index) }
                ]}>
                  <Play size={32} color="#FFFFFF" strokeWidth={1.5} fill="#FFFFFF" />
                  <TouchableOpacity
                    style={styles.deleteIconButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteStory(story.id);
                    }}
                    activeOpacity={0.7}>
                    <Trash2 size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.storyCardContent}>
                  <View style={styles.storyCardHeader}>
                    <Text style={styles.languageBadge}>{getLanguageFlag(story.language_code)}</Text>
                  </View>

                  <Text style={styles.storyCardTitle} numberOfLines={2}>
                    {story.title}
                  </Text>

                  <View style={styles.storyCardMeta}>
                    <Text style={styles.storyMetaText}>
                      {story.season} • {story.time_of_day}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
    </ScrollView>
  );
}

function getStoryColor(index: number): string {
  const colors = ['#FF9B71', '#7FCCB5', '#9B87E8', '#FF8FA3', '#FFB86F', '#85C1E2'];
  return colors[index % colors.length];
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F8F5',
  },
  container: {
    flex: 1,
    backgroundColor: '#E8F8F5',
  },
  scrollContent: {
    paddingBottom: SPACING.xxxl,
  },
  topBar: {
    paddingTop: 60,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
    backgroundColor: '#E8F8F5',
  },
  pageTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  pageSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
  },
  languageFilter: {
    backgroundColor: '#E8F8F5',
    marginBottom: SPACING.lg,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: SPACING.xl,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
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
    gap: SPACING.lg,
  },
  storyCard: {
    width: '47%',
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  storyImagePlaceholder: {
    width: '100%',
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  deleteIconButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
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
  storyCardMeta: {
    marginTop: SPACING.xs,
  },
  storyMetaText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text.secondary,
    textTransform: 'capitalize',
  },
});
