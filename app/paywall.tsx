import { useState } from 'react';
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
} from 'react-native-reanimated';
import {
  X,
  Sparkles,
  Check,
  Infinity,
  Globe,
  Volume2,
  BookOpen,
  Users,
  Zap,
  Star,
  Shield,
  Clock,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useApp } from '@/contexts/AppContext';
import { subscriptionService } from '@/services/subscriptionService';
import { SPACING, BORDER_RADIUS, FONTS, SHADOWS } from '@/constants/theme';
import { hapticFeedback } from '@/utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PRO_FEATURES = [
  { icon: Infinity, label: 'Unlimited stories', sub: 'Every single month', color: '#FF6B6B' },
  { icon: Globe, label: '20+ languages', sub: 'All unlocked instantly', color: '#4ECDC4' },
  { icon: Volume2, label: 'AI narration', sub: 'Every story voiced', color: '#45B7D1' },
  { icon: BookOpen, label: 'Long-form stories', sub: '250+ words per story', color: '#96CEB4' },
  { icon: Users, label: 'Family plan', sub: 'Up to 4 children', color: '#FFEAA7' },
  { icon: Zap, label: 'Priority speed', sub: 'Instant generation', color: '#DDA0DD' },
];

const PLANS = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: '$6.99',
    period: '/month',
    badge: null,
    highlight: false,
    perMonth: null,
    description: 'Full access, month to month',
  },
  {
    id: 'yearly',
    label: 'Annual',
    price: '$49.99',
    period: '/year',
    badge: 'BEST VALUE',
    highlight: true,
    perMonth: '$4.17/mo',
    description: 'Save 40% vs monthly',
  },
  {
    id: 'family',
    label: 'Family',
    price: '$9.99',
    period: '/month',
    badge: 'UP TO 4 KIDS',
    highlight: false,
    perMonth: 'Per family',
    description: 'Up to 4 children included',
  },
];

const TRUST_BADGES = [
  { icon: Shield, label: '7-Day Free Trial' },
  { icon: Clock, label: 'Cancel Anytime' },
  { icon: Star, label: 'No Hidden Fees' },
];

