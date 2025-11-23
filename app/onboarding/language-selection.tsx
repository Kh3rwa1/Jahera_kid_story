import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SUPPORTED_LANGUAGES, MAX_LANGUAGES, Language } from '@/constants/languages';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withRepeat,
  withSequence,
  interpolate
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Globe2, Sparkles, Star } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function LanguageSelection() {
  const router = useRouter();
  const { currentTheme } = useTheme();
  const themeColors = currentTheme.colors;
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>([]);

  // Floating sparkle animations
  const sparkle1 = useSharedValue(0);
  const sparkle2 = useSharedValue(0);
  const sparkle3 = useSharedValue(0);

  useEffect(() => {
    sparkle1.value = withRepeat(
      withSequence(
        withSpring(1, { damping: 2 }),
        withSpring(0, { damping: 2 })
      ),
      -1,
      false
    );
    sparkle2.value = withRepeat(
      withSequence(
        withSpring(1, { damping: 2 }),
        withSpring(0, { damping: 2 })
      ),
      -1,
      false
    );
    sparkle3.value = withRepeat(
      withSequence(
        withSpring(1, { damping: 2 }),
        withSpring(0, { damping: 2 })
      ),
      -1,
      false
    );
  }, []);

  const sparkle1Style = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: interpolate(sparkle1.value, [0, 1], [0.3, 1]),
      transform: [{ scale: interpolate(sparkle1.value, [0, 1], [0.8, 1.2]) }],
    };
  });

  const sparkle2Style = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: interpolate(sparkle2.value, [0, 1], [0.3, 1]),
      transform: [{ scale: interpolate(sparkle2.value, [0, 1], [0.8, 1.2]) }],
    };
  });

  const sparkle3Style = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: interpolate(sparkle3.value, [0, 1], [0.3, 1]),
      transform: [{ scale: interpolate(sparkle3.value, [0, 1], [0.8, 1.2]) }],
    };
  });

  const toggleLanguage = async (language: Language) => {
    const isSelected = selectedLanguages.some(l => l.code === language.code);

    if (isSelected) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedLanguages(selectedLanguages.filter(l => l.code !== language.code));
    } else {
      if (selectedLanguages.length >= MAX_LANGUAGES) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
          '🌈 Maximum Reached',
          `You can select up to ${MAX_LANGUAGES} languages.`,
          [{ text: 'OK' }]
        );
        return;
      }
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setSelectedLanguages([...selectedLanguages, language]);
    }
  };

  const handleContinue = async () => {
    if (selectedLanguages.length === 0) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('🌍 Select Language', 'Please select at least one language to continue.', [
        { text: 'OK' },
      ]);
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push({
      pathname: '/onboarding/kid-name',
      params: {
        languages: JSON.stringify(selectedLanguages.map(l => ({ code: l.code, name: l.name }))),
      },
    });
  };

  return (
    <LinearGradient colors={themeColors.backgroundGradient} style={styles.container}>
      {/* Floating decorative elements */}
      <Animated.View style={[styles.floatingSparkle, { top: '8%', left: '10%' }, sparkle1Style]}>
        <Sparkles size={24} color={themeColors.primary} />
      </Animated.View>
      <Animated.View style={[styles.floatingSparkle, { top: '12%', right: '15%' }, sparkle2Style]}>
        <Star size={20} color={themeColors.primary} />
      </Animated.View>
      <Animated.View style={[styles.floatingSparkle, { top: '20%', right: '8%' }, sparkle3Style]}>
        <Sparkles size={18} color={themeColors.primary} />
      </Animated.View>

      {/* Header with enhanced design */}
      <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.header}>
        <View style={[styles.iconBadge, { backgroundColor: themeColors.primary + '20' }]}>
          <Globe2 size={40} color={themeColors.primary} strokeWidth={2.5} />
        </View>
        <Text style={[styles.title, { color: themeColors.text.primary }]}>
          Choose Your Languages! 🌍
        </Text>
        <Text style={[styles.subtitle, { color: themeColors.text.secondary }]}>
          Pick up to {MAX_LANGUAGES} languages for magical stories
        </Text>

        {/* Enhanced progress indicator */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: themeColors.primary + '20' }]}>
            <LinearGradient
              colors={themeColors.gradients.primary}
              style={[
                styles.progressFill,
                { width: `${(selectedLanguages.length / MAX_LANGUAGES) * 100}%` }
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
          <View style={styles.counterRow}>
            <Text style={[styles.counter, { color: themeColors.primary }]}>
              {selectedLanguages.length} of {MAX_LANGUAGES} selected
            </Text>
            {selectedLanguages.length > 0 && (
              <Animated.View entering={FadeInDown.springify()}>
                <Text style={styles.emoji}>🎉</Text>
              </Animated.View>
            )}
          </View>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.languageList}
        contentContainerStyle={styles.languageListContent}
        showsVerticalScrollIndicator={false}
      >
        {SUPPORTED_LANGUAGES.map((language, index) => {
          const isSelected = selectedLanguages.some(l => l.code === language.code);

          return (
            <Animated.View
              key={language.code}
              entering={FadeInDown.delay(200 + index * 50).springify()}
            >
              <TouchableOpacity
                style={[
                  styles.languageCard,
                  {
                    backgroundColor: themeColors.cardBackground,
                    borderColor: isSelected ? themeColors.primary : 'transparent'
                  }
                ]}
                onPress={() => toggleLanguage(language)}
                activeOpacity={0.7}
              >
                {isSelected && (
                  <LinearGradient
                    colors={themeColors.gradients.primary}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                )}
                <View style={styles.languageContent}>
                  <LinearGradient
                    colors={isSelected
                      ? ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']
                      : [themeColors.primary + '15', themeColors.primary + '10']
                    }
                    style={styles.flagContainer}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.flag}>{language.flag}</Text>
                  </LinearGradient>
                  <View style={styles.languageInfo}>
                    <Text style={[
                      styles.languageName,
                      { color: isSelected ? '#FFFFFF' : themeColors.text.primary }
                    ]}>
                      {language.name}
                    </Text>
                    <Text style={[
                      styles.languageNative,
                      { color: isSelected ? 'rgba(255, 255, 255, 0.9)' : themeColors.text.secondary }
                    ]}>
                      {language.nativeName}
                    </Text>
                  </View>
                  {isSelected && (
                    <Animated.View
                      entering={FadeInDown.springify()}
                      style={styles.checkmark}
                    >
                      <Text style={styles.checkmarkText}>✓</Text>
                    </Animated.View>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* Enhanced Footer with CTA */}
      <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.footer}>
        <TouchableOpacity
          onPress={handleContinue}
          disabled={selectedLanguages.length === 0}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={selectedLanguages.length === 0
              ? [themeColors.text.light, themeColors.text.light]
              : themeColors.gradients.primary
            }
            style={styles.continueButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.continueButtonText}>
              {selectedLanguages.length === 0 ? 'Select a language 🌟' : 'Continue Adventure →'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingSparkle: {
    position: 'absolute',
    zIndex: 0,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: SPACING.xxl,
    paddingBottom: SPACING.md,
    zIndex: 1,
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  title: {
    fontSize: 34,
    fontWeight: FONT_WEIGHTS.extrabold,
    marginBottom: SPACING.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONT_SIZES.lg,
    marginBottom: SPACING.xl,
    lineHeight: 24,
    fontWeight: FONT_WEIGHTS.medium,
  },
  progressContainer: {
    gap: SPACING.sm,
  },
  progressBar: {
    height: 8,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.md,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  counter: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  emoji: {
    fontSize: 18,
  },
  languageList: {
    flex: 1,
    zIndex: 1,
  },
  languageListContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  languageCard: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 3,
    ...SHADOWS.lg,
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  flagContainer: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
    ...SHADOWS.sm,
  },
  flag: {
    fontSize: 36,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: 4,
  },
  languageNative: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  checkmarkText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
  footer: {
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl + 10,
    zIndex: 1,
  },
  continueButton: {
    paddingVertical: SPACING.xl,
    borderRadius: BORDER_RADIUS.pill,
    alignItems: 'center',
    ...SHADOWS.xl,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: 0.5,
  },
});
