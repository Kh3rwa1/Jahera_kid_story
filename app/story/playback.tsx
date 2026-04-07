import { LinearGradient } from 'expo-linear-gradient';
import { Award,RefreshCw,RefreshCw as VolumeRetry } from 'lucide-react-native';
import { useMemo,useState } from 'react';
import {
ActivityIndicator,
StatusBar,
StyleSheet,
Text,
TouchableOpacity,
View,
useWindowDimensions,
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

  const { isBuffering, audioPolling, audioError } = useAudio();
  const { position, duration } = useAudioProgress();
  const { prefs } = useReadingPreferences();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const {
    paragraphs,
    allWords,
    activeWordIndex,
    activeParaIndex
  } = useWordHighlighting(story?.content ?? '', position, duration);

  const themeObj = THEMES.find((t: any) => t.id === story?.theme);
  const accentColor = useMemo(() => themeObj?.gradient[0] || colors.primary, [themeObj, colors.primary]);
  const themeGradient = useMemo(() => [accentColor + '44', accentColor + '22', colors.background] as const, [accentColor, colors.background]);

  if (isLoading && !story) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
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
          themeGradient={themeGradient}
          colors={colors}
        />

        <Animated.View 
          entering={SlideInDown.springify().damping(20)}
          style={[styles.playerSheet, { backgroundColor: colors.cardBackground, paddingBottom: insets.bottom + 20 }]}
        >
          <View style={styles.sheetHandle} />
          
          <PlaybackProgress accentColor={accentColor} colors={colors} />

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
              <VolumeRetry size={14} color={accentColor} />
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
          videoUri={null} // Caching handled in hook
          audioPolling={audioPolling}
          isBuffering={isBuffering}
          onDismiss={dismissCinematicIntro}
          introOpacity={introOpacity}
        />
      )}
    </View>
  );
}

function StatItem({ value, label, colors }: { value: string | number, label: string, colors: ThemeColors }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color: colors.text.primary, fontFamily: FONTS.bold }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.text.secondary, fontFamily: FONTS.medium }]}>{label}</Text>
    </View>
  );
}

function QuizButton({ onPress }: { onPress: () => void }) {
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
});
