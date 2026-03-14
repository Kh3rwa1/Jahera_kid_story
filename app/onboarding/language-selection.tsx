import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { SUPPORTED_LANGUAGES, MAX_LANGUAGES, Language } from '@/constants/languages';
import { SPACING, BORDER_RADIUS, FONT_SIZES, SHADOWS, FONTS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Globe as Globe2, ChevronRight, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const STEP_DOTS = [true, false, false, false];

export default function LanguageSelection() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentTheme } = useTheme();
  const themeColors = currentTheme.colors;
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>([]);

  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1600 }),
        withTiming(1, { duration: 1600 })
      ),
      -1,
      true
    );
  }, []);

  const iconPulseStyle = useAnimatedStyle(() => {
    'worklet';
    return { transform: [{ scale: pulse.value }] };
  });

  const toggleLanguage = async (language: Language) => {
    const isSelected = selectedLanguages.some(l => l.code === language.code);
    if (isSelected) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedLanguages(selectedLanguages.filter(l => l.code !== language.code));
    } else {
      if (selectedLanguages.length >= MAX_LANGUAGES) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setSelectedLanguages([...selectedLanguages, language]);
    }
  };

  const handleContinue = async () => {
    if (selectedLanguages.length === 0) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push({
      pathname: '/onboarding/kid-name',
      params: { languages: JSON.stringify(selectedLanguages.map(l => ({ code: l.code, name: l.name }))) },
    });
  };

  const canContinue = selectedLanguages.length > 0;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={themeColors.backgroundGradient} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <Animated.View
        entering={FadeInDown.delay(80).springify()}
        style={[styles.header, { paddingTop: insets.top + SPACING.lg }]}
      >
        <Animated.View style={iconPulseStyle}>
          <View style={[styles.iconCircle, { shadowColor: themeColors.primary }]}>
            <LinearGradient
              colors={[themeColors.primary, themeColors.primaryDark]}
              style={styles.iconGradient}
            >
              <Globe2 size={32} color="#FFFFFF" strokeWidth={2} />
            </LinearGradient>
          </View>
        </Animated.View>

        <Text style={[styles.title, { color: themeColors.text.primary }]}>
          Choose Language
        </Text>
        <Text style={[styles.subtitle, { color: themeColors.text.secondary }]}>
          Pick up to {MAX_LANGUAGES} languages for magical stories
        </Text>

        {/* Step indicator */}
        <View style={styles.stepRow}>
          {STEP_DOTS.map((active, i) => (
            <View
              key={i}
              style={[
                styles.stepDot,
                active
                  ? [styles.stepDotActive, { backgroundColor: themeColors.primary }]
                  : { backgroundColor: themeColors.primary + '25' },
              ]}
            />
          ))}
        </View>

        {/* Selection count */}
        <View style={[styles.countBadge, { backgroundColor: themeColors.primary + '15' }]}>
          <Text style={[styles.countText, { color: themeColors.primary }]}>
            {selectedLanguages.length} of {MAX_LANGUAGES} selected
          </Text>
          {selectedLanguages.length > 0 && (
            <Animated.Text entering={ZoomIn.springify()} style={styles.countEmoji}>
              ✓
            </Animated.Text>
          )}
        </View>
      </Animated.View>

      {/* Language list */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {SUPPORTED_LANGUAGES.map((language, index) => {
          const isSelected = selectedLanguages.some(l => l.code === language.code);
          return (
            <Animated.View
              key={language.code}
              entering={FadeInDown.delay(160 + index * 45).springify()}
            >
              <TouchableOpacity
                onPress={() => toggleLanguage(language)}
                activeOpacity={0.75}
                style={styles.cardTouchable}
              >
                {isSelected ? (
                  <LinearGradient
                    colors={[themeColors.primary, themeColors.primaryDark]}
                    style={styles.card}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.flagBadgeSelected}>
                      <Text style={styles.flagText}>{language.flag}</Text>
                    </View>
                    <View style={styles.langInfo}>
                      <Text style={styles.langNameSelected}>{language.name}</Text>
                      <Text style={styles.langNativeSelected}>{language.nativeName}</Text>
                    </View>
                    <View style={styles.checkCircle}>
                      <Check size={16} color={themeColors.primary} strokeWidth={3} />
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={[styles.card, { backgroundColor: themeColors.cardBackground, shadowColor: themeColors.primary }]}>
                    <View style={[styles.flagBadge, { backgroundColor: themeColors.primary + '12' }]}>
                      <Text style={styles.flagText}>{language.flag}</Text>
                    </View>
                    <View style={styles.langInfo}>
                      <Text style={[styles.langName, { color: themeColors.text.primary }]}>{language.name}</Text>
                      <Text style={[styles.langNative, { color: themeColors.text.secondary }]}>{language.nativeName}</Text>
                    </View>
                    <View style={[styles.chevronBadge, { backgroundColor: themeColors.primary + '10' }]}>
                      <ChevronRight size={16} color={themeColors.primary} strokeWidth={2.5} />
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* Footer CTA */}
      <Animated.View
        entering={FadeInUp.delay(300).springify()}
        style={[styles.footer, { paddingBottom: insets.bottom + SPACING.lg }]}
      >
        <TouchableOpacity onPress={handleContinue} disabled={!canContinue} activeOpacity={0.88}>
          <LinearGradient
            colors={canContinue ? [themeColors.primary, themeColors.primaryDark] : [themeColors.text.light + 'AA', themeColors.text.light + 'AA']}
            style={styles.ctaButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.ctaText}>
              {canContinue ? 'Continue' : 'Select a language'}
            </Text>
            {canContinue && <ChevronRight size={22} color="#FFFFFF" strokeWidth={2.5} />}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  iconGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    fontFamily: FONTS.extrabold,
    letterSpacing: -0.5,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  stepRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  stepDot: {
    height: 6,
    borderRadius: 3,
  },
  stepDotActive: {
    width: 24,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.pill,
  },
  countText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
  },
  countEmoji: {
    fontSize: 13,
    fontFamily: FONTS.bold,
  },
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  cardTouchable: {},
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.lg,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  flagBadge: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagBadgeSelected: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  flagText: { fontSize: 30 },
  langInfo: { flex: 1 },
  langName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    marginBottom: 2,
  },
  langNative: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  langNameSelected: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  langNativeSelected: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.8)',
  },
  chevronBadge: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xl - 2,
    borderRadius: BORDER_RADIUS.pill,
    ...SHADOWS.xl,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    letterSpacing: 0.3,
  },
});
