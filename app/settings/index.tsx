import {
  BORDER_RADIUS,
  FONT_SIZES,
  FONTS,
  SHADOWS,
  SPACING,
} from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { revenueCatService } from '@/services/revenueCatServiceInternal';
import { subscriptionService } from '@/services/subscriptionService';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  CreditCard,
  Crown,
  Info,
  Palette,
  RotateCcw,
  Shield,
  Volume2,
  Bell,
  Zap,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ColorScheme } from '@/constants/themeSchemes';

const ENTITLEMENT_PRO = 'pro';

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
  const insets = useSafeAreaInsets();
  const { currentTheme } = useTheme();
  const C = currentTheme.colors;
  const styles = useStyles(C, insets);
  const { subscription, profile, refreshSubscription } = useApp();
  const [isRestoring, setIsRestoring] = useState(false);

  const isPro = subscription?.plan !== 'free';
  const rcUIAvailable = revenueCatService.isUIAvailable();

  const syncSubscriptionAndNotify = async (plan: 'pro' | 'family') => {
    if (!profile) return;
    if (plan === 'family') {
      await subscriptionService.upgradeToFamily(profile.id);
    } else {
      await subscriptionService.upgradeToPro(profile.id);
    }
    await refreshSubscription();
    Alert.alert(
      'Purchases Restored',
      'Your subscription has been restored successfully.',
    );
  };

  const handleManageSubscription = async () => {
    if (!profile) return;

    if (rcUIAvailable) {
      await revenueCatService.presentCustomerCenter(async (plan) => {
        await subscriptionService.syncFromRevenueCat(profile.id);
        await refreshSubscription();
        if (plan !== 'free') {
          Alert.alert(
            'Subscription Restored',
            'Your subscription has been restored successfully.',
          );
        }
      });
      return;
    }

    Alert.alert(
      'Manage Subscription',
      'To manage your subscription, visit the Subscriptions section in your device Settings.',
      [{ text: 'OK' }],
    );
  };

  const handleRestorePurchases = async () => {
    if (!profile) return;

    setIsRestoring(true);
    try {
      if (rcUIAvailable) {
        const result =
          await revenueCatService.presentPaywallIfNeeded(ENTITLEMENT_PRO);
        if (!result.purchased && !result.restored) return;
        await subscriptionService.syncFromRevenueCat(profile.id);
        await refreshSubscription();
        if (result.restored) {
          Alert.alert(
            'Purchases Restored',
            'Your subscription has been restored successfully.',
          );
        }
        return;
      }

      const rcInfo = await revenueCatService.restorePurchases();
      if (!rcInfo.isActive) {
        Alert.alert(
          'No Purchases Found',
          'We could not find any active subscriptions linked to your account.',
        );
        return;
      }
      await syncSubscriptionAndNotify(
        rcInfo.plan === 'family' ? 'family' : 'pro',
      );
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
      gradient: C.gradients.primary,
    },
    {
      id: 'reading',
      title: 'Reading Preferences',
      description: 'Font size, line spacing, text alignment',
      icon: <BookOpen size={24} color="#FFFFFF" />,
      route: '/settings/reading',
      gradient: C.gradients.forest || ['#2E7D32', '#66BB6A'],
    },
    {
      id: 'notifications',
      title: 'Bedtime Reminders',
      description: 'Daily story reminder notifications',
      icon: <Bell size={24} color="#FFFFFF" />,
      route: '/settings/notifications',
      gradient: C.gradients.ocean || ['#0EA5E9', '#0369A1'],
    },
    {
      id: 'audio',
      title: 'Audio Narration',
      description: 'Voices, AI models, and fine-tuning',
      icon: <Volume2 size={24} color="#FFFFFF" />,
      route: '/settings/audio',
      gradient: C.gradients.sunset || ['#F43F5E', '#FB923C'],
    },
    {
      id: 'parent-dashboard',
      title: 'Parent Dashboard',
      description: "View your child's learning progress & stats",
      icon: <Shield size={24} color="#FFFFFF" />,
      route: '/parent-dashboard',
      gradient: C.gradients.ocean || ['#0EA5E9', '#0369A1'],
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={C.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Customize your experience</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!isPro && (
          <TouchableOpacity
            onPress={() => router.push('/paywall')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={C?.gradients?.sunset || ['#F43F5E', '#FB923C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.upgradeBanner}
            >
              <View style={styles.upgradeBannerLeft}>
                <Crown size={28} color="#FFFFFF" />
                <View>
                  <Text style={styles.upgradeBannerTitle}>Upgrade to Pro</Text>
                  <Text style={styles.upgradeBannerSub}>
                    Unlimited stories + audio narration
                  </Text>
                </View>
              </View>
              <View style={[styles.upgradeBannerArrow]}>
                <Zap size={18} color="#FFFFFF" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {isPro && (
          <TouchableOpacity
            onPress={handleManageSubscription}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={C?.gradients?.sunset || ['#F43F5E', '#FB923C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.proBanner}
            >
              <Crown size={24} color="#FFFFFF" />
              <View style={{ flex: 1 }}>
                <Text style={styles.proBannerTitle}>
                  {subscription?.plan === 'family'
                    ? 'Family Plan Active'
                    : 'Pro Plan Active'}
                </Text>
                <Text style={styles.proBannerSub}>
                  Tap to manage subscription
                </Text>
              </View>
              <CreditCard size={18} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={styles.settingsSection}>
          {settingItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.settingCard}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={item.gradient || ['#CCC', '#999']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconContainer}
              >
                {item.icon}
              </LinearGradient>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{item.title}</Text>
                <Text style={styles.settingDescription}>
                  {item.description}
                </Text>
              </View>
              <ChevronRight size={20} color={C.text.light} />
            </TouchableOpacity>
          ))}
        </View>

        {!isPro && (
          <TouchableOpacity
            style={styles.restoreRow}
            onPress={handleRestorePurchases}
            disabled={isRestoring}
            activeOpacity={0.7}
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color={C.text.light} />
            ) : (
              <RotateCcw size={18} color={C.text.secondary} strokeWidth={2} />
            )}
            <Text style={styles.restoreText}>
              {isRestoring ? 'Restoring...' : 'Restore Purchases'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.infoBox}>
          <Info size={20} color={C.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Jahera - AI Story Adventures</Text>
            <Text style={styles.infoText}>
              Version 1.1.0 · Made with love for kids
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = (C: ColorScheme['colors'], insets: EdgeInsets) => {
  return React.useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: C.background },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: SPACING.xl,
          paddingBottom: SPACING.lg,
          paddingTop: insets.top + (SPACING.md || 12),
          backgroundColor: C.background,
        },
        backButton: {
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: SPACING.lg,
          ...SHADOWS.xs,
          backgroundColor: C.cardBackground,
        },
        headerContent: { flex: 1 },
        headerTitle: {
          fontSize: FONT_SIZES.xxl,
          fontFamily: FONTS.bold,
          color: C.text.primary,
        },
        headerSubtitle: {
          fontSize: FONT_SIZES.sm,
          marginTop: 2,
          color: C.text.secondary,
        },
        content: { flex: 1 },
        scrollContent: { padding: SPACING.xl, paddingBottom: SPACING.xxxl * 2 },
        upgradeBanner: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: SPACING.xl,
          borderRadius: BORDER_RADIUS.xl,
          marginBottom: SPACING.xxl,
          ...SHADOWS.lg,
        },
        upgradeBannerLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.md,
          flex: 1,
        },
        upgradeBannerTitle: {
          fontSize: 16,
          fontFamily: FONTS.bold,
          color: '#FFFFFF',
        },
        upgradeBannerSub: {
          fontSize: 12,
          fontFamily: FONTS.medium,
          color: 'rgba(255,255,255,0.85)',
        },
        upgradeBannerArrow: {
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255,255,255,0.2)',
        },
        proBanner: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.md,
          padding: SPACING.xl,
          borderRadius: BORDER_RADIUS.xl,
          marginBottom: SPACING.xxl,
          ...SHADOWS.md,
        },
        proBannerTitle: {
          fontSize: 15,
          fontFamily: FONTS.bold,
          color: '#FFFFFF',
        },
        proBannerSub: {
          fontSize: 12,
          fontFamily: FONTS.medium,
          color: 'rgba(255,255,255,0.85)',
        },
        settingsSection: { gap: SPACING.md, marginBottom: SPACING.xxl },
        settingCard: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: SPACING.lg,
          borderRadius: BORDER_RADIUS.lg,
          gap: SPACING.lg,
          ...SHADOWS.sm,
          backgroundColor: C.cardBackground,
        },
        iconContainer: {
          width: 52,
          height: 52,
          borderRadius: BORDER_RADIUS.md,
          justifyContent: 'center',
          alignItems: 'center',
          ...SHADOWS.sm,
        },
        settingInfo: { flex: 1 },
        settingTitle: {
          fontSize: FONT_SIZES.lg,
          fontFamily: FONTS.bold,
          color: C.text.primary,
          marginBottom: SPACING.xs,
        },
        settingDescription: {
          fontSize: FONT_SIZES.sm,
          lineHeight: 18,
          color: C.text.secondary,
        },
        restoreRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.md,
          padding: SPACING.lg,
          borderRadius: BORDER_RADIUS.lg,
          marginBottom: SPACING.lg,
          backgroundColor: C.cardBackground,
          ...SHADOWS.xs,
        },
        restoreText: {
          fontSize: FONT_SIZES.md,
          fontFamily: FONTS.medium,
          color: C.text.secondary,
        },
        infoBox: {
          flexDirection: 'row',
          padding: SPACING.lg,
          borderRadius: BORDER_RADIUS.lg,
          gap: SPACING.md,
          alignItems: 'center',
          backgroundColor: (C?.gradients?.primary?.[0] || '#6366f1') + '15',
        },
        infoContent: { flex: 1 },
        infoTitle: {
          fontSize: FONT_SIZES.md,
          fontFamily: FONTS.semibold,
          color: C.text.primary,
          marginBottom: SPACING.xs,
        },
        infoText: { fontSize: FONT_SIZES.sm, color: C.text.secondary },
      }),
    [C],
  );
};
