import { ColorWheelPicker } from '@/components/ColorWheelPicker';
import {
  BORDER_RADIUS,
  FONT_SIZES,
  FONTS,
  SHADOWS,
  SPACING,
} from '@/constants/theme';
import { COLOR_SCHEMES } from '@/constants/themeSchemes';
import { APP_ICONS, useTheme } from '@/contexts/ThemeContext';
import { hapticFeedback } from '@/utils/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  AppWindow,
  ArrowLeft,
  Check,
  Palette,
  Pipette,
  Sparkles,
  Wand as Wand2,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  Platform,
} from 'react-native';
import Animated, {
  Extrapolation,
  FadeIn,
  FadeInDown,
  FadeInUp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ColorScheme } from '@/constants/themeSchemes';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const ThemeCard = React.memo(
  ({
    scheme,
    isSelected,
    onPress,
    index,
    winWidth,
    styles,
    C,
  }: {
    scheme: (typeof COLOR_SCHEMES)[0];
    isSelected: boolean;
    onPress: () => void;
    index: number;
    winWidth: number;
    styles: ReturnType<typeof useStyles>;
    C: ColorScheme['colors'];
  }) => {
    const scale = useSharedValue(1);
    const animStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      shadowOpacity: withTiming(isSelected ? 0.45 : 0.12),
    }));

    const glowStyle = useAnimatedStyle(() => ({
      opacity: withSpring(isSelected ? 1 : 0),
      transform: [{ scale: withSpring(isSelected ? 1 : 0.9) }],
    }));

    const handlePress = () => {
      hapticFeedback.light();
      scale.value = withSequence(
        withSpring(0.94, { damping: 10, stiffness: 500 }),
        withSpring(1, { damping: 12, stiffness: 300 }),
      );
      onPress();
    };

    return (
      <Animated.View
        entering={FadeInUp.delay(80 + index * 50).springify()}
        style={[animStyle, { position: 'relative' }]}
      >
        {/* Premium Glow Effect */}
        <Animated.View
          style={[
            glowStyle,
            styles.themeGlow,
            {
              backgroundColor: scheme.colors.primary + '30',
              shadowColor: scheme.colors.primary,
            },
          ]}
        />

        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.92}
          style={[
            styles.themeCard,
            { width: winWidth * 0.82 }, // Increased width for 'peek' effect
            isSelected && styles.themeCardSelected,
          ]}
        >
          <LinearGradient
            colors={
              scheme.colors.gradients.primary as [string, string, ...string[]]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.themeGradient}
          >
            <View style={styles.themeCardInner}>
              <View style={styles.themeCardDots}>
                <View style={styles.themeDot90} />
                <View style={styles.themeDot60} />
                <View style={styles.themeDot35} />
              </View>
              <View style={styles.themeCardMockLines}>
                <View style={styles.themeMockLine80} />
                <View style={styles.themeMockLine50} />
              </View>
            </View>

            {isSelected && (
              <Animated.View
                entering={FadeIn.springify()}
                style={styles.themeCheckBadge}
              >
                <Check size={14} color="#FFFFFF" strokeWidth={3} />
              </Animated.View>
            )}
          </LinearGradient>

          <View style={styles.themeCardFooter}>
            <Text style={styles.themeCardEmoji}>{scheme.emoji}</Text>
            <View style={styles.themeCardMeta}>
              <Text style={styles.themeCardName}>{scheme.name}</Text>
              <Text style={styles.themeCardSwatch} numberOfLines={1}>
                {scheme.colors.primary}
              </Text>
            </View>
            {isSelected && (
              <View
                style={[
                  styles.activeChip,
                  { backgroundColor: scheme.colors.primary + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.activeChipText,
                    { color: scheme.colors.primary },
                  ]}
                >
                  Active
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  },
);

const IconCard = React.memo(
  ({
    icon,
    isSelected,
    onPress,
    C,
    index,
    winWidth,
    styles,
  }: {
    icon: (typeof APP_ICONS)[0];
    isSelected: boolean;
    onPress: () => void;
    C: ColorScheme['colors'];
    index: number;
    winWidth: number;
    styles: ReturnType<typeof useStyles>;
  }) => {
    const scale = useSharedValue(1);
    const rotate = useSharedValue(0);

    const animStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
    }));

    const handlePress = () => {
      hapticFeedback.selection();
      scale.value = withSequence(
        withSpring(0.85, { damping: 8, stiffness: 500 }),
        withSpring(1.08, { damping: 10, stiffness: 300 }),
        withSpring(1, { damping: 12, stiffness: 200 }),
      );
      rotate.value = withSequence(
        withTiming(-12, { duration: 80 }),
        withTiming(12, { duration: 80 }),
        withTiming(0, { duration: 80 }),
      );
      onPress();
    };

    return (
      <Animated.View entering={FadeInUp.delay(120 + index * 40).springify()}>
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.85}
          style={styles.iconCardOuter}
        >
          <Animated.View
            style={[
              animStyle,
              styles.iconCard,
              {
                backgroundColor: isSelected
                  ? C.primary + '15'
                  : C.cardBackground,
                borderColor: isSelected ? C.primary : C.text.light + '25',
                borderWidth: isSelected ? 2.5 : 1, // Slightly thicker border for premium feel
                width: (winWidth - SPACING.xl * 2 - SPACING.md * 3) / 4,
                height: (winWidth - SPACING.xl * 2 - SPACING.md * 3) / 4,
              },
            ]}
          >
            <Text style={styles.iconEmoji}>{icon.emoji}</Text>
            {isSelected && (
              <Animated.View
                entering={FadeIn.springify()}
                style={[styles.iconCheckDot, { backgroundColor: C.primary }]}
              >
                <Check size={9} color="#FFF" strokeWidth={3.5} />
              </Animated.View>
            )}
          </Animated.View>
          <Text
            style={[
              styles.iconCardLabel,
              { color: isSelected ? C.primary : C.text.secondary },
            ]}
            numberOfLines={1}
          >
            {icon.name}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  },
);

