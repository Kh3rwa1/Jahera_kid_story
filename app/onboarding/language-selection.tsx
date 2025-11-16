import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SUPPORTED_LANGUAGES, MAX_LANGUAGES, Language } from '@/constants/languages';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '@/constants/theme';

export default function LanguageSelection() {
  const router = useRouter();
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>([]);

  const toggleLanguage = (language: Language) => {
    const isSelected = selectedLanguages.some(l => l.code === language.code);

    if (isSelected) {
      setSelectedLanguages(selectedLanguages.filter(l => l.code !== language.code));
    } else {
      if (selectedLanguages.length >= MAX_LANGUAGES) {
        Alert.alert(
          'Maximum Reached',
          `You can select up to ${MAX_LANGUAGES} languages.`,
          [{ text: 'OK' }]
        );
        return;
      }
      setSelectedLanguages([...selectedLanguages, language]);
    }
  };

  const handleContinue = () => {
    if (selectedLanguages.length === 0) {
      Alert.alert('Select Language', 'Please select at least one language to continue.', [
        { text: 'OK' },
      ]);
      return;
    }

    router.push({
      pathname: '/onboarding/kid-name',
      params: {
        languages: JSON.stringify(selectedLanguages.map(l => ({ code: l.code, name: l.name }))),
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Languages 🌍</Text>
        <Text style={styles.subtitle}>
          Select up to {MAX_LANGUAGES} languages for your stories
        </Text>
        <Text style={styles.counter}>
          {selectedLanguages.length} / {MAX_LANGUAGES} selected
        </Text>
      </View>

      <ScrollView style={styles.languageList} contentContainerStyle={styles.languageListContent}>
        {SUPPORTED_LANGUAGES.map(language => {
          const isSelected = selectedLanguages.some(l => l.code === language.code);

          return (
            <TouchableOpacity
              key={language.code}
              style={[styles.languageCard, isSelected && styles.languageCardSelected]}
              onPress={() => toggleLanguage(language)}
              activeOpacity={0.7}>
              <Text style={styles.flag}>{language.flag}</Text>
              <View style={styles.languageInfo}>
                <Text style={[styles.languageName, isSelected && styles.languageNameSelected]}>
                  {language.name}
                </Text>
                <Text
                  style={[styles.languageNative, isSelected && styles.languageNativeSelected]}>
                  {language.nativeName}
                </Text>
              </View>
              {isSelected && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            selectedLanguages.length === 0 && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={selectedLanguages.length === 0}
          activeOpacity={0.8}>
          <Text style={styles.continueButtonText}>Continue →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: SPACING.xxl,
    paddingBottom: SPACING.xxl,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
    marginBottom: SPACING.lg,
  },
  counter: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.bold,
  },
  languageList: {
    flex: 1,
  },
  languageListContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.cardBackground,
  },
  languageCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFE5DB',
  },
  flag: {
    fontSize: 36,
    marginRight: SPACING.lg,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  languageNameSelected: {
    color: COLORS.primary,
  },
  languageNative: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
  },
  languageNativeSelected: {
    color: COLORS.primary,
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
  footer: {
    padding: SPACING.xxl,
    backgroundColor: COLORS.background,
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.text.light,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
});
