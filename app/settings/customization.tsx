import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
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
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { ArrowLeft, Check, Palette, Pipette, Sparkles, Wand as Wand2, AppWindow } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { COLOR_SCHEMES } from '@/constants/themeSchemes';
import { APP_ICONS } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONTS } from '@/constants/theme';
import { hapticFeedback } from '@/utils/haptics';
import { ColorWheelPicker } from '@/components/ColorWheelPicker';

const { width } = Dimensions.get('window');
const THEME_CARD_WIDTH = width * 0.72;
const THEME_CARD_MARGIN = 10;
const ICON_CARD_SIZE = (width - SPACING.xl * 2 - SPACING.md * 3) / 4;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function ThemeCard({
  scheme,
  isSelected,
  onPress,
  index,
}: {
  scheme: (typeof COLOR_SCHEMES)[0];
  isSelected: boolean;
  onPress: () => void;
  index: number;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.94, { damping: 10, stiffness: 500 }),
      withSpring(1, { damping: 12, stiffness: 300 })
    );
    onPress();
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(80 + index * 50).springify()}
      style={animStyle}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.92}
        style={[
          styles.themeCard,
          isSelected && styles.themeCardSelected,
        ]}
      >
        <LinearGradient
          colors={scheme.colors.gradients.primary as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.themeGradient}
        >
          <View style={styles.themeCardInner}>
            <View style={styles.themeCardDots}>
              <View style={[styles.dot, { backgroundColor: 'rgba(255,255,255,0.9)' }]} />
              <View style={[styles.dot, { backgroundColor: 'rgba(255,255,255,0.6)' }]} />
              <View style={[styles.dot, { backgroundColor: 'rgba(255,255,255,0.35)' }]} />
            </View>
            <View style={styles.themeCardMockLines}>
              <View style={[styles.mockLine, { width: '70%', backgroundColor: 'rgba(255,255,255,0.8)' }]} />
              <View style={[styles.mockLine, { width: '45%', backgroundColor: 'rgba(255,255,255,0.5)', marginTop: 6 }]} />
            </View>
          </View>

          {isSelected && (
            <Animated.View entering={FadeIn.springify()} style={styles.themeCheckBadge}>
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
            <View style={[styles.activeChip, { backgroundColor: scheme.colors.primary + '20' }]}>
              <Text style={[styles.activeChipText, { color: scheme.colors.primary }]}>Active</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function IconCard({
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
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.85, { damping: 8, stiffness: 500 }),
      withSpring(1.08, { damping: 10, stiffness: 300 }),
      withSpring(1, { damping: 12, stiffness: 200 })
    );
    rotate.value = withSequence(
      withTiming(-12, { duration: 80 }),
      withTiming(12, { duration: 80 }),
      withTiming(0, { duration: 80 })
    );
    onPress();
  };

  return (
    <Animated.View entering={FadeInUp.delay(120 + index * 40).springify()}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.85} style={styles.iconCardOuter}>
        <Animated.View
          style={[
            animStyle,
            styles.iconCard,
            {
              backgroundColor: isSelected ? colors.primary + '15' : colors.cardBackground,
              borderColor: isSelected ? colors.primary : colors.text.light + '25',
              borderWidth: isSelected ? 2 : 1,
            },
          ]}
        >
          <Text style={styles.iconEmoji}>{icon.emoji}</Text>
          {isSelected && (
            <Animated.View
              entering={FadeIn.springify()}
              style={[styles.iconCheckDot, { backgroundColor: colors.primary }]}
            >
              <Check size={9} color="#FFF" strokeWidth={3.5} />
            </Animated.View>
          )}
        </Animated.View>
        <Text
          style={[
            styles.iconCardLabel,
            { color: isSelected ? colors.primary : colors.text.secondary },
          ]}
          numberOfLines={1}
        >
          {icon.name}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function SectionLabel({
  icon: Icon,
  label,
  color,
  delay = 0,
}: {
  icon: any;
  label: string;
  color: string;
  delay?: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={styles.sectionLabel}>
      <View style={[styles.sectionLabelIcon, { backgroundColor: color + '18' }]}>
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

  const [selectedThemeId, setSelectedThemeId] = useState(customColor ? 'custom' : currentTheme.id);
  const [selectedIconId, setSelectedIconId] = useState(currentIcon.id);
  const [showColorWheel, setShowColorWheel] = useState(!!customColor);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const toastAnim = useSharedValue(0);
  const toastAnimStyle = useAnimatedStyle(() => ({
    opacity: toastAnim.value,
    transform: [
      {
        translateY: interpolate(toastAnim.value, [0, 1], [-12, 0], Extrapolation.CLAMP),
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
    [toastAnim]
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

  const COLORS = currentTheme.colors;
  const backScale = useSharedValue(1);
  const backStyle = useAnimatedStyle(() => ({ transform: [{ scale: backScale.value }] }));

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <LinearGradient
        colors={COLORS.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.header}>
        <AnimatedTouchable
          style={[backStyle, styles.backBtn, { backgroundColor: COLORS.cardBackground }]}
          onPressIn={() => { backScale.value = withSpring(0.88, { damping: 8, stiffness: 500 }); }}
          onPressOut={() => { backScale.value = withSpring(1, { damping: 10, stiffness: 200 }); }}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color={COLORS.text.primary} strokeWidth={2.5} />
        </AnimatedTouchable>

        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: COLORS.text.primary }]}>Customize</Text>
          <Text style={[styles.headerSub, { color: COLORS.text.secondary }]}>
            Make it uniquely yours
          </Text>
        </View>

        <View style={[styles.headerBadge, { backgroundColor: COLORS.primary + '18' }]}>
          <Wand2 size={16} color={COLORS.primary} strokeWidth={2} />
        </View>
      </Animated.View>

      {toast && (
        <Animated.View style={[toastAnimStyle, styles.toastWrap]}>
          <LinearGradient
            colors={
              toast.type === 'success'
                ? ([COLORS.success, '#059669'] as [string, string])
                : ([COLORS.error, '#DC2626'] as [string, string])
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
        <Animated.View entering={FadeInDown.delay(60).springify()} style={styles.heroBanner}>
          <LinearGradient
            colors={COLORS.gradients.primary as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroBannerGrad}
          >
            <View style={styles.heroLeft}>
              <Text style={styles.heroTitle}>Design Your{'\n'}Experience</Text>
              <Text style={styles.heroSub}>
                Choose from curated themes or craft your own with the color picker
              </Text>
            </View>
            <View style={styles.heroRight}>
              <View style={styles.heroCircle1} />
              <View style={styles.heroCircle2} />
              <Sparkles size={32} color="rgba(255,255,255,0.9)" />
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.section}>
          <SectionLabel icon={Palette} label="Color Theme" color={COLORS.primary} delay={100} />
          <Animated.Text
            entering={FadeIn.delay(140)}
            style={[styles.sectionDesc, { color: COLORS.text.secondary }]}
          >
            Swipe to explore all themes
          </Animated.Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.themeScroll}
          decelerationRate="fast"
          snapToInterval={THEME_CARD_WIDTH + THEME_CARD_MARGIN * 2}
          snapToAlignment="start"
        >
          {COLOR_SCHEMES.map((scheme, index) => (
            <ThemeCard
              key={scheme.id}
              scheme={scheme}
              isSelected={selectedThemeId === scheme.id && !customColor}
              onPress={() => handleThemeSelect(scheme.id)}
              index={index}
            />
          ))}
        </ScrollView>

        <View style={[styles.section, { marginTop: SPACING.xxl }]}>
          <SectionLabel icon={Pipette} label="Custom Color" color={COLORS.primary} delay={160} />
          <Animated.Text
            entering={FadeIn.delay(200)}
            style={[styles.sectionDesc, { color: COLORS.text.secondary }]}
          >
            Generate a unique theme from any color
          </Animated.Text>

          <Animated.View entering={FadeInUp.delay(220).springify()}>
            <TouchableOpacity
              onPress={handleColorWheelToggle}
              activeOpacity={0.85}
              style={[
                styles.colorToggleRow,
                {
                  backgroundColor: showColorWheel
                    ? COLORS.primary + '12'
                    : COLORS.cardBackground,
                  borderColor: showColorWheel ? COLORS.primary : COLORS.text.light + '30',
                },
              ]}
            >
              <LinearGradient
                colors={
                  showColorWheel
                    ? (COLORS.gradients.primary as [string, string, ...string[]])
                    : (['#E8E8E8', '#D8D8D8'] as [string, string])
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.colorToggleIcon}
              >
                <Pipette size={17} color="#FFFFFF" strokeWidth={2.5} />
              </LinearGradient>

              <View style={styles.colorToggleContent}>
                <Text style={[styles.colorToggleTitle, { color: COLORS.text.primary }]}>
                  {showColorWheel ? 'Color Wheel Active' : 'Open Color Wheel'}
                </Text>
                <Text style={[styles.colorToggleSub, { color: COLORS.text.secondary }]}>
                  {showColorWheel
                    ? 'Drag to pick your perfect hue'
                    : 'Create a fully custom theme'}
                </Text>
              </View>

              <View
                style={[
                  styles.colorToggleArrow,
                  {
                    backgroundColor: showColorWheel
                      ? COLORS.primary + '20'
                      : COLORS.text.light + '18',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.colorToggleArrowText,
                    { color: showColorWheel ? COLORS.primary : COLORS.text.secondary },
                  ]}
                >
                  {showColorWheel ? '▲' : '▼'}
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

        <View style={[styles.section, { marginTop: SPACING.xxl }]}>
          <SectionLabel icon={AppWindow} label="App Icon" color={COLORS.primary} delay={240} />
          <Animated.Text
            entering={FadeIn.delay(280)}
            style={[styles.sectionDesc, { color: COLORS.text.secondary }]}
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
                colors={COLORS}
                index={index}
              />
            ))}
          </View>
        </View>

        <Animated.View entering={FadeIn.delay(360)} style={styles.footerNote}>
          <View
            style={[
              styles.footerNotePill,
              { backgroundColor: COLORS.primary + '12', borderColor: COLORS.primary + '20' },
            ]}
          >
            <Sparkles size={13} color={COLORS.primary} strokeWidth={2} />
            <Text style={[styles.footerNoteText, { color: COLORS.text.secondary }]}>
              All changes are saved automatically
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
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
    gap: SPACING.md,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: FONTS.bold,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  headerSub: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginTop: 1,
  },
  headerBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  toastText: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: FONTS.semibold,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  heroBanner: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xxl,
    borderRadius: BORDER_RADIUS.xxl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  heroBannerGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.xl,
    paddingVertical: 28,
    gap: SPACING.lg,
  },
  heroLeft: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    lineHeight: 28,
    letterSpacing: -0.3,
    marginBottom: SPACING.sm,
  },
  heroSub: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 18,
  },
  heroRight: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroCircle1: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  heroCircle2: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  section: {
    paddingHorizontal: SPACING.xl,
  },
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
  },
  themeScroll: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: 4,
    gap: THEME_CARD_MARGIN * 2,
  },
  themeCard: {
    width: THEME_CARD_WIDTH,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeCardSelected: {
    borderColor: 'rgba(0,0,0,0.1)',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  themeGradient: {
    height: 130,
    position: 'relative',
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
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  themeCardMockLines: {
    gap: 0,
  },
  mockLine: {
    height: 8,
    borderRadius: 4,
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
    backgroundColor: '#FFFFFF',
  },
  themeCardEmoji: {
    fontSize: 22,
  },
  themeCardMeta: {
    flex: 1,
  },
  themeCardName: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#1A1F36',
    letterSpacing: -0.2,
  },
  themeCardSwatch: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    color: '#ADB5BD',
    marginTop: 1,
  },
  activeChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.round,
  },
  activeChipText: {
    fontSize: 11,
    fontFamily: FONTS.semibold,
  },
  colorToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  colorToggleIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorToggleContent: {
    flex: 1,
    gap: 2,
  },
  colorToggleTitle: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    letterSpacing: -0.2,
  },
  colorToggleSub: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    lineHeight: 16,
  },
  colorToggleArrow: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorToggleArrowText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
  },
  colorWheelWrap: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  iconsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  iconCardOuter: {
    alignItems: 'center',
    gap: SPACING.xs,
    width: ICON_CARD_SIZE,
  },
  iconCard: {
    width: ICON_CARD_SIZE,
    height: ICON_CARD_SIZE,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  iconEmoji: {
    fontSize: 36,
  },
  iconCheckDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  iconCardLabel: {
    fontSize: 11,
    fontFamily: FONTS.semibold,
    textAlign: 'center',
  },
  footerNote: {
    alignItems: 'center',
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xl,
  },
  footerNotePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
  },
  footerNoteText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
});
