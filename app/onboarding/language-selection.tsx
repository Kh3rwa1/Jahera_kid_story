import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SUPPORTED_LANGUAGES, MAX_LANGUAGES, Language } from '@/constants/languages';

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
        <Text style={styles.title}>Choose Your Languages</Text>
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
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 12,
  },
  counter: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '600',
  },
  languageList: {
    flex: 1,
  },
  languageListContent: {
    padding: 16,
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  languageCardSelected: {
    borderColor: '#0d6efd',
    backgroundColor: '#e7f1ff',
  },
  flag: {
    fontSize: 32,
    marginRight: 16,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  languageNameSelected: {
    color: '#0d6efd',
  },
  languageNative: {
    fontSize: 14,
    color: '#6c757d',
  },
  languageNativeSelected: {
    color: '#0b5ed7',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0d6efd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  continueButton: {
    backgroundColor: '#0d6efd',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#adb5bd',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
