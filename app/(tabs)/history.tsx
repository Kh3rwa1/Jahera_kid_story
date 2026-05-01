import { AnimatedPressable } from '@/components/AnimatedPressable';
import { getThemeIcon } from '@/utils/themeIcons';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { SafeScreen, SafeScrollView } from '@/components/layout';
import { ErrorState } from '@/components/ErrorState';
import { FloatingParticles } from '@/components/FloatingParticles';
import { LoadingSkeleton, Skeleton } from '@/components/LoadingSkeleton';
import { MeshBackground } from '@/components/MeshBackground';
import { FONTS, LAYOUT, SHADOWS, SPACING } from '@/constants/theme';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { useScreenClass } from '@/hooks/useScreenClass';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useUI } from '@/contexts/UIContext';
import { storyService } from '@/services/database';
import {
  useEntranceSequence,
  useFloat,
  usePulse,
  useSpringPress,
} from '@/utils/animations';
import { getRelativeTime, getSeasonPalette } from '@/utils/dateUtils';
import { hapticFeedback } from '@/utils/haptics';
import { getLanguageFlag, getLanguageNativeName } from '@/utils/languageUtils';
import { talkative } from '@/utils/talkative';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronRight,
  Grid2x2,
  List,
  Play,
  Search,
  SlidersHorizontal,
  Sparkles,
  Volume2,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  ZoomIn,
} from 'react-native-reanimated';

// ... layout constants removed to use dynamic theme-aware values ...

type SortOption = 'newest' | 'oldest' | 'language';
type ViewMode = 'grid' | 'list';
type ThemeColors = ReturnType<typeof useTheme>['currentTheme']['colors'];
type StoryItem = ReturnType<typeof useApp>['stories'][number];
type SeasonPalette = ReturnType<typeof getSeasonPalette>;
type HistoryStyles = ReturnType<typeof useStyles>;

