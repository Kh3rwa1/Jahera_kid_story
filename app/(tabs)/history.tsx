import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown, FadeInUp, ZoomIn, FadeIn,
  useSharedValue, useAnimatedStyle, withSpring, interpolate,
} from 'react-native-reanimated';
import { useEntranceSequence, useSpringPress, usePulse, useFloat } from '@/utils/animations';
import { FloatingParticles } from '@/components/FloatingParticles';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getLanguageFlag, getLanguageNativeName } from '@/utils/languageUtils';
import {
  BookOpen,
  Play,
  Search,
  SlidersHorizontal,
  Volume2,
  Sparkles,
  ChevronRight,
  Grid2x2,
  List,
} from 'lucide-react-native';
import { SPACING, SHADOWS, FONTS, LAYOUT, BORDER_RADIUS } from '@/constants/theme';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { MeshBackground } from '@/components/MeshBackground';
import { storyService } from '@/services/database';
import { getRelativeTime, getSeasonPalette } from '@/utils/dateUtils';
import { hapticFeedback } from '@/utils/haptics';
import { talkative } from '@/utils/talkative';
import { Container } from '@/components/Container';
import { BREAKPOINTS } from '@/constants/theme';

// Responsive constants - Denser for premium agency look
const COLUMN_GAP = 12;
const PAGE_PADDING = 20;

type SortOption = 'newest' | 'oldest' | 'language';
type ViewMode = 'grid' | 'list';

