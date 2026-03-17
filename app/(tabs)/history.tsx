import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown, FadeInUp, ZoomIn, FadeIn,
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay,
} from 'react-native-reanimated';
import { useEntranceSequence, useSpringPress } from '@/utils/animations';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getLanguageFlag, getLanguageNativeName } from '@/utils/languageUtils';
import {
  BookOpen,
  Play,
  Search,
  SlidersHorizontal,
  Volume2,
  Clock,
  Sparkles,
  ChevronRight,
  Grid2x2,
  List,
} from 'lucide-react-native';
import { SPACING, BORDER_RADIUS, SHADOWS, FONTS, FONT_SIZES } from '@/constants/theme';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { storyService } from '@/services/database';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { KidsBubbleBackground } from '@/components/KidsBubbleBackground';
import { MarqueeText } from '@/components/MarqueeText';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - SPACING.xl * 2 - SPACING.md) / 2;

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

function getSeasonPalette(season: string): { colors: readonly [string, string, string]; accent: string; emoji: string } {
  switch (season) {
    case 'spring': return { colors: ['#D4F5D4', '#A8E6CF', '#7ED3B2'], accent: '#38A169', emoji: '🌸' };
    case 'summer': return { colors: ['#FFF3C4', '#FBBF24', '#F59E0B'], accent: '#D97706', emoji: '☀️' };
    case 'fall':   return { colors: ['#FDEBD0', '#F9A825', '#E65100'], accent: '#C0392B', emoji: '🍂' };
    case 'winter': return { colors: ['#DBEAFE', '#93C5FD', '#60A5FA'], accent: '#2563EB', emoji: '❄️' };
    default:       return { colors: ['#D4F5D4', '#A8E6CF', '#7ED3B2'], accent: '#38A169', emoji: '📖' };
  }
}

type SortOption = 'newest' | 'oldest' | 'language';
type ViewMode = 'grid' | 'list';

