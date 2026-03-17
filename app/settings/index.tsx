import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Key,
  Palette,
  Info,
  ChevronRight,
  Shield,
  Crown,
  Zap,
  BookOpen,
  RotateCcw,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useApp } from '@/contexts/AppContext';
import { revenueCatService } from '@/services/revenueCatService';
import { subscriptionService } from '@/services/subscriptionService';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, FONTS, SHADOWS } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

interface SettingItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  gradient: readonly [string, string, ...string[]];
}

export default function SettingsScreen() {
  const router = useRouter();
  const { currentTheme } = useTheme();
  const COLORS = currentTheme.colors;
  const { subscription, profile, refreshSubscription } = useApp();
  const [isRestoring, setIsRestoring] = useState(false);

  const isPro = subscription?.plan !== 'free';

  const handleRestorePurchases = async () => {
    if (!profile) return;
    setIsRestoring(true);
    try {
      const rcInfo = await revenueCatService.restorePurchases();
      if (rcInfo.isActive) {
        if (rcInfo.plan === 'family') {
          await subscriptionService.upgradeToFamily(profile.$id);
        } else {
          await subscriptionService.upgradeToPro(profile.$id);
        }
        await refreshSubscription();
        Alert.alert('Purchases Restored', 'Your subscription has been restored successfully.');
      } else {
        Alert.alert('No Purchases Found', 'We could not find any active subscriptions linked to your account.');
      }
    } catch {
      Alert.alert('Restore Failed', 'Please try again or contact support.');
    } finally {
      setIsRestoring(false);
    }
  };

  const settingItems: SettingItem[] = [
    {
      id: 'customization',
      title: 'Customization',
      description: 'Personalize colors and app icon',
      icon: <Palette size={24} color="#FFFFFF" />,
      route: '/settings/customization',
      gradient: COLORS.gradients.primary,
    },
    {
      id: 'reading',
      title: 'Reading Preferences',
      description: 'Font size, line spacing, text alignment',
      icon: <BookOpen size={24} color="#FFFFFF" />,
      route: '/settings/reading',
      gradient: COLORS.gradients.forest || ['#2E7D32', '#66BB6A'],
    },
    {
      id: 'parent-dashboard',
      title: 'Parent Dashboard',
      description: "View your child's learning progress & stats",
      icon: <Shield size={24} color="#FFFFFF" />,
      route: '/parent-dashboard',
      gradient: COLORS.gradients.ocean || ['#0EA5E9', '#0369A1'],
    },
    {
      id: 'api-keys',
      title: 'API Keys',
      description: 'Advanced: use your own OpenAI key',
      icon: <Key size={24} color="#FFFFFF" />,
      route: '/settings/api-keys',
      gradient: COLORS.gradients.royal,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <View style={[styles.header, { backgroundColor: COLORS.background }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: COLORS.cardBackground }]}
          onPress={() => router.back()}>
          <ArrowLeft size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: COLORS.text.primary, fontFamily: FONTS.bold }]}>
            Settings
          </Text>
          <Text style={[styles.headerSubtitle, { color: COLORS.text.secondary }]}>
            Customize your experience
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {!isPro && (
          <TouchableOpacity onPress={() => router.push('/paywall')} activeOpacity={0.9}>
            <LinearGradient
              colors={COLORS.gradients.sunset}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.upgradeBanner}>
              <View style={styles.upgradeBannerLeft}>
                <Crown size={28} color="#FFFFFF" />
                <View>
                  <Text style={styles.upgradeBannerTitle}>Upgrade to Pro</Text>
                  <Text style={styles.upgradeBannerSub}>Unlimited stories + audio narration</Text>
                </View>
              </View>
              <View style={[styles.upgradeBannerArrow]}>
                <Zap size={18} color="#FFFFFF" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {isPro && (
          <LinearGradient
            colors={COLORS.gradients.sunset}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.proBanner}>
            <Crown size={24} color="#FFFFFF" />
            <View>
              <Text style={styles.proBannerTitle}>
                {subscription?.plan === 'family' ? 'Family Plan Active' : 'Pro Plan Active'}
              </Text>
              <Text style={styles.proBannerSub}>Enjoying unlimited stories</Text>
            </View>
          </LinearGradient>
        )}

        <View style={styles.settingsSection}>
          {settingItems.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[styles.settingCard, { backgroundColor: COLORS.cardBackground }]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}>
              <LinearGradient
                colors={item.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconContainer}>
                {item.icon}
              </LinearGradient>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: COLORS.text.primary }]}>
                  {item.title}
                </Text>
                <Text style={[styles.settingDescription, { color: COLORS.text.secondary }]}>
                  {item.description}
                </Text>
              </View>
              <ChevronRight size={20} color={COLORS.text.light} />
            </TouchableOpacity>
          ))}
        </View>

        {!isPro && (
          <TouchableOpacity
            style={[styles.restoreRow, { backgroundColor: COLORS.cardBackground, ...SHADOWS.xs }]}
            onPress={handleRestorePurchases}
            disabled={isRestoring}
            activeOpacity={0.7}
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color={COLORS.text.light} />
            ) : (
              <RotateCcw size={18} color={COLORS.text.secondary} strokeWidth={2} />
            )}
            <Text style={[styles.restoreText, { color: COLORS.text.secondary }]}>
              {isRestoring ? 'Restoring...' : 'Restore Purchases'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={[styles.infoBox, { backgroundColor: COLORS.gradients.primary[0] + '15' }]}>
          <Info size={20} color={COLORS.primary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: COLORS.text.primary, fontFamily: FONTS.semibold }]}>
              Jahera - AI Story Adventures
            </Text>
            <Text style={[styles.infoText, { color: COLORS.text.secondary }]}>
              Version 1.1.0 · Made with love for kids
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  backButton: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.lg, ...SHADOWS.xs,
  },
  headerContent: { flex: 1 },
  headerTitle: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold },
  headerSubtitle: { fontSize: FONT_SIZES.sm, marginTop: 2 },
  content: { flex: 1 },
  scrollContent: { padding: SPACING.xl, paddingBottom: SPACING.xxxl * 2 },
  upgradeBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SPACING.xl, borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.xxl, ...SHADOWS.lg,
  },
  upgradeBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
  upgradeBannerTitle: { fontSize: 16, fontFamily: FONTS.bold, color: '#FFFFFF' },
  upgradeBannerSub: { fontSize: 12, fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.85)' },
  upgradeBannerArrow: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  proBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    padding: SPACING.xl, borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.xxl, ...SHADOWS.md,
  },
  proBannerTitle: { fontSize: 15, fontFamily: FONTS.bold, color: '#FFFFFF' },
  proBannerSub: { fontSize: 12, fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.85)' },
  settingsSection: { gap: SPACING.md, marginBottom: SPACING.xxl },
  settingCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: SPACING.lg, borderRadius: BORDER_RADIUS.lg, gap: SPACING.lg, ...SHADOWS.sm,
  },
  iconContainer: {
    width: 52, height: 52, borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center', alignItems: 'center', ...SHADOWS.sm,
  },
  settingInfo: { flex: 1 },
  settingTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold, marginBottom: SPACING.xs },
  settingDescription: { fontSize: FONT_SIZES.sm, lineHeight: 18 },
  restoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
  },
  restoreText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  infoBox: {
    flexDirection: 'row', padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg, gap: SPACING.md, alignItems: 'center',
  },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: FONT_SIZES.md, marginBottom: SPACING.xs },
  infoText: { fontSize: FONT_SIZES.sm },
});
