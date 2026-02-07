import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Key,
  Palette,
  Info,
  ChevronRight,
  Sparkles,
  Heart,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '@/constants/theme';

interface SettingItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  gradient: string[];
}

export default function SettingsTab() {
  const router = useRouter();
  const { currentTheme } = useTheme();
  const COLORS = currentTheme.colors;

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
      id: 'api-keys',
      title: 'API Keys',
      description: 'Manage your OpenAI and ElevenLabs keys',
      icon: <Key size={24} color="#FFFFFF" />,
      route: '/settings/api-keys',
      gradient: COLORS.gradients.royal,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['top']}>
      <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: COLORS.text.primary }]}>
          Settings
        </Text>
        <Text style={[styles.headerSubtitle, { color: COLORS.text.secondary }]}>
          Customize your experience
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <LinearGradient
            colors={COLORS.gradients.sunset}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.welcomeBanner}
          >
            <View style={styles.bannerIconWrap}>
              <Sparkles size={28} color="#FFFFFF" />
            </View>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>Make Jahera Yours!</Text>
              <Text style={styles.bannerText}>
                Customize every aspect of your storytelling experience
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.settingsSection}>
          {settingItems.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeInDown.delay(200 + index * 80).springify()}
            >
              <TouchableOpacity
                style={[styles.settingCard, { backgroundColor: COLORS.cardBackground }]}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={item.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconContainer}
                >
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
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <View style={[styles.infoBox, { backgroundColor: COLORS.gradients.primary[0] + '15' }]}>
            <Info size={20} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, { color: COLORS.text.primary }]}>
                Jahera - AI Story Adventures
              </Text>
              <View style={styles.infoRow}>
                <Text style={[styles.infoText, { color: COLORS.text.secondary }]}>
                  Version 1.0.0
                </Text>
                <View style={styles.infoDot} />
                <Text style={[styles.infoText, { color: COLORS.text.secondary }]}>
                  Made with
                </Text>
                <Heart size={12} color={COLORS.error} fill={COLORS.error} />
                <Text style={[styles.infoText, { color: COLORS.text.secondary }]}>
                  for kids
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.xl,
    paddingBottom: 120,
  },
  welcomeBanner: {
    flexDirection: 'row',
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.xxl,
    ...SHADOWS.lg,
  },
  bannerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
  },
  bannerText: {
    fontSize: FONT_SIZES.sm,
    color: '#FFFFFF',
    opacity: 0.95,
    lineHeight: 20,
  },
  settingsSection: {
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.lg,
    ...SHADOWS.sm,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.xs,
  },
  settingDescription: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.md,
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: SPACING.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#999',
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
  },
});
