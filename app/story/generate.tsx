import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'react-native';

import { SafeScreen } from '@/components/layout';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useStoryGeneration } from '@/hooks/useStoryGeneration';
import { formatLocationLabel } from '@/services/locationService';

import { ErrorState } from '@/components/ErrorState';
import { GenerationLoading } from '@/components/story/Generate/GenerationLoading';
import { OptionsView } from '@/components/story/Generate/OptionsView';

export default function GenerateStoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  const { profile } = useApp();

  const {
    selectedBehaviorGoal,
    setSelectedBehaviorGoal,
    selectedTheme,
    setSelectedTheme,
    selectedMood,
    setSelectedMood,
    selectedLength,
    setSelectedLength,
    selectedVoice,
    setSelectedVoice,
    selectedLanguage,
    setSelectedLanguage,
    locationCtx,
    phase,
    status,
    progress,
    error,
    steps,
    handleStartGeneration,
    handleRetry,
    subscription,
  } = useStoryGeneration();
  const isPremium = subscription?.plan !== 'free';

  if (error) {
    return (
      <SafeScreen backgroundColor={colors.background} padded={false}>
        <ErrorState
          type="general"
          title="Generation Failed"
          message={error}
          onRetry={handleRetry}
          onGoHome={() => router.back()}
          showDetails={false}
        />
      </SafeScreen>
    );
  }

  if (phase === 'generating') {
    return (
      <SafeScreen backgroundColor={colors.background} padded={false}>
        <GenerationLoading
          colors={colors}
          status={status}
          progress={progress}
          steps={steps}
          locationCtx={locationCtx}
          languageCode={selectedLanguage}
        />
      </SafeScreen>
    );
  }

  return (
    <SafeScreen backgroundColor={colors.background} padded={false}>
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
        locationLabel={
          locationCtx ? formatLocationLabel(locationCtx) : 'City not set'
        }
        onStart={handleStartGeneration}
        onBack={() => router.back()}
        isPremium={isPremium}
        languageCode={selectedLanguage || 'en'}
        subscription={subscription}
        profileId={(params.profileId as string) || profile?.id || ''}
      />
    </SafeScreen>
  );
}
