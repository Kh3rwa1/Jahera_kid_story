import React, { useState, useCallback } from 'react';
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
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  Layout,
} from 'react-native-reanimated';
import { ArrowLeft, Check, Palette, AppWindow, Pipette, Sparkles } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { COLOR_SCHEMES } from '@/constants/themeSchemes';
import { APP_ICONS } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, FONT_SIZES, SHADOWS, FONTS } from '@/constants/theme';
import { hapticFeedback } from '@/utils/haptics';
import { ColorWheelPicker } from '@/components/ColorWheelPicker';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.xl * 3) / 2;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function AnimatedThemeCard({
  scheme,
  isSelected,
  onPress,
  colors,
  index,
}: {
  scheme: (typeof COLOR_SCHEMES)[0];
  isSelected: boolean;
  onPress: () => void;
  colors: any;
  index: number;
}) {
  const cardScale = useSharedValue(1);
  const checkScale = useSharedValue(isSelected ? 1 : 0);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const checkAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  const handlePress = () => {
    cardScale.value = withSequence(
      withSpring(0.92, { damping: 8, stiffness: 400 }),
      withSpring(1.02, { damping: 10, stiffness: 300 }),
      withSpring(1, { damping: 12, stiffness: 200 })
    );
    checkScale.value = withSpring(1, { damping: 8, stiffness: 300 });
    onPress();
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(150 + index * 60).springify()}
      layout={Layout.springify()}
    >
      <AnimatedTouchable
        style={[
          cardAnimStyle,
          styles.themeCard,
          {
            backgroundColor: colors.cardBackground,
            borderColor: isSelected ? colors.primary : 'transparent',
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={scheme.colors.gradients.primary as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.themePreview}
        >
          {isSelected && (
            <Animated.View
              style={[checkAnimStyle, styles.checkBadge, { backgroundColor: colors.cardBackground }]}
            >
              <Check size={16} color={colors.primary} strokeWidth={3} />
            </Animated.View>
          )}
        </LinearGradient>
        <View style={styles.themeInfo}>
          <Text style={styles.themeEmoji}>{scheme.emoji}</Text>
          <Text style={[styles.themeName, { color: colors.text.primary }]} numberOfLines={1}>
            {scheme.name}
          </Text>
        </View>
      </AnimatedTouchable>
    </Animated.View>
  );
}

function AnimatedIconCard({
  icon,
  isSelected,
  onPress,
  colors,
  index,
}: {
  icon: (typeof APP_ICONS)[0];
  isSelected: boolean;
  onPress: () => void;
  colors: any;
  index: number;
}) {
  const cardScale = useSharedValue(1);
  const emojiRotate = useSharedValue(0);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const emojiAnimStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${emojiRotate.value}deg` }],
  }));

  const handlePress = () => {
    cardScale.value = withSequence(
      withSpring(0.9, { damping: 8, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    emojiRotate.value = withSequence(
      withTiming(-15, { duration: 100 }),
      withTiming(15, { duration: 100 }),
      withTiming(-8, { duration: 80 }),
      withTiming(0, { duration: 80 })
    );
    onPress();
  };

  return (
    <Animated.View entering={FadeInUp.delay(200 + index * 50).springify()}>
      <AnimatedTouchable
        style={[
          cardAnimStyle,
          styles.iconCard,
          {
            backgroundColor: colors.cardBackground,
            borderColor: isSelected ? colors.primary : 'transparent',
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        <View style={styles.iconContainer}>
          <Animated.Text style={[styles.iconEmoji, emojiAnimStyle]}>{icon.emoji}</Animated.Text>
          {isSelected && (
            <Animated.View
              entering={FadeIn.springify()}
              style={[styles.checkBadgeSmall, { backgroundColor: colors.primary }]}
            >
              <Check size={12} color="#FFFFFF" strokeWidth={3} />
            </Animated.View>
          )}
        </View>
        <Text style={[styles.iconName, { color: colors.text.primary }]} numberOfLines={1}>
          {icon.name}
        </Text>
        <Text style={[styles.iconDescription, { color: colors.text.light }]} numberOfLines={1}>
          {icon.description}
        </Text>
      </AnimatedTouchable>
    </Animated.View>
  );
}

export default function CustomizationScreen() {
  const router = useRouter();
  const { currentTheme, currentIcon, customColor, setTheme, setIcon, setCustomColor, clearCustomColor } = useTheme();
  const [selectedThemeId, setSelectedThemeId] = useState(customColor ? 'custom' : currentTheme.id);
  const [selectedIconId, setSelectedIconId] = useState(currentIcon.id);
  const [showColorWheel, setShowColorWheel] = useState(!!customColor);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toastScale = useSharedValue(0);

  const toastAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: toastScale.value }],
    opacity: toastScale.value,
  }));

  const showSuccess = useCallback((msg: string) => {
    setErrorMsg(null);
    setSuccessMsg(msg);
    toastScale.value = withSequence(
      withSpring(1.05, { damping: 8, stiffness: 300 }),
      withSpring(1, { damping: 12, stiffness: 200 })
    );
    setTimeout(() => {
      toastScale.value = withTiming(0, { duration: 200 });
      setTimeout(() => setSuccessMsg(null), 200);
    }, 1800);
  }, [toastScale]);

  const showError = useCallback((msg: string) => {
    setSuccessMsg(null);
    setErrorMsg(msg);
    toastScale.value = withSpring(1, { damping: 12, stiffness: 200 });
    setTimeout(() => {
      toastScale.value = withTiming(0, { duration: 200 });
      setTimeout(() => setErrorMsg(null), 200);
    }, 2500);
  }, [toastScale]);

  const handleThemeSelect = async (themeId: string) => {
    try {
      hapticFeedback.light();
      setSelectedThemeId(themeId);
      setShowColorWheel(false);
      await setTheme(themeId);
      showSuccess('Theme updated!');
    } catch {
      showError('Failed to update theme.');
    }
  };

  const handleColorWheelToggle = () => {
    hapticFeedback.light();
    setShowColorWheel(!showColorWheel);
    if (!showColorWheel) {
      setSelectedThemeId('custom');
    }
  };

  const handleCustomColorSelect = async (color: string) => {
    try {
      setSelectedThemeId('custom');
      await setCustomColor(color);
    } catch {
      showError('Failed to save custom color.');
    }
  };

  const handleResetCustomColor = async () => {
    try {
      hapticFeedback.light();
      setShowColorWheel(false);
      await clearCustomColor();
      setSelectedThemeId(currentTheme.id);
      showSuccess('Switched back to preset theme!');
    } catch {
      showError('Failed to reset.');
    }
  };

  const handleIconSelect = async (iconId: string) => {
    try {
      hapticFeedback.light();
      setSelectedIconId(iconId);
      await setIcon(iconId);
      showSuccess('Icon updated!');
    } catch {
      showError('Failed to update icon.');
    }
  };

  const COLORS = currentTheme.colors;
  const backScale = useSharedValue(1);
  const backAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backScale.value }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill} />

      <Animated.View entering={FadeInDown.delay(50).springify()} style={[styles.header]}>
        <AnimatedTouchable
          style={[backAnimStyle, styles.backButton, { backgroundColor: COLORS.cardBackground }]}
          onPressIn={() => { backScale.value = withSpring(0.88, { damping: 8, stiffness: 400 }); }}
          onPressOut={() => { backScale.value = withSpring(1, { damping: 10, stiffness: 200 }); }}
          onPress={() => router.back()}
        >
          <ArrowLeft size={22} color={COLORS.text.primary} />
        </AnimatedTouchable>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: COLORS.text.primary }]}>Customization</Text>
          <Text style={[styles.headerSubtitle, { color: COLORS.text.secondary }]}>Make Jahera yours</Text>
        </View>
      </Animated.View>

      {(successMsg || errorMsg) && (
        <Animated.View style={[toastAnimStyle, styles.toastContainer]}>
          <View style={[styles.toast, { backgroundColor: successMsg ? COLORS.success : COLORS.error }]}>
            {successMsg && <Check size={16} color="#FFFFFF" strokeWidth={2.5} />}
            <Text style={styles.toastText}>{successMsg || errorMsg}</Text>
          </View>
        </Animated.View>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <LinearGradient
            colors={COLORS.gradients.primary as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroBanner}
          >
            <View style={styles.heroIconWrap}>
              <Sparkles size={26} color="#FFFFFF" />
            </View>
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>Design Your Experience</Text>
              <Text style={styles.heroSubtitle}>Pick a preset theme or create your own with the color wheel</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.section}>
          <Animated.View entering={FadeInDown.delay(130).springify()} style={styles.sectionHeader}>
            <Palette size={22} color={COLORS.primary} />
            <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>Color Theme</Text>
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(180)} style={[styles.sectionDescription, { color: COLORS.text.secondary }]}>
            Choose your favorite color scheme
          </Animated.Text>

          <View style={styles.themesGrid}>
            {COLOR_SCHEMES.map((scheme, index) => (
              <AnimatedThemeCard
                key={scheme.id}
                scheme={scheme}
                isSelected={selectedThemeId === scheme.id && !customColor}
                onPress={() => handleThemeSelect(scheme.id)}
                colors={COLORS}
                index={index}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.sectionHeader}>
            <Pipette size={22} color={COLORS.primary} />
            <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>Custom Color</Text>
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(220)} style={[styles.sectionDescription, { color: COLORS.text.secondary }]}>
            Pick any color to generate a unique theme
          </Animated.Text>

          <Animated.View entering={FadeInUp.delay(250).springify()}>
            <TouchableOpacity
              style={[
                styles.colorWheelToggle,
                {
                  backgroundColor: showColorWheel ? COLORS.primary + '15' : COLORS.cardBackground,
                  borderColor: showColorWheel ? COLORS.primary : COLORS.text.light + '30',
                },
              ]}
              onPress={handleColorWheelToggle}
              activeOpacity={0.8}
            >
              <View style={[styles.toggleIcon, { backgroundColor: showColorWheel ? COLORS.primary : COLORS.text.light + '40' }]}>
                <Pipette size={18} color={showColorWheel ? '#FFFFFF' : COLORS.text.secondary} />
              </View>
              <View style={styles.toggleContent}>
                <Text style={[styles.toggleTitle, { color: COLORS.text.primary }]}>
                  {showColorWheel ? 'Color Wheel Active' : 'Open Color Wheel'}
                </Text>
                <Text style={[styles.toggleSubtitle, { color: COLORS.text.secondary }]}>
                  {showColorWheel ? 'Drag around the wheel to pick your color' : 'Tap to create a fully custom theme'}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {showColorWheel && (
            <Animated.View entering={FadeInDown.springify()} style={styles.colorWheelWrap}>
              <ColorWheelPicker
                initialColor={customColor || COLORS.primary}
                onColorSelect={handleCustomColorSelect}
                onReset={handleResetCustomColor}
                textPrimary={COLORS.text.primary}
                textSecondary={COLORS.text.secondary}
                cardBg={COLORS.cardBackground}
              />
            </Animated.View>
          )}
        </View>

        <View style={styles.section}>
          <Animated.View entering={FadeInDown.delay(220).springify()} style={styles.sectionHeader}>
            <AppWindow size={22} color={COLORS.primary} />
            <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>App Icon</Text>
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(260)} style={[styles.sectionDescription, { color: COLORS.text.secondary }]}>
            Choose your app icon style
          </Animated.Text>

          <View style={styles.iconsGrid}>
            {APP_ICONS.map((icon, index) => (
              <AnimatedIconCard
                key={icon.id}
                icon={icon}
                isSelected={selectedIconId === icon.id}
                onPress={() => handleIconSelect(icon.id)}
                colors={COLORS}
                index={index}
              />
            ))}
          </View>
        </View>

        <Animated.View entering={FadeIn.delay(400)}>
          <View style={[styles.infoBox, { backgroundColor: COLORS.primary + '12' }]}>
            <Sparkles size={16} color={COLORS.primary} />
            <Text style={[styles.infoText, { color: COLORS.text.primary }]}>
              Changes are applied instantly and saved automatically.
            </Text>
          </View>
        </Animated.View>
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
    paddingBottom: SPACING.md,
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
  toastContainer: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.md,
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
    paddingBottom: 120,
  },
  heroBanner: {
    flexDirection: 'row',
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
    ...SHADOWS.lg,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
  },
  heroSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: '#FFFFFF',
    opacity: 0.9,
    lineHeight: 18,
  },
  section: {
    marginBottom: SPACING.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
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
    height: 90,
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
  colorWheelToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
    ...SHADOWS.sm,
  },
  toggleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleContent: {
    flex: 1,
    gap: 2,
  },
  toggleTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
  },
  toggleSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    lineHeight: 16,
  },
  colorWheelWrap: {
    marginTop: SPACING.xl,
    paddingVertical: SPACING.xl,
    alignItems: 'center',
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
    fontSize: 44,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.md,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    lineHeight: 20,
  },
});
