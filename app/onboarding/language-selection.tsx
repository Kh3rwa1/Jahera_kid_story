import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SUPPORTED_LANGUAGES, MAX_LANGUAGES, Language } from '@/constants/languages';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '@/constants/theme';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Globe2 } from 'lucide-react-native';

export default function LanguageSelection() {
  const router = useRouter();
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>([]);

  const toggleLanguage = async (language: Language) => {
    const isSelected = selectedLanguages.some(l => l.code === language.code);

    if (isSelected) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedLanguages(selectedLanguages.filter(l => l.code !== language.code));
    } else {
      if (selectedLanguages.length >= MAX_LANGUAGES) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
          'Maximum Reached',
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
      Alert.alert('Select Language', 'Please select at least one language to continue.', [
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
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      {/* Header with animation */}
      <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.header}>
        <View style={styles.iconBadge}>
          <Globe2 size={32} color={COLORS.primary} strokeWidth={2.5} />
        </View>
        <Text style={styles.title}>Choose Your Languages</Text>
        <Text style={styles.subtitle}>
          Select up to {MAX_LANGUAGES} languages for personalized stories
        </Text>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                { width: `${(selectedLanguages.length / MAX_LANGUAGES) * 100}%` }
              ]}
            />
          </View>
          <Text style={styles.counter}>
            {selectedLanguages.length} of {MAX_LANGUAGES} selected
          </Text>
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
                style={[styles.languageCard, isSelected && styles.languageCardSelected]}
                onPress={() => toggleLanguage(language)}
                activeOpacity={0.7}
              >
                {isSelected && (
                  <LinearGradient
                    colors={[COLORS.primaryLight, COLORS.primary]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                )}
                <View style={styles.languageContent}>
                  <View style={styles.flagContainer}>
                    <Text style={styles.flag}>{language.flag}</Text>
                  </View>
                  <View style={styles.languageInfo}>
                    <Text style={[styles.languageName, isSelected && styles.languageNameSelected]}>
                      {language.name}
                    </Text>
                    <Text style={[styles.languageNative, isSelected && styles.languageNativeSelected]}>
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

      {/* Footer with CTA */}
      <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.footer}>
        <TouchableOpacity
          onPress={handleContinue}
          disabled={selectedLanguages.length === 0}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={selectedLanguages.length === 0
              ? [COLORS.text.light, COLORS.text.light]
              : [COLORS.primary, COLORS.primaryDark]
            }
            style={styles.continueButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.continueButtonText}>
              {selectedLanguages.length === 0 ? 'Select a language' : 'Continue →'}
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
  header: {
    paddingTop: 60,
    paddingHorizontal: SPACING.xxl,
    paddingBottom: SPACING.md,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: 'rgba(255, 102, 52, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: FONT_WEIGHTS.extrabold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
    marginBottom: SPACING.lg,
    lineHeight: 22,
    fontWeight: FONT_WEIGHTS.medium,
  },
  progressContainer: {
    gap: SPACING.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 102, 52, 0.15)',
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
  },
  counter: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.bold,
  },
  languageList: {
    flex: 1,
  },
  languageListContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
    gap: SPACING.xs,
  },
  languageCard: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  languageCardSelected: {
    ...SHADOWS.lg,
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.cardBackground,
  },
  flagContainer: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  flag: {
    fontSize: 32,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  languageNameSelected: {
    color: '#FFFFFF',
  },
  languageNative: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  languageNativeSelected: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  footer: {
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl + 10,
  },
  continueButton: {
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    ...SHADOWS.colored,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: 0.3,
  },
});
