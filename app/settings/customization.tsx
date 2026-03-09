import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, Check, Palette, AppWindow } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { COLOR_SCHEMES } from '@/constants/themeSchemes';
import { APP_ICONS } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, FONT_SIZES, SHADOWS, FONTS } from '@/constants/theme';
import { hapticFeedback } from '@/utils/haptics';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.xl * 3) / 2;

export default function CustomizationScreen() {
  const router = useRouter();
  const { currentTheme, currentIcon, setTheme, setIcon } = useTheme();
  const [selectedThemeId, setSelectedThemeId] = useState(currentTheme.id);
  const [selectedIconId, setSelectedIconId] = useState(currentIcon.id);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setErrorMsg(null);
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 2000);
  };

  const showError = (msg: string) => {
    setSuccessMsg(null);
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 3000);
  };

  const handleThemeSelect = async (themeId: string) => {
    try {
      hapticFeedback.light();
      setSelectedThemeId(themeId);
      await setTheme(themeId);
      showSuccess('Theme updated!');
    } catch {
      showError('Failed to update theme. Please try again.');
    }
  };

  const handleIconSelect = async (iconId: string) => {
    try {
      hapticFeedback.light();
      setSelectedIconId(iconId);
      await setIcon(iconId);
      showSuccess('Icon updated!');
    } catch {
      showError('Failed to update icon. Please try again.');
    }
  };

  const COLORS = currentTheme.colors;

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <View style={[styles.header, { backgroundColor: COLORS.background }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: COLORS.cardBackground }]}
          onPress={() => router.back()}>
          <ArrowLeft size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: COLORS.text.primary }]}>
            Customization
          </Text>
          <Text style={[styles.headerSubtitle, { color: COLORS.text.secondary }]}>
            Make Jahera yours
          </Text>
        </View>
      </View>

      {successMsg && (
        <Animated.View entering={FadeInDown.springify()}>
          <View style={[styles.toast, { backgroundColor: COLORS.success }]}>
            <Check size={16} color="#FFFFFF" />
            <Text style={styles.toastText}>{successMsg}</Text>
          </View>
        </Animated.View>
      )}

      {errorMsg && (
        <Animated.View entering={FadeInDown.springify()}>
          <View style={[styles.toast, { backgroundColor: COLORS.error }]}>
            <Text style={styles.toastText}>{errorMsg}</Text>
          </View>
        </Animated.View>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Palette size={24} color={COLORS.primary} />
            <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>
              Color Theme
            </Text>
          </View>
          <Text style={[styles.sectionDescription, { color: COLORS.text.secondary }]}>
            Choose your favorite color scheme
          </Text>

          <View style={styles.themesGrid}>
            {COLOR_SCHEMES.map(scheme => {
              const isSelected = selectedThemeId === scheme.id;
              return (
                <TouchableOpacity
                  key={scheme.id}
                  style={[
                    styles.themeCard,
                    {
                      backgroundColor: COLORS.cardBackground,
                      borderColor: isSelected ? COLORS.primary : 'transparent',
                    },
                  ]}
                  onPress={() => handleThemeSelect(scheme.id)}
                  activeOpacity={0.8}>
                  <LinearGradient
                    colors={scheme.colors.gradients.primary as [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.themePreview}>
                    {isSelected && (
                      <View
                        style={[
                          styles.checkBadge,
                          { backgroundColor: COLORS.cardBackground },
                        ]}>
                        <Check size={16} color={COLORS.primary} strokeWidth={3} />
                      </View>
                    )}
                  </LinearGradient>
                  <View style={styles.themeInfo}>
                    <Text style={styles.themeEmoji}>{scheme.emoji}</Text>
                    <Text
                      style={[styles.themeName, { color: COLORS.text.primary }]}
                      numberOfLines={1}>
                      {scheme.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppWindow size={24} color={COLORS.primary} />
            <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>
              App Icon
            </Text>
          </View>
          <Text style={[styles.sectionDescription, { color: COLORS.text.secondary }]}>
            Choose your app icon style
          </Text>

          <View style={styles.iconsGrid}>
            {APP_ICONS.map(icon => {
              const isSelected = selectedIconId === icon.id;
              return (
                <TouchableOpacity
                  key={icon.id}
                  style={[
                    styles.iconCard,
                    {
                      backgroundColor: COLORS.cardBackground,
                      borderColor: isSelected ? COLORS.primary : 'transparent',
                    },
                  ]}
                  onPress={() => handleIconSelect(icon.id)}
                  activeOpacity={0.8}>
                  <View style={styles.iconContainer}>
                    <Text style={styles.iconEmoji}>{icon.emoji}</Text>
                    {isSelected && (
                      <View
                        style={[
                          styles.checkBadgeSmall,
                          { backgroundColor: COLORS.primary },
                        ]}>
                        <Check size={12} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    )}
                  </View>
                  <Text
                    style={[styles.iconName, { color: COLORS.text.primary }]}
                    numberOfLines={1}>
                    {icon.name}
                  </Text>
                  <Text
                    style={[styles.iconDescription, { color: COLORS.text.light }]}
                    numberOfLines={1}>
                    {icon.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[styles.infoBox, { backgroundColor: COLORS.gradients.primary[0] + '20' }]}>
          <Text style={[styles.infoText, { color: COLORS.text.primary }]}>
            Changes are applied instantly! Your preferences are saved automatically.
          </Text>
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
    ...SHADOWS.sm,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.bold,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    marginTop: 2,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semibold,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.xl,
    paddingBottom: SPACING.xxxl * 2,
  },
  section: {
    marginBottom: SPACING.xxxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
  },
  sectionDescription: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.lg,
  },
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  themeCard: {
    width: CARD_WIDTH,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 3,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  themePreview: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  themeInfo: {
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  themeEmoji: {
    fontSize: 20,
  },
  themeName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.semibold,
    flex: 1,
  },
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  iconCard: {
    width: CARD_WIDTH,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 3,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: SPACING.sm,
  },
  iconEmoji: {
    fontSize: 48,
  },
  checkBadgeSmall: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  iconName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  iconDescription: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  infoBox: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.lg,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    textAlign: 'center',
    lineHeight: 20,
  },
});