function PlanCard({
  plan,
  selected,
  onSelect,
  COLORS,
}: {
  plan: (typeof PLANS)[0];
  selected: boolean;
  onSelect: () => void;
  COLORS: any;
}) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.97, { damping: 15 }, () => {
      scale.value = withSpring(1, { damping: 15 });
    });
    onSelect();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
      <Animated.View style={animStyle}>
        {plan.badge && (
          <View style={styles.badgeFloating}>
            <LinearGradient
              colors={plan.highlight ? ['#FF8C42', '#FF6B35'] : ['#2ECC71', '#27AE60']}
              style={styles.badgeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.badgeText}>{plan.badge}</Text>
            </LinearGradient>
          </View>
        )}
        <View
          style={[
            styles.planCard,
            { backgroundColor: COLORS.cardBackground },
            selected && { borderColor: COLORS.primary, borderWidth: 2.5 },
            !selected && { borderColor: COLORS.text.light + '20', borderWidth: 1.5 },
            plan.badge && { marginTop: 14 },
          ]}
        >
          {selected && (
            <LinearGradient
              colors={[COLORS.primary + '12', COLORS.primary + '04']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          )}

          <View style={styles.planCardInner}>
            <View style={styles.planLeft}>
              <Text style={[styles.planLabel, { color: selected ? COLORS.primary : COLORS.text.secondary }]}>
                {plan.label}
              </Text>
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

            <View style={[
              styles.planCheckCircle,
              { backgroundColor: selected ? COLORS.primary : COLORS.text.light + '20' },
            ]}>
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
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!profile) return;
    setIsLoading(true);
    hapticFeedback.medium();

    try {
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
    } catch {
      Alert.alert('Something went wrong', 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTrial = async () => {
    if (!profile) return;
    setIsLoading(true);
    hapticFeedback.medium();

    try {
      await subscriptionService.startTrial(profile.$id);
      await refreshSubscription();
      hapticFeedback.success();
      Alert.alert(
        '7-Day Free Trial Started!',
        'Enjoy full Pro access for 7 days, completely free.',
        [{ text: "Let's Go!", onPress: () => router.back() }]
      );
    } catch {
      Alert.alert('Something went wrong', 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['top', 'bottom']}>
      <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill} />

      <View style={styles.decorativeOrb1} />
      <View style={styles.decorativeOrb2} />

      <TouchableOpacity
        style={[styles.closeButton, { backgroundColor: COLORS.cardBackground, ...SHADOWS.sm }]}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <X size={18} color={COLORS.text.secondary} />
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.heroSection}>
          <View style={styles.iconGlowOuter}>
            <View style={[styles.iconGlowInner, { backgroundColor: COLORS.primary + '20' }]}>
              <LinearGradient
                colors={COLORS.gradients.sunset}
                style={styles.iconCircle}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Sparkles size={44} color="#FFFFFF" strokeWidth={1.5} />
              </LinearGradient>
            </View>
          </View>

          <Text style={[styles.heroTag, { color: COLORS.primary }]}>PRO MEMBERSHIP</Text>
          <Text style={[styles.heroTitle, { color: COLORS.text.primary }]}>
            Unlock Jahera Pro
          </Text>
          <Text style={[styles.heroSubtitle, { color: COLORS.text.secondary }]}>
            Unlimited magical stories for your child,{'\n'}personalized with AI
          </Text>

          <View style={styles.trustBadgesRow}>
            {TRUST_BADGES.map((badge, i) => {
              const Icon = badge.icon;
              return (
                <View key={i} style={[styles.trustBadge, { backgroundColor: COLORS.cardBackground, ...SHADOWS.xs }]}>
                  <Icon size={12} color={COLORS.primary} strokeWidth={2.5} />
                  <Text style={[styles.trustBadgeText, { color: COLORS.text.secondary }]}>{badge.label}</Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(180).springify()} style={styles.featuresSection}>
          <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>Everything you get</Text>
          <View style={styles.featuresGrid}>
            {PRO_FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <View
                  key={index}
                  style={[styles.featureChip, { backgroundColor: COLORS.cardBackground, ...SHADOWS.xs }]}
                >
                  <View style={[styles.featureIconBubble, { backgroundColor: feature.color + '20' }]}>
                    <Icon size={18} color={feature.color} strokeWidth={2} />
                  </View>
                  <Text style={[styles.featureChipLabel, { color: COLORS.text.primary }]}>{feature.label}</Text>
                  <Text style={[styles.featureChipSub, { color: COLORS.text.light }]}>{feature.sub}</Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(260).springify()} style={styles.plansSection}>
          <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>Choose your plan</Text>
          <View style={styles.plansList}>
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                selected={selectedPlan === plan.id}
                onSelect={() => { setSelectedPlan(plan.id); hapticFeedback.light(); }}
                COLORS={COLORS}
              />
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(340).springify()} style={styles.ctaSection}>
          <TouchableOpacity
            onPress={handleSubscribe}
            activeOpacity={0.9}
            disabled={isLoading}
          >
            <LinearGradient
              colors={COLORS.gradients.sunset}
              style={styles.ctaButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Sparkles size={20} color="#FFFFFF" strokeWidth={2} />
              )}
              <Text style={styles.ctaButtonText}>
                {isLoading ? 'Processing...' : 'Subscribe Now'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleStartTrial}
            style={[styles.trialButton, { backgroundColor: COLORS.primary + '12', borderColor: COLORS.primary + '30' }]}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <Text style={[styles.trialButtonText, { color: COLORS.primary }]}>
              Start 7-Day Free Trial
            </Text>
          </TouchableOpacity>

          <View style={styles.socialProofRow}>
            <View style={styles.avatarStack}>
              {['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'].map((color, i) => (
                <View key={i} style={[styles.avatarBubble, { backgroundColor: color, marginLeft: i > 0 ? -8 : 0 }]}>
                  <Text style={styles.avatarEmoji}>
                    {['😊', '🎉', '✨', '🌟'][i]}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={[styles.socialProofText, { color: COLORS.text.secondary }]}>
              Join 10,000+ families already reading
            </Text>
          </View>

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
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255,107,107,0.06)',
    top: -80,
    right: -80,
    zIndex: 0,
  },
  decorativeOrb2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(78,205,196,0.05)',
    bottom: 100,
    left: -60,
    zIndex: 0,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 14,
    right: SPACING.xl,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: SPACING.xxxl + SPACING.xl + 16,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
    gap: SPACING.md,
  },
  iconGlowOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,107,107,0.06)',
    marginBottom: 4,
  },
  iconGlowInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
  heroTag: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 34,
    fontFamily: FONTS.display,
    textAlign: 'center',
    letterSpacing: -0.8,
    lineHeight: 40,
  },
  heroSubtitle: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    textAlign: 'center',
    lineHeight: 23,
  },
  trustBadgesRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.pill,
  },
  trustBadgeText: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
  },
  featuresSection: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 20,
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
    gap: 6,
  },
  featureIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  featureChipLabel: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    lineHeight: 18,
  },
  featureChipSub: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    lineHeight: 16,
  },
  plansSection: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  plansList: {
    gap: SPACING.sm,
  },
  badgeFloating: {
    alignSelf: 'flex-start',
    marginLeft: SPACING.lg,
    marginBottom: -8,
    zIndex: 2,
  },
  badgeGradient: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.pill,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  planCard: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  planCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  planLeft: {
    flex: 1,
    gap: 4,
  },
  planLabel: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    lineHeight: 20,
  },
  planDescription: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    lineHeight: 16,
  },
  planPerMonthChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.pill,
    marginTop: 4,
  },
  planPerMonthText: {
    fontSize: 11,
    fontFamily: FONTS.semibold,
  },
  planRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  planPrice: {
    fontSize: 28,
    fontFamily: FONTS.display,
    lineHeight: 32,
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
    marginLeft: 4,
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
    ...SHADOWS.lg,
  },
  ctaButtonText: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  trialButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: BORDER_RADIUS.pill,
    borderWidth: 1.5,
  },
  trialButtonText: {
    fontSize: 15,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarEmoji: {
    fontSize: 13,
  },
  socialProofText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
  disclaimer: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 16,
  },
});
