import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { SPACING, BORDER_RADIUS, FONTS, SHADOWS } from '@/constants/theme';
import { hapticFeedback } from '@/utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

type PlanId = 'monthly' | 'yearly' | 'family';

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
  const monthlyPrice = offerings.monthly?.product?.priceString ?? '$6.99';
  const yearlyPrice = offerings.yearly?.product?.priceString ?? '$49.99';
  const familyPrice = offerings.family?.product?.priceString ?? '$9.99';

  const yearlyMonthly = offerings.yearly?.product?.price
    ? `$${(offerings.yearly.product.price / 12).toFixed(2)}/mo`
    : '$4.17/mo';

  return [
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

function ShimmerCta({ onPress, isLoading, label, gradient }: {
  onPress: () => void;
  isLoading: boolean;
  label: string;
  gradient: readonly [string, string, ...string[]];
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
}: {
  plan: PlanDisplayItem;
  selected: boolean;
  onSelect: () => void;
  COLORS: any;
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
  const { profile, refreshSubscription } = useApp();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('yearly');
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [offerings, setOfferings] = useState<RCOffering>({ monthly: null, yearly: null, family: null, raw: null });
  const [offeringsLoading, setOfferingsLoading] = useState(true);

  const rcAvailable = revenueCatService.isAvailable();
  const plans = buildPlans(offerings);
  const selectedPlanData = plans.find(p => p.id === selectedPlan) ?? plans[1];

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

  const handleSubscribe = async () => {
    if (!profile) return;
    setIsLoading(true);
    hapticFeedback.medium();

    try {
      if (rcAvailable && selectedPlanData.rcPackage) {
        const result = await revenueCatService.purchasePackage(selectedPlanData.rcPackage);

        if (result.cancelled) {
          setIsLoading(false);
          return;
        }

        if (result.success) {
          if (result.plan === 'family') {
            await subscriptionService.upgradeToFamily(profile.$id);
          } else {
            await subscriptionService.upgradeToPro(profile.$id);
          }
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
          await subscriptionService.upgradeToFamily(profile.$id);
        } else {
          await subscriptionService.upgradeToPro(profile.$id);
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

  const handleStartTrial = async () => {
    if (!profile) return;
    setIsLoading(true);
    hapticFeedback.medium();

    try {
      if (rcAvailable && selectedPlanData.rcPackage) {
        const result = await revenueCatService.purchasePackage(selectedPlanData.rcPackage);

        if (result.cancelled) {
          setIsLoading(false);
          return;
        }

        if (result.success) {
          await subscriptionService.upgradeToPro(profile.$id);
          await refreshSubscription();
          hapticFeedback.success();
          Alert.alert(
            'Welcome to Pro!',
            'Your trial is now active. Enjoy full access!',
            [{ text: "Let's Go!", onPress: () => router.back() }]
          );
        } else {
          Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
        }
      } else {
        await subscriptionService.startTrial(profile.$id);
        await refreshSubscription();
        hapticFeedback.success();
        Alert.alert(
          '7-Day Free Trial Started!',
          'Enjoy full Pro access for 7 days, completely free.',
          [{ text: "Let's Go!", onPress: () => router.back() }]
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
    setIsRestoring(true);
    hapticFeedback.light();

    try {
      const rcInfo = await revenueCatService.restorePurchases();

      if (rcInfo.isActive) {
        if (rcInfo.plan === 'family') {
          await subscriptionService.upgradeToFamily(profile.$id);
        } else {
          await subscriptionService.upgradeToPro(profile.$id);
        }
        await refreshSubscription();
        hapticFeedback.success();
        Alert.alert(
          'Purchases Restored',
          'Your subscription has been restored successfully.',
          [{ text: 'Great!', onPress: () => router.back() }]
        );
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
                  style={[styles.featureChip, { backgroundColor: COLORS.cardBackground, ...SHADOWS.xs }]}
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
                />
              ))}
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(340).springify()} style={styles.ctaSection}>
          <ShimmerCta
            onPress={handleStartTrial}
            isLoading={isLoading}
            label="Start 7-Day Free Trial"
            gradient={COLORS.gradients.sunset}
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

const styles = StyleSheet.create({
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
    fontFamily: FONTS.semibold,
    marginLeft: 2,
  },
  heroTitle: {
    fontSize: 32,
    fontFamily: FONTS.display,
    textAlign: 'center',
    letterSpacing: -0.6,
    lineHeight: 38,
  },
  heroSubtitle: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    textAlign: 'center',
    lineHeight: 23,
  },
  trustRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  trustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.pill,
  },
  trustPillText: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
  },

  sectionWrap: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xxl,
  },
  sectionTitle: {
    fontSize: 19,
    fontFamily: FONTS.displayBold,
    marginBottom: SPACING.lg,
    letterSpacing: -0.3,
  },

  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  featureChip: {
    width: (SCREEN_WIDTH - SPACING.xl * 2 - SPACING.sm) / 2,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    gap: 5,
  },
  featureIconBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  featureChipLabel: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    lineHeight: 17,
  },
  featureChipSub: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    lineHeight: 15,
  },

  compareTable: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  compareHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  compareHeaderLabel: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    width: 70,
    textAlign: 'center',
  },
  compareProHeader: {
    width: 70,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.pill,
    alignItems: 'center',
  },
  compareProHeaderText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
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
    fontSize: 13,
    fontFamily: FONTS.semibold,
    width: 70,
    textAlign: 'center',
  },
  compareRowPro: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    width: 70,
    textAlign: 'center',
  },

  offeringsLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xxl,
  },
  offeringsLoaderText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },

  plansList: {
    gap: SPACING.sm,
  },

  featuredPlanCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  featuredPlanCardSelected: {
    ...SHADOWS.lg,
  },
  featuredPlanBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featuredBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.pill,
  },
  featuredBadgeText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    letterSpacing: 1.2,
  },
  featuredSaving: {
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  featuredPlanBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  featuredPlanLeft: {
    flex: 1,
    gap: 4,
  },
  featuredPlanLabel: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    lineHeight: 21,
  },
  featuredPlanDesc: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  perMonthChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.pill,
    marginTop: 4,
  },
  perMonthText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
  },
  featuredPlanRight: {
    alignItems: 'flex-end',
    gap: 1,
  },
  featuredPlanPrice: {
    fontSize: 28,
    fontFamily: FONTS.display,
    lineHeight: 32,
  },
  featuredPlanPeriod: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },

  planCard: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.xs,
  },
  planCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  planLeft: {
    flex: 1,
    gap: 3,
  },
  planLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  planLabel: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    lineHeight: 19,
  },
  inlineBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.pill,
  },
  inlineBadgeText: {
    fontSize: 9,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  planDescription: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    lineHeight: 16,
  },
  planPerMonthChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.pill,
    marginTop: 3,
  },
  planPerMonthText: {
    fontSize: 10,
    fontFamily: FONTS.semibold,
  },
  planRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  planPrice: {
    fontSize: 24,
    fontFamily: FONTS.display,
    lineHeight: 28,
  },
  planPeriod: {
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
  planCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  emptyCircleInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,140,66,0.4)',
  },

  ctaSection: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 18,
    borderRadius: BORDER_RADIUS.pill,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  ctaShimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 70,
    backgroundColor: 'rgba(255,255,255,0.16)',
    transform: [{ skewX: '-20deg' }],
  },
  ctaButtonText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 15,
    borderRadius: BORDER_RADIUS.pill,
    borderWidth: 1.5,
  },
  subscribeButtonText: {
    fontSize: 14,
    fontFamily: FONTS.semibold,
  },

  socialProofRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarInitials: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  socialProofText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  restoreText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  disclaimer: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 16,
    paddingBottom: 4,
  },
});
