import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
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
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Globe as Globe2, ChevronRight, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function LanguageSelection() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentTheme } = useTheme();
  const themeColors = currentTheme.colors;
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>([]);

  const ring1 = useSharedValue(1);
  const ring2 = useSharedValue(1);

  useEffect(() => {
    ring1.value = withRepeat(
      withSequence(withTiming(1.4, { duration: 2000 }), withTiming(1, { duration: 2000 })),
      -1, true
    );
    ring2.value = withRepeat(
      withSequence(withTiming(1, { duration: 800 }), withTiming(1.25, { duration: 2000 }), withTiming(1, { duration: 1200 })),
      -1, true
    );
  }, []);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1.value }],
    opacity: interpolate(ring1.value, [1, 1.4], [0.18, 0]),
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2.value }],
    opacity: interpolate(ring2.value, [1, 1.25], [0.28, 0]),
  }));

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
  const progressWidth = (1 / 4) * 100;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Hero zone */}
      <LinearGradient
        colors={[themeColors.primary, themeColors.primaryDark]}
        style={[styles.hero, { paddingTop: insets.top + SPACING.lg }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View
            entering={FadeInDown.delay(100)}
            style={[styles.progressFill, { width: `${progressWidth}%`, backgroundColor: 'rgba(255,255,255,0.9)' }]}
          />
        </View>

        {/* Step label */}
        <Animated.View entering={FadeInDown.delay(120)} style={styles.stepLabel}>
          <Text style={styles.stepLabelText}>Step 1 of 4</Text>
        </Animated.View>

        {/* Globe icon with rings */}
        <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.iconZone}>
          <Animated.View style={[styles.ring, { width: 140, height: 140, borderRadius: 70, borderColor: 'rgba(255,255,255,0.3)' }, ring1Style]} />
          <Animated.View style={[styles.ring, { width: 100, height: 100, borderRadius: 50, borderColor: 'rgba(255,255,255,0.4)' }, ring2Style]} />
          <View style={styles.iconCircle}>
            <Globe2 size={38} color="#FFFFFF" strokeWidth={1.8} />
          </View>
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(200).springify()} style={styles.heroTitle}>
          Choose Language
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(240).springify()} style={styles.heroSubtitle}>
          Pick up to {MAX_LANGUAGES} languages for magical stories
        </Animated.Text>

        {/* Selection pill */}
        <Animated.View entering={FadeInDown.delay(280).springify()} style={styles.selectionPillRow}>
          {[0, 1, 2].map(i => {
            const filled = i < selectedLanguages.length;
            return (
              <View key={i} style={[styles.selectionPill, filled ? styles.selectionPillFilled : styles.selectionPillEmpty]}>
                {filled && <Check size={12} color={themeColors.primary} strokeWidth={3} />}
              </View>
            );
          })}
          <Text style={styles.selectionPillText}>
            {selectedLanguages.length === 0
              ? 'None selected'
              : `${selectedLanguages.length} of ${MAX_LANGUAGES} selected`}
          </Text>
        </Animated.View>
      </LinearGradient>

      {/* Language list */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {SUPPORTED_LANGUAGES.map((language, index) => {
          const isSelected = selectedLanguages.some(l => l.code === language.code);
          const selectionOrder = selectedLanguages.findIndex(l => l.code === language.code);
          return (
            <Animated.View
              key={language.code}
              entering={FadeInDown.delay(80 + index * 40).springify()}
            >
              <TouchableOpacity
                onPress={() => toggleLanguage(language)}
                activeOpacity={0.72}
              >
                <View style={[
                  styles.card,
                  { backgroundColor: themeColors.cardBackground },
                  isSelected && { borderColor: themeColors.primary, borderWidth: 2 },
                ]}>
                  {isSelected && (
                    <View style={[styles.cardAccent, { backgroundColor: themeColors.primary }]} />
                  )}
                  <View style={[styles.flagBadge, { backgroundColor: isSelected ? themeColors.primary + '15' : themeColors.primary + '0A' }]}>
                    <Text style={styles.flagText}>{language.flag}</Text>
                  </View>
                  <View style={styles.langInfo}>
                    <Text style={[styles.langName, { color: themeColors.text.primary }]}>{language.name}</Text>
                    <Text style={[styles.langNative, { color: themeColors.text.secondary }]}>{language.nativeName}</Text>
                  </View>
                  {isSelected ? (
                    <View style={[styles.checkCircle, { backgroundColor: themeColors.primary }]}>
                      <Check size={14} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  ) : (
                    <View style={[styles.unselectedDot, { borderColor: themeColors.primary + '40' }]} />
                  )}
                </View>
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
            colors={canContinue ? [themeColors.primary, themeColors.primaryDark] : ['#D1D5DB', '#D1D5DB']}
            style={styles.ctaButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.ctaText}>
              {canContinue ? `Continue (${selectedLanguages.length})` : 'Select a language'}
            </Text>
            {canContinue && <ChevronRight size={22} color="#FFFFFF" strokeWidth={2.5} />}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  hero: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  stepLabel: {
    alignSelf: 'flex-start',
    marginBottom: SPACING.lg,
  },
  stepLabelText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  iconZone: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  heroTitle: {
    fontSize: 26,
    fontFamily: FONTS.extrabold,
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  selectionPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.pill,
  },
  selectionPill: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionPillFilled: {
    backgroundColor: '#FFFFFF',
  },
  selectionPillEmpty: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  selectionPillText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.3,
  },
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.md,
    ...SHADOWS.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  flagBadge: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagText: { fontSize: 28 },
  langInfo: { flex: 1 },
  langName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    marginBottom: 2,
  },
  langNative: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  unselectedDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
  },
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    backgroundColor: '#F8F9FA',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: 18,
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