function SectionLabel({
  icon: Icon,
  label,
  color,
  delay = 0,
  styles,
}: Readonly<{
  icon: any;
  label: string;
  color: string;
  delay?: number;
  styles: ReturnType<typeof useStyles>;
}>) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      style={styles.sectionLabel}
    >
      <View
        style={[styles.sectionLabelIcon, { backgroundColor: color + '18' }]}
      >
        <Icon size={15} color={color} strokeWidth={2.5} />
      </View>
      <Text style={[styles.sectionLabelText, { color }]}>{label}</Text>
    </Animated.View>
  );
}

export default function CustomizationScreen() {
  const router = useRouter();
  const {
    currentTheme,
    currentIcon,
    customColor,
    setTheme,
    setIcon,
    setCustomColor,
    clearCustomColor,
  } = useTheme();

  const C = currentTheme.colors;
  const { width: winWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const styles = useStyles(C, insets);

  const [selectedThemeId, setSelectedThemeId] = useState(
    customColor ? 'custom' : currentTheme.id,
  );
  const [selectedIconId, setSelectedIconId] = useState(currentIcon.id);
  const [showColorWheel, setShowColorWheel] = useState(!!customColor);
  const [toast, setToast] = useState<{
    msg: string;
    type: 'success' | 'error';
  } | null>(null);

  const toastAnim = useSharedValue(0);
  const toastAnimStyle = useAnimatedStyle(() => ({
    opacity: toastAnim.value,
    transform: [
      {
        translateY: interpolate(
          toastAnim.value,
          [0, 1],
          [-12, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const showToast = useCallback(
    (msg: string, type: 'success' | 'error' = 'success') => {
      setToast({ msg, type });
      toastAnim.value = withSpring(1, { damping: 12, stiffness: 300 });
      setTimeout(() => {
        toastAnim.value = withTiming(0, { duration: 250 });
        setTimeout(() => setToast(null), 260);
      }, 2000);
    },
    [toastAnim],
  );

  const handleThemeSelect = async (themeId: string) => {
    try {
      hapticFeedback.light();
      setSelectedThemeId(themeId);
      setShowColorWheel(false);
      await setTheme(themeId);
      showToast('Theme updated');
    } catch {
      showToast('Failed to update theme', 'error');
    }
  };

  const handleColorWheelToggle = () => {
    hapticFeedback.light();
    setShowColorWheel(!showColorWheel);
    if (!showColorWheel) setSelectedThemeId('custom');
  };

  const handleCustomColorSelect = async (color: string) => {
    try {
      setSelectedThemeId('custom');
      await setCustomColor(color);
    } catch {
      showToast('Failed to save color', 'error');
    }
  };

  const handleResetCustomColor = async () => {
    try {
      hapticFeedback.light();
      setShowColorWheel(false);
      await clearCustomColor();
      setSelectedThemeId(currentTheme.id);
      showToast('Reset to preset theme');
    } catch {
      showToast('Failed to reset', 'error');
    }
  };

  const handleIconSelect = async (iconId: string) => {
    try {
      hapticFeedback.light();
      setSelectedIconId(iconId);
      await setIcon(iconId);
      showToast('Icon updated');
    } catch {
      showToast('Failed to update icon', 'error');
    }
  };

  const backScale = useSharedValue(1);
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backScale.value }],
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={C.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        entering={FadeInDown.delay(0).springify()}
        style={styles.header}
      >
        <AnimatedTouchable
          style={[backStyle, styles.backBtn]}
          onPressIn={() => {
            backScale.value = withSpring(0.88, { damping: 8, stiffness: 500 });
          }}
          onPressOut={() => {
            backScale.value = withSpring(1, { damping: 10, stiffness: 200 });
          }}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color={C.text.primary} strokeWidth={2.5} />
        </AnimatedTouchable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Customize</Text>
          <Text style={styles.headerSub}>Make it uniquely yours</Text>
        </View>

        <View style={styles.headerBadge}>
          <Wand2 size={16} color={C.primary} strokeWidth={2} />
        </View>
      </Animated.View>

      {toast && (
        <Animated.View style={[toastAnimStyle, styles.toastWrap]}>
          <LinearGradient
            colors={
              toast.type === 'success'
                ? ([C.success, '#059669'] as [string, string])
                : ([C.error, '#DC2626'] as [string, string])
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.toast}
          >
            <Check size={14} color="#FFF" strokeWidth={3} />
            <Text style={styles.toastText}>{toast.msg}</Text>
          </LinearGradient>
        </Animated.View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View
          entering={FadeInDown.delay(60).springify()}
          style={styles.heroBanner}
        >
          <LinearGradient
            colors={C.gradients.primary as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.heroBannerGrad}
          >
            <View style={styles.heroLeft}>
              <View style={styles.heroPill}>
                <Sparkles size={10} color="#FFFFFF" />
                <Text style={styles.heroPillText}>PREMIUM ENGINE</Text>
              </View>
              <Text style={styles.heroTitle}>Design Your Experience</Text>
              <Text style={styles.heroSub}>
                Choose curated themes or craft your own unique world
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.section}>
          <SectionLabel
            icon={Palette}
            label="Color Theme"
            color={C.primary}
            delay={100}
            styles={styles}
          />
          <Animated.Text
            entering={FadeIn.delay(140)}
            style={styles.sectionDesc}
          >
            Swipe to explore all themes
          </Animated.Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.themeScroll}
          decelerationRate="fast"
          snapToInterval={winWidth * 0.82 + 20}
          snapToAlignment="start"
        >
          {COLOR_SCHEMES.map((scheme, index) => (
            <ThemeCard
              key={scheme.id}
              scheme={scheme}
              isSelected={selectedThemeId === scheme.id && !customColor}
              onPress={() => handleThemeSelect(scheme.id)}
              index={index}
              winWidth={winWidth}
              styles={styles}
              C={C}
            />
          ))}
        </ScrollView>

        <View style={[styles.section, { marginTop: SPACING.xxl }]}>
          <SectionLabel
            icon={Pipette}
            label="Custom Color"
            color={C.primary}
            delay={160}
            styles={styles}
          />
          <Animated.Text
            entering={FadeIn.delay(200)}
            style={styles.sectionDesc}
          >
            Generate a unique theme from any color
          </Animated.Text>

          <Animated.View entering={FadeInUp.delay(220).springify()}>
            <TouchableOpacity
              onPress={handleColorWheelToggle}
              activeOpacity={0.9}
              style={[
                styles.colorToggleRow,
                showColorWheel && styles.colorToggleRowActive,
              ]}
            >
              <View style={styles.colorPillStack}>
                <LinearGradient
                  colors={['#FF5F6D', '#FFC371']}
                  style={styles.colorPill}
                />
                <LinearGradient
                  colors={['#2193b0', '#6dd5ed']}
                  style={[styles.colorPill, { marginLeft: -12 }]}
                />
                <LinearGradient
                  colors={['#ee9ca7', '#ffdde1']}
                  style={[styles.colorPill, { marginLeft: -12 }]}
                />
              </View>

              <View style={styles.colorToggleContent}>
                <Text style={styles.colorToggleTitle}>Creative Color Lab</Text>
                <Text style={styles.colorToggleSub}>
                  Mix any color to generate a custom palette
                </Text>
              </View>

              <View
                style={[
                  styles.colorToggleAction,
                  { backgroundColor: C.primary },
                ]}
              >
                {showColorWheel ? (
                  <Check size={18} color="#FFF" strokeWidth={3} />
                ) : (
                  <Pipette size={18} color="#FFF" strokeWidth={2.5} />
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>

          {showColorWheel && (
            <Animated.View
              entering={FadeInDown.springify()}
              style={styles.colorWheelWrap}
            >
              <ColorWheelPicker
                initialColor={customColor || C.primary}
                onColorSelect={handleCustomColorSelect}
                onReset={handleResetCustomColor}
                textPrimary={C.text.primary}
                textSecondary={C.text.secondary}
                cardBg={C.cardBackground}
              />
            </Animated.View>
          )}
        </View>

        <View style={[styles.section, { marginTop: SPACING.xxl }]}>
          <SectionLabel
            icon={AppWindow}
            label="App Icon"
            color={C.primary}
            delay={240}
            styles={styles}
          />
          <Animated.Text
            entering={FadeIn.delay(280)}
            style={styles.sectionDesc}
          >
            Choose your icon style
          </Animated.Text>

          <View style={styles.iconsRow}>
            {APP_ICONS.map((icon, index) => (
              <IconCard
                key={icon.id}
                icon={icon}
                isSelected={selectedIconId === icon.id}
                onPress={() => handleIconSelect(icon.id)}
                C={C}
                index={index}
                winWidth={winWidth}
                styles={styles}
              />
            ))}
          </View>
        </View>

        <Animated.View entering={FadeIn.delay(360)} style={styles.footerNote}>
          <View style={styles.footerNotePill}>
            <Sparkles size={13} color={C.primary} strokeWidth={2} />
            <Text style={styles.footerNoteText}>
              All changes are saved automatically
            </Text>
          </View>
        </Animated.View>
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
          gap: SPACING.md,
          paddingHorizontal: SPACING.xl,
          paddingBottom: SPACING.lg,
          paddingTop: insets.top + (SPACING.sm || 12),
        },
        backBtn: {
          width: 42,
          height: 42,
          borderRadius: 21,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: C.cardBackground,
          ...SHADOWS.xs,
        },
        headerText: { flex: 1 },
        headerTitle: {
          fontSize: 26,
          fontFamily: FONTS.bold,
          color: C.text.primary,
          letterSpacing: -0.5,
          lineHeight: 32,
        },
        headerSub: {
          fontSize: 13,
          fontFamily: FONTS.regular,
          color: C.text.secondary,
          marginTop: 1,
        },
        headerBadge: {
          width: 38,
          height: 38,
          borderRadius: 19,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: C.primary + '18',
        },
        toastWrap: {
          paddingHorizontal: SPACING.xl,
          marginBottom: SPACING.sm,
          zIndex: 100,
        },
        toast: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.sm,
          paddingVertical: 10,
          paddingHorizontal: SPACING.lg,
          borderRadius: BORDER_RADIUS.round,
          ...SHADOWS.md,
        },
        toastText: { color: '#FFF', fontSize: 13, fontFamily: FONTS.semibold },
        scrollContent: { paddingBottom: 120 },
        heroBanner: {
          marginHorizontal: SPACING.xl,
          marginBottom: SPACING.xxl,
          borderRadius: BORDER_RADIUS.xxl,
          overflow: 'hidden',
          ...SHADOWS.lg,
        },
        heroBannerGrad: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: SPACING.xl,
          paddingVertical: 24,
          gap: SPACING.lg,
        },
        heroLeft: { flex: 1, gap: 4 },
        heroPill: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: 'rgba(255,255,255,0.15)',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 6,
          alignSelf: 'flex-start',
          marginBottom: 4,
        },
        heroPillText: {
          fontSize: 9,
          fontFamily: FONTS.extrabold,
          color: '#FFFFFF',
          letterSpacing: 1,
        },
        heroTitle: {
          fontSize: 24,
          fontFamily: FONTS.bold,
          color: '#FFFFFF',
          letterSpacing: -0.5,
        },
        heroSub: {
          fontSize: 13,
          fontFamily: FONTS.medium,
          color: 'rgba(255,255,255,0.85)',
          lineHeight: 18,
        },
        section: { paddingHorizontal: SPACING.xl },
        sectionLabel: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.sm,
          marginBottom: 4,
        },
        sectionLabelIcon: {
          width: 28,
          height: 28,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
        },
        sectionLabelText: {
          fontSize: FONT_SIZES.md,
          fontFamily: FONTS.bold,
          letterSpacing: -0.2,
        },
        sectionDesc: {
          fontSize: 12,
          fontFamily: FONTS.regular,
          marginBottom: SPACING.lg,
          marginLeft: 4,
          color: C.text.secondary,
        },
        themeScroll: {
          paddingHorizontal: SPACING.xl,
          paddingBottom: 12,
          gap: 20,
        },
        themeGlow: {
          position: 'absolute',
          top: 10,
          left: 10,
          right: 10,
          bottom: 10,
          borderRadius: BORDER_RADIUS.xl,
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.5,
          shadowRadius: 24,
          elevation: Platform.OS === 'android' ? 0 : 20,
        },
        themeCard: {
          borderRadius: BORDER_RADIUS.xl,
          overflow: 'hidden',
          backgroundColor: C.cardBackground,
          borderWidth: 1.5,
          borderColor: 'transparent',
          ...SHADOWS.md,
        },
        themeCardSelected: { borderColor: C.primary },
        themeGradient: {
          height: 140,
          justifyContent: 'flex-end',
          padding: SPACING.md,
        },
        themeCardInner: {
          position: 'absolute',
          top: SPACING.lg,
          left: SPACING.lg,
          right: SPACING.lg,
        },
        themeCardDots: {
          flexDirection: 'row',
          gap: 5,
          marginBottom: SPACING.md,
        },
        themeDot90: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: 'rgba(255,255,255,0.9)',
        },
        themeDot60: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: 'rgba(255,255,255,0.6)',
        },
        themeDot35: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: 'rgba(255,255,255,0.35)',
        },
        themeCardMockLines: { gap: 0 },
        themeMockLine80: {
          width: '80%',
          height: 8,
          borderRadius: 4,
          backgroundColor: 'rgba(255,255,255,0.8)',
        },
        themeMockLine50: {
          width: '50%',
          height: 8,
          borderRadius: 4,
          backgroundColor: 'rgba(255,255,255,0.5)',
          marginTop: 6,
        },
        themeCheckBadge: {
          position: 'absolute',
          top: SPACING.md,
          right: SPACING.md,
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: 'rgba(255,255,255,0.3)',
          borderWidth: 2,
          borderColor: 'rgba(255,255,255,0.8)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        themeCardFooter: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: SPACING.md,
          paddingHorizontal: SPACING.lg,
          gap: SPACING.sm,
          backgroundColor: C.cardBackground,
        },
        themeCardEmoji: { fontSize: 22 },
        themeCardMeta: { flex: 1 },
        themeCardName: {
          fontSize: 14,
          fontFamily: FONTS.bold,
          color: C.text.primary,
          letterSpacing: -0.2,
        },
        themeCardSwatch: {
          fontSize: 10,
          fontFamily: FONTS.regular,
          color: C.text.light,
          marginTop: 1,
        },
        activeChip: {
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: BORDER_RADIUS.round,
        },
        activeChipText: { fontSize: 11, fontFamily: FONTS.semibold },
        colorToggleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.md,
          padding: 16,
          borderRadius: 24,
          borderWidth: 1,
          backgroundColor: C.cardBackground,
          borderColor: C.text.light + '20',
          ...SHADOWS.sm,
        },
        colorToggleRowActive: {
          borderColor: C.primary,
          backgroundColor: C.primary + '05',
        },
        colorPillStack: {
          flexDirection: 'row',
          alignItems: 'center',
          marginRight: 4,
        },
        colorPill: {
          width: 32,
          height: 32,
          borderRadius: 16,
          borderWidth: 2,
          borderColor: '#FFF',
          ...SHADOWS.xs,
        },
        colorToggleContent: { flex: 1, gap: 2 },
        colorToggleTitle: {
          fontSize: 16,
          fontFamily: FONTS.bold,
          color: C.text.primary,
          letterSpacing: -0.3,
        },
        colorToggleSub: {
          fontSize: 12,
          fontFamily: FONTS.medium,
          color: C.text.secondary,
        },
        colorToggleAction: {
          width: 42,
          height: 42,
          borderRadius: 21,
          alignItems: 'center',
          justifyContent: 'center',
          ...SHADOWS.sm,
        },
        colorWheelWrap: { marginTop: SPACING.lg, paddingBottom: 20 },
        iconsRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: SPACING.md,
          paddingHorizontal: SPACING.xl,
        },
        iconCardOuter: { alignItems: 'center', gap: SPACING.xs },
        iconCard: {
          borderRadius: BORDER_RADIUS.xl,
          alignItems: 'center',
          justifyContent: 'center',
          ...SHADOWS.xs,
        },
        iconEmoji: { fontSize: 28 },
        iconCheckDot: {
          position: 'absolute',
          top: -6,
          right: -6,
          width: 22,
          height: 22,
          borderRadius: 11,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: '#FFF',
        },
        iconCardLabel: {
          fontSize: 11,
          fontFamily: FONTS.medium,
          textAlign: 'center',
        },
        footerNote: { alignItems: 'center', marginTop: SPACING.xxxl },
        footerNotePill: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.xs,
          paddingHorizontal: SPACING.lg,
          paddingVertical: SPACING.sm,
          borderRadius: BORDER_RADIUS.pill,
          backgroundColor: C.primary + '12',
          borderWidth: 1,
          borderColor: C.primary + '20',
        },
        footerNoteText: {
          fontSize: 12,
          fontFamily: FONTS.medium,
          color: C.text.secondary,
        },
      }),
    [C],
  );
};