function AnimatedFilterChip({
  label,
  flag,
  active,
  COLORS,
  styles,
  onPress,
  index,
}: Readonly<{
  label: string;
  flag?: string;
  active: boolean;
  COLORS: ThemeColors;
  styles: HistoryStyles;
  onPress: () => void;
  index: number;
}>) {
  const scale = useSharedValue(active ? 1.05 : 1);
  const entrance = useEntranceSequence(index, 140, 50);

  useEffect(() => {
    scale.value = withSpring(active ? 1.05 : 1, { damping: 12 });
  }, [active, scale]);

  const handlePress = () => {
    hapticFeedback.light();
    onPress();
  };

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: interpolate(scale.value, [1, 1.05], [0.9, 1]),
  }));

  return (
    <Animated.View style={entrance}>
      <Animated.View style={pressStyle}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            {
              backgroundColor: active ? COLORS.primary : COLORS.cardBackground,
              borderColor: active ? COLORS.primary : COLORS.text.light + '15',
              borderWidth: 1,
            },
          ]}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          {flag && <Text style={styles.filterChipFlag}>{flag}</Text>}
          <Text
            style={[
              styles.filterChipText,
              { color: active ? '#FFF' : COLORS.text.secondary },
            ]}
          >
            {label}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const AnimatedStoryGridCard = React.memo(function AnimatedStoryGridCard({
  story,
  idx,
  palette,
  onPress,
  onLongPress,
  COLORS,
  styles,
}: Readonly<{
  story: StoryItem;
  idx: number;
  palette: SeasonPalette;
  onPress: () => void;
  onLongPress: () => void;
  COLORS: ThemeColors;
  styles: HistoryStyles;
}>) {
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
          <LinearGradient
            colors={palette.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gridArt}
          >
            {/* Book Spine Accent */}
            <View
              style={[styles.gridSpine, { backgroundColor: palette.accent }]}
            />

            {/* Magical Aura */}
            <View
              style={[
                styles.gridAura,
                { backgroundColor: palette.accent + '30' },
              ]}
            />
            <View
              style={[
                styles.gridAuraInner,
                { backgroundColor: '#FFF', opacity: 0.3 },
              ]}
            />

            {(() => {
              const ti = getThemeIcon(story.theme);
              const TIcon = ti.icon;
              return (
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TIcon
                    size={36}
                    color="rgba(255,255,255,0.9)"
                    strokeWidth={1.5}
                  />
                </View>
              );
            })()}

            <View style={styles.gridBadgesTop}>
              <View style={styles.gridGlassBadge}>
                <Text style={{ fontSize: 13 }}>
                  {getLanguageFlag(story.language_code)}
                </Text>
              </View>
            </View>

            {story.audio_url && (
              <View style={styles.gridPlayBtn}>
                <Volume2 size={12} color="#FFF" fill="#FFF" />
              </View>
            )}
          </LinearGradient>

          <View style={styles.gridInfo}>
            <Text
              style={[styles.gridTitle, { color: COLORS.text.primary }]}
              numberOfLines={2}
            >
              {story.title}
            </Text>
            <View style={styles.gridMeta}>
              <View
                style={[
                  styles.gridSeasonTag,
                  {
                    backgroundColor: palette.colors[0] + '15',
                    borderColor: palette.accent + '20',
                  },
                ]}
              >
                <Text
                  style={[styles.gridSeasonTagText, { color: palette.accent }]}
                >
                  {story.season || 'Story'}
                </Text>
              </View>
              <Text style={[styles.gridMetaText, { color: COLORS.text.light }]}>
                {getRelativeTime(story.generated_at || story.created_at)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
});

const filterAndSortStories = (
  stories: StoryItem[],
  selectedLanguage: string | null,
  searchQuery: string,
  sortBy: SortOption,
): StoryItem[] => {
  let result = [...stories];
  if (selectedLanguage)
    result = result.filter((s) => s.language_code === selectedLanguage);
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter((s) => s.title.toLowerCase().includes(q));
  }
  switch (sortBy) {
    case 'oldest':
      result.sort(
        (a, b) =>
          new Date(a.generated_at || a.created_at).getTime() -
          new Date(b.generated_at || b.created_at).getTime(),
      );
      break;
    case 'language':
      result.sort((a, b) => a.language_code.localeCompare(b.language_code));
      break;
    default:
      result.sort(
        (a, b) =>
          new Date(b.generated_at || b.created_at).getTime() -
          new Date(a.generated_at || a.created_at).getTime(),
      );
  }
  return result;
};

