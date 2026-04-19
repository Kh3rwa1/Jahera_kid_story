import { LinearGradient } from 'expo-linear-gradient';
import { Award, BookOpen, Pause, Play, RefreshCw, SkipBack, SkipForward, Sparkles } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming, Easing, interpolate, cancelAnimation } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect } from 'react';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useAudio, useAudioProgress } from '@/contexts/AudioContext';
import { useReadingPreferences } from '@/contexts/ReadingPreferencesContext';
import { useTheme } from '@/contexts/ThemeContext';
import { usePlayback } from '@/hooks/usePlayback';
import { useWordHighlighting } from '@/hooks/useWordHighlighting';

import { CinematicIntro } from '@/components/story/Playback/CinematicIntro';
import { PlaybackHeader } from '@/components/story/Playback/PlaybackHeader';
import { PlaybackProgress, formatTime } from '@/components/story/Playback/PlaybackProgress';
import { ReadingSettings } from '@/components/story/Playback/ReadingSettings';
import { ReadingView } from '@/components/story/Playback/ReadingView';
import { THEMES } from '@/constants/storyOptions';
import { getThemeIcon } from '@/utils/themeIcons';

import { BORDER_RADIUS, FONTS, SHADOWS, SPACING } from '@/constants/theme';
import { ThemeColors } from '@/types/theme';

