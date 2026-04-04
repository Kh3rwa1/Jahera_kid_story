import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import {
  X,
  Sparkles,
  Check,
  Globe,
  Volume2,
  BookOpen,
  Users,
  Zap,
  Star,
  Shield,
  Clock,
  Infinity as InfinityIcon,
  ChevronRight,
  RotateCcw,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useApp } from '@/contexts/AppContext';
import { revenueCatService, RCOffering } from '@/services/revenueCatService';
import { subscriptionService } from '@/services/subscriptionService';

const ENTITLEMENT_PRO = 'pro';
import { SPACING, BORDER_RADIUS, FONTS, SHADOWS } from '@/constants/theme';
import { hapticFeedback } from '@/utils/haptics';


const FREE_VS_PRO = [
  { label: 'Stories/month', free: '3', pro: 'Unlimited' },
  { label: 'AI narration', free: '✗', pro: '✓' },
  { label: 'Languages', free: '2', pro: '20+' },
  { label: 'Story length', free: 'Short', pro: 'All lengths' },
];

const PRO_FEATURES = [
  { icon: InfinityIcon, label: 'Unlimited stories', sub: 'Every single month', color: '#FF6B6B' },
  { icon: Globe, label: '20+ languages', sub: 'All unlocked instantly', color: '#4ECDC4' },
  { icon: Volume2, label: 'AI narration', sub: 'Every story voiced', color: '#45B7D1' },
  { icon: BookOpen, label: 'Long-form stories', sub: '250+ words per story', color: '#F59E0B' },
  { icon: Users, label: 'Family plan', sub: 'Up to 4 children', color: '#10B981' },
  { icon: Zap, label: 'Priority speed', sub: 'Instant generation', color: '#6366F1' },
];

const AVATARS = [
  { initials: 'SA', color: '#FF6B6B' },
  { initials: 'MK', color: '#4ECDC4' },
  { initials: 'JL', color: '#45B7D1' },
  { initials: 'RT', color: '#F59E0B' },
];

type PlanId = 'weekly' | 'monthly' | 'yearly' | 'family';

interface PlanDisplayItem {
  id: PlanId;
  label: string;
  price: string;
  period: string;
  badge: string | null;
  highlight: boolean;
  perMonth: string | null;
  description: string;
  rcPackage: any | null;
}

function buildPlans(offerings: RCOffering): PlanDisplayItem[] {
  const weeklyPrice = offerings.weekly?.product?.priceString ?? '$1.99';
  const monthlyPrice = offerings.monthly?.product?.priceString ?? '$6.99';
  const yearlyPrice = offerings.yearly?.product?.priceString ?? '$49.99';
  const familyPrice = offerings.family?.product?.priceString ?? '$9.99';

  const yearlyMonthly = offerings.yearly?.product?.price
    ? `$${(offerings.yearly.product.price / 12).toFixed(2)}/mo`
    : '$4.17/mo';

  return [
    {
      id: 'weekly',
      label: 'Weekly',
      price: weeklyPrice,
      period: '/week',
      badge: 'TRY IT OUT',
      highlight: false,
      perMonth: null,
      description: 'Try Pro risk-free for a week',
      rcPackage: offerings.weekly,
    },
    {
      id: 'monthly',
      label: 'Monthly',
      price: monthlyPrice,
      period: '/month',
      badge: null,
      highlight: false,
      perMonth: null,
      description: 'Full access, month to month',
      rcPackage: offerings.monthly,
    },
    {
      id: 'yearly',
      label: 'Annual',
      price: yearlyPrice,
      period: '/year',
      badge: 'BEST VALUE',
      highlight: true,
      perMonth: yearlyMonthly,
      description: 'Save ~40% vs monthly',
      rcPackage: offerings.yearly,
    },
    {
      id: 'family',
      label: 'Family',
      price: familyPrice,
      period: '/month',
      badge: 'UP TO 4 KIDS',
      highlight: false,
      perMonth: 'Per family',
      description: 'Up to 4 children included',
      rcPackage: offerings.family,
    },
  ];
}

