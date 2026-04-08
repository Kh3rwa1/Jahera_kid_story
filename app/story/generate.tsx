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
import { Sparkles,Zap } from 'lucide-react-native';
import { Text,TouchableOpacity } from 'react-native';

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
    familyMembers, setFamilyMembers,
    friends, setFriends,
    locationCtx,
    phase, status, progress, error, isQuotaError, steps,
    handleStartGeneration, handleRetry,
    subscription
  } = useStoryGeneration();
  const isPremium = subscription?.plan !== 'free';

  if (isQuotaError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.quotaContainer}>
          <View style={styles.quotaIconWrap}>
            <LinearGradient colors={['#FEF3C7', '#FDE68A']} style={styles.quotaIconBg}>
              <Zap size={36} color="#D97706" strokeWidth={2} />
            </LinearGradient>
          </View>
          <Text style={[styles.quotaTitle, { color: colors.text.primary }]}>Monthly Limit Reached</Text>
          <Text style={[styles.quotaSubtitle, { color: colors.text.secondary }]}>
            You've used all your free stories this month. Upgrade to Pro for unlimited adventures!
          </Text>
          <TouchableOpacity onPress={() => router.push('/paywall')} activeOpacity={0.9} style={styles.fullWidth}>
            <LinearGradient
              colors={['#FF8C42', '#FF5C00']}
              style={styles.upgradeButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Sparkles size={18} color="#FFFFFF" />
              <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <Text style={[styles.backLinkText, { color: colors.text.light }]}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
        profile={profile}
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
        familyMembers={familyMembers}
        friends={friends}
        onFamilyMembersChange={setFamilyMembers}
        onFriendsChange={setFriends}
        locationLabel={formatLocationLabel(locationCtx) || 'City not set'}
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
  quotaContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 20,
  },
  quotaIconWrap: { marginBottom: 10 },
  quotaIconBg: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quotaTitle: { fontSize: 24, fontFamily: FONTS.extrabold, textAlign: 'center' },
  quotaSubtitle: { fontSize: 15, fontFamily: FONTS.medium, textAlign: 'center', lineHeight: 23 },
  fullWidth: { width: '100%' },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: BORDER_RADIUS.xxl,
    ...SHADOWS.lg,
  },
  upgradeButtonText: { fontSize: 16, fontFamily: FONTS.extrabold, color: '#FFFFFF' },
  backLink: { paddingVertical: 15 },
  backLinkText: { fontSize: 14, fontFamily: FONTS.medium },
});
