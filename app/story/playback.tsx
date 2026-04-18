import { LinearGradient } from 'expo-linear-gradient';
import { Award,RefreshCw } from 'lucide-react-native';
import { useMemo,useState } from 'react';
import {
ActivityIndicator,
StatusBar,
StyleSheet,
Text,
TouchableOpacity,
View,
} from 'react-native';
import Animated,{ SlideInDown } from 'react-native-reanimated';
import { SafeAreaView,useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAudio,useAudioProgress } from '@/contexts/AudioContext';
import { useReadingPreferences } from '@/contexts/ReadingPreferencesContext';
import { useTheme } from '@/contexts/ThemeContext';
import { usePlayback } from '@/hooks/usePlayback';
import { useWordHighlighting } from '@/hooks/useWordHighlighting';

import { AudioControls } from '@/components/story/Playback/AudioControls';
import { CinematicIntro } from '@/components/story/Playback/CinematicIntro';
import { PlaybackHeader } from '@/components/story/Playback/PlaybackHeader';
import { PlaybackProgress,formatTime } from '@/components/story/Playback/PlaybackProgress';
import { ReadingSettings } from '@/components/story/Playback/ReadingSettings';
import { ReadingView } from '@/components/story/Playback/ReadingView';
import { THEMES } from '@/constants/storyOptions';

import { BORDER_RADIUS,FONTS,SHADOWS,SPACING } from '@/constants/theme';
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

  const { isBuffering, audioPolling, audioError, isDeviceTTS } = useAudio();
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
  const themeGradient = useMemo(() => [accentColor + '44', accentColor + '22', colors.background] as const, [accentColor, colors.background]);

  if (isLoading && !story) {
    return (
      <View style={[styles.fill, { backgroundColor: colors.background }]}>
        <SafeAreaView edges={['top']} style={styles.fill}>
          {/* Skeleton header */}
          <View style={styles.skeletonHeader}>
            <View style={[styles.skeletonCircle, { backgroundColor: colors.text.light + '18' }]} />
            <View style={styles.skeletonHeaderCenter}>
              <View style={[styles.skeletonPill, { backgroundColor: colors.text.light + '18', width: 120 }]} />
              <View style={[styles.skeletonPill, { backgroundColor: colors.text.light + '12', width: 180, marginTop: 6 }]} />
            </View>
            <View style={[styles.skeletonCircle, { backgroundColor: colors.text.light + '18' }]} />
          </View>

          {/* Skeleton audio area */}
          <View style={styles.skeletonAudio}>
            <View style={[styles.skeletonAlbumArt, { backgroundColor: colors.text.light + '12' }]} />
            <View style={[styles.skeletonPill, { backgroundColor: colors.text.light + '18', width: '60%', height: 20, marginTop: SPACING.xl }]} />
            <View style={[styles.skeletonPill, { backgroundColor: colors.text.light + '12', width: '40%', height: 14, marginTop: 8 }]} />
          </View>

          {/* Skeleton controls */}
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
      <LinearGradient colors={themeGradient} style={StyleSheet.absoluteFill} />
      
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
        <AudioControls 
          accentColor={accentColor} 
          colors={colors}
        />

        <Animated.View 
          entering={SlideInDown.springify().damping(20)}
          style={[styles.playerSheet, { backgroundColor: colors.cardBackground, paddingBottom: insets.bottom + 20 }]}
        >
          <View style={styles.sheetHandle} />
          
          <PlaybackProgress accentColor={accentColor} colors={colors} isDeviceTTS={isDeviceTTS} />

          <View style={styles.statsRow}>
            <StatItem value={story?.word_count ?? allWords.length} label="words" colors={colors} />
            <StatItem value={formatTime(duration)} label="length" colors={colors} />
            <StatItem value={story?.language_code?.toUpperCase() ?? 'EN'} label="lang" colors={colors} />
          </View>

          <View style={styles.actionStack}>
            {hasQuiz && <QuizButton onPress={handleGoToQuiz} />}
            <TouchableOpacity onPress={handleNewStory} style={[styles.outlineBtn, { borderColor: colors.text.light + '30' }]}>
              <RefreshCw size={16} color={colors.text.secondary} />
              <Text style={[styles.outlineBtnText, { color: colors.text.secondary }]}>New Story</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
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

      {audioError && (
        <SafeAreaView edges={['bottom']} style={styles.errorBanner}>
          <View style={styles.errorBannerContent}>
            <Text style={styles.errorText}>Audio error. Try again later.</Text>
            <TouchableOpacity onPress={retryAudio} style={styles.retryBtn}>
              <RefreshCw size={14} color={accentColor} />
              <Text style={{ color: accentColor, fontWeight: '700' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}
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

function StatItem({ value, label, colors }: Readonly<{ value: string | number, label: string, colors: ThemeColors }>) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color: colors.text.primary, fontFamily: FONTS.bold }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.text.secondary, fontFamily: FONTS.medium }]}>{label}</Text>
    </View>
  );
}

function QuizButton({ onPress }: Readonly<{ onPress: () => void }>) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.quizBtn}>
        <Award size={18} color="#FFF" fill="#FFF" />
        <Text style={styles.quizBtnText}>Take the Quiz</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  audioContent: { flex: 1, justifyContent: 'space-between' },
  playerSheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: SPACING.xxl,
    paddingTop: 8,
    ...SHADOWS.lg,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 20 },
  statLabel: { fontSize: 12, textTransform: 'uppercase' },
  actionStack: { gap: 12 },
  quizBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.xl,
  },
  quizBtnText: { color: '#FFF', fontSize: 18, fontFamily: FONTS.bold },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 13,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
  },
  outlineBtnText: { fontSize: 16, fontFamily: FONTS.semibold },
  errorBanner: { padding: 12, backgroundColor: '#FEF2F2' },
  errorBannerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  errorText: { color: '#B91C1C', fontSize: 14 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  // Skeleton loading styles
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    gap: SPACING.md,
  },
  skeletonHeaderCenter: { flex: 1, alignItems: 'center' },
  skeletonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  skeletonPill: {
    height: 12,
    borderRadius: 6,
  },
  skeletonAudio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  skeletonAlbumArt: {
    width: 200,
    height: 200,
    borderRadius: 32,
  },
  skeletonControls: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: SPACING.xxl,
    paddingTop: 28,
    paddingBottom: 40,
    gap: SPACING.xl,
    ...SHADOWS.lg,
  },
  skeletonBar: {
    height: 4,
    borderRadius: 2,
    width: '100%',
  },
  skeletonControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  skeletonCircleSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  skeletonCircleLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
});
