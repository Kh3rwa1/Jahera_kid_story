import { ParentConsentGate } from '@/components/ParentConsentGate';
import { analytics } from '@/services/analyticsService';
import { useRouter } from 'expo-router';

export default function ConsentScreen() {
  const router = useRouter();

  return (
    <ParentConsentGate
      onContinue={(timestamp) => {
        analytics.trackParentConsentGiven(timestamp);
        router.push({ pathname: '/onboarding/language-selection', params: { consentGivenAt: timestamp } });
      }}
    />
  );
}