function AnimatedFilterChip({ label, flag, active, COLORS, styles, onPress, index }: {
  label: string; flag?: string; active: boolean; COLORS: any; styles: any; onPress: () => void; index: number;
}) {
  const scale = useSharedValue(active ? 1.05 : 1);
  const entrance = useEntranceSequence(index, 140, 50);

  useEffect(() => {
    scale.value = withSpring(active ? 1.05 : 1, { damping: 12 });
  }, [active]);

  const handlePress = () => {
    hapticFeedback.light();
    onPress();
  };

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: interpolate(scale.value, [1, 1.05], [0.9, 1]),
  }));

  return (
    <Animated.View style={[entrance, pressStyle]}>
      <TouchableOpacity
        style={[
          styles.filterChip,
          { 
            backgroundColor: active ? COLORS.primary : COLORS.cardBackground,
            borderColor: active ? COLORS.primary : COLORS.text.light + '15',
            borderWidth: 1,
          }
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {flag && <Text style={styles.filterChipFlag}>{flag}</Text>}
        <Text style={[styles.filterChipText, { color: active ? '#FFF' : COLORS.text.secondary }]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const AnimatedStoryGridCard = React.memo(function AnimatedStoryGridCard({ story, idx, palette, onPress, onLongPress, COLORS, styles }: any) {
  const entrance = useEntranceSequence(idx, 60, 40);
  const { style: springStyle, onPressIn, onPressOut } = useSpringPress();

  return (
    <Animated.View style={[styles.gridItem, entrance]}>
      <Animated.View style={springStyle}>
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
            
            <View style={styles.gridBadgeRow}>
              <View style={styles.gridLangBadge}>
                <Text style={{ fontSize: 13 }}>{getLanguageFlag(story.language_code)}</Text>
              </View>
              {story.audio_url && (
                <View style={[styles.gridAudioBadge, { backgroundColor: 'rgba(0,0,0,0.15)' }]}>
                  <Volume2 size={10} color="#FFF" />
                </View>
              )}
            </View>

            <View style={[styles.gridPlayCircle, { backgroundColor: COLORS.cardBackground + 'E6' }]}>
              <Play size={14} color={COLORS.primary} fill={COLORS.primary} />
            </View>
          </LinearGradient>
          
          <View style={[styles.gridInfo, { backgroundColor: COLORS.cardBackground }]}>
            <Text style={[styles.gridTitle, { color: COLORS.text.primary }]} numberOfLines={2}>
              {story.title}
            </Text>
            <View style={styles.gridMeta}>
              <Text style={[styles.gridMetaText, { color: COLORS.text.secondary }]}>
                {getRelativeTime(story.generated_at || story.created_at)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
});

export default function HistoryScreen() {
  const router = useRouter();
  const { currentTheme } = useTheme();
  const COLORS = currentTheme.colors;
  const { stories, refreshStories, setStories } = useApp();
  const insets = useSafeAreaInsets();
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const { width: winWidth } = useWindowDimensions();
  const isTablet = winWidth >= BREAKPOINTS.tablet;
  const isDesktop = winWidth >= BREAKPOINTS.desktop;

  const styles = useStyles(COLORS, insets, isTablet, isDesktop, winWidth);

  const featuredPulseStyle = usePulse(0.98, 1.02);
  const emptyFloatStyle = useFloat(6, 1500);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshStories();
    setIsRefreshing(false);
  }, [refreshStories]);

  const confirmDelete = useCallback(async () => {
    if (!deleteId) return;
    const success = await storyService.delete(deleteId);
    if (success) setStories(prev => prev.filter(s => s.id !== deleteId));
    setDeleteId(null);
  }, [deleteId, setStories]);

  const handlePlayStory = useCallback(
    (storyTitle: string, storyId: string, languageCode: string) => {
      talkative.speak(`Opening ${storyTitle}`, languageCode || 'en');
      router.push({ pathname: '/story/playback', params: { storyId } });
    },
    [router]
  );

  const languages = useMemo(
    () => Array.from(new Set((stories || []).map(s => s.language_code))),
    [stories]
  );

  const filteredStories = useMemo(() => {
    let result = [...(stories || [])];
    if (selectedLanguage) result = result.filter(s => s.language_code === selectedLanguage);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => s.title.toLowerCase().includes(q));
    }
    switch (sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.generated_at || a.created_at).getTime() - new Date(b.generated_at || b.created_at).getTime());
        break;
      case 'language':
        result.sort((a, b) => a.language_code.localeCompare(b.language_code));
        break;
      default:
        result.sort((a, b) => new Date(b.generated_at || b.created_at).getTime() - new Date(a.generated_at || a.created_at).getTime());
    }
    return result;
  }, [stories, selectedLanguage, searchQuery, sortBy]);

  const featuredStory = useMemo(() => (stories.length > 0 && !searchQuery && !selectedLanguage ? stories[0] : null), [stories, searchQuery, selectedLanguage]);

  return (
    <Container 
      maxWidth 
      gradient 
      gradientColors={COLORS.backgroundGradient}
      safeAreaEdges={['top']}
      scroll
      scrollProps={{
        refreshControl: <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />,
        contentContainerStyle: styles.scroll,
        stickyHeaderIndices: [2]
      }}
    >
      <MeshBackground primaryColor={COLORS.primary} />
      <FloatingParticles count={15} />
        {/* ── View Toggle / Meta (No redundant title) ── */}
        <Animated.View entering={FadeInDown.delay(40).springify()} style={[styles.header, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }]}>
          <Text style={[styles.pageSubtitle, { color: COLORS.text.secondary, marginTop: 0 }]}>
            {stories.length} {stories.length === 1 ? 'Magical Story' : 'Magical Stories'}
          </Text>
          <TouchableOpacity
            style={[styles.viewToggle, { backgroundColor: COLORS.cardBackground + '66', borderColor: COLORS.text.light + '20', borderWidth: 1 }]}
            onPress={() => {
              hapticFeedback.medium();
              setViewMode(v => (v === 'grid' ? 'list' : 'grid'));
            }}
            activeOpacity={0.75}
          >
            {viewMode === 'grid'
              ? <List size={18} color={COLORS.text.primary} />
              : <Grid2x2 size={18} color={COLORS.text.primary} />
            }
          </TouchableOpacity>
        </Animated.View>

        {/* ── Featured / latest story ── */}
        {featuredStory && (
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Animated.View style={featuredPulseStyle}>
              <AnimatedPressable
                onPress={() => handlePlayStory(featuredStory.title, featuredStory.id, featuredStory.language_code)}
                scaleDown={0.96}
                style={styles.featuredWrap}
              >
              <LinearGradient
                colors={getSeasonPalette(featuredStory.season, COLORS.primary, featuredStory.theme).colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.featuredCard}
              >
                <View style={styles.featuredOverlay}>
                  <View style={styles.featuredTop}>
                    <View style={[styles.featuredBadge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                      <Sparkles size={11} color="#FFF" />
                      <Text style={styles.featuredBadgeText}>LATEST ADVENTURE</Text>
                    </View>
                    {featuredStory.audio_url && (
                      <View style={[styles.audioPill, { backgroundColor: 'rgba(0,0,0,0.2)' }]}>
                        <Volume2 size={12} color="#FFF" strokeWidth={2.5} />
                      </View>
                    )}
                  </View>

                  <View style={styles.featuredContent}>
                    <View style={styles.featuredIconContainer}>
                      <Text style={styles.featuredSeasonIcon}>
                        {getSeasonPalette(featuredStory.season, COLORS.primary, featuredStory.theme).emoji}
                      </Text>
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={styles.featuredTitle} numberOfLines={2}>
                        {featuredStory.title}
                      </Text>
                      <View style={styles.featuredMetaLeft}>
                        <Text style={styles.featuredLangFlag}>{getLanguageFlag(featuredStory.language_code)}</Text>
                        <Text style={styles.featuredMetaText}>
                          {getRelativeTime(featuredStory.generated_at || featuredStory.created_at)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.featuredFooter}>
                    <View style={[styles.featuredPlayBtn, { backgroundColor: COLORS.cardBackground }]}>
                      <Play size={14} color={COLORS.primary} fill={COLORS.primary} />
                      <Text style={[styles.featuredPlayText, { color: COLORS.primary }]}>Read Now</Text>
                    </View>
                    {featuredStory.word_count && (
                      <Text style={styles.wordCountText}>{featuredStory.word_count} words</Text>
                    )}
                  </View>
                </View>
              </LinearGradient>
            </AnimatedPressable>
            </Animated.View>
          </Animated.View>
        )}

        {/* ── Search + Filter Strip (Sticky) ── */}
        <View style={styles.controlsStickyWrapper}>
          <Animated.View entering={FadeInDown.delay(140).springify()} style={[styles.controlsRow, { backgroundColor: COLORS.cardBackground + 'B3', padding: 12, borderRadius: 24, marginHorizontal: -4 }]}>
            <View style={[styles.searchBar, { backgroundColor: COLORS.cardBackground }]}>
              <Search size={16} color={COLORS.text.light} strokeWidth={2.5} />
              <TextInput
                style={[styles.searchInput, { color: COLORS.text.primary }]}
                placeholder="Search your stories..."
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
              onPress={() => {
                hapticFeedback.selection();
                setShowSortMenu(v => !v);
              }}
              activeOpacity={0.8}
            >
              <SlidersHorizontal size={18} color={showSortMenu ? '#FFF' : COLORS.primary} strokeWidth={2.5} />
            </TouchableOpacity>
          </Animated.View>

          {/* Language filter chips */}
          {languages.length > 1 && (
            <Animated.View entering={FadeIn.delay(200)}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                {[null, ...languages].map((lang, idx) => {
                  const active = lang === null ? !selectedLanguage : selectedLanguage === lang;
                  return (
                    <AnimatedFilterChip
                      key={lang ?? '__all'}
                      label={lang ? getLanguageNativeName(lang) : 'All Stories'}
                      flag={lang ? getLanguageFlag(lang) : undefined}
                      active={active}
                      COLORS={COLORS}
                      styles={styles}
                      onPress={() => {
                        hapticFeedback.selection();
                        setSelectedLanguage(lang);
                      }}
                      index={idx}
                    />
                  );
                })}
              </ScrollView>
            </Animated.View>
          )}
        </View>

        {/* Sort dropdown */}
        {showSortMenu && (
          <Animated.View entering={FadeIn.duration(200)} style={[styles.sortMenu, { backgroundColor: COLORS.cardBackground, top: languages.length > 1 ? 160 : 70 }]}>
            <View style={styles.sortMenuHeader}>
              <Text style={[styles.sortMenuTitle, { color: COLORS.text.primary }]}>Sort Collection</Text>
            </View>
            {(['newest', 'oldest', 'language'] as SortOption[]).map(opt => {
              const label = opt === 'newest' ? 'Newest Added' : opt === 'oldest' ? 'Oldest Added' : 'By Language';
              const active = sortBy === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.sortMenuItem, active && { backgroundColor: COLORS.primary + '10' }]}
                  onPress={() => {
                    hapticFeedback.medium();
                    setSortBy(opt);
                    setShowSortMenu(false);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.sortMenuLabel, { color: active ? COLORS.primary : COLORS.text.primary, fontFamily: active ? FONTS.displayBold : FONTS.displayMedium }]}>
                    {label}
                  </Text>
                  {active && <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />}
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        )}

        {/* ── Stories ── */}
        {filteredStories.length === 0 ? (
          <Animated.View entering={ZoomIn.delay(100).springify()} style={styles.emptyWrap}>
            <Animated.View style={[styles.emptyIconCircle, { backgroundColor: COLORS.primary + '10' }, emptyFloatStyle]}>
              <Text style={styles.emptyEmoji}>{searchQuery ? '🔍' : '✨'}</Text>
            </Animated.View>
            <Text style={[styles.emptyTitle, { color: COLORS.text.primary }]}>
              {searchQuery ? 'No matches found' : 'Ready for adventure?'}
            </Text>
            <Text style={[styles.emptyBody, { color: COLORS.text.secondary }]}>
              {searchQuery
                ? 'Try a different search term or clear the filter'
                : 'Your magical library is waiting for its first story. Create one now!'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={[styles.emptyAction, { backgroundColor: COLORS.primary }]}
                onPress={() => router.push('/story/generate')}
              >
                <Sparkles size={16} color="#FFF" strokeWidth={2.5} />
                <Text style={styles.emptyActionText}>Create Story</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        ) : viewMode === 'grid' ? (
          <View style={[styles.grid, { gap: COLUMN_GAP }]}>
            {filteredStories.map((story, idx) => {
              const palette = getSeasonPalette(story.season, COLORS.primary, story.theme);
              return (
                <AnimatedStoryGridCard
                  key={story.id}
                  story={story}
                  idx={idx}
                  palette={palette}
                  onPress={() => handlePlayStory(story.title, story.id, story.language_code)}
                  onLongPress={() => {
                    hapticFeedback.warning();
                    setDeleteId(story.id);
                  }}
                  COLORS={COLORS}
                  styles={styles}
                />
              );
            })}
          </View>
        ) : (
          <View style={[styles.list, { backgroundColor: COLORS.cardBackground + '66', borderColor: COLORS.text.light + '20', borderWidth: 1 }]}>
            {filteredStories.map((story, idx) => {
              const palette = getSeasonPalette(story.season, COLORS.primary, story.theme);
              return (
                <Animated.View key={story.id} entering={FadeInUp.delay(60 + idx * 30).springify()}>
                  <AnimatedPressable
                    style={styles.listCard}
                    onPress={() => handlePlayStory(story.title, story.id, story.language_code)}
                    onLongPress={() => {
                      hapticFeedback.warning();
                      setDeleteId(story.id);
                    }}
                    scaleDown={0.98}
                    delayLongPress={500}
                  >
                    <LinearGradient
                      colors={palette.colors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.listThumb}
                    >
                      <Text style={styles.listThumbEmoji}>{palette.emoji}</Text>
                      {story.audio_url && (
                        <View style={styles.listAudioIndicator}>
                          <Volume2 size={8} color="#FFF" />
                        </View>
                      )}
                    </LinearGradient>

                    <View style={styles.listInfo}>
                      <Text style={[styles.listTitle, { color: COLORS.text.primary }]} numberOfLines={1}>
                        {story.title}
                      </Text>
                      <View style={styles.listMeta}>
                        <Text style={styles.listLangFlag}>{getLanguageFlag(story.language_code)}</Text>
                        <Text style={[styles.listMetaText, { color: COLORS.text.secondary }]}>
                          {getRelativeTime(story.generated_at || story.created_at)}
                        </Text>
                        {story.word_count && (
                          <Text style={[styles.listMetaText, { color: COLORS.text.light }]}>
                            · {story.word_count} words
                          </Text>
                        )}
                      </View>
                    </View>

                    <ChevronRight size={16} color={COLORS.text.light} />
                  </AnimatedPressable>

                  {idx < filteredStories.length - 1 && (
                    <View style={[styles.listDivider, { backgroundColor: 'rgba(0,0,0,0.05)' }]} />
                  )}
                </Animated.View>
              );
            })}
          </View>
        )}
      <ConfirmDialog
        visible={!!deleteId}
        title="Remove Story?"
        message="This will permanently delete this magical story from your library."
        confirmText="Remove"
        cancelText="Keep Story"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        destructive
      />
    </Container>
  );
}

const useStyles = (C: any, insets: any, isTablet: boolean, isDesktop: boolean, winWidth: number) => {
  return useMemo(() => {
    const PADDING = isTablet ? 32 : 20;
    const GAP = isTablet ? 16 : 12;
    
    // Grid Calculations
    const contentWidth = Math.min(winWidth, 1000) - (PADDING * 2);
    let nCols = 2;
    if (isDesktop) nCols = 4;
    else if (isTablet) nCols = 3;
    
    const cardW = (contentWidth - (GAP * (nCols - 1))) / nCols;
    const cardH = cardW * 1.35;

    return StyleSheet.create({
      container: { flex: 1 },
      scroll: {
        paddingHorizontal: PADDING,
        paddingTop: SPACING.md,
        paddingBottom: 140,
        gap: SPACING.xl,
      },

      header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
      },
      titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
      titleIcon: {
        width: isTablet ? 48 : 40, height: isTablet ? 48 : 40, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
      },
      pageTitle: {
        fontSize: isTablet ? 36 : 28,
        fontFamily: FONTS.display,
        letterSpacing: -0.5,
      },
      pageSubtitle: {
        fontSize: isTablet ? 16 : 14,
        fontFamily: FONTS.medium,
        marginTop: -2,
        opacity: 0.8,
      },
      viewToggle: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.sm,
      },

      featuredWrap: { 
        borderRadius: isTablet ? 40 : 32, 
        overflow: 'hidden', 
        ...SHADOWS.md,
      },
      featuredCard: {
        minHeight: isTablet ? 260 : 180,
        position: 'relative',
      },
      featuredOverlay: {
        flex: 1,
        padding: isTablet ? SPACING.xxxl : SPACING.xl,
        backgroundColor: 'rgba(0,0,0,0.05)',
        justifyContent: 'center',
        gap: isTablet ? SPACING.md : 0,
      },
      featuredTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      featuredBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: BORDER_RADIUS.pill,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
      },
      featuredBadgeText: {
        fontSize: 13,
        fontFamily: FONTS.displayBold,
        color: '#FFF',
        letterSpacing: 0.8,
      },
      audioPill: {
        width: 32, height: 32, 
        borderRadius: 16,
        alignItems: 'center', justifyContent: 'center',
      },
      featuredContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: isTablet ? SPACING.xl : SPACING.lg,
        marginTop: 12,
      },
      featuredIconContainer: {
        width: isTablet ? 80 : 64, height: isTablet ? 80 : 64,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
      },
      featuredSeasonIcon: { fontSize: isTablet ? 40 : 32 },
      featuredTitle: {
        fontSize: isTablet ? 32 : 24,
        fontFamily: FONTS.displayBold,
        color: '#FFF',
        letterSpacing: -0.3,
        lineHeight: isTablet ? 36 : 28,
      },
      featuredMetaLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
      featuredLangFlag: { fontSize: isTablet ? 22 : 18 },
      featuredMetaText: { fontSize: isTablet ? 15 : 13, fontFamily: FONTS.displayMedium, color: 'rgba(255,255,255,0.9)' },
      
      featuredFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 16,
      },
      featuredPlayBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 16,
        ...SHADOWS.sm,
      },
      featuredPlayText: {
        fontSize: 15,
        fontFamily: FONTS.displayBold,
      },
      wordCountText: {
        fontSize: 14,
        fontFamily: FONTS.displayMedium,
        color: 'rgba(255,255,255,0.9)',
      },

      controlsStickyWrapper: {
        gap: SPACING.md,
        zIndex: 10,
        width: '100%',
        maxWidth: LAYOUT.maxWidth,
        alignSelf: 'center',
      },
      controlsRow: { 
        flexDirection: 'row', 
        gap: SPACING.sm,
        ...SHADOWS.sm,
      },
      searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        paddingHorizontal: 18,
        borderRadius: 18,
        gap: 12,
        borderWidth: 2,
        borderColor: C.primary + '30',
      },
      searchInput: { flex: 1, fontSize: 16, fontFamily: FONTS.displayMedium },
      sortBtn: {
        width: 56,
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
      },

      sortMenu: {
        position: 'absolute',
        right: 0,
        width: 240,
        borderRadius: 24,
        overflow: 'hidden',
        ...SHADOWS.xl,
        zIndex: 100,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
      },
      sortMenuHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.03)' },
      sortMenuTitle: { fontSize: 12, fontFamily: FONTS.displayBold, color: '#999', textTransform: 'uppercase', letterSpacing: 1 },
      sortMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
      },
      sortMenuLabel: { fontSize: 15 },
      dot: { width: 6, height: 6, borderRadius: 3 },

      filterScroll: { gap: 12, paddingBottom: 4 },
      filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 18,
        ...SHADOWS.sm,
      },
      filterChipFlag: { fontSize: 18 },
      filterChipText: { fontSize: 14, fontFamily: FONTS.displayBold },

      grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
      },
      gridItem: { 
        marginBottom: GAP,
        width: cardW,
      },
      gridCard: {
        borderRadius: isTablet ? 32 : 28,
        overflow: 'hidden',
        height: cardH,
        ...SHADOWS.md,
      },
      gridThumb: {
        width: '100%',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      },
      gridSeasonEmoji: {
        fontSize: isTablet ? 76 : 64,
        marginBottom: 4,
      },
      gridPlayCircle: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.md,
      },
      gridBadgeRow: {
        position: 'absolute',
        top: 12,
        left: 12,
        flexDirection: 'row',
        gap: 6,
      },
      gridLangBadge: {
        width: 32,
        height: 32,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
      },
      gridAudioBadge: {
        width: 32,
        height: 32,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
      },
      gridInfo: {
        padding: isTablet ? 18 : 14,
        gap: 4,
      },
      gridTitle: {
        fontSize: isTablet ? 16 : 14,
        fontFamily: FONTS.displayBold,
        lineHeight: isTablet ? 20 : 18,
        letterSpacing: -0.2,
        minHeight: isTablet ? 40 : 36,
      },
      gridMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
      gridMetaText: { fontSize: 14, fontFamily: FONTS.displayMedium, opacity: 0.7 },

      list: {
        borderRadius: 32,
        overflow: 'hidden',
        ...SHADOWS.sm,
        marginTop: 8,
      },
      listCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: isTablet ? 20 : 16,
        gap: 16,
      },
      listThumb: {
        width: isTablet ? 80 : 64,
        height: isTablet ? 80 : 64,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
      },
      listThumbEmoji: { fontSize: isTablet ? 36 : 28 },
      listAudioIndicator: {
        position: 'absolute',
        bottom: 2, right: 2,
        width: 16, height: 16, borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center', justifyContent: 'center',
      },
      listInfo: { flex: 1, gap: 4 },
      listTitle: { fontSize: isTablet ? 18 : 16, fontFamily: FONTS.displayBold },
      listMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
      listLangFlag: { fontSize: isTablet ? 18 : 16 },
      listMetaText: { fontSize: 12, fontFamily: FONTS.displayMedium },
      listDivider: { height: 1, marginHorizontal: 20 },
      
      emptyWrap: {
        paddingVertical: 60,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      },
      emptyIconCircle: {
        width: 100, height: 100, borderRadius: 50,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 8,
      },
      emptyEmoji: { fontSize: 44 },
      emptyTitle: { fontSize: 24, fontFamily: FONTS.displayBold },
      emptyBody: {
        fontSize: 16,
        fontFamily: FONTS.medium,
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 300,
      },
      emptyAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 18,
        marginTop: 8,
        ...SHADOWS.md,
      },
      emptyActionText: { color: '#FFF', fontSize: 16, fontFamily: FONTS.displayBold },
    });
  }, [C, isTablet, isDesktop, winWidth]);
};
