import { useApp } from '@/contexts/AppContext';
import { RCOffering,RCPackage,revenueCatService } from '@/services/revenueCatService';
import { subscriptionService } from '@/services/subscriptionService';
import { hapticFeedback } from '@/utils/haptics';
import { logger } from '@/utils/logger';
import { useRouter } from 'expo-router';
import { useCallback,useEffect,useRef,useState } from 'react';
import { Alert } from 'react-native';

export type PlanId = 'weekly' | 'monthly' | 'yearly' | 'family';

export interface Plan {
  id: PlanId;
  label: string;
  price: string;
  period: string;
  save?: string;
  isPopular?: boolean;
  rcPackage?: RCPackage | null;
}

export function usePurchase() {
  const router = useRouter();
  const { profile, refreshSubscription } = useApp();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('yearly');
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [offerings, setOfferings] = useState<RCOffering>({ weekly: null, monthly: null, yearly: null, family: null, raw: null });
  const [offeringsLoading, setOfferingsLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const rcAvailable = revenueCatService.isAvailable();
  const rcUIAvailable = revenueCatService.isUIAvailable();

  const navigateHome = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }, [router]);

  const syncAndCelebrate = useCallback(async (title: string, message: string) => {
    if (!profile) return;
    await subscriptionService.syncFromRevenueCat(profile.id);
    await refreshSubscription();
    hapticFeedback.success();
    Alert.alert(title, message, [{ text: "Let's Go!", onPress: navigateHome }]);
  }, [navigateHome, profile, refreshSubscription]);

  const fallbackActivatePlan = useCallback(async (plan: Plan) => {
    if (!profile) return;
    if (plan.id === 'family') await subscriptionService.upgradeToFamily(profile.id);
    else await subscriptionService.startTrial(profile.id);
    await refreshSubscription();
    Alert.alert('Success', 'Your subscription is active.');
    navigateHome();
  }, [navigateHome, profile, refreshSubscription]);

  const handlePaywallResult = useCallback(async () => {
    const result = await revenueCatService.presentPaywall(offerings.raw);
    if (!result.purchased && !result.restored) return;

    await syncAndCelebrate(
      result.restored ? 'Purchases Restored' : 'Welcome to Pro!',
      result.restored
        ? 'Your subscription has been restored.'
        : 'Your subscription is now active. Enjoy unlimited stories!'
    );
  }, [offerings.raw, syncAndCelebrate]);

  const handlePackagePurchase = useCallback(async (plan: Plan) => {
    if (!plan.rcPackage) return;

    const result = await revenueCatService.purchasePackage(plan.rcPackage);
    if (result.cancelled) return;

    if (!result.success) {
      Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
      return;
    }

    await syncAndCelebrate('Welcome to Pro!', 'Your subscription is now active. Enjoy unlimited stories!');
  }, [syncAndCelebrate]);

  const fetchOfferings = useCallback(async () => {
    if (!rcAvailable) {
      setOfferingsLoading(false);
      return;
    }

    try {
      const o = await revenueCatService.getOfferings();
      if (isMounted.current) {
        setOfferings(o);
        setOfferingsLoading(false);
      }
    } catch (err) {
      logger.error('[usePurchase] Failed to get offerings:', err);
      if (isMounted.current) setOfferingsLoading(false);
    }
  }, [rcAvailable]);

  useEffect(() => {
    fetchOfferings();
  }, [fetchOfferings]);

  const handlePurchase = async (plan: Plan) => {
    if (!profile) return;
    setIsLoading(true);
    hapticFeedback.medium();

    try {
      if (rcUIAvailable) {
        await handlePaywallResult();
        return;
      }

      if (rcAvailable && plan.rcPackage) {
        await handlePackagePurchase(plan);
        return;
      }

      await fallbackActivatePlan(plan);
    } catch (err) {
      logger.error('[usePurchase] Purchase error:', err);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!profile) return;
    setIsRestoring(true);
    hapticFeedback.light();

    try {
      const result = await revenueCatService.restorePurchases();
      if (result.isActive) {
        await subscriptionService.syncFromRevenueCat(profile.id);
        await refreshSubscription();
        hapticFeedback.success();
        Alert.alert('Restored', 'Your purchases have been restored.');
      } else {
        Alert.alert('Restoration Failed', 'No past purchases found.');
      }
    } catch (err) {
      logger.error('[usePurchase] Restoration error:', err);
      Alert.alert('Error', 'Could not restore purchases.');
    } finally {
      if (isMounted.current) setIsRestoring(false);
    }
  };

  return {
    selectedPlan,
    setSelectedPlan,
    isLoading,
    isRestoring,
    offerings,
    offeringsLoading,
    handlePurchase,
    handleRestore,
    rcAvailable
  };
}
