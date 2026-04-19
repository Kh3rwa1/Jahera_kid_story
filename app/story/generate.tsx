import { useLocalSearchParams,useRouter } from 'expo-router';
import {
StatusBar,
StyleSheet,
View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useStoryGeneration } from '@/hooks/useStoryGeneration';
import { formatLocationLabel } from '@/services/locationService';

import { ErrorState } from '@/components/ErrorState';
import { GenerationLoading } from '@/components/story/Generate/GenerationLoading';
import { OptionsView } from '@/components/story/Generate/OptionsView';
import { BORDER_RADIUS,FONTS,SHADOWS } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function GenerateStoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  const { profile } = useApp();

  const {
    selectedBehaviorGoal, setSelectedBehaviorGoal,
    selectedTheme, setSelectedTheme,
    selectedMood, setSelectedMood,
    selectedLength, setSelectedLength,
    selectedVoice, setSelectedVoice,
    selectedLanguage, setSelectedLanguage,
    locationCtx,
    phase, status, progress, error, steps,
    handleStartGeneration, handleRetry,
    subscription
  } = useStoryGeneration();
  const isPremium = subscription?.plan !== 'free';


  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ErrorState
          type="general"
          title="Generation Failed"
          message={error}
          onRetry={handleRetry}
          onGoHome={() => router.back()}
          showDetails={false}
        />
      </SafeAreaView>
    );
  }

  if (phase === 'generating') {
    return (
      <GenerationLoading
        colors={colors}
        status={status}
        progress={progress}
        steps={steps}
        locationCtx={locationCtx}
        languageCode={selectedLanguage}
        profile={profile as any}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" />
      <OptionsView
        colors={colors}
        selectedBehaviorGoal={selectedBehaviorGoal}
        onBehaviorGoalChange={setSelectedBehaviorGoal}
        selectedTheme={selectedTheme}
        setSelectedTheme={setSelectedTheme}
        selectedMood={selectedMood}
        setSelectedMood={setSelectedMood}
        selectedLength={selectedLength}
        setSelectedLength={setSelectedLength}
        selectedVoice={selectedVoice}
        onVoiceChange={setSelectedVoice}
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
        locationLabel={locationCtx ? formatLocationLabel(locationCtx) : 'City not set'}
        onStart={handleStartGeneration}
        onBack={() => router.back()}
        isPremium={isPremium}
        languageCode={selectedLanguage || 'en'}
        subscription={subscription}
        profileId={(params.profileId as string) || profile?.id || ''}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
