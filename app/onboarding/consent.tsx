import ParentConsentGate from '@/components/ParentConsentGate';
import { FloatingParticles } from '@/components/FloatingParticles';
import { MeshBackground } from '@/components/MeshBackground';
import { useTheme } from '@/contexts/ThemeContext';
import { analytics } from '@/services/analyticsService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';

export default function ConsentScreen() {
  const { currentTheme } = useTheme();

  const handleContinue = async (consentTimestamp: string) => {
    await AsyncStorage.setItem(
      'jahera_parent_consent',
      JSON.stringify({
        consent_given_at: consentTimestamp,
        version: '1.0',
      }),
    );

    analytics.trackParentConsentGiven(consentTimestamp, '1.0');

    router.replace('/onboarding/language-selection');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      <MeshBackground primaryColor={currentTheme.colors.primary} />
      <FloatingParticles />
      <ParentConsentGate onContinue={handleContinue} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
