import { useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Text,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { Sparkles, BookOpen, ChevronRight, Globe, Users, Volume2, Clock, Play, Shuffle, Settings, Flame, Crown, ArrowRight, Wand as Wand2, TrendingUp } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, SHADOWS, FONTS } from '@/constants/theme';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { ErrorState } from '@/components/ErrorState';
import { getLanguageFlag } from '@/utils/languageUtils';
import { getTimeOfDay } from '@/utils/contextUtils';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { ProfileAvatar } from '@/components/ProfileAvatar';

const { width: SW } = Dimensions.get('window');
const CARD_W = Math.min(SW * 0.68, 260);

function getGreeting(name: string): { line1: string; line2: string } {
  const tod = getTimeOfDay(new Date());
  switch (tod) {
    case 'morning':
      return { line1: `Good morning,`, line2: `${name} ☀️` };
    case 'afternoon':
      return { line1: `Hey there,`, line2: `${name} 🌈` };
    case 'evening':
      return { line1: `Good evening,`, line2: `${name} 🌙` };
    case 'night':
      return { line1: `Still up,`, line2: `${name} ⭐` };
    default:
      return { line1: `Welcome back,`, line2: `${name} ✨` };
  }
}

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

const SEASON_CONFIG: Record<string, { colors: readonly [string, string, string]; emoji: string }> = {
  spring: { colors: ['#D4F4E2', '#A8E6C3', '#6DD6A0'], emoji: '🌸' },
  summer: { colors: ['#FFF3B0', '#FFE066', '#FFD020'], emoji: '☀️' },
  fall:   { colors: ['#FFE5C4', '#FFCA80', '#FFAA3B'], emoji: '🍂' },
  winter: { colors: ['#D6EEF9', '#A8D8F0', '#70BDE5'], emoji: '❄️' },
};

function PulseRing({ color, delay }: { color: string; delay: number }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withDelay(delay, withRepeat(
      withSequence(withTiming(1.6, { duration: 1800 }), withTiming(1, { duration: 0 })),
      -1, false
    ));
    opacity.value = withDelay(delay, withRepeat(
      withSequence(withTiming(0, { duration: 1800 }), withTiming(0.6, { duration: 0 })),
      -1, false
    ));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.pulseRing, { borderColor: color }, style]} />
  );
}

