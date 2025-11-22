import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Key,
  Palette,
  Info,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

interface SettingItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  gradient: string[];
}

export default function SettingsScreen() {
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
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.background }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: COLORS.cardBackground }]}
          onPress={() => router.back()}>
          <ArrowLeft size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: COLORS.text.primary }]}>
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
        {/* Welcome Banner */}
        <LinearGradient
          colors={COLORS.gradients.sunset}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.welcomeBanner}>
          <Sparkles size={32} color="#FFFFFF" />
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Make Jahera Yours!</Text>
            <Text style={styles.bannerText}>
              Customize every aspect of your storytelling experience
            </Text>
          </View>
        </LinearGradient>

        {/* Settings Items */}
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

        {/* App Info */}
        <View style={[styles.infoBox, { backgroundColor: COLORS.gradients.primary[0] + '15' }]}>
          <Info size={20} color={COLORS.primary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: COLORS.text.primary }]}>
              Jahera - AI Story Adventures
            </Text>
            <Text style={[styles.infoText, { color: COLORS.text.secondary }]}>
              Version 1.0.0 • Made with love for kids
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.xl,
    paddingBottom: SPACING.xxxl * 2,
  },
  welcomeBanner: {
    flexDirection: 'row',
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
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
  infoText: {
    fontSize: FONT_SIZES.sm,
  },
});