function ShimmerCta({ onPress, isLoading, label, gradient, styles }: {
  onPress: () => void;
  isLoading: boolean;
  label: string;
  gradient: readonly [string, string, ...string[]];
  styles: any;
}) {
  const shimmerX = useSharedValue(-1);
  const scale = useSharedValue(1);

  useEffect(() => {
    shimmerX.value = withRepeat(
      withTiming(1, { duration: 2800, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmerX.value, [-1, 1], [-220, 220]) }],
  }));

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={scaleStyle}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 14 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
        activeOpacity={1}
        disabled={isLoading}
      >
        <LinearGradient
          colors={gradient as [string, string]}
          style={styles.ctaButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderRadius: BORDER_RADIUS.pill }]}>
            <Animated.View style={[styles.ctaShimmer, shimmerStyle]} />
          </View>
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Sparkles size={19} color="#FFFFFF" strokeWidth={2} />
          )}
          <Text style={styles.ctaButtonText}>{isLoading ? 'Processing...' : label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

function PlanCard({
  plan,
  selected,
  onSelect,
  COLORS,
  styles,
}: {
  plan: PlanDisplayItem;
  selected: boolean;
  onSelect: () => void;
  COLORS: any;
  styles: any;
}) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.97, { damping: 15 }),
      withSpring(1, { damping: 15 })
    );
    onSelect();
  };

  if (plan.highlight) {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
        <Animated.View style={animStyle}>
          <LinearGradient
            colors={selected ? ['#FF8C42', '#FF5C00'] : ['#FFF4EE', '#FFF4EE']}
            style={[styles.featuredPlanCard, selected && styles.featuredPlanCardSelected]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.featuredPlanBadgeRow}>
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredBadgeText}>BEST VALUE</Text>
              </View>
              <Text style={[styles.featuredSaving, { color: selected ? 'rgba(255,255,255,0.85)' : '#FF8C42' }]}>
                Save 40%
              </Text>
            </View>

            <View style={styles.featuredPlanBody}>
              <View style={styles.featuredPlanLeft}>
                <Text style={[styles.featuredPlanLabel, { color: selected ? '#FFFFFF' : '#1E293B' }]}>
                  Annual
                </Text>
                <Text style={[styles.featuredPlanDesc, { color: selected ? 'rgba(255,255,255,0.7)' : '#64748B' }]}>
                  Billed once per year
                </Text>
                {plan.perMonth && (
                  <View style={[styles.perMonthChip, { backgroundColor: selected ? 'rgba(255,255,255,0.2)' : '#FF8C4218' }]}>
                    <Text style={[styles.perMonthText, { color: selected ? '#FFFFFF' : '#FF8C42' }]}>
                      {plan.perMonth}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.featuredPlanRight}>
                <Text style={[styles.featuredPlanPrice, { color: selected ? '#FFFFFF' : '#1E293B' }]}>
                  {plan.price}
                </Text>
                <Text style={[styles.featuredPlanPeriod, { color: selected ? 'rgba(255,255,255,0.65)' : '#94A3B8' }]}>
                  {plan.period}
                </Text>
              </View>

              <View style={[styles.planCheckCircle, {
                backgroundColor: selected ? '#FFFFFF' : '#FF8C4220',
              }]}>
                {selected
                  ? <Check size={13} color="#FF8C42" strokeWidth={3} />
                  : <View style={styles.emptyCircleInner} />
                }
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
      <Animated.View style={animStyle}>
        <View style={[
          styles.planCard,
          { backgroundColor: COLORS.cardBackground },
          selected && { borderColor: COLORS.primary, borderWidth: 2 },
          !selected && { borderColor: COLORS.text.light + '25', borderWidth: 1.5 },
        ]}>
          {selected && (
            <LinearGradient
              colors={[COLORS.primary + '10', COLORS.primary + '03']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          )}

          <View style={styles.planCardInner}>
            <View style={styles.planLeft}>
              <View style={styles.planLabelRow}>
                <Text style={[styles.planLabel, { color: selected ? COLORS.primary : COLORS.text.primary }]}>
                  {plan.label}
                </Text>
                {plan.badge && (
                  <View style={[styles.inlineBadge, { backgroundColor: '#10B98118' }]}>
                    <Text style={[styles.inlineBadgeText, { color: '#10B981' }]}>{plan.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.planDescription, { color: COLORS.text.light }]}>
                {plan.description}
              </Text>
              {plan.perMonth && (
                <View style={[styles.planPerMonthChip, { backgroundColor: selected ? COLORS.primary + '18' : COLORS.text.light + '12' }]}>
                  <Text style={[styles.planPerMonthText, { color: selected ? COLORS.primary : COLORS.text.secondary }]}>
                    {plan.perMonth}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.planRight}>
              <Text style={[styles.planPrice, { color: selected ? COLORS.primary : COLORS.text.primary }]}>
                {plan.price}
              </Text>
              <Text style={[styles.planPeriod, { color: COLORS.text.light }]}>{plan.period}</Text>
            </View>

            <View style={[styles.planCheckCircle, {
              backgroundColor: selected ? COLORS.primary : COLORS.text.light + '20',
            }]}>
              {selected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
            </View>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function PaywallScreen() {
  const router = useRouter();
  const { currentTheme } = useTheme();
  const COLORS = currentTheme.colors;
  const { width: winWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const styles = useStyles(COLORS, insets, winWidth);
  const { profile, refreshSubscription } = useApp();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('yearly');
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [offerings, setOfferings] = useState<RCOffering>({ weekly: null, monthly: null, yearly: null, family: null, raw: null });
  const [offeringsLoading, setOfferingsLoading] = useState(true);

  const rcAvailable = revenueCatService.isAvailable();
  const rcUIAvailable = revenueCatService.isUIAvailable();
  const plans = buildPlans(offerings);
  const selectedPlanData = plans.find(p => p.id === selectedPlan) ?? plans[2];

  useEffect(() => {
    if (rcAvailable) {
      revenueCatService.getOfferings().then(o => {
        setOfferings(o);
        setOfferingsLoading(false);
      });
    } else {
      setOfferingsLoading(false);
    }
  }, [rcAvailable]);

  const handleGetStarted = async () => {
    if (!profile) return;
    setIsLoading(true);
    hapticFeedback.medium();

    try {
      if (rcUIAvailable) {
        const result = await revenueCatService.presentPaywall(offerings.raw);
        if (result.purchased || result.restored) {
          await subscriptionService.syncFromRevenueCat(profile.id);
          await refreshSubscription();
          hapticFeedback.success();
          Alert.alert(
            result.restored ? 'Purchases Restored' : 'Welcome to Pro!',
            result.restored
              ? 'Your subscription has been restored.'
              : 'Your subscription is now active. Enjoy unlimited stories!',
            [{ text: "Let's Go!", onPress: () => router.back() }]
          );
        }
        return;
      }

      if (rcAvailable && selectedPlanData.rcPackage) {
        const result = await revenueCatService.purchasePackage(selectedPlanData.rcPackage);
        if (result.cancelled) return;
        if (result.success) {
          await subscriptionService.syncFromRevenueCat(profile.id);
          await refreshSubscription();
          hapticFeedback.success();
          Alert.alert(
            'Welcome to Pro!',
            'Your subscription is now active. Enjoy unlimited stories!',
            [{ text: "Let's Go!", onPress: () => router.back() }]
          );
        } else {
          Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
        }
      } else {
        if (selectedPlan === 'family') {
          await subscriptionService.upgradeToFamily(profile.id);
        } else {
          await subscriptionService.startTrial(profile.id);
        }
        await refreshSubscription();
        hapticFeedback.success();
        Alert.alert(
          'Welcome to Pro!',
          'Your subscription is now active. Enjoy unlimited stories!',
          [{ text: "Let's Go!", onPress: () => router.back() }]
        );
      }
    } catch (err: any) {
      Alert.alert('Something went wrong', err?.message ?? 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!profile) return;
    setIsLoading(true);
    hapticFeedback.medium();

    try {
      if (rcAvailable && selectedPlanData.rcPackage) {
        const result = await revenueCatService.purchasePackage(selectedPlanData.rcPackage);
        if (result.cancelled) return;
        if (result.success) {
          await subscriptionService.syncFromRevenueCat(profile.id);
          await refreshSubscription();
          hapticFeedback.success();
          Alert.alert(
            'Welcome to Pro!',
            'Your subscription is now active. Enjoy unlimited stories!',
            [{ text: 'Start Exploring', onPress: () => router.back() }]
          );
        } else {
          Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
        }
      } else {
        if (selectedPlan === 'family') {
          await subscriptionService.upgradeToFamily(profile.id);
        } else {
          await subscriptionService.upgradeToPro(profile.id);
        }
        await refreshSubscription();
        hapticFeedback.success();
        Alert.alert(
          'Welcome to Pro!',
          'Your subscription is now active. Enjoy unlimited stories!',
          [{ text: 'Start Exploring', onPress: () => router.back() }]
        );
      }
    } catch (err: any) {
      Alert.alert('Something went wrong', err?.message ?? 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    if (!profile) return;

    if (rcUIAvailable) {
      setIsRestoring(true);
      hapticFeedback.light();
      try {
        const result = await revenueCatService.presentPaywallIfNeeded(ENTITLEMENT_PRO);
        if (result.purchased || result.restored) {
          await subscriptionService.syncFromRevenueCat(profile.id);
          await refreshSubscription();
          hapticFeedback.success();
          if (result.restored) {
            Alert.alert('Purchases Restored', 'Your subscription has been restored successfully.', [
              { text: 'Great!', onPress: () => router.back() },
            ]);
          }
        }
      } catch {
        Alert.alert('Restore Failed', 'Please try again or contact support.');
      } finally {
        setIsRestoring(false);
      }
      return;
    }

    setIsRestoring(true);
    hapticFeedback.light();
    try {
      const rcInfo = await revenueCatService.restorePurchases();
      if (rcInfo.isActive) {
        if (rcInfo.plan === 'family') {
          await subscriptionService.upgradeToFamily(profile.id);
        } else {
          await subscriptionService.upgradeToPro(profile.id);
        }
        await refreshSubscription();
        hapticFeedback.success();
        Alert.alert('Purchases Restored', 'Your subscription has been restored successfully.', [
          { text: 'Great!', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('No Purchases Found', 'We could not find any active subscriptions linked to your account.');
      }
    } catch {
      Alert.alert('Restore Failed', 'Please try again or contact support.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['top', 'bottom']}>
      <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill} />

      <View style={[styles.decorativeOrb1, { backgroundColor: COLORS.primary + '08' }]} />
      <View style={styles.decorativeOrb2} />

      <TouchableOpacity
        style={[styles.closeButton, { backgroundColor: COLORS.cardBackground, ...SHADOWS.sm }]}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <X size={17} color={COLORS.text.secondary} />
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.heroSection}>
          <View style={[styles.iconGlowOuter, { backgroundColor: COLORS.primary + '0A' }]}>
            <View style={[styles.iconGlowMid, { backgroundColor: COLORS.primary + '16' }]}>
              <LinearGradient
                colors={COLORS.gradients.sunset}
                style={styles.iconCircle}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Sparkles size={40} color="#FFFFFF" strokeWidth={1.5} />
              </LinearGradient>
            </View>
          </View>

          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} size={14} color="#F59E0B" fill="#F59E0B" strokeWidth={0} />
            ))}
            <Text style={[styles.ratingText, { color: COLORS.text.secondary }]}>4.9 · 2,400+ ratings</Text>
          </View>

          <Text style={[styles.heroTitle, { color: COLORS.text.primary }]}>
            Unlock Jahera Pro
          </Text>
          <Text style={[styles.heroSubtitle, { color: COLORS.text.secondary }]}>
            Unlimited magical stories for your child,{'\n'}personalized with AI
          </Text>

          <View style={styles.trustRow}>
            {[
              { icon: Shield, label: '7-Day Free Trial' },
              { icon: Clock, label: 'Cancel Anytime' },
            ].map((b, i) => {
              const Icon = b.icon;
              return (
                <View key={i} style={[styles.trustPill, { backgroundColor: COLORS.cardBackground, ...SHADOWS.xs }]}>
                  <Icon size={11} color={COLORS.primary} strokeWidth={2.5} />
                  <Text style={[styles.trustPillText, { color: COLORS.text.secondary }]}>{b.label}</Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(160).springify()} style={styles.sectionWrap}>
          <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>What you get</Text>
          <View style={styles.featuresGrid}>
            {PRO_FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <View
                  key={index}
                  style={[
                    styles.featureChip,
                    { 
                      backgroundColor: COLORS.cardBackground, 
                      width: (winWidth - SPACING.xl * 2 - SPACING.md) / 2,
                      ...SHADOWS.xs 
                    }
                  ]}
                >
                  <View style={[styles.featureIconBubble, { backgroundColor: feature.color + '18' }]}>
                    <Icon size={17} color={feature.color} strokeWidth={2} />
                  </View>
                  <Text style={[styles.featureChipLabel, { color: COLORS.text.primary }]}>{feature.label}</Text>
                  <Text style={[styles.featureChipSub, { color: COLORS.text.light }]}>{feature.sub}</Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(220).springify()} style={styles.sectionWrap}>
          <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>Free vs Pro</Text>
          <View style={[styles.compareTable, { backgroundColor: COLORS.cardBackground, ...SHADOWS.sm }]}>
            <View style={styles.compareHeader}>
              <Text style={[styles.compareHeaderLabel, { color: COLORS.text.light, flex: 2 }]}>Feature</Text>
              <Text style={[styles.compareHeaderLabel, { color: COLORS.text.light }]}>Free</Text>
              <LinearGradient
                colors={COLORS.gradients.sunset}
                style={styles.compareProHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.compareProHeaderText}>Pro</Text>
              </LinearGradient>
            </View>
            {FREE_VS_PRO.map((row, i) => (
              <View key={i} style={[styles.compareRow, i < FREE_VS_PRO.length - 1 && { borderBottomWidth: 1, borderBottomColor: COLORS.text.light + '12' }]}>
                <Text style={[styles.compareRowLabel, { color: COLORS.text.secondary, flex: 2 }]}>{row.label}</Text>
                <Text style={[styles.compareRowFree, { color: COLORS.text.light }]}>{row.free}</Text>
                <Text style={[styles.compareRowPro, { color: COLORS.primary }]}>{row.pro}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(280).springify()} style={styles.sectionWrap}>
          <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>Choose your plan</Text>

          {offeringsLoading ? (
            <View style={styles.offeringsLoader}>
              <ActivityIndicator color={COLORS.primary} size="small" />
              <Text style={[styles.offeringsLoaderText, { color: COLORS.text.secondary }]}>
                Loading plans...
              </Text>
            </View>
          ) : (
            <View style={styles.plansList}>
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  selected={selectedPlan === plan.id}
                  onSelect={() => { setSelectedPlan(plan.id); hapticFeedback.light(); }}
                  COLORS={COLORS}
                  styles={styles}
                />
              ))}
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(340).springify()} style={styles.ctaSection}>
          <ShimmerCta
            onPress={handleGetStarted}
            isLoading={isLoading}
            label="Start 7-Day Free Trial"
            gradient={COLORS.gradients.sunset}
            styles={styles}
          />

          <TouchableOpacity
            onPress={handleSubscribe}
            style={[styles.subscribeButton, { borderColor: COLORS.text.light + '30', backgroundColor: COLORS.cardBackground }]}
            activeOpacity={0.8}
            disabled={isLoading || isRestoring}
          >
            <Text style={[styles.subscribeButtonText, { color: COLORS.text.secondary }]}>
              Subscribe Now
            </Text>
            <ChevronRight size={15} color={COLORS.text.light} strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.socialProofRow}>
            <View style={styles.avatarStack}>
              {AVATARS.map((a, i) => (
                <View key={i} style={[styles.avatarBubble, { backgroundColor: a.color, marginLeft: i > 0 ? -9 : 0, borderColor: COLORS.background }]}>
                  <Text style={styles.avatarInitials}>{a.initials}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.socialProofText, { color: COLORS.text.secondary }]}>
              Join 10,000+ families reading
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleRestorePurchases}
            style={styles.restoreButton}
            activeOpacity={0.7}
            disabled={isLoading || isRestoring}
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color={COLORS.text.light} />
            ) : (
              <RotateCcw size={13} color={COLORS.text.light} strokeWidth={2} />
            )}
            <Text style={[styles.restoreText, { color: COLORS.text.light }]}>
              {isRestoring ? 'Restoring...' : 'Restore Purchases'}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.disclaimer, { color: COLORS.text.light }]}>
            Cancel anytime. No hidden fees. Billed through your app store.
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = (C: any, insets: any, winWidth: number) => {
  return useMemo(() => StyleSheet.create({
    container: { flex: 1, overflow: 'hidden' },
    decorativeOrb1: {
      position: 'absolute',
      width: 320,
      height: 320,
      borderRadius: 160,
      top: -100,
      right: -100,
      zIndex: 0,
    },
    decorativeOrb2: {
      position: 'absolute',
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: 'rgba(78,205,196,0.05)',
      bottom: 120,
      left: -60,
      zIndex: 0,
    },
    closeButton: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 52 : 12,
      right: SPACING.xl,
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    scrollContent: { paddingBottom: 52 },

    heroSection: {
      alignItems: 'center',
      paddingTop: SPACING.xxxl + SPACING.xl + 12,
      paddingHorizontal: SPACING.xl,
      paddingBottom: SPACING.xxl,
      gap: SPACING.md,
    },
    iconGlowOuter: {
      width: 128,
      height: 128,
      borderRadius: 64,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    iconGlowMid: {
      width: 104,
      height: 104,
      borderRadius: 52,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      ...SHADOWS.lg,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    ratingText: {
      fontSize: 12,
      fontFamily: FONTS.medium,
    },
    heroTitle: {
      fontSize: 32,
      fontFamily: FONTS.extrabold,
      textAlign: 'center',
      letterSpacing: -1,
    },
    heroSubtitle: {
      fontSize: 15,
      fontFamily: FONTS.medium,
      textAlign: 'center',
      lineHeight: 22,
    },
    trustRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      marginTop: SPACING.sm,
    },
    trustPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: BORDER_RADIUS.pill,
    },
    trustPillText: {
      fontSize: 11,
      fontFamily: FONTS.bold,
      letterSpacing: 0.3,
      opacity: 0.8,
    },

    sectionWrap: {
      paddingHorizontal: SPACING.xl,
      marginBottom: SPACING.xxxl,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: FONTS.bold,
      marginBottom: SPACING.lg,
      paddingLeft: 2,
    },

    featuresGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.md,
    },
    featureChip: {
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.xl,
      gap: 6,
    },
    featureIconBubble: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    featureChipLabel: {
      fontSize: 13,
      fontFamily: FONTS.bold,
    },
    featureChipSub: {
      fontSize: 10,
      fontFamily: FONTS.medium,
      lineHeight: 14,
    },

    compareTable: {
      borderRadius: BORDER_RADIUS.xl,
      overflow: 'hidden',
    },
    compareHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.lg,
      paddingVertical: 14,
      backgroundColor: 'rgba(0,0,0,0.02)',
    },
    compareHeaderLabel: {
      flex: 1,
      fontSize: 11,
      fontFamily: FONTS.bold,
      textAlign: 'center',
      letterSpacing: 0.5,
    },
    compareProHeader: {
      flex: 1,
      paddingVertical: 6,
      borderRadius: BORDER_RADIUS.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    compareProHeaderText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontFamily: FONTS.extrabold,
    },
    compareRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.lg,
      paddingVertical: 14,
    },
    compareRowLabel: {
      fontSize: 13,
      fontFamily: FONTS.medium,
    },
    compareRowFree: {
      flex: 1,
      fontSize: 12,
      fontFamily: FONTS.bold,
      textAlign: 'center',
      opacity: 0.6,
    },
    compareRowPro: {
      flex: 1,
      fontSize: 13,
      fontFamily: FONTS.bold,
      textAlign: 'center',
    },

    plansList: {
      gap: SPACING.md,
    },
    planCard: {
      borderRadius: BORDER_RADIUS.xl,
      overflow: 'hidden',
    },
    planCardInner: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: SPACING.lg,
    },
    planLeft: {
      flex: 1,
      gap: 4,
    },
    planLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    planLabel: {
      fontSize: 16,
      fontFamily: FONTS.bold,
    },
    inlineBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    inlineBadgeText: {
      fontSize: 10,
      fontFamily: FONTS.extrabold,
      letterSpacing: 0.5,
    },
    planDescription: {
      fontSize: 12,
      fontFamily: FONTS.medium,
      opacity: 0.8,
    },
    planPerMonthChip: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: BORDER_RADIUS.pill,
      marginTop: 6,
    },
    planPerMonthText: {
      fontSize: 11,
      fontFamily: FONTS.bold,
    },
    planRight: {
      alignItems: 'flex-end',
      marginRight: SPACING.lg,
    },
    planPrice: {
      fontSize: 18,
      fontFamily: FONTS.extrabold,
    },
    planPeriod: {
      fontSize: 12,
      fontFamily: FONTS.medium,
    },
    planCheckCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyCircleInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: 'rgba(0,0,0,0.05)',
    },

    featuredPlanCard: {
      borderRadius: BORDER_RADIUS.xl,
      padding: SPACING.lg,
      ...SHADOWS.md,
    },
    featuredPlanCardSelected: {
      ...SHADOWS.lg,
    },
    featuredPlanBadgeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.md,
    },
    featuredBadge: {
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: BORDER_RADIUS.pill,
    },
    featuredBadgeText: {
      fontSize: 10,
      fontFamily: FONTS.extrabold,
      color: '#FF8C42',
      letterSpacing: 0.5,
    },
    featuredSaving: {
      fontSize: 11,
      fontFamily: FONTS.bold,
    },
    featuredPlanBody: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    featuredPlanLeft: {
      flex: 1,
      gap: 4,
    },
    featuredPlanLabel: {
      fontSize: 20,
      fontFamily: FONTS.extrabold,
    },
    featuredPlanDesc: {
      fontSize: 12,
      fontFamily: FONTS.medium,
    },
    perMonthChip: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: BORDER_RADIUS.pill,
      marginTop: 8,
    },
    perMonthText: {
      fontSize: 12,
      fontFamily: FONTS.extrabold,
    },
    featuredPlanRight: {
      alignItems: 'flex-end',
      marginRight: SPACING.lg,
    },
    featuredPlanPrice: {
      fontSize: 22,
      fontFamily: FONTS.extrabold,
    },
    featuredPlanPeriod: {
      fontSize: 13,
      fontFamily: FONTS.medium,
    },

    offeringsLoader: {
      height: 200,
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.md,
    },
    offeringsLoaderText: {
      fontSize: 14,
      fontFamily: FONTS.medium,
    },

    ctaSection: {
      paddingHorizontal: SPACING.xl,
      alignItems: 'center',
      gap: SPACING.md,
    },
    ctaButton: {
      width: winWidth - SPACING.xl * 2,
      paddingVertical: 18,
      borderRadius: BORDER_RADIUS.pill,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.sm,
      ...SHADOWS.lg,
    },
    ctaShimmer: {
      position: 'absolute',
      width: 140,
      height: '300%',
      backgroundColor: 'rgba(255,255,255,0.2)',
      transform: [{ rotate: '25deg' }],
    },
    ctaButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontFamily: FONTS.bold,
      letterSpacing: 0.5,
    },
    subscribeButton: {
      width: winWidth - SPACING.xl * 2,
      paddingVertical: 16,
      borderRadius: BORDER_RADIUS.pill,
      borderWidth: 1.5,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.xs,
    },
    subscribeButtonText: {
      fontSize: 15,
      fontFamily: FONTS.bold,
    },
    socialProofRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: SPACING.sm,
    },
    avatarStack: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatarBubble: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitials: {
      fontSize: 8,
      fontFamily: FONTS.bold,
      color: '#FFFFFF',
    },
    socialProofText: {
      fontSize: 12,
      fontFamily: FONTS.medium,
    },
    restoreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      marginTop: 4,
    },
    restoreText: {
      fontSize: 11,
      fontFamily: FONTS.bold,
      textDecorationLine: 'underline',
    },
    disclaimer: {
      fontSize: 10,
      fontFamily: FONTS.medium,
      textAlign: 'center',
      opacity: 0.6,
      marginTop: SPACING.sm,
    },
  }), [C, insets, winWidth]);
};