function FloatAnim({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withDelay(delay, withRepeat(
      withSequence(withTiming(-8, { duration: 2400 }), withTiming(8, { duration: 2400 })),
      -1, true
    ));
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

interface StatsTickerProps {
  stories: number;
  languages: number;
  characters: number;
  primaryColor: string;
  cardBackground: string;
  textPrimary: string;
  textSecondary: string;
}

function StatsTicker({ stories, languages, characters, primaryColor, cardBackground, textPrimary, textSecondary }: StatsTickerProps) {
  const translateX = useSharedValue(0);
  const containerWidth = useRef(0);
  const contentWidth = useRef(0);

  const items = [
    { value: stories, label: 'Stories', icon: <BookOpen size={13} color={primaryColor} strokeWidth={2} />, color: primaryColor },
    { value: languages, label: 'Languages', icon: <Globe size={13} color="#F59E0B" strokeWidth={2} />, color: '#F59E0B' },
    { value: characters, label: 'Characters', icon: <Users size={13} color="#10B981" strokeWidth={2} />, color: '#10B981' },
    { value: stories, label: 'Stories', icon: <BookOpen size={13} color={primaryColor} strokeWidth={2} />, color: primaryColor },
    { value: languages, label: 'Languages', icon: <Globe size={13} color="#F59E0B" strokeWidth={2} />, color: '#F59E0B' },
    { value: characters, label: 'Characters', icon: <Users size={13} color="#10B981" strokeWidth={2} />, color: '#10B981' },
  ];

  const startAnimation = useCallback((cw: number, conW: number) => {
    cancelAnimation(translateX);
    translateX.value = 0;
    const halfContent = cw / 2;
    const duration = halfContent * 22;
    translateX.value = withRepeat(
      withTiming(-halfContent, { duration, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(220).springify()}
      style={styles.statsTickerWrapper}
      onLayout={(e) => {
        containerWidth.current = e.nativeEvent.layout.width;
        if (contentWidth.current > 0) {
          startAnimation(contentWidth.current, containerWidth.current);
        }
      }}
    >
      <Animated.View
        style={[styles.statsTickerTrack, animStyle]}
        onLayout={(e) => {
          contentWidth.current = e.nativeEvent.layout.width;
          if (containerWidth.current > 0) {
            startAnimation(contentWidth.current, containerWidth.current);
          }
        }}
      >
        {items.map((s, i) => (
          <View key={i} style={[styles.statsTickerPill, { backgroundColor: cardBackground }]}>
            <View style={[styles.statsTickerIcon, { backgroundColor: s.color + '20' }]}>
              {s.icon}
            </View>
            <Text style={[styles.statsTickerVal, { color: textPrimary }]}>{s.value}</Text>
            <Text style={[styles.statsTickerLbl, { color: textSecondary }]}>{s.label}</Text>
            {i < items.length - 1 && (
              <View style={[styles.statsTickerDot, { backgroundColor: textSecondary + '40' }]} />
            )}
          </View>
        ))}
      </Animated.View>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { currentTheme } = useTheme();
  const C = currentTheme.colors;
  const { profile, stories, isLoading, error, refreshAll, subscription, streak } = useApp();

  const handleRefresh = useCallback(async () => { await refreshAll(); }, [refreshAll]);

  const handleGenerateStory = useCallback(() => {
    if (!profile) return;
    router.push({ pathname: '/story/generate', params: { profileId: profile.$id, languageCode: profile.primary_language } });
  }, [profile, router]);

  const handleStoryPress = useCallback((storyId: string) => {
    router.push({ pathname: '/story/playback', params: { storyId } });
  }, [router]);

  const handleLastStory = useCallback(() => {
    if (stories.length > 0) handleStoryPress(stories[0].$id);
  }, [stories, handleStoryPress]);

  const handleRandomStory = useCallback(() => {
    if (stories.length > 0) handleStoryPress(stories[Math.floor(Math.random() * stories.length)].$id);
  }, [stories, handleStoryPress]);

  const recentStories = useMemo(() => stories.slice(0, 10), [stories]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: C.background }]} edges={['top']}>
        <LinearGradient colors={C.backgroundGradient} style={StyleSheet.absoluteFill} />
        <View style={styles.loadingWrap}><LoadingSkeleton type="card" count={3} /></View>
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: C.background }]} edges={['top']}>
        <LinearGradient colors={C.backgroundGradient} style={StyleSheet.absoluteFill} />
        <ErrorState type="general" title="Unable to Load" message={error || 'Failed to load your profile.'} onRetry={refreshAll} onGoHome={() => router.replace('/')} />
      </SafeAreaView>
    );
  }

  const { line1, line2 } = getGreeting(profile.kid_name || 'Friend');
  const isPro = subscription?.plan !== 'free';
  const storiesLeft = subscription?.stories_remaining ?? 0;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: C.background }]} edges={['top']}>
      <LinearGradient colors={C.backgroundGradient} style={StyleSheet.absoluteFill} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={handleRefresh} tintColor={C.primary} />}
      >

        {/* ─── TOP BAR ─── */}
        <Animated.View entering={FadeIn.delay(40)} style={styles.topBar}>
          <TouchableOpacity style={styles.avatarRow} onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.85}>
            <ProfileAvatar avatarUrl={profile.avatar_url} name={profile.kid_name} size="small" />
            <View style={styles.greetBlock}>
              <Text style={[styles.greetLine1, { color: C.text.secondary }]}>{line1}</Text>
              <Text style={[styles.greetLine2, { color: C.text.primary }]}>{line2}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.topBarRight}>
            {streak && streak.current_streak > 0 && (
              <View style={[styles.streakChip, { backgroundColor: '#FFF3E0' }]}>
                <Flame size={13} color="#F59E0B" />
                <Text style={styles.streakChipText}>{streak.current_streak}</Text>
              </View>
            )}
            {isPro && (
              <View style={[styles.proChip, { backgroundColor: C.warning + '20' }]}>
                <Crown size={11} color={C.warning} />
                <Text style={[styles.proChipText, { color: C.warning }]}>PRO</Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: C.cardBackground }]}
              onPress={() => router.push('/(tabs)/settings')}
              activeOpacity={0.7}
            >
              <Settings size={19} color={C.text.secondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ─── HERO GENERATE CARD ─── */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.heroWrap}>
          <AnimatedPressable onPress={handleGenerateStory} scaleDown={0.97}>
            <LinearGradient
              colors={[...C.gradients.sunset]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              {/* Background glow orbs */}
              <View style={[styles.orb, styles.orbTL, { backgroundColor: 'rgba(255,255,255,0.15)' }]} />
              <View style={[styles.orb, styles.orbBR, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />

              <View style={styles.heroInner}>
                <View style={styles.heroText}>
                  <View style={[styles.heroPill, { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
                    <Wand2 size={12} color="#FFFFFF" strokeWidth={2.5} />
                    <Text style={styles.heroPillText}>AI-Powered Stories</Text>
                  </View>
                  <Text style={styles.heroH1}>Create a{'\n'}New Story</Text>
                  <Text style={styles.heroSub}>
                    Personalized for {profile.kid_name}, in seconds
                  </Text>
                  <View style={styles.heroBtn}>
                    <Sparkles size={14} color="#FFFFFF" strokeWidth={2.5} />
                    <Text style={styles.heroBtnText}>Generate Magic</Text>
                    <ArrowRight size={14} color="#FFFFFF" strokeWidth={2.5} />
                  </View>
                </View>

                <FloatAnim delay={400}>
                  <View style={styles.heroEmojiStack}>
                    <Text style={styles.heroEmojiMain}>🧙‍♂️</Text>
                    <View style={styles.heroSparkleRow}>
                      <Text style={styles.heroSparkle}>✨</Text>
                      <Text style={styles.heroSparkle}>⭐</Text>
                    </View>
                  </View>
                </FloatAnim>
              </View>

              {/* Bottom strip */}
              <View style={[styles.heroStrip, { backgroundColor: 'rgba(0,0,0,0.12)' }]}>
                <View style={styles.heroStripItem}>
                  <Globe size={11} color="rgba(255,255,255,0.8)" strokeWidth={2} />
                  <Text style={styles.heroStripText}>{profile.languages?.length || 1} language{(profile.languages?.length || 1) > 1 ? 's' : ''}</Text>
                </View>
                <View style={styles.heroStripDot} />
                <View style={styles.heroStripItem}>
                  <Users size={11} color="rgba(255,255,255,0.8)" strokeWidth={2} />
                  <Text style={styles.heroStripText}>
                    {(profile.family_members?.length || 0) + (profile.friends?.length || 0)} characters
                  </Text>
                </View>
                {!isPro && (
                  <>
                    <View style={styles.heroStripDot} />
                    <View style={styles.heroStripItem}>
                      <Sparkles size={11} color="rgba(255,255,255,0.8)" strokeWidth={2} />
                      <Text style={styles.heroStripText}>{storiesLeft} stories left</Text>
                    </View>
                  </>
                )}
              </View>
            </LinearGradient>
          </AnimatedPressable>
        </Animated.View>

        {/* ─── QUICK ACTIONS ─── */}
        {stories.length > 0 && (
          <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.quickRow}>
            {[
              {
                icon: <Play size={16} color="#FFFFFF" fill="#FFFFFF" strokeWidth={0} />,
                label: 'Continue',
                sublabel: 'Last story',
                grad: ['#3B82F6', '#2563EB'] as [string, string],
                onPress: handleLastStory,
              },
              {
                icon: <Shuffle size={16} color="#FFFFFF" strokeWidth={2.5} />,
                label: 'Surprise',
                sublabel: 'Random pick',
                grad: ['#F59E0B', '#D97706'] as [string, string],
                onPress: handleRandomStory,
              },
              {
                icon: <TrendingUp size={16} color="#FFFFFF" strokeWidth={2.5} />,
                label: 'Library',
                sublabel: `${stories.length} stories`,
                grad: ['#10B981', '#059669'] as [string, string],
                onPress: () => router.push('/(tabs)/history'),
              },
            ].map((a, i) => (
              <Animated.View key={a.label} entering={FadeInDown.delay(180 + i * 50).springify()} style={styles.quickItem}>
                <AnimatedPressable onPress={a.onPress} scaleDown={0.93} style={styles.quickCard}>
                  <LinearGradient colors={a.grad} style={styles.quickIconCircle}>
                    {a.icon}
                  </LinearGradient>
                  <Text style={[styles.quickLabel, { color: C.text.primary }]}>{a.label}</Text>
                  <Text style={[styles.quickSublabel, { color: C.text.secondary }]}>{a.sublabel}</Text>
                </AnimatedPressable>
              </Animated.View>
            ))}
          </Animated.View>
        )}

        {/* ─── STATS TICKER ─── */}
        <StatsTicker
          stories={stories.length}
          languages={profile.languages?.length || 0}
          characters={(profile.family_members?.length || 0) + (profile.friends?.length || 0)}
          primaryColor={C.primary}
          cardBackground={C.cardBackground}
          textPrimary={C.text.primary}
          textSecondary={C.text.secondary}
        />

        {/* ─── RECENT STORIES ─── */}
        <View style={styles.section}>
          <Animated.View entering={FadeInDown.delay(260).springify()} style={styles.secHeader}>
            <Text style={[styles.secTitle, { color: C.text.primary }]}>Recent Stories</Text>
            {stories.length > 4 && (
              <TouchableOpacity
                style={[styles.seeAllBtn, { backgroundColor: C.primary + '14' }]}
                onPress={() => router.push('/(tabs)/history')}
                activeOpacity={0.7}
              >
                <Text style={[styles.seeAllText, { color: C.primary }]}>See all</Text>
                <ChevronRight size={13} color={C.primary} strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </Animated.View>

          {recentStories.length === 0 ? (
            <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.emptyWrap}>
              <LinearGradient
                colors={[C.cardBackground, C.cardBackground]}
                style={[styles.emptyCard, { borderColor: C.text.light + '20', borderWidth: 1.5 }]}
              >
                <View style={styles.emptyIconRing}>
                  <Text style={styles.emptyEmoji}>🌟</Text>
                </View>
                <Text style={[styles.emptyTitle, { color: C.text.primary }]}>No Stories Yet</Text>
                <Text style={[styles.emptySub, { color: C.text.secondary }]}>
                  Tap "Generate Magic" above to create your first personalized story!
                </Text>
                <TouchableOpacity
                  style={[styles.emptyAction, { backgroundColor: C.primary }]}
                  onPress={handleGenerateStory}
                  activeOpacity={0.85}
                >
                  <Wand2 size={15} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.emptyActionText}>Create First Story</Text>
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carousel}
              decelerationRate="fast"
              snapToInterval={CARD_W + SPACING.md}
            >
              {recentStories.map((story, idx) => {
                const season = SEASON_CONFIG[story.season] || SEASON_CONFIG.spring;
                const flag = getLanguageFlag(story.language_code);
                return (
                  <Animated.View key={story.$id} entering={FadeInRight.delay(280 + idx * 50).springify()}>
                    <AnimatedPressable
                      style={[styles.storyCard, { width: CARD_W, backgroundColor: C.cardBackground }]}
                      onPress={() => handleStoryPress(story.$id)}
                      scaleDown={0.95}
                    >
                      {/* Artwork */}
                      <LinearGradient colors={season.colors} style={styles.storyArt}>
                        <Text style={styles.storyArtEmoji}>{season.emoji}</Text>
                        {/* Top badges */}
                        <View style={styles.storyBadgesTop}>
                          <View style={styles.storyFlagBadge}>
                            <Text style={styles.storyFlag}>{flag}</Text>
                          </View>
                          {story.audio_url && (
                            <View style={[styles.storyAudioBadge, { backgroundColor: 'rgba(0,0,0,0.35)' }]}>
                              <Volume2 size={9} color="#FFFFFF" strokeWidth={2.5} />
                            </View>
                          )}
                        </View>
                        {/* Play overlay */}
                        <View style={[styles.storyPlayBtn, { backgroundColor: 'rgba(255,255,255,0.9)' }]}>
                          <Play size={12} color="#333" fill="#333" strokeWidth={0} />
                        </View>
                      </LinearGradient>

                      {/* Content */}
                      <View style={styles.storyContent}>
                        <Text style={[styles.storyTitle, { color: C.text.primary }]} numberOfLines={2}>
                          {story.title}
                        </Text>
                        <View style={styles.storyMeta}>
                          <Clock size={10} color={C.text.light} strokeWidth={2} />
                          <Text style={[styles.storyMetaText, { color: C.text.light }]}>
                            {getRelativeTime(story.generated_at || story.$createdAt)}
                          </Text>
                          {story.season && (
                            <View style={[styles.seasonTag, { backgroundColor: season.colors[0] }]}>
                              <Text style={styles.seasonTagText}>{story.season}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </AnimatedPressable>
                  </Animated.View>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* ─── LANGUAGES ─── */}
        {profile.languages?.length > 1 && (
          <Animated.View entering={FadeInDown.delay(360).springify()} style={styles.section}>
            <View style={styles.secHeader}>
              <Text style={[styles.secTitle, { color: C.text.primary }]}>Languages</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
              {profile.languages.map((lang, i) => {
                const count = stories.filter(s => s.language_code === lang.language_code).length;
                const maxCount = Math.max(1, ...profile.languages.map(l => stories.filter(s => s.language_code === l.language_code).length));
                return (
                  <Animated.View key={lang.$id} entering={FadeInRight.delay(380 + i * 60).springify()}>
                    <View style={[styles.langCard, { backgroundColor: C.cardBackground }]}>
                      <Text style={styles.langFlag}>{getLanguageFlag(lang.language_code)}</Text>
                      <Text style={[styles.langName, { color: C.text.primary }]}>{lang.language_name}</Text>
                      <Text style={[styles.langCount, { color: C.text.secondary }]}>{count} {count === 1 ? 'story' : 'stories'}</Text>
                      <View style={[styles.langBar, { backgroundColor: C.text.light + '20' }]}>
                        <View style={[styles.langBarFill, { backgroundColor: C.primary, width: `${Math.max(12, (count / maxCount) * 100)}%` }]} />
                      </View>
                    </View>
                  </Animated.View>
                );
              })}
            </ScrollView>
          </Animated.View>
        )}

        {/* ─── CHARACTERS ─── */}
        {((profile.family_members?.length ?? 0) > 0 || (profile.friends?.length ?? 0) > 0) && (
          <Animated.View entering={FadeInDown.delay(420).springify()} style={styles.section}>
            <View style={styles.secHeader}>
              <Text style={[styles.secTitle, { color: C.text.primary }]}>Story Characters</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
              {profile.family_members?.map((m, i) => (
                <Animated.View key={m.$id} entering={FadeInRight.delay(440 + i * 55).springify()}>
                  <View style={[styles.charCard, { backgroundColor: C.cardBackground }]}>
                    <LinearGradient colors={[C.primary + '30', C.primary + '10']} style={styles.charAvatar}>
                      <Text style={[styles.charInitial, { color: C.primary }]}>{m.name.charAt(0).toUpperCase()}</Text>
                    </LinearGradient>
                    <Text style={[styles.charName, { color: C.text.primary }]} numberOfLines={1}>{m.name}</Text>
                    <View style={[styles.charTag, { backgroundColor: C.primary + '18' }]}>
                      <Text style={[styles.charTagText, { color: C.primary }]}>Family</Text>
                    </View>
                  </View>
                </Animated.View>
              ))}
              {profile.friends?.map((f, i) => (
                <Animated.View key={f.$id} entering={FadeInRight.delay(480 + i * 55).springify()}>
                  <View style={[styles.charCard, { backgroundColor: C.cardBackground }]}>
                    <LinearGradient colors={['#10B98130', '#10B98110']} style={styles.charAvatar}>
                      <Text style={[styles.charInitial, { color: '#10B981' }]}>{f.name.charAt(0).toUpperCase()}</Text>
                    </LinearGradient>
                    <Text style={[styles.charName, { color: C.text.primary }]} numberOfLines={1}>{f.name}</Text>
                    <View style={[styles.charTag, { backgroundColor: '#10B98118' }]}>
                      <Text style={[styles.charTagText, { color: '#10B981' }]}>Friend</Text>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* ─── UPGRADE BANNER ─── */}
        {!isPro && storiesLeft <= 2 && (
          <Animated.View entering={FadeInDown.delay(480).springify()} style={styles.section}>
            <TouchableOpacity onPress={() => router.push('/paywall')} activeOpacity={0.88}>
              <LinearGradient
                colors={['#1A1A2E', '#16213E', '#0F3460']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.upgradeBanner}
              >
                <View style={styles.upgradeLeft}>
                  <Text style={styles.upgradeTitle}>Unlock Unlimited Stories</Text>
                  <Text style={styles.upgradeSub}>
                    {storiesLeft === 0 ? 'You\'ve used all your free stories.' : `Only ${storiesLeft} free ${storiesLeft === 1 ? 'story' : 'stories'} left.`}
                  </Text>
                </View>
                <View style={[styles.upgradeArrow, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                  <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.5} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 110 },
  loadingWrap: { padding: SPACING.xl, gap: SPACING.md },

  /* Top bar */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
  greetBlock: { gap: 1 },
  greetLine1: { fontSize: 12, fontFamily: FONTS.semibold, letterSpacing: 0.2 },
  greetLine2: { fontSize: 20, fontFamily: FONTS.extrabold, letterSpacing: -0.4 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  streakChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: BORDER_RADIUS.pill,
  },
  streakChipText: { fontSize: 13, fontFamily: FONTS.extrabold, color: '#F59E0B' },
  proChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: BORDER_RADIUS.pill,
  },
  proChipText: { fontSize: 11, fontFamily: FONTS.extrabold },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.xs,
  },

  /* Hero */
  heroWrap: { paddingHorizontal: SPACING.xl, marginBottom: SPACING.lg },
  heroCard: {
    borderRadius: BORDER_RADIUS.xxl,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  orb: { position: 'absolute', borderRadius: 999 },
  orbTL: { width: 160, height: 160, top: -60, left: -40 },
  orbBR: { width: 200, height: 200, bottom: -80, right: -60 },
  heroInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.xxl,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  heroText: { flex: 1, gap: SPACING.sm },
  heroPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: BORDER_RADIUS.pill,
  },
  heroPillText: { fontSize: 11, fontFamily: FONTS.bold, color: '#FFFFFF', letterSpacing: 0.3 },
  heroH1: {
    fontSize: 32, fontFamily: FONTS.extrabold,
    color: '#FFFFFF', letterSpacing: -0.8, lineHeight: 36,
  },
  heroSub: {
    fontSize: 13, fontFamily: FONTS.semibold,
    color: 'rgba(255,255,255,0.82)', lineHeight: 19,
  },
  heroBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: SPACING.lg, paddingVertical: 10,
    borderRadius: BORDER_RADIUS.pill,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    marginTop: 4,
  },
  heroBtnText: { fontSize: 14, fontFamily: FONTS.extrabold, color: '#FFFFFF' },
  heroEmojiStack: { alignItems: 'center', gap: 4 },
  heroEmojiMain: { fontSize: 72 },
  heroSparkleRow: { flexDirection: 'row', gap: 4 },
  heroSparkle: { fontSize: 20 },
  heroStrip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  heroStripItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroStripText: { fontSize: 11, fontFamily: FONTS.semibold, color: 'rgba(255,255,255,0.8)' },
  heroStripDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)' },

  /* Quick actions */
  quickRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  quickItem: { flex: 1 },
  quickCard: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.xl,
    gap: 5,
  },
  quickIconCircle: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
    ...SHADOWS.sm,
  },
  quickLabel: { fontSize: 13, fontFamily: FONTS.bold, textAlign: 'center' },
  quickSublabel: { fontSize: 10, fontFamily: FONTS.medium, textAlign: 'center' },

  /* Stats Ticker */
  statsTickerWrapper: {
    overflow: 'hidden',
    marginBottom: SPACING.xxl,
    height: 68,
  },
  statsTickerTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  statsTickerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.pill,
    gap: 6,
    ...SHADOWS.xs,
  },
  statsTickerIcon: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  statsTickerVal: { fontSize: 18, fontFamily: FONTS.extrabold, letterSpacing: -0.5 },
  statsTickerLbl: { fontSize: 12, fontFamily: FONTS.semibold },
  statsTickerDot: {
    width: 4, height: 4, borderRadius: 2,
    marginLeft: 8,
  },

  /* Sections */
  section: { marginBottom: SPACING.xxl },
  secHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.xl, marginBottom: SPACING.md,
  },
  secTitle: { fontSize: 20, fontFamily: FONTS.extrabold, letterSpacing: -0.4 },
  seeAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: BORDER_RADIUS.pill,
  },
  seeAllText: { fontSize: 13, fontFamily: FONTS.bold },

  /* Empty state */
  emptyWrap: { paddingHorizontal: SPACING.xl },
  emptyCard: {
    borderRadius: BORDER_RADIUS.xxl, padding: SPACING.xxxl,
    alignItems: 'center', gap: SPACING.md, ...SHADOWS.sm,
  },
  emptyIconRing: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#FFF9E6', alignItems: 'center', justifyContent: 'center',
  },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 20, fontFamily: FONTS.extrabold, letterSpacing: -0.3 },
  emptySub: { fontSize: 14, fontFamily: FONTS.medium, textAlign: 'center', lineHeight: 21 },
  emptyAction: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.xl, paddingVertical: 13,
    borderRadius: BORDER_RADIUS.pill, marginTop: 4, ...SHADOWS.sm,
  },
  emptyActionText: { fontSize: 15, fontFamily: FONTS.bold, color: '#FFFFFF' },

  /* Story carousel */
  carousel: { paddingHorizontal: SPACING.xl, gap: SPACING.md },
  storyCard: {
    borderRadius: BORDER_RADIUS.xxl, overflow: 'hidden', ...SHADOWS.md,
  },
  storyArt: { width: '100%', height: 148, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  storyArtEmoji: { fontSize: 52 },
  storyBadgesTop: {
    position: 'absolute', top: SPACING.sm, left: SPACING.sm,
    flexDirection: 'row', gap: 5, alignItems: 'center',
  },
  storyFlagBadge: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
  },
  storyFlag: { fontSize: 15 },
  storyAudioBadge: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  storyPlayBtn: {
    position: 'absolute', bottom: SPACING.sm, right: SPACING.sm,
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.xs,
  },
  storyContent: { padding: SPACING.md, paddingTop: SPACING.sm + 2 },
  storyTitle: {
    fontSize: 14, fontFamily: FONTS.bold,
    marginBottom: 6, lineHeight: 20, letterSpacing: -0.1, minHeight: 40,
  },
  storyMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  storyMetaText: { fontSize: 11, fontFamily: FONTS.medium },
  seasonTag: {
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: BORDER_RADIUS.pill,
  },
  seasonTagText: { fontSize: 10, fontFamily: FONTS.bold, color: '#555' },

  /* Languages */
  hRow: { paddingHorizontal: SPACING.xl, gap: SPACING.sm },
  langCard: {
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xl, alignItems: 'center', gap: 4, minWidth: 112, ...SHADOWS.xs,
  },
  langFlag: { fontSize: 28 },
  langName: { fontSize: 13, fontFamily: FONTS.bold },
  langCount: { fontSize: 11, fontFamily: FONTS.medium },
  langBar: { width: '100%', height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 2 },
  langBarFill: { height: '100%', borderRadius: 2 },

  /* Characters */
  charCard: {
    alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xl, gap: 5, minWidth: 88, ...SHADOWS.xs,
  },
  charAvatar: {
    width: 50, height: 50, borderRadius: 25,
    alignItems: 'center', justifyContent: 'center',
  },
  charInitial: { fontSize: 20, fontFamily: FONTS.extrabold },
  charName: { fontSize: 13, fontFamily: FONTS.bold, maxWidth: 80, textAlign: 'center' },
  charTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: BORDER_RADIUS.pill },
  charTagText: { fontSize: 10, fontFamily: FONTS.bold },

  /* Upgrade banner */
  upgradeBanner: {
    marginHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.md,
  },
  upgradeLeft: { flex: 1, gap: 4 },
  upgradeTitle: { fontSize: 17, fontFamily: FONTS.extrabold, color: '#FFFFFF', letterSpacing: -0.3 },
  upgradeSub: { fontSize: 13, fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.7)' },
  upgradeArrow: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },

  /* Pulse ring (unused visually but kept for possible future use) */
  pulseRing: {
    position: 'absolute', width: 60, height: 60,
    borderRadius: 30, borderWidth: 2,
  },
});
