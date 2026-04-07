import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { X, RotateCcw } from 'lucide-react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { usePurchase, Plan, PlanId } from '@/hooks/usePurchase';
import { PlanCard } from '@/components/paywall/PlanCard';
import { FeatureList } from '@/components/paywall/FeatureList';
import { ShimmerCta } from '@/components/ui/ShimmerCta';
import { SPACING, BORDER_RADIUS, FONTS, SHADOWS } from '@/constants/theme';
import { ThemeColors, EdgeInsets } from '@/types/theme';
import { RCOffering } from '@/services/revenueCatService';

const FREE_VS_PRO = [
  { label: 'Stories/month', free: '3', pro: 'Unlimited' },
  { label: 'AI narration', free: '✗', pro: '✓' },
  { label: 'Languages', free: '2', pro: '20+' },
  { label: 'Parent tools', free: 'Basic', pro: 'Full' },
];

function buildPlans(offerings: RCOffering): Plan[] {
  const weeklyPrice = offerings.weekly?.product?.priceString ?? '$1.99';
  const monthlyPrice = offerings.monthly?.product?.priceString ?? '$6.99';
  const yearlyPrice = offerings.yearly?.product?.priceString ?? '$49.99';
  const familyPrice = offerings.family?.product?.priceString ?? '$9.99';

  return [
    {
      id: 'weekly',
      label: 'Weekly',
      price: weeklyPrice,
      period: 'week',
      rcPackage: offerings.weekly,
    },
    {
      id: 'monthly',
      label: 'Monthly',
      price: monthlyPrice,
      period: 'month',
      rcPackage: offerings.monthly,
    },
    {
      id: 'yearly',
      label: 'Annual',
      price: yearlyPrice,
      period: 'year',
      save: '40%',
      isPopular: true,
      rcPackage: offerings.yearly,
    },
    {
      id: 'family',
      label: 'Family Plan',
      price: familyPrice,
      period: 'month',
      rcPackage: offerings.family,
    },
  ];
}

export default function PaywallScreen() {
  const router = useRouter();
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  const { width: winWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const styles = useStyles(colors, insets, winWidth);

  const {
    selectedPlan,
    setSelectedPlan,
    isLoading,
    isRestoring,
    offerings,
    offeringsLoading,
    handlePurchase,
    handleRestore,
  } = usePurchase();

  const plans = useMemo(() => buildPlans(offerings), [offerings]);
  const activePlan = useMemo(() => 
    plans.find(p => p.id === selectedPlan) || plans[2], 
  [plans, selectedPlan]);

  const handleClose = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Section */}
        <LinearGradient
          colors={[colors.primary + '15', 'transparent']}
          style={styles.headerGradient}
        >
          <SafeAreaView edges={['top']} style={styles.header}>
            <View style={styles.topRow}>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <X size={24} color={colors.text.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleRestore} 
                style={styles.restoreBtn}
                disabled={isRestoring}
              >
                <RotateCcw size={16} color={colors.text.light} />
                <Text style={[styles.restoreText, { color: colors.text.light }]}>
                  {isRestoring ? 'Restoring...' : 'Restore'}
                </Text>
              </TouchableOpacity>
            </View>

            <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.hero}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
                <Image 
                  source={require('@/assets/images/icon.png')} 
                  style={styles.heroIcon} 
                />
              </View>
              <Text style={[styles.heroTitle, { color: colors.text.primary }]}>
                Unlock the Magic
              </Text>
              <Text style={[styles.heroSubtitle, { color: colors.text.secondary }]}>
                Create unlimited stories and adventures for your children with Jahera Pro.
              </Text>
            </Animated.View>
          </SafeAreaView>
        </LinearGradient>

        {/* Feature List Component */}
        <FeatureList colors={colors} />

        {/* Plan Comparison (Optional for clarity) */}
        <View style={styles.comparisonTable}>
          <View style={[styles.tableHeader, { borderBottomColor: colors.text.light + '15' }]}>
            <Text style={[styles.tableLabel, { color: colors.text.light }]}>Feature</Text>
            <Text style={[styles.tableLabel, { color: colors.text.light }]}>Free</Text>
            <Text style={[styles.tableLabel, { color: colors.primary, fontFamily: FONTS.bold }]}>Pro</Text>
          </View>
          {FREE_VS_PRO.map((item) => (
            <View key={item.label} style={styles.tableRow}>
              <Text style={[styles.rowLabel, { color: colors.text.secondary }]}>{item.label}</Text>
              <Text style={[styles.rowValue, { color: colors.text.light }]}>{item.free}</Text>
              <Text style={[styles.rowValue, { color: colors.text.primary, fontFamily: FONTS.bold }]}>{item.pro}</Text>
            </View>
          ))}
        </View>

        {/* Plan Selection Section */}
        <View style={styles.plansContainer}>
          <Text style={[styles.plansTitle, { color: colors.text.primary }]}>
            Choose Your Plan
          </Text>
          {offeringsLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={{ color: colors.text.light }}>Loading plans...</Text>
            </View>
          ) : (
            plans.map(plan => (
              <PlanCard 
                key={plan.id}
                plan={plan}
                selected={selectedPlan === plan.id}
                onSelect={() => setSelectedPlan(plan.id)}
                colors={colors}
              />
            ))
          )}
        </View>

        <View style={styles.footerSpacing} />
      </ScrollView>

      {/* Floating CTA Section */}
      <View style={[styles.floatingCta, { borderTopColor: colors.text.light + '10' }]}>
        <ShimmerCta 
          label={selectedPlan === 'family' ? 'Get Family Pro' : 'Try 3 Days Free'}
          onPress={() => handlePurchase(activePlan)}
          isLoading={isLoading}
          gradient={['#FF8C42', '#FF5C00']}
          renderIcon={() => (
            <Image 
              source={require('@/assets/images/icon.png')} 
              style={{ width: 22, height: 22, tintColor: '#FFFFFF' }} 
            />
          )}
        />
        <Text style={[styles.disclaimer, { color: colors.text.light }]}>
          Recurring billing. Cancel anytime in App Store.
        </Text>
      </View>
    </View>
  );
}

const useStyles = (colors: ThemeColors, insets: EdgeInsets, width: number) => StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 160,
  },
  headerGradient: {
    marginBottom: 20,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  restoreText: {
    fontSize: 13,
    fontFamily: FONTS.semibold,
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...SHADOWS.md,
  },
  heroIcon: {
    width: 32,
    height: 32,
    tintColor: '#FFF',
  },
  heroTitle: {
    fontSize: 32,
    fontFamily: FONTS.display,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    textAlign: 'center',
    lineHeight: 24,
  },
  comparisonTable: {
    marginHorizontal: SPACING.lg,
    marginBottom: 32,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: BORDER_RADIUS.xl,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  tableLabel: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  rowLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  rowValue: {
    width: 60,
    textAlign: 'center',
    fontSize: 14,
  },
  plansContainer: {
    paddingHorizontal: SPACING.lg,
  },
  plansTitle: {
    fontSize: 22,
    fontFamily: FONTS.display,
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  footerSpacing: {
    height: 40,
  },
  floatingCta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    paddingHorizontal: SPACING.xl,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
    ...SHADOWS.lg,
  },
  disclaimer: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    textAlign: 'center',
    marginTop: 12,
  },
});