export default function StoryPlaybackScreen() {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  const insets = useSafeAreaInsets();

  const {
    story, isLoading, hasQuiz, tab, setTab,
    showCinematicIntro, introOpacity, dismissCinematicIntro,
    handleBack, handleGoToQuiz, handleNewStory, retryAudio
  } = usePlayback();

  const { isPlaying, isBuffering, audioPolling, audioError, isDeviceTTS, sound, playPause, seek } = useAudio();
  const { position, duration } = useAudioProgress();
  const { prefs } = useReadingPreferences();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const {
    paragraphs,
    allWords,
    activeWordIndex,
    activeParaIndex
  } = useWordHighlighting(story?.content ?? '', position, duration);

  const themeObj = THEMES.find((t) => t.id === story?.theme);
  const accentColor = useMemo(() => themeObj?.gradient[0] || colors.primary, [themeObj, colors.primary]);
  const accentColorDark = useMemo(() => themeObj?.gradient[1] || colors.primaryDark, [themeObj, colors.primaryDark]);

  // Vinyl rotation
  const vinylRotation = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      vinylRotation.value = withRepeat(
        withTiming(vinylRotation.value + 360, { duration: 8000, easing: Easing.linear }), -1, false
      );
    } else {
      cancelAnimation(vinylRotation);
    }
  }, [isPlaying]);

  const vinylStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${vinylRotation.value}deg` }],
  }));

  // Play button scale
  const playScale = useSharedValue(1);
  const playBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playScale.value }],
  }));

  const handlePlayPause = () => {
    playScale.value = withSequence(withSpring(0.85, { damping: 8 }), withSpring(1, { damping: 10 }));
    playPause();
  };

  const handleSkipBack = () => seek(Math.max(0, position - 10000));
  const handleSkipForward = () => { if (duration) seek(Math.min(duration, position + 15000)); };

  const { icon: ThemeIcon, size: themeIconSize } = getThemeIcon(story?.theme);

  if (isLoading && !story) {
    return (
      <View style={[styles.fill, { backgroundColor: colors.background }]}>
        <SafeAreaView edges={['top']} style={styles.fill}>
          <View style={styles.skeletonHeader}>
            <View style={[styles.skeletonCircle, { backgroundColor: colors.text.light + '18' }]} />
            <View style={styles.skeletonHeaderCenter}>
              <View style={[styles.skeletonPill, { backgroundColor: colors.text.light + '18', width: 120 }]} />
              <View style={[styles.skeletonPill, { backgroundColor: colors.text.light + '12', width: 180, marginTop: 6 }]} />
            </View>
            <View style={[styles.skeletonCircle, { backgroundColor: colors.text.light + '18' }]} />
          </View>
          <View style={styles.skeletonAudio}>
            <View style={[styles.skeletonAlbumArt, { backgroundColor: colors.text.light + '12' }]} />
            <View style={[styles.skeletonPill, { backgroundColor: colors.text.light + '18', width: '60%', height: 20, marginTop: SPACING.xl }]} />
            <View style={[styles.skeletonPill, { backgroundColor: colors.text.light + '12', width: '40%', height: 14, marginTop: 8 }]} />
          </View>
          <View style={[styles.skeletonControls, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.skeletonBar, { backgroundColor: colors.text.light + '15' }]} />
            <View style={styles.skeletonControlRow}>
              <View style={[styles.skeletonCircleSmall, { backgroundColor: colors.text.light + '18' }]} />
              <View style={[styles.skeletonCircleLarge, { backgroundColor: colors.primary + '25' }]} />
              <View style={[styles.skeletonCircleSmall, { backgroundColor: colors.text.light + '18' }]} />
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const renderAudioTab = () => (
    <View style={styles.fill}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[accentColorDark, accentColor + 'CC', accentColor + '44', colors.background]}
        locations={[0, 0.3, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      <PlaybackHeader
        tab={tab}
        onTabChange={setTab}
        onBack={handleBack}
        onShare={() => {}}
        title={story?.title ?? ''}
        colors={colors}
        accentColor={accentColor}
        isAudioMode
      />

      <View style={styles.audioContent}>
        {/* Story Title + Meta */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.titleSection}>
          <Text style={styles.storyTitle} numberOfLines={2}>
            {story?.title ?? 'Your Story'}
          </Text>
          <View style={styles.metaRow}>
            {story?.theme && (
              <View style={styles.metaBadge}>
                <ThemeIcon size={12} color="#FFF" />
                <Text style={styles.metaBadgeText}>{themeObj?.label ?? story.theme}</Text>
              </View>
            )}
            {story?.mood && (
              <View style={[styles.metaBadge, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                <Text style={styles.metaBadgeText}>{story.mood}</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Album Art */}
        <Animated.View entering={FadeIn.delay(300).duration(600)} style={styles.albumSection}>
          {/* Outer glow ring */}
          <View style={[styles.albumGlow, { shadowColor: accentColor }]}>
            <Animated.View style={[styles.albumOuter, vinylStyle]}>
              <LinearGradient
                colors={[accentColor, accentColorDark, 'rgba(0,0,0,0.5)']}
                style={styles.albumGradient}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
              >
                {/* Decorative rings */}
                <View style={[styles.albumRingOuter, { borderColor: 'rgba(255,255,255,0.08)' }]} />
                <View style={[styles.albumRingMid, { borderColor: 'rgba(255,255,255,0.12)' }]} />
                <View style={styles.albumCore}>
                  <View style={[styles.albumCoreInner, { backgroundColor: accentColor + '60' }]}>
                    <ThemeIcon size={32} color="rgba(255,255,255,0.95)" strokeWidth={1.5} />
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Controls */}
        <Animated.View
          entering={SlideInDown.springify().damping(18)}
          style={[styles.playerSheet, { backgroundColor: colors.cardBackground, paddingBottom: insets.bottom + 20 }]}
        >
          <View style={styles.sheetHandle} />

          {/* Progress */}
          <PlaybackProgress accentColor={accentColor} colors={colors} isDeviceTTS={isDeviceTTS} />

          {/* Transport Controls */}
          <View style={styles.controlsRow}>
            <AnimatedPressable onPress={handleSkipBack} disabled={!sound || isDeviceTTS} scaleDown={0.9} style={styles.skipBtn}>
              <SkipBack size={24} color={colors.text.primary} strokeWidth={2} />
              <Text style={[styles.skipLabel, { color: colors.text.light }]}>10</Text>
            </AnimatedPressable>

            <Animated.View style={playBtnStyle}>
              <AnimatedPressable
                onPress={handlePlayPause}
                disabled={!sound && !isDeviceTTS}
                scaleDown={0.9}
                style={[styles.playBtnShadow, { shadowColor: accentColor }]}
              >
                <LinearGradient
                  colors={sound || isDeviceTTS ? [accentColor, accentColorDark] : ['#999', '#777']}
                  style={styles.playBtn}
                >
                  {isBuffering ? (
                    <ActivityIndicator color="#FFF" size="large" />
                  ) : isPlaying ? (
                    <Pause size={30} color="#FFF" fill="#FFF" />
                  ) : (
                    <Play size={30} color="#FFF" fill="#FFF" style={{ marginLeft: 3 }} />
                  )}
                </LinearGradient>
              </AnimatedPressable>
            </Animated.View>

            <AnimatedPressable onPress={handleSkipForward} disabled={!sound || isDeviceTTS} scaleDown={0.9} style={styles.skipBtn}>
              <SkipForward size={24} color={colors.text.primary} strokeWidth={2} />
              <Text style={[styles.skipLabel, { color: colors.text.light }]}>15</Text>
            </AnimatedPressable>
          </View>

          {/* Stats */}
          <View style={[styles.statsRow, { borderTopColor: colors.text.light + '10' }]}>
            <StatItem value={story?.word_count ?? allWords.length} label="words" colors={colors} />
            <View style={[styles.statDivider, { backgroundColor: colors.text.light + '15' }]} />
            <StatItem value={formatTime(duration)} label="length" colors={colors} />
            <View style={[styles.statDivider, { backgroundColor: colors.text.light + '15' }]} />
            <StatItem value={story?.language_code?.toUpperCase() ?? 'EN'} label="lang" colors={colors} />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionStack}>
            {hasQuiz && (
              <AnimatedPressable onPress={handleGoToQuiz} scaleDown={0.97}>
                <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.quizBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Award size={18} color="#FFF" fill="#FFF" />
                  <Text style={styles.quizBtnText}>Take the Quiz</Text>
                </LinearGradient>
              </AnimatedPressable>
            )}
            <AnimatedPressable onPress={handleNewStory} scaleDown={0.97} style={[styles.outlineBtn, { borderColor: colors.text.light + '25' }]}>
              <RefreshCw size={16} color={colors.text.secondary} />
              <Text style={[styles.outlineBtnText, { color: colors.text.secondary }]}>New Story</Text>
            </AnimatedPressable>
          </View>
        </Animated.View>
      </View>

      {/* Audio Error Banner */}
      {audioError && (
        <View style={[styles.errorBanner, { bottom: insets.bottom + 16 }]}>
          <View style={styles.errorContent}>
            <Text style={styles.errorText}>Audio failed</Text>
            <AnimatedPressable onPress={retryAudio} scaleDown={0.95} style={styles.retryChip}>
              <RefreshCw size={12} color={accentColor} />
              <Text style={{ color: accentColor, fontFamily: FONTS.bold, fontSize: 13 }}>Retry</Text>
            </AnimatedPressable>
          </View>
        </View>
      )}
    </View>
  );

  const renderTextTab = () => (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" />
      <PlaybackHeader
        tab={tab}
        onTabChange={setTab}
        onBack={handleBack}
        onShare={() => {}}
        onToggleSettings={() => setIsSettingsOpen(!isSettingsOpen)}
        showSettingsBtn
        isSettingsOpen={isSettingsOpen}
        title={story?.title ?? ''}
        colors={colors}
        accentColor={accentColor}
      />
      {isSettingsOpen && <ReadingSettings colors={colors} accentColor={accentColor} />}
      <ReadingView
        content={story?.content ?? ''}
        paragraphs={paragraphs}
        activeWordIndex={activeWordIndex}
        activeParaIndex={activeParaIndex}
        accentColor={accentColor}
        colors={colors}
        prefs={prefs}
        languageCode={story?.language_code}
        storyTheme={story?.theme || undefined}
        storyMood={story?.mood || undefined}
      />
    </View>
  );

  return (
    <View style={styles.fill}>
      {tab === 'audio' ? renderAudioTab() : renderTextTab()}
      {showCinematicIntro && (
        <CinematicIntro
          story={story}
          audioPolling={audioPolling}
          isBuffering={isBuffering}
          onDismiss={dismissCinematicIntro}
          introOpacity={introOpacity}
        />
      )}
    </View>
  );
}

function StatItem({ value, label, colors }: Readonly<{ value: string | number; label: string; colors: ThemeColors }>) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color: colors.text.primary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.text.light }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },

  // --- Audio Tab ---
  audioContent: { flex: 1, justifyContent: 'space-between' },

  titleSection: {
    paddingHorizontal: SPACING.xxl,
    paddingTop: 80,
    alignItems: 'center',
  },
  storyTitle: {
    fontSize: 26,
    fontFamily: FONTS.display,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  metaBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FONTS.bold,
    textTransform: 'capitalize',
  },

  // --- Album Art ---
  albumSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  albumGlow: {
    borderRadius: 110,
    ...(Platform.OS === 'ios' ? {
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 40,
    } : { elevation: 20 }),
  },
  albumOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  albumGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  albumRingOuter: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
  },
  albumRingMid: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  albumCore: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  albumCoreInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },

  // --- Player Sheet ---
  playerSheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: SPACING.xxl,
    paddingTop: 10,
    ...SHADOWS.lg,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignSelf: 'center',
    marginBottom: 16,
  },

  // --- Controls ---
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 36,
    marginVertical: 20,
  },
  skipBtn: {
    alignItems: 'center',
    gap: 2,
  },
  skipLabel: {
    fontSize: 11,
    fontFamily: FONTS.bold,
  },
  playBtnShadow: {
    borderRadius: 40,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  playBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // --- Stats ---
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    marginBottom: 8,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 18, fontFamily: FONTS.display, letterSpacing: -0.3 },
  statLabel: { fontSize: 10, fontFamily: FONTS.extrabold, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  statDivider: { width: 1, height: 28, borderRadius: 0.5 },

  // --- Actions ---
  actionStack: { gap: 10, marginTop: 4 },
  quizBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 15,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.md,
  },
  quizBtnText: { color: '#FFF', fontSize: 17, fontFamily: FONTS.bold },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
  },
  outlineBtnText: { fontSize: 15, fontFamily: FONTS.semibold },

  // --- Error ---
  errorBanner: {
    position: 'absolute',
    left: SPACING.xl,
    right: SPACING.xl,
    backgroundColor: '#FEF2F2',
    borderRadius: BORDER_RADIUS.lg,
    padding: 12,
    ...SHADOWS.sm,
  },
  errorContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  errorText: { color: '#B91C1C', fontSize: 14, fontFamily: FONTS.medium },
  retryChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  // --- Skeleton ---
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    gap: SPACING.md,
  },
  skeletonHeaderCenter: { flex: 1, alignItems: 'center' },
  skeletonCircle: { width: 40, height: 40, borderRadius: 20 },
  skeletonPill: { height: 12, borderRadius: 6 },
  skeletonAudio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  skeletonAlbumArt: { width: 200, height: 200, borderRadius: 100 },
  skeletonControls: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: SPACING.xxl,
    paddingTop: 28,
    paddingBottom: 40,
    gap: SPACING.xl,
    ...SHADOWS.lg,
  },
  skeletonBar: { height: 4, borderRadius: 2, width: '100%' },
  skeletonControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  skeletonCircleSmall: { width: 44, height: 44, borderRadius: 22 },
  skeletonCircleLarge: { width: 64, height: 64, borderRadius: 32 },
});