export default function HistoryScreen() {
  const router = useRouter();
  const { currentTheme } = useTheme();
  const COLORS = currentTheme.colors;
  const { profile, stories, refreshStories, setStories } = useApp();
  const { wakeUI } = useUI();
  const screen = useScreenClass();
  const tabBarPadding = useTabBarHeight();
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const { isLoading, error, refreshAll } = useApp();

  const winWidth = screen.width;
  const isTablet = screen.isTablet;
  const tabBarBottomOffset = Math.max(
    SPACING.xl,
    tabBarPadding - screen.insets.bottom,
  );

  const styles = useStyles(COLORS, isTablet, winWidth);

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
    if (success) setStories((prev) => prev.filter((s) => s.id !== deleteId));
    setDeleteId(null);
  }, [deleteId, setStories]);

  const handlePlayStory = useCallback(
    (storyTitle: string, storyId: string, languageCode: string) => {
      talkative.speak(`Opening ${storyTitle}`, languageCode || 'en');
      router.push({ pathname: '/story/playback', params: { storyId } });
    },
    [router],
  );

  const languages = useMemo(
    () => Array.from(new Set((stories || []).map((s) => s.language_code))),
    [stories],
  );

  const filteredStories = useMemo(
    () =>
      filterAndSortStories(
        stories || [],
        selectedLanguage,
        searchQuery,
        sortBy,
      ),
    [stories, selectedLanguage, searchQuery, sortBy],
  );

  const featuredStory = useMemo(
    () =>
      (stories || []).length > 0 && !searchQuery && !selectedLanguage
        ? stories[0]
        : null,
    [stories, searchQuery, selectedLanguage],
  );

  if (isLoading) {
    return (
      <SafeScrollView
        backgroundColor={COLORS.background}
        edges={['top', 'bottom']}
        maxWidth={LAYOUT.maxWidth}
        padded={false}
        bottomOffset={tabBarBottomOffset}
        contentContainerStyle={styles.scroll}
      >
        <MeshBackground primaryColor={COLORS.primary} />
        <FloatingParticles count={5} />

        <View style={styles.header}>
          <Skeleton
            width={180}
            height={32}
            borderRadius={8}
            color="rgba(0,0,0,0.08)"
          />
          <Skeleton
            width={44}
            height={44}
            borderRadius={14}
            color="rgba(0,0,0,0.05)"
          />
        </View>

        {/* Featured Skeleton */}
        <View
          style={[
            styles.featuredWrap,
            { backgroundColor: 'rgba(255,255,255,0.4)' },
          ]}
        >
          <Skeleton
            width="100%"
            height={160}
            borderRadius={32}
            color="rgba(0,0,0,0.05)"
          />
          <View style={{ padding: 20, gap: 10 }}>
            <Skeleton
              width="85%"
              height={24}
              borderRadius={6}
              color="rgba(0,0,0,0.08)"
            />
            <Skeleton
              width="40%"
              height={16}
              borderRadius={6}
              color="rgba(0,0,0,0.04)"
            />
          </View>
        </View>

        <View style={{ marginBottom: 8 }}>
          <Skeleton
            width="100%"
            height={52}
            borderRadius={16}
            color="rgba(0,0,0,0.05)"
          />
        </View>

        <View style={{ marginBottom: 4, flexDirection: 'row', gap: 10 }}>
          <Skeleton
            width={100}
            height={36}
            borderRadius={18}
            color="rgba(0,0,0,0.05)"
          />
          <Skeleton
            width={100}
            height={36}
            borderRadius={18}
            color="rgba(0,0,0,0.05)"
          />
          <Skeleton
            width={100}
            height={36}
            borderRadius={18}
            color="rgba(0,0,0,0.05)"
          />
        </View>

        <LoadingSkeleton
          type={viewMode === 'grid' ? 'grid' : 'list'}
          count={6}
        />
      </SafeScrollView>
    );
  }

  if (error) {
    return (
      <SafeScreen
        backgroundColor={COLORS.background}
        edges={['top', 'bottom']}
        maxWidth={LAYOUT.maxWidth}
        padded={false}
        contentStyle={styles.screenContent}
      >
        <MeshBackground primaryColor={COLORS.primary} />
        <ErrorState
          type="general"
          title="Oopsy Daisy!"
          message={error}
          onRetry={refreshAll}
          onGoHome={() => router.replace('/')}
        />
      </SafeScreen>
    );
  }

  return (
    <SafeScrollView
      backgroundColor={COLORS.background}
      edges={['top', 'bottom']}
      maxWidth={LAYOUT.maxWidth}
      padded={false}
      bottomOffset={tabBarBottomOffset}
      onScroll={wakeUI}
      scrollEventThrottle={16}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={COLORS.primary}
        />
      }
      contentContainerStyle={styles.scroll}
      stickyHeaderIndices={[3]} // Mesh(0), Particles(1), HeroWrap(2), Controls(3)
    >
      <MeshBackground primaryColor={COLORS.primary} />
      <FloatingParticles count={5} />

      {/* Hero Section: Header + Featured */}
      <View style={{ gap: SPACING.xl }}>
        <Animated.View
          entering={FadeInDown.delay(40).springify()}
          style={styles.header}
        >
          <View style={styles.titleRow}>
            <View
              style={[
                styles.titleIcon,
                { backgroundColor: COLORS.primary + '15' },
              ]}
            >
              <Sparkles size={24} color={COLORS.primary} strokeWidth={2.5} />
            </View>
            <View>
              <Text style={[styles.pageTitle, { color: COLORS.text.primary }]}>
                Magical Library
              </Text>
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.countBadge,
                    { backgroundColor: COLORS.primary + '12' },
                  ]}
                >
                  <Text
                    style={[styles.countBadgeText, { color: COLORS.primary }]}
                  >
                    {stories.length} {stories.length === 1 ? 'Book' : 'Books'}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.pageSubtitle,
                    { color: COLORS.text.secondary },
                  ]}
                >
                  Your collection of wonders
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.viewToggle,
              {
                backgroundColor: COLORS.cardBackground + '80',
                borderColor: COLORS.text.light + '15',
                borderWidth: 1,
              },
            ]}
            onPress={() => {
              hapticFeedback.medium();
              setViewMode((v) => (v === 'grid' ? 'list' : 'grid'));
            }}
            activeOpacity={0.75}
          >
            {viewMode === 'grid' ? (
              <List size={20} color={COLORS.primary} strokeWidth={2.5} />
            ) : (
              <Grid2x2 size={20} color={COLORS.primary} strokeWidth={2.5} />
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Featured / latest story */}
        {featuredStory && (
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Animated.View style={featuredPulseStyle}>
              <AnimatedPressable
                onPress={() =>
                  handlePlayStory(
                    featuredStory.title,
                    featuredStory.id,
                    featuredStory.language_code,
                  )
                }
                scaleDown={0.96}
                style={styles.featuredWrap}
              >
                <LinearGradient
                  colors={
                    [COLORS.primary, COLORS.primaryDark] as [string, string]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.featuredCard}
                >
                  {/* Top Section: Visual */}
                  <View style={styles.featuredArtSection}>
                    <View
                      style={[
                        styles.featuredSpine,
                        { backgroundColor: '#FFF', opacity: 0.4 },
                      ]}
                    />

                    {/* Layered Epic Aura */}
                    <View
                      style={[
                        styles.featuredAura,
                        { backgroundColor: COLORS.primary + '50' },
                      ]}
                    />
                    <View
                      style={[
                        styles.featuredAuraOuter,
                        { backgroundColor: '#FFF', opacity: 0.2 },
                      ]}
                    />

                    {(() => {
                      const ti = getThemeIcon(featuredStory.theme);
                      const TIcon = ti.icon;
                      return (
                        <View
                          style={{
                            width: 80,
                            height: 80,
                            borderRadius: 40,
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <TIcon
                            size={44}
                            color="rgba(255,255,255,0.9)"
                            strokeWidth={1.5}
                          />
                        </View>
                      );
                    })()}

                    <View style={styles.featuredBadges}>
                      <View style={styles.featuredHeroPill}>
                        <Sparkles size={12} color="#FFF" strokeWidth={2.5} />
                        <Text style={styles.featuredHeroPillText}>
                          LATEST ADVENTURE
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Bottom Section: Info */}
                  <View
                    style={[
                      styles.featuredBodySection,
                      { backgroundColor: COLORS.cardBackground },
                    ]}
                  >
                    <View style={styles.featuredTitleRow}>
                      <Text
                        style={[
                          styles.featuredTitle,
                          { color: COLORS.text.primary },
                        ]}
                        numberOfLines={2}
                      >
                        {featuredStory.title}
                      </Text>
                      <View style={styles.featuredAudioBox}>
                        {featuredStory.audio_url && (
                          <Volume2
                            size={24}
                            color={COLORS.primary}
                            fill={COLORS.primary + '20'}
                          />
                        )}
                      </View>
                    </View>

                    <View style={styles.featuredMetaInfo}>
                      <View style={styles.featuredLangBox}>
                        <Text style={styles.featuredFlag}>
                          {getLanguageFlag(featuredStory.language_code)}
                        </Text>
                        <Text
                          style={[
                            styles.featuredTime,
                            { color: COLORS.text.light },
                          ]}
                        >
                          {getRelativeTime(
                            featuredStory.generated_at ||
                              featuredStory.created_at,
                          )}
                        </Text>
                      </View>
                      <View style={styles.featuredStats}>
                        <View
                          style={[
                            styles.featuredStatPill,
                            { backgroundColor: COLORS.primary + '08' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.featuredStatText,
                              { color: COLORS.primary },
                            ]}
                          >
                            {featuredStory.word_count || 0} words
                          </Text>
                        </View>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.featuredBtn,
                        { backgroundColor: COLORS.primary },
                      ]}
                      onPress={() =>
                        handlePlayStory(
                          featuredStory.title,
                          featuredStory.id,
                          featuredStory.language_code,
                        )
                      }
                    >
                      <LinearGradient
                        colors={['rgba(255,255,255,0.2)', 'rgba(0,0,0,0)']}
                        style={StyleSheet.absoluteFill}
                      />
                      <Play size={18} color="#FFF" fill="#FFF" />
                      <Text style={styles.featuredBtnText}>READ NOW</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </AnimatedPressable>
            </Animated.View>
          </Animated.View>
        )}
      </View>

      {/* Search + Filter Strip (Sticky) */}
      <View style={styles.controlsStickyWrapper}>
        <Animated.View
          entering={FadeInDown.delay(140).springify()}
          style={[
            styles.controlsRow,
            { backgroundColor: COLORS.cardBackground + 'D9' },
          ]}
        >
          <View
            style={[
              styles.searchBar,
              { backgroundColor: COLORS.cardBackground + '80' },
            ]}
          >
            <Search size={18} color={COLORS.primary} strokeWidth={2.5} />
            <TextInput
              style={[styles.searchInput, { color: COLORS.text.primary }]}
              placeholder="Search magical tales..."
              placeholderTextColor={COLORS.text.light}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text
                  style={{
                    fontSize: 12,
                    color: COLORS.text.light,
                    fontFamily: FONTS.displayBold,
                  }}
                >
                  CLEAR
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.sortBtn,
              {
                backgroundColor: showSortMenu
                  ? COLORS.primary
                  : COLORS.cardBackground + '80',
                borderColor: COLORS.primary + '20',
                borderWidth: 1,
              },
            ]}
            onPress={() => {
              hapticFeedback.selection();
              setShowSortMenu((v) => !v);
            }}
            activeOpacity={0.8}
          >
            <SlidersHorizontal
              size={20}
              color={showSortMenu ? '#FFF' : COLORS.primary}
              strokeWidth={2.5}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Language filter chips */}
        {languages.length > 1 && (
          <Animated.View entering={FadeIn.delay(200)}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {[null, ...languages].map((lang, idx) => {
                const active =
                  lang === null ? !selectedLanguage : selectedLanguage === lang;
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
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[
            styles.sortMenu,
            {
              backgroundColor: COLORS.cardBackground,
              top: languages.length > 1 ? 160 : 70,
            },
          ]}
        >
          <View style={styles.sortMenuHeader}>
            <Text
              style={[styles.sortMenuTitle, { color: COLORS.text.primary }]}
            >
              Sort Collection
            </Text>
          </View>
          {(['newest', 'oldest', 'language'] as SortOption[]).map((opt) => {
            let label = 'By Language';
            if (opt === 'newest') label = 'Newest Added';
            else if (opt === 'oldest') label = 'Oldest Added';
            const active = sortBy === opt;
            return (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.sortMenuItem,
                  active && { backgroundColor: COLORS.primary + '10' },
                ]}
                onPress={() => {
                  hapticFeedback.medium();
                  setSortBy(opt);
                  setShowSortMenu(false);
                }}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.sortMenuLabel,
                    {
                      color: active ? COLORS.primary : COLORS.text.primary,
                      fontFamily: active
                        ? FONTS.displayBold
                        : FONTS.displayMedium,
                    },
                  ]}
                >
                  {label}
                </Text>
                {active && (
                  <View
                    style={[styles.dot, { backgroundColor: COLORS.primary }]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      )}

      {/* Stories */}
      {filteredStories.length === 0 ? (
        <Animated.View
          entering={ZoomIn.delay(100).springify()}
          style={styles.emptyWrap}
        >
          <Animated.View
            style={[
              styles.emptyIconCircle,
              { backgroundColor: COLORS.primary + '10' },
              emptyFloatStyle,
            ]}
          >
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
              onPress={() =>
                router.push({
                  pathname: '/story/generate',
                  params: {
                    profileId: profile?.id,
                    languageCode: profile?.primary_language,
                  },
                })
              }
            >
              <Sparkles size={16} color="#FFF" strokeWidth={2.5} />
              <Text style={styles.emptyActionText}>Create Story</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <View
              key={`grid-${styles.gridItem.width}`}
              style={[styles.grid, { gap: styles.gridItem.marginBottom - 16 }]}
            >
              {filteredStories.map((story, idx) => {
                const palette = getSeasonPalette(
                  story.season,
                  COLORS.primary,
                  story.theme,
                );
                return (
                  <AnimatedStoryGridCard
                    key={story.id}
                    story={story}
                    idx={idx}
                    palette={palette}
                    onPress={() =>
                      handlePlayStory(
                        story.title,
                        story.id,
                        story.language_code,
                      )
                    }
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
            <View
              style={[
                styles.list,
                {
                  backgroundColor: COLORS.cardBackground + '66',
                  borderColor: COLORS.text.light + '20',
                  borderWidth: 1,
                },
              ]}
            >
              {filteredStories.map((story, idx) => {
                const palette = getSeasonPalette(
                  story.season,
                  COLORS.primary,
                  story.theme,
                );
                return (
                  <Animated.View
                    key={story.id}
                    entering={FadeInUp.delay(60 + idx * 30).springify()}
                  >
                    <AnimatedPressable
                      style={styles.listCard}
                      onPress={() =>
                        handlePlayStory(
                          story.title,
                          story.id,
                          story.language_code,
                        )
                      }
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
                        {(() => {
                          const ti = getThemeIcon(story.theme);
                          const TIcon = ti.icon;
                          return (
                            <TIcon
                              size={24}
                              color="rgba(255,255,255,0.9)"
                              strokeWidth={1.5}
                            />
                          );
                        })()}
                        {story.audio_url && (
                          <View style={styles.listAudioIndicator}>
                            <Volume2 size={8} color="#FFF" />
                          </View>
                        )}
                      </LinearGradient>

                      <View style={styles.listInfo}>
                        <Text
                          style={[
                            styles.listTitle,
                            { color: COLORS.text.primary },
                          ]}
                          numberOfLines={1}
                        >
                          {story.title}
                        </Text>
                        <View style={styles.listMeta}>
                          <Text style={styles.listLangFlag}>
                            {getLanguageFlag(story.language_code)}
                          </Text>
                          <Text
                            style={[
                              styles.listMetaText,
                              { color: COLORS.text.secondary },
                            ]}
                          >
                            {getRelativeTime(
                              story.generated_at || story.created_at,
                            )}
                          </Text>
                          {story.word_count && (
                            <Text
                              style={[
                                styles.listMetaText,
                                { color: COLORS.text.light },
                              ]}
                            >
                              · {story.word_count} words
                            </Text>
                          )}
                        </View>
                      </View>

                      <ChevronRight size={16} color={COLORS.text.light} />
                    </AnimatedPressable>

                    {idx < filteredStories.length - 1 && (
                      <View
                        style={[
                          styles.listDivider,
                          { backgroundColor: 'rgba(0,0,0,0.05)' },
                        ]}
                      />
                    )}
                  </Animated.View>
                );
              })}
            </View>
          )}
        </>
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
    </SafeScrollView>
  );
}

/* ── Style Builders ─────────────────────────────────────────────────── */

const buildLayoutStyles = (PADDING: number) => ({
  container: { flex: 1 } as const,
  screenContent: {
    flex: 1,
    paddingHorizontal: PADDING,
  },
  scroll: {
    paddingHorizontal: PADDING,
    paddingTop: SPACING.md,
    gap: SPACING.xl,
  },
});

const buildHeaderStyles = (isTablet: boolean) => ({
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: SPACING.lg,
  },
  titleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
  },
  titleIcon: {
    width: isTablet ? 60 : 52,
    height: isTablet ? 60 : 52,
    borderRadius: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...SHADOWS.sm,
  },
  pageTitle: {
    fontSize: isTablet ? 34 : 26,
    fontFamily: FONTS.displayBold,
    letterSpacing: -0.5,
  },
  badgeRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginTop: 2,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  countBadgeText: {
    fontSize: 10,
    fontFamily: FONTS.displayBold,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  pageSubtitle: {
    fontSize: isTablet ? 14 : 12,
    fontFamily: FONTS.displayMedium,
    opacity: 0.6,
  },
  viewToggle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...SHADOWS.sm,
  },
});

const buildFeaturedStyles = (isTablet: boolean) => ({
  featuredWrap: {
    borderRadius: 32,
    overflow: 'hidden' as const,
    ...SHADOWS.xl,
    marginBottom: SPACING.md,
  },
  featuredCard: {
    minHeight: isTablet ? 300 : 260,
  },
  featuredArtSection: {
    height: isTablet ? 180 : 150,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  featuredSpine: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    width: 8,
    zIndex: 10,
  },
  featuredAura: {
    position: 'absolute' as const,
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.4,
  },
  featuredAuraOuter: {
    position: 'absolute' as const,
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  featuredLargeEmoji: {
    fontSize: isTablet ? 90 : 72,
    zIndex: 2,
    ...SHADOWS.md,
  },
  featuredBadges: {
    position: 'absolute' as const,
    top: 16,
    left: 20,
    zIndex: 3,
  },
  featuredHeroPill: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  featuredHeroPillText: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: FONTS.displayBold,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  featuredBodySection: {
    padding: 24,
    gap: 16,
  },
  featuredTitleRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  featuredTitle: {
    flex: 1,
    fontSize: isTablet ? 28 : 24,
    fontFamily: FONTS.displayBold,
    letterSpacing: -0.8,
    lineHeight: isTablet ? 32 : 28,
  },
  featuredAudioBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.03)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  featuredMetaInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  featuredLangBox: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  featuredFlag: { fontSize: 22 },
  featuredTime: {
    fontSize: 14,
    fontFamily: FONTS.displayMedium,
    opacity: 0.5,
  },
  featuredStats: {
    flexDirection: 'row' as const,
  },
  featuredStatPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  featuredStatText: {
    fontSize: 12,
    fontFamily: FONTS.displayBold,
    textTransform: 'uppercase' as const,
  },
  featuredBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 12,
    height: 56,
    borderRadius: 18,
    ...SHADOWS.lg,
    marginTop: 8,
    overflow: 'hidden' as const,
  },
  featuredBtnText: {
    color: '#FFF',
    fontSize: 17,
    fontFamily: FONTS.displayBold,
    letterSpacing: 1,
  },
});

const buildControlStyles = (_C: ThemeColors) => ({
  controlsStickyWrapper: {
    gap: SPACING.md,
    zIndex: 10,
    width: '100%' as const,
    maxWidth: LAYOUT.maxWidth,
    alignSelf: 'center' as const,
    marginBottom: SPACING.sm,
  },
  controlsRow: {
    flexDirection: 'row' as const,
    gap: SPACING.sm,
    padding: 12,
    borderRadius: 24,
    ...SHADOWS.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.displayMedium,
  },
  sortBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...SHADOWS.sm,
  },
  sortMenu: {
    position: 'absolute' as const,
    right: 0,
    width: 240,
    borderRadius: 24,
    overflow: 'hidden' as const,
    ...SHADOWS.xl,
    zIndex: 100,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  sortMenuHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  sortMenuTitle: {
    fontSize: 12,
    fontFamily: FONTS.displayBold,
    color: '#999',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  sortMenuItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: 16,
  },
  sortMenuLabel: { fontSize: 15 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  filterScroll: { gap: 10, paddingBottom: 4, paddingHorizontal: 2 },
  filterChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    ...SHADOWS.sm,
  },
  filterChipFlag: { fontSize: 16 },
  filterChipText: { fontSize: 13, fontFamily: FONTS.displayBold },
});

const buildGridStyles = (
  isTablet: boolean,
  GAP: number,
  cardW: number,
  cardH: number,
) => ({
  grid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    marginTop: 8,
    width: '100%' as const,
    gap: GAP,
  },
  gridItem: {
    marginBottom: GAP + 16,
    width: cardW,
  },
  gridCard: {
    borderRadius: isTablet ? 32 : 28,
    overflow: 'hidden' as const,
    height: cardH,
    ...SHADOWS.md,
  },
  gridArt: {
    height: cardH * 0.58,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  gridSpine: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    zIndex: 10,
  },
  gridAura: {
    position: 'absolute' as const,
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.4,
  },
  gridAuraInner: {
    position: 'absolute' as const,
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  gridEmoji: {
    fontSize: isTablet ? 72 : 58,
    zIndex: 2,
    ...SHADOWS.sm,
  },
  gridBadgesTop: {
    position: 'absolute' as const,
    top: 12,
    left: 14,
    zIndex: 3,
  },
  gridGlassBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  gridPlayBtn: {
    position: 'absolute' as const,
    bottom: 12,
    right: 12,
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...SHADOWS.sm,
    zIndex: 3,
  },
  gridInfo: {
    padding: 16,
    flex: 1,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.01)',
  },
  gridTitle: {
    fontSize: isTablet ? 17 : 14.5,
    fontFamily: FONTS.displayBold,
    lineHeight: isTablet ? 22 : 19,
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  gridMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  gridSeasonTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  gridSeasonTagText: {
    fontSize: 10,
    fontFamily: FONTS.displayBold,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  gridMetaText: {
    fontSize: 11,
    fontFamily: FONTS.displayMedium,
    opacity: 0.5,
  },
});

const buildListStyles = (isTablet: boolean) => ({
  list: {
    borderRadius: 32,
    overflow: 'hidden' as const,
    ...SHADOWS.sm,
    marginTop: 8,
  },
  listCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: isTablet ? 20 : 16,
    gap: 16,
  },
  listThumb: {
    width: isTablet ? 80 : 64,
    height: isTablet ? 80 : 64,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  listThumbEmoji: { fontSize: isTablet ? 36 : 28 },
  listAudioIndicator: {
    position: 'absolute' as const,
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  listInfo: { flex: 1, gap: 4 },
  listTitle: { fontSize: isTablet ? 18 : 16, fontFamily: FONTS.displayBold },
  listMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  listLangFlag: { fontSize: isTablet ? 18 : 16 },
  listMetaText: { fontSize: 12, fontFamily: FONTS.displayMedium },
  listDivider: { height: 1, marginHorizontal: 20 },
});

const buildEmptyStyles = () => ({
  emptyWrap: {
    paddingVertical: 60,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 16,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 8,
  },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { fontSize: 24, fontFamily: FONTS.displayBold },
  emptyBody: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    textAlign: 'center' as const,
    lineHeight: 22,
    maxWidth: 300,
  },
  emptyAction: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 18,
    marginTop: 8,
    ...SHADOWS.md,
  },
  emptyActionText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: FONTS.displayBold,
  },
});

/* ── Composed useStyles Hook ───────────────────────────────────────── */

const useStyles = (C: ThemeColors, isTablet: boolean, winWidth: number) => {
  return useMemo(() => {
    const PADDING = isTablet ? 32 : 20;
    const GAP = isTablet ? 16 : 12;
    const contentWidth = Math.min(winWidth, 1000) - PADDING * 2;
    let nCols = 2;
    if (winWidth >= 960) nCols = 4;
    else if (winWidth >= 600) nCols = 3;
    else nCols = 2;
    const cardW = (contentWidth - GAP * (nCols - 1)) / nCols;
    const cardH = cardW * 1.25;

    return StyleSheet.create({
      ...buildLayoutStyles(PADDING),
      ...buildHeaderStyles(isTablet),
      ...buildFeaturedStyles(isTablet),
      ...buildControlStyles(C),
      ...buildGridStyles(isTablet, GAP, cardW, cardH),
      ...buildListStyles(isTablet),
      ...buildEmptyStyles(),
    });
  }, [C, isTablet, winWidth]);
};
