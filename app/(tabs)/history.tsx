import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getLanguageFlag, getLanguageNativeName } from '@/utils/languageUtils';
import { BookOpen, Play, Search, SortDesc, Volume2, Clock, Trash2 } from 'lucide-react-native';
import { SPACING, BORDER_RADIUS, SHADOWS, FONTS } from '@/constants/theme';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { storyService } from '@/services/database';

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

type SortOption = 'newest' | 'oldest' | 'language';

export default function HistoryScreen() {
  const router = useRouter();
  const { currentTheme } = useTheme();
  const COLORS = currentTheme.colors;
  const { stories, refreshStories, setStories } = useApp();
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshStories();
    setIsRefreshing(false);
  }, [refreshStories]);

  const confirmDelete = useCallback(async () => {
    if (!deleteId) return;
    const success = await storyService.delete(deleteId);
    if (success) {
      setStories(prev => prev.filter(s => s.id !== deleteId));
    }
    setDeleteId(null);
  }, [deleteId, setStories]);

  const handlePlayStory = useCallback(
    (storyId: string) => {
      router.push({ pathname: '/story/playback', params: { storyId } });
    },
    [router]
  );

  const languages = useMemo(
    () => Array.from(new Set(stories.map(s => s.language_code))),
    [stories]
  );

  const filteredStories = useMemo(() => {
    let result = [...stories];

    if (selectedLanguage) {
      result = result.filter(s => s.language_code === selectedLanguage);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => s.title.toLowerCase().includes(q));
    }

    switch (sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.generated_at).getTime() - new Date(b.generated_at).getTime());
        break;
      case 'language':
        result.sort((a, b) => a.language_code.localeCompare(b.language_code));
        break;
      default:
        result.sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime());
    }

    return result;
  }, [stories, selectedLanguage, searchQuery, sortBy]);

  const cycleSortOption = useCallback(() => {
    const options: SortOption[] = ['newest', 'oldest', 'language'];
    const currentIdx = options.indexOf(sortBy);
    setSortBy(options[(currentIdx + 1) % options.length]);
  }, [sortBy]);

  const sortLabel = sortBy === 'newest' ? 'Newest' : sortBy === 'oldest' ? 'Oldest' : 'Language';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['top']}>
      <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill} />

      <View style={styles.topBar}>
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <Text style={[styles.pageTitle, { color: COLORS.text.primary }]}>My Library</Text>
          <Text style={[styles.pageSubtitle, { color: COLORS.text.secondary }]}>
            {stories.length} {stories.length === 1 ? 'story' : 'stories'} created
          </Text>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.searchRow}>
        <View style={[styles.searchBar, { backgroundColor: COLORS.cardBackground }]}>
          <Search size={18} color={COLORS.text.light} />
          <TextInput
            style={[styles.searchInput, { color: COLORS.text.primary }]}
            placeholder="Search stories..."
            placeholderTextColor={COLORS.text.light}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={[styles.sortButton, { backgroundColor: COLORS.cardBackground }]}
          onPress={cycleSortOption}
          activeOpacity={0.7}
        >
          <SortDesc size={18} color={COLORS.primary} />
          <Text style={[styles.sortLabel, { color: COLORS.primary }]}>{sortLabel}</Text>
        </TouchableOpacity>
      </Animated.View>

      {languages.length > 1 && (
        <Animated.View entering={FadeInDown.delay(160).springify()}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.languageFilterContent}
          >
            <TouchableOpacity
              style={[styles.filterChip, { backgroundColor: !selectedLanguage ? COLORS.primary : COLORS.cardBackground }]}
              onPress={() => setSelectedLanguage(null)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, { color: !selectedLanguage ? '#FFF' : COLORS.text.primary }]}>
                All
              </Text>
            </TouchableOpacity>
            {languages.map(lang => (
              <TouchableOpacity
                key={lang}
                style={[styles.filterChip, { backgroundColor: selectedLanguage === lang ? COLORS.primary : COLORS.cardBackground }]}
                onPress={() => setSelectedLanguage(lang)}
                activeOpacity={0.7}
              >
                <Text style={styles.filterChipFlag}>{getLanguageFlag(lang)}</Text>
                <Text style={[styles.filterChipText, { color: selectedLanguage === lang ? '#FFF' : COLORS.text.primary }]}>
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
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
        }
      >
        {filteredStories.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: COLORS.primary + '12' }]}>
              <BookOpen size={40} color={COLORS.primary} strokeWidth={1.5} />
            </View>
            <Text style={[styles.emptyTitle, { color: COLORS.text.primary }]}>
              {searchQuery ? 'No matches found' : 'No stories yet'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: COLORS.text.secondary }]}>
              {searchQuery ? 'Try a different search term' : 'Create your first story from the Home tab'}
            </Text>
          </View>
        ) : (
          <View style={styles.storiesGrid}>
            {filteredStories.map((story, index) => (
              <Animated.View
                key={story.id}
                entering={FadeInUp.delay(80 + index * 50).springify()}
                style={styles.storyCardWrap}
              >
                <TouchableOpacity
                  style={[styles.storyCard, { backgroundColor: COLORS.cardBackground }]}
                  onPress={() => handlePlayStory(story.id)}
                  onLongPress={() => setDeleteId(story.id)}
                  activeOpacity={0.85}
                  delayLongPress={500}
                >
                  <LinearGradient
                    colors={getSeasonColors(story.season)}
                    style={styles.storyImagePlaceholder}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Play size={24} color="rgba(255,255,255,0.8)" strokeWidth={1.5} fill="rgba(255,255,255,0.8)" />
                    <View style={styles.langBadge}>
                      <Text style={styles.langBadgeText}>{getLanguageFlag(story.language_code)}</Text>
                    </View>
                    {story.audio_url && (
                      <View style={styles.audioIndicator}>
                        <Volume2 size={10} color="#FFF" />
                      </View>
                    )}
                  </LinearGradient>

                  <View style={styles.storyCardContent}>
                    <Text style={[styles.storyCardTitle, { color: COLORS.text.primary }]} numberOfLines={2}>
                      {story.title}
                    </Text>
                    <View style={styles.storyMetaRow}>
                      <Clock size={11} color={COLORS.text.light} />
                      <Text style={[styles.storyMetaText, { color: COLORS.text.light }]}>
                        {getRelativeTime(story.generated_at || story.created_at)}
                      </Text>
                    </View>
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
        cancelText="Keep"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        destructive
      />
    </SafeAreaView>
  );
}

function getSeasonColors(season: string): string[] {
  switch (season) {
    case 'spring': return ['#C6F6D5', '#9AE6B4'];
    case 'summer': return ['#FEFCBF', '#F6E05E'];
    case 'fall': return ['#FEEBC8', '#F6AD55'];
    case 'winter': return ['#BEE3F8', '#63B3ED'];
    default: return ['#C6F6D5', '#9AE6B4'];
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: SPACING.sm,
  },
  pageTitle: { fontSize: 24, fontFamily: FONTS.bold, marginBottom: 2 },
  pageSubtitle: { fontSize: 14, fontFamily: FONTS.medium },
  searchRow: {
    flexDirection: 'row', paddingHorizontal: SPACING.xl,
    gap: SPACING.sm, marginBottom: SPACING.md,
  },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, borderRadius: BORDER_RADIUS.lg,
    height: 44, gap: SPACING.sm, ...SHADOWS.xs,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: FONTS.medium },
  sortButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: SPACING.md, borderRadius: BORDER_RADIUS.lg,
    height: 44, ...SHADOWS.xs,
  },
  sortLabel: { fontSize: 12, fontFamily: FONTS.semibold },
  languageFilterContent: {
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm, gap: SPACING.sm,
  },
  filterChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.pill, gap: 6, ...SHADOWS.xs,
  },
  filterChipFlag: { fontSize: 16 },
  filterChipText: { fontSize: 13, fontFamily: FONTS.semibold },
  scrollContent: { paddingBottom: 100 },
  emptyState: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 80, paddingHorizontal: SPACING.xl,
  },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg,
  },
  emptyTitle: { fontSize: 18, fontFamily: FONTS.bold, marginBottom: SPACING.sm },
  emptySubtitle: { fontSize: 14, fontFamily: FONTS.regular, textAlign: 'center' },
  storiesGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg, gap: SPACING.md,
  },
  storyCardWrap: { width: '47%' },
  storyCard: {
    borderRadius: BORDER_RADIUS.xl, overflow: 'hidden', ...SHADOWS.sm,
  },
  storyImagePlaceholder: {
    width: '100%', height: 120,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  langBadge: {
    position: 'absolute', top: SPACING.sm, left: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 10,
    width: 26, height: 26, alignItems: 'center', justifyContent: 'center',
  },
  langBadgeText: { fontSize: 13 },
  audioIndicator: {
    position: 'absolute', top: SPACING.sm, right: SPACING.sm,
    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 10,
    width: 22, height: 22, alignItems: 'center', justifyContent: 'center',
  },
  storyCardContent: { padding: SPACING.md },
  storyCardTitle: {
    fontSize: 13, fontFamily: FONTS.semibold, lineHeight: 18,
    marginBottom: 6, minHeight: 36,
  },
  storyMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  storyMetaText: { fontSize: 11, fontFamily: FONTS.medium },
});