function AnimatedFilterChip({ label, flag, active, primaryColor, cardBackground, textSecondary, onPress, index }: {
  label: string; flag?: string; active: boolean; primaryColor: string; cardBackground: string; textSecondary: string; onPress: () => void; index: number;
}) {
  const scale = useSharedValue(active ? 1.04 : 1);
  const entrance = useEntranceSequence(index, 130, 40);

  const handlePress = () => {
    scale.value = withSpring(0.9, { damping: 10 });
    setTimeout(() => { scale.value = withSpring(active ? 1 : 1.04, { damping: 12 }); }, 100);
    onPress();
  };

  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[entrance, pressStyle]}>
      <TouchableOpacity
        style={[styles.filterChip, { backgroundColor: active ? primaryColor : cardBackground }]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        {flag && <Text style={styles.filterChipFlag}>{flag}</Text>}
        <Text style={[styles.filterChipText, { color: active ? '#FFF' : textSecondary }]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function AnimatedStoryGridCard({ story, idx, palette, onPress, onLongPress, COLORS }: any) {
  const entrance = useEntranceSequence(idx, 60, 40);
  const { style: pressStyle, onPressIn, onPressOut } = useSpringPress();

  return (
    <Animated.View style={[styles.gridItem, entrance]}>
      <Animated.View style={pressStyle}>
        <TouchableOpacity
          style={[styles.gridCard, { backgroundColor: COLORS.cardBackground }]}
          onPress={onPress}
          onLongPress={onLongPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          activeOpacity={1}
          delayLongPress={500}
        >
          <LinearGradient colors={palette.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gridThumb}>
            <Text style={styles.gridSeasonEmoji}>{palette.emoji}</Text>
            <View style={[styles.gridPlayCircle, { backgroundColor: 'rgba(255,255,255,0.72)' }]}>
              <Play size={16} color={palette.accent} fill={palette.accent} strokeWidth={0} />
            </View>
            <View style={styles.gridBadgeRow}>
              <View style={styles.gridLangBadge}>
                <Text style={{ fontSize: 12 }}>{getLanguageFlag(story.language_code)}</Text>
              </View>
              {story.audio_url && (
                <View style={[styles.gridAudioBadge, { backgroundColor: 'rgba(0,0,0,0.22)' }]}>
                  <Volume2 size={9} color="#FFF" />
                </View>
              )}
            </View>
          </LinearGradient>
          <View style={styles.gridInfo}>
            <Text style={[styles.gridTitle, { color: COLORS.text.primary }]} numberOfLines={2}>{story.title}</Text>
            <View style={styles.gridMeta}>
              <Clock size={10} color={COLORS.text.light} />
              <Text style={[styles.gridMetaText, { color: COLORS.text.light }]}>
                {getRelativeTime(story.generated_at || story.$createdAt)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

export default function HistoryScreen() {
  const router = useRouter();
  const { currentTheme } = useTheme();
  const COLORS = currentTheme.colors;
  const { stories, refreshStories, setStories } = useApp();
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshStories();
    setIsRefreshing(false);
  }, [refreshStories]);

  const confirmDelete = useCallback(async () => {
    if (!deleteId) return;
    const success = await storyService.delete(deleteId);
    if (success) setStories(prev => prev.filter(s => s.$id !== deleteId));
    setDeleteId(null);
  }, [deleteId, setStories]);

  const handlePlayStory = useCallback(
    (storyId: string) => router.push({ pathname: '/story/playback', params: { storyId } }),
    [router]
  );

  const languages = useMemo(
    () => Array.from(new Set(stories.map(s => s.language_code))),
    [stories]
  );

  const filteredStories = useMemo(() => {
    let result = [...stories];
    if (selectedLanguage) result = result.filter(s => s.language_code === selectedLanguage);
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

  const sortLabel = sortBy === 'newest' ? 'Newest first' : sortBy === 'oldest' ? 'Oldest first' : 'By language';
  const featuredStory = useMemo(() => (stories.length > 0 ? stories[0] : null), [stories]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['top']}>
      <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill} />
      <KidsBubbleBackground bubbleCount={8} cloudCount={2} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* ── Page header ── */}
        <Animated.View entering={FadeInDown.delay(40).springify()} style={styles.header}>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.titleEmoji}>📚</Text>
              <Text style={[styles.pageTitle, { color: COLORS.text.primary }]}>My Library</Text>
            </View>
            <Text style={[styles.pageSubtitle, { color: COLORS.text.secondary }]}>
              {stories.length} {stories.length === 1 ? 'story' : 'stories'} collected
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.viewToggle, { backgroundColor: COLORS.cardBackground }]}
            onPress={() => setViewMode(v => (v === 'grid' ? 'list' : 'grid'))}
            activeOpacity={0.75}
          >
            {viewMode === 'grid'
              ? <List size={18} color={COLORS.text.secondary} />
              : <Grid2x2 size={18} color={COLORS.text.secondary} />
            }
          </TouchableOpacity>
        </Animated.View>

        {/* ── Featured / latest story ── */}
        {featuredStory && !searchQuery && !selectedLanguage && (
          <Animated.View entering={FadeInDown.delay(80).springify()}>
            <AnimatedPressable
              onPress={() => handlePlayStory(featuredStory.$id)}
              scaleDown={0.97}
              style={styles.featuredWrap}
            >
              {(() => {
                const palette = getSeasonPalette(featuredStory.season);
                return (
                  <LinearGradient
                    colors={palette.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.featuredCard}
                  >
                    <View style={styles.featuredTop}>
                      <View style={styles.featuredBadge}>
                        <Sparkles size={11} color={palette.accent} />
                        <Text style={[styles.featuredBadgeText, { color: palette.accent }]}>Latest Story</Text>
                      </View>
                      {featuredStory.audio_url && (
                        <View style={[styles.audioPill, { backgroundColor: 'rgba(0,0,0,0.12)' }]}>
                          <Volume2 size={11} color={palette.accent} />
                          <Text style={[styles.audioPillText, { color: palette.accent }]}>Audio</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.featuredCenter}>
                      <Text style={styles.featuredSeasonIcon}>{palette.emoji}</Text>
                      <MarqueeText
                        text={featuredStory.title}
                        style={[styles.featuredTitle, { color: '#1A1A2E' }]}
                        containerStyle={{ flex: 1 }}
                      />
                    </View>

                    <View style={styles.featuredMeta}>
                      <View style={styles.featuredMetaLeft}>
                        <Text style={styles.featuredLangFlag}>{getLanguageFlag(featuredStory.language_code)}</Text>
                        <Text style={[styles.featuredMetaText, { color: palette.accent + 'CC' }]}>
                          {getRelativeTime(featuredStory.generated_at || featuredStory.$createdAt)}
                        </Text>
                      </View>
                      <View style={[styles.featuredPlayBtn, { backgroundColor: palette.accent }]}>
                        <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
                        <Text style={styles.featuredPlayText}>Play Story</Text>
                      </View>
                    </View>
                  </LinearGradient>
                );
              })()}
            </AnimatedPressable>
          </Animated.View>
        )}

        {/* ── Search + sort ── */}
        <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.controlsRow}>
          <View style={[styles.searchBar, { backgroundColor: COLORS.cardBackground }]}>
            <Search size={16} color={COLORS.text.light} strokeWidth={2} />
            <TextInput
              style={[styles.searchInput, { color: COLORS.text.primary }]}
              placeholder="Search stories…"
              placeholderTextColor={COLORS.text.light}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.sortBtn,
              { backgroundColor: showSortMenu ? COLORS.primary : COLORS.cardBackground },
            ]}
            onPress={() => setShowSortMenu(v => !v)}
            activeOpacity={0.8}
          >
            <SlidersHorizontal size={16} color={showSortMenu ? '#FFF' : COLORS.primary} strokeWidth={2} />
          </TouchableOpacity>
        </Animated.View>

        {/* Sort dropdown */}
        {showSortMenu && (
          <Animated.View entering={FadeIn.duration(150)} style={[styles.sortMenu, { backgroundColor: COLORS.cardBackground }]}>
            {(['newest', 'oldest', 'language'] as SortOption[]).map(opt => {
              const label = opt === 'newest' ? 'Newest first' : opt === 'oldest' ? 'Oldest first' : 'By language';
              const active = sortBy === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.sortMenuItem, active && { backgroundColor: COLORS.primary + '14' }]}
                  onPress={() => { setSortBy(opt); setShowSortMenu(false); }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.sortMenuLabel, { color: active ? COLORS.primary : COLORS.text.primary }]}>
                    {label}
                  </Text>
                  {active && <ChevronRight size={14} color={COLORS.primary} />}
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        )}

        {/* ── Language filter chips ── */}
        {languages.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {[null, ...languages].map((lang, idx) => {
              const active = lang === null ? !selectedLanguage : selectedLanguage === lang;
              return (
                <AnimatedFilterChip
                  key={lang ?? '__all'}
                  label={lang ? getLanguageNativeName(lang) : 'All'}
                  flag={lang ? getLanguageFlag(lang) : undefined}
                  active={active}
                  primaryColor={COLORS.primary}
                  cardBackground={COLORS.cardBackground}
                  textSecondary={COLORS.text.secondary}
                  onPress={() => setSelectedLanguage(lang)}
                  index={idx}
                />
              );
            })}
          </ScrollView>
        )}

        {/* ── Section label ── */}
        {filteredStories.length > 0 && (
          <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.sectionRow}>
            <Text style={[styles.sectionLabel, { color: COLORS.text.secondary }]}>
              {filteredStories.length} {filteredStories.length === 1 ? 'result' : 'results'} · {sortLabel}
            </Text>
          </Animated.View>
        )}

        {/* ── Stories ── */}
        {filteredStories.length === 0 ? (
          <Animated.View entering={ZoomIn.delay(100).springify()} style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>{searchQuery ? '🔍' : '📖'}</Text>
            <Text style={[styles.emptyTitle, { color: COLORS.text.primary }]}>
              {searchQuery ? 'No matches found' : 'No stories yet!'}
            </Text>
            <Text style={[styles.emptyBody, { color: COLORS.text.secondary }]}>
              {searchQuery
                ? 'Try a different search term or clear the filter'
                : 'Head to the Home tab and create your first magical story!'}
            </Text>
          </Animated.View>
        ) : viewMode === 'grid' ? (
          <View style={styles.grid}>
            {filteredStories.map((story, idx) => {
              const palette = getSeasonPalette(story.season);
              return (
                <AnimatedStoryGridCard
                  key={story.$id}
                  story={story}
                  idx={idx}
                  palette={palette}
                  onPress={() => handlePlayStory(story.$id)}
                  onLongPress={() => setDeleteId(story.$id)}
                  COLORS={COLORS}
                />
              );
            })}
          </View>
        ) : (
          <View style={[styles.list, { backgroundColor: COLORS.cardBackground }]}>
            {filteredStories.map((story, idx) => {
              const palette = getSeasonPalette(story.season);
              return (
                <Animated.View key={story.$id} entering={FadeInUp.delay(60 + idx * 30).springify()}>
                  <AnimatedPressable
                    style={styles.listCard}
                    onPress={() => handlePlayStory(story.$id)}
                    onLongPress={() => setDeleteId(story.$id)}
                    scaleDown={0.97}
                    delayLongPress={500}
                  >
                    <LinearGradient
                      colors={palette.colors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.listThumb}
                    >
                      <Text style={styles.listThumbEmoji}>{palette.emoji}</Text>
                    </LinearGradient>

                    <View style={styles.listInfo}>
                      <MarqueeText
                        text={story.title}
                        style={[styles.listTitle, { color: COLORS.text.primary }]}
                      />
                      <View style={styles.listMeta}>
                        <Text style={styles.listLangFlag}>{getLanguageFlag(story.language_code)}</Text>
                        <Text style={[styles.listMetaText, { color: COLORS.text.secondary }]}>
                          {getLanguageNativeName(story.language_code)}
                        </Text>
                        <View style={[styles.listDot, { backgroundColor: COLORS.text.light }]} />
                        <Clock size={10} color={COLORS.text.light} />
                        <Text style={[styles.listMetaText, { color: COLORS.text.light }]}>
                          {getRelativeTime(story.generated_at || story.$createdAt)}
                        </Text>
                        {story.audio_url && (
                          <>
                            <View style={[styles.listDot, { backgroundColor: COLORS.text.light }]} />
                            <Volume2 size={10} color={COLORS.text.light} />
                          </>
                        )}
                      </View>
                    </View>

                    <ChevronRight size={16} color={COLORS.text.light} />
                  </AnimatedPressable>

                  {idx < filteredStories.length - 1 && (
                    <View style={[styles.listDivider, { backgroundColor: COLORS.text.primary + '07' }]} />
                  )}
                </Animated.View>
              );
            })}
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: 120,
    gap: SPACING.lg,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  titleEmoji: { fontSize: 22 },
  pageTitle: {
    fontSize: 32,
    fontFamily: FONTS.display,
    letterSpacing: -0.4,
  },
  pageSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    marginTop: 2,
  },
  viewToggle: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.xs,
  },

  featuredWrap: { borderRadius: BORDER_RADIUS.xxl, overflow: 'hidden', ...SHADOWS.lg },
  featuredCard: {
    padding: SPACING.xl,
    gap: SPACING.md,
    minHeight: 170,
    justifyContent: 'space-between',
  },
  featuredTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.pill,
  },
  featuredBadgeText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    letterSpacing: 0.2,
  },
  audioPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.pill,
  },
  audioPillText: { fontSize: 10, fontFamily: FONTS.semibold },

  featuredCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  featuredSeasonIcon: { fontSize: 36 },
  featuredTitle: {
    fontSize: 22,
    fontFamily: FONTS.extrabold,
    letterSpacing: -0.5,
    lineHeight: 27,
    flex: 1,
  },

  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featuredMetaLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featuredLangFlag: { fontSize: 18 },
  featuredMetaText: { fontSize: 12, fontFamily: FONTS.semibold },
  featuredPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 9,
    borderRadius: BORDER_RADIUS.pill,
  },
  featuredPlayText: {
    fontSize: 13,
    fontFamily: FONTS.extrabold,
    color: '#FFFFFF',
  },

  controlsRow: { flexDirection: 'row', gap: SPACING.sm },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.sm,
    ...SHADOWS.xs,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: FONTS.semibold },
  sortBtn: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.xs,
  },

  sortMenu: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.md,
    marginTop: -SPACING.sm,
  },
  sortMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
  },
  sortMenuLabel: { fontSize: 14, fontFamily: FONTS.bold },

  filterScroll: { gap: SPACING.sm, paddingRight: SPACING.xs },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.md,
    paddingVertical: 9,
    borderRadius: BORDER_RADIUS.pill,
    ...SHADOWS.xs,
  },
  filterChipFlag: { fontSize: 15 },
  filterChipText: { fontSize: 13, fontFamily: FONTS.bold },

  sectionRow: { marginBottom: -SPACING.sm },
  sectionLabel: { fontSize: 12, fontFamily: FONTS.medium },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  gridItem: { width: CARD_WIDTH },
  gridCard: {
    borderRadius: BORDER_RADIUS.xxl,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  gridThumb: {
    width: '100%',
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gridSeasonEmoji: {
    fontSize: 46,
    marginBottom: 4,
  },
  gridPlayCircle: {
    position: 'absolute',
    bottom: SPACING.sm,
    right: SPACING.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridBadgeRow: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    flexDirection: 'row',
    gap: 4,
  },
  gridLangBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridAudioBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridInfo: {
    padding: SPACING.md,
    gap: 4,
  },
  gridTitle: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    lineHeight: 18,
    letterSpacing: -0.1,
    minHeight: 36,
  },
  gridMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  gridMetaText: { fontSize: 11, fontFamily: FONTS.medium },

  list: {
    borderRadius: BORDER_RADIUS.xxl,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  listThumb: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  listThumbEmoji: { fontSize: 24 },
  listInfo: { flex: 1, gap: 4 },
  listTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    letterSpacing: -0.1,
  },
  listMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  listLangFlag: { fontSize: 13 },
  listMetaText: { fontSize: 11, fontFamily: FONTS.medium },
  listDot: { width: 3, height: 3, borderRadius: 2 },
  listDivider: { height: 1, marginLeft: 56 + SPACING.md + SPACING.lg },

  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 70,
    gap: SPACING.md,
  },
  emptyEmoji: { fontSize: 60, marginBottom: 4 },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.extrabold,
    letterSpacing: -0.3,
  },
  emptyBody: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 260,
  },
});
