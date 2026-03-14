import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
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
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useApp } from '@/contexts/AppContext';
import { subscriptionService } from '@/services/subscriptionService';
import { SPACING, BORDER_RADIUS, FONTS, SHADOWS } from '@/constants/theme';
import { hapticFeedback } from '@/utils/haptics';

const PRO_FEATURES = [
  { icon: Infinity, label: 'Unlimited stories every month' },
  { icon: Globe, label: 'All 20+ languages unlocked' },
  { icon: Volume2, label: 'AI voice narration for every story' },
  { icon: BookOpen, label: 'Long-form stories (250+ words)' },
  { icon: Users, label: 'Family plan for up to 4 children' },
  { icon: Zap, label: 'Priority story generation speed' },
];

const PLANS = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: '$6.99',
    period: '/month',
    badge: null,
    highlight: false,
  },
  {
    id: 'yearly',
    label: 'Yearly',
    price: '$49.99',
    period: '/year',
    badge: 'SAVE 40%',
    highlight: true,
    perMonth: '$4.17/mo',
  },
  {
    id: 'family',
    label: 'Family',
    price: '$9.99',
    period: '/month',
    badge: '4 KIDS',
    highlight: false,
    perMonth: 'Up to 4 children',
  },
];

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
        [{ text: 'Lets Go!', onPress: () => router.back() }]
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

      <TouchableOpacity
        style={[styles.closeButton, { backgroundColor: COLORS.cardBackground }]}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <X size={20} color={COLORS.text.secondary} />
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.heroSection}>
          <LinearGradient
            colors={COLORS.gradients.sunset}
            style={styles.iconCircle}
          >
            <Sparkles size={40} color="#FFFFFF" strokeWidth={1.5} />
          </LinearGradient>
          <Text style={[styles.heroTitle, { color: COLORS.text.primary }]}>
            Unlock Jahera Pro
          </Text>
          <Text style={[styles.heroSubtitle, { color: COLORS.text.secondary }]}>
            Unlimited magical stories for your child, personalized with AI
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).springify()} style={[styles.featuresCard, { backgroundColor: COLORS.cardBackground }]}>
          {PRO_FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <View key={index} style={styles.featureRow}>
                <View style={[styles.featureIconWrap, { backgroundColor: COLORS.primary + '15' }]}>
                  <Icon size={16} color={COLORS.primary} strokeWidth={2} />
                </View>
                <Text style={[styles.featureLabel, { color: COLORS.text.primary }]}>{feature.label}</Text>
                <Check size={16} color={COLORS.success} strokeWidth={2.5} />
              </View>
            );
          })}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.plansSection}>
          <Text style={[styles.plansTitle, { color: COLORS.text.primary }]}>Choose Your Plan</Text>
          <View style={styles.plansGrid}>
            {PLANS.map(plan => (
              <TouchableOpacity
                key={plan.id}
                onPress={() => { setSelectedPlan(plan.id); hapticFeedback.light(); }}
                activeOpacity={0.85}
              >
                <View style={[
                  styles.planCard,
                  { backgroundColor: COLORS.cardBackground, borderColor: COLORS.text.light + '30' },
                  selectedPlan === plan.id && { borderColor: COLORS.primary, borderWidth: 2 },
                  plan.highlight && selectedPlan === plan.id && styles.planCardHighlight,
                ]}>
                  {plan.badge && (
                    <View style={[styles.planBadge, { backgroundColor: plan.highlight ? COLORS.primary : COLORS.warning }]}>
                      <Text style={styles.planBadgeText}>{plan.badge}</Text>
                    </View>
                  )}
                  <Text style={[styles.planLabel, { color: COLORS.text.secondary }]}>{plan.label}</Text>
                  <View style={styles.planPriceRow}>
                    <Text style={[styles.planPrice, { color: COLORS.text.primary }]}>{plan.price}</Text>
                    <Text style={[styles.planPeriod, { color: COLORS.text.light }]}>{plan.period}</Text>
                  </View>
                  {plan.perMonth && (
                    <Text style={[styles.planPerMonth, { color: COLORS.text.secondary }]}>{plan.perMonth}</Text>
                  )}
                  {selectedPlan === plan.id && (
                    <View style={[styles.planSelectedDot, { backgroundColor: COLORS.primary }]} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.ctaSection}>
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
              <Sparkles size={20} color="#FFFFFF" />
              <Text style={styles.ctaButtonText}>
                {isLoading ? 'Processing...' : 'Subscribe Now'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleStartTrial}
            style={[styles.trialButton, { borderColor: COLORS.primary + '40' }]}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <Text style={[styles.trialButtonText, { color: COLORS.primary }]}>
              Start 7-Day Free Trial
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
  container: { flex: 1 },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 16,
    right: SPACING.xl,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...SHADOWS.sm,
  },
  scrollContent: { paddingBottom: 40 },
  heroSection: {
    alignItems: 'center',
    paddingTop: SPACING.xxxl + SPACING.xl,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
    gap: SPACING.md,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.lg,
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: FONTS.extrabold,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  featuresCard: {
    marginHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
    ...SHADOWS.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  featureIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  plansSection: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xxl,
  },
  plansTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.lg,
  },
  plansGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  planCard: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 4,
    minHeight: 100,
    ...SHADOWS.xs,
    position: 'relative',
  },
  planCardHighlight: {
    ...SHADOWS.md,
  },
  planBadge: {
    position: 'absolute',
    top: -10,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.pill,
  },
  planBadgeText: {
    fontSize: 9,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  planLabel: {
    fontSize: 11,
    fontFamily: FONTS.semibold,
    marginTop: SPACING.sm,
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  planPrice: {
    fontSize: 18,
    fontFamily: FONTS.extrabold,
  },
  planPeriod: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    paddingBottom: 2,
  },
  planPerMonth: {
    fontSize: 10,
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
  planSelectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
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
    paddingVertical: SPACING.xl,
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
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.pill,
    borderWidth: 1.5,
  },
  trialButtonText: {
    fontSize: 15,
    fontFamily: FONTS.semibold,
  },
  disclaimer: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 16,
  },
});
