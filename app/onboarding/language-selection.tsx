import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { SUPPORTED_LANGUAGES, MAX_LANGUAGES, Language } from '@/constants/languages';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONTS, SHADOWS } from '@/constants/theme';
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
  ZoomIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ChevronRight, Check, Sparkles } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { generateAudio } from '@/services/audioService';

export default function LanguageSelection() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: winWidth } = useWindowDimensions();
  const { currentTheme } = useTheme();
  const C = currentTheme.colors;
  const styles = useStyles(C, insets, winWidth);
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>([]);

  const btnScale = useSharedValue(1);

  useEffect(() => {
    // Welcome narration
    const timer = setTimeout(() => {
      speak("Hi there! Which languages should we use for your stories?", 'en');
    }, 800);

    return () => {
      clearTimeout(timer);
      if (sound) {
        sound.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const speak = async (text: string, lang: string) => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }

      const url = await generateAudio(text, lang);
      if (!url) return;

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true }
      );
      setSound(newSound);
    } catch (err) {
      console.error('TTS Error (Language Selection):', err);
    }
  };

  const btnAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const toggleLanguage = async (language: Language) => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const isSelected = selectedLanguages.some(l => l.code === language.code);
    if (isSelected) {
      setSelectedLanguages(selectedLanguages.filter(l => l.code !== language.code));
    } else {
      if (selectedLanguages.length >= MAX_LANGUAGES) {
        if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }
      setSelectedLanguages([...selectedLanguages, language]);
      // Narrate language name playfully
      speak(language.name, language.code);
    }
  };

  const handleContinue = async () => {
    if (selectedLanguages.length === 0) {
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    btnScale.value = withSequence(withSpring(0.92, { damping: 10 }), withSpring(1, { damping: 12 }));
    setTimeout(() => {
      router.push({
        pathname: '/onboarding/kid-name',
        params: { languages: JSON.stringify(selectedLanguages.map(l => ({ code: l.code, name: l.name }))) },
      });
    }, 150);
  };

  const canContinue = selectedLanguages.length > 0;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={[C.primary, C.primaryDark]}
          style={[styles.header, { paddingTop: insets.top + SPACING.md }]}
        >
          <View style={styles.topRow}>
            <View style={styles.progressContainer}>
              <View style={[styles.progressLine, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Animated.View 
                  entering={FadeInDown.delay(200)}
                  style={[styles.progressFill, { width: '25%', backgroundColor: '#FFFFFF' }]} 
                />
              </View>
              <Text style={styles.progressText}>Step 1 of 4</Text>
            </View>
          </View>

          <View style={styles.heroSection}>
            <LottieView
              source={{ uri: 'https://lottie.host/76cc96a6-f13e-436d-963d-4c3822295cf7/l9GzB6p7Qk.json' }}
              autoPlay
              loop
              style={styles.lottieGlobe}
            />
            <Animated.View entering={ZoomIn.delay(400).springify()} style={styles.sparkleIcon}>
              <Sparkles size={24} color="#FFD700" fill="#FFD700" />
            </Animated.View>
          </View>

          <Animated.Text entering={FadeInUp.delay(300).springify()} style={styles.title}>
            Languages!
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(400).springify()} style={styles.subtitle}>
            Which languages should we use{'\n'}to tell your stories?
          </Animated.Text>

          <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.selectionPill}>
            <Text style={styles.selectionLabel}>
              {selectedLanguages.length === 0 
                ? 'Pick up to 3' 
                : `Awesome! ${selectedLanguages.length} chosen`}
            </Text>
            <View style={styles.dotRow}>
              {[0, 1, 2].map(i => (
                <View 
                  key={i} 
                  style={[
                    styles.dot, 
                    i < selectedLanguages.length ? { backgroundColor: '#FFFFFF' } : { backgroundColor: 'rgba(255,255,255,0.3)' }
                  ]} 
                />
              ))}
            </View>
          </Animated.View>
        </LinearGradient>

        <View style={styles.listSection}>
          {SUPPORTED_LANGUAGES.map((lang, idx) => {
            const isSelected = selectedLanguages.some(l => l.code === lang.code);
            return (
              <Animated.View 
                key={lang.code}
                entering={FadeInDown.delay(600 + idx * 50).springify()}
              >
                <TouchableOpacity
                  onPress={() => toggleLanguage(lang)}
                  activeOpacity={0.9}
                  style={[
                    styles.card,
                    isSelected && { borderColor: C.primary, backgroundColor: C.primary + '10', borderWidth: 2.5 },
                  ]}
                >
                  <View style={[styles.flagCircle, { backgroundColor: isSelected ? '#FFFFFF' : '#F5F6F9' }]}>
                    <Text style={styles.flagEmoji}>{lang.flag}</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.langName, { color: isSelected ? C.primary : C.text.primary }]}>
                      {lang.name}
                    </Text>
                    <Text style={styles.langNative}>{lang.nativeName}</Text>
                  </View>
                  {isSelected ? (
                    <Animated.View entering={ZoomIn} style={[styles.checkCircle, { backgroundColor: C.primary }]}>
                      <Check size={16} color="#FFFFFF" strokeWidth={3} />
                    </Animated.View>
                  ) : (
                    <View style={styles.emptyCheck} />
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      <Animated.View 
        entering={FadeInUp.delay(200).springify()}
        style={[styles.footer, { paddingBottom: insets.bottom + SPACING.lg }]}
      >
        <Animated.View style={btnAnimStyle}>
          <TouchableOpacity 
            onPress={handleContinue} 
            disabled={!canContinue} 
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={canContinue ? [C.primary, C.primaryDark] : ['#E2E8F0', '#CBD5E1']}
              style={styles.cta}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.ctaText, !canContinue && { color: '#94A3B8' }]}>
                {canContinue ? 'Lets Go!' : 'Pick your language'}
              </Text>
              {canContinue && <ChevronRight size={22} color="#FFFFFF" strokeWidth={3} />}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const useStyles = (C: any, insets: any, winWidth: number) => {
  return useMemo(() => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    scroll: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    header: {
      paddingHorizontal: SPACING.xl,
      paddingBottom: SPACING.xxl,
      borderBottomLeftRadius: 40,
      borderBottomRightRadius: 40,
      alignItems: 'center',
      ...SHADOWS.md,
    },
    topRow: {
      width: '100%',
      marginBottom: SPACING.lg,
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    progressLine: {
      flex: 1,
      height: 6,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
    progressText: {
      fontSize: 12,
      fontFamily: FONTS.bold,
      color: 'rgba(255,255,255,0.7)',
    },
    heroSection: {
      position: 'relative',
      width: 180,
      height: 180,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.md,
    },
    lottieGlobe: {
      width: 220,
      height: 220,
    },
    sparkleIcon: {
      position: 'absolute',
      top: 10,
      right: 10,
    },
    title: {
      fontSize: 36,
      fontFamily: 'Baloo2-Bold',
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 17,
      fontFamily: 'Baloo2-Medium',
      color: 'rgba(255,255,255,0.85)',
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: SPACING.xl,
    },
    selectionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.15)',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 30,
      gap: 12,
    },
    selectionLabel: {
      fontSize: 14,
      fontFamily: FONTS.bold,
      color: '#FFFFFF',
    },
    dotRow: {
      flexDirection: 'row',
      gap: 4,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    listSection: {
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.xl,
      gap: 12,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 24,
      padding: 16,
      borderWidth: 1.5,
      borderColor: '#F1F5F9',
      ...SHADOWS.sm,
    },
    flagCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    flagEmoji: { fontSize: 32 },
    cardInfo: { flex: 1 },
    langName: {
      fontSize: 18,
      fontFamily: 'Baloo2-Bold',
      marginBottom: 0,
    },
    langNative: {
      fontSize: 13,
      fontFamily: FONTS.medium,
      color: C.text.light,
    },
    checkCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyCheck: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: '#E2E8F0',
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.md,
      backgroundColor: 'rgba(255,255,255,0.9)',
    },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
      borderRadius: 30,
      gap: 10,
      ...SHADOWS.md,
    },
    ctaText: {
      fontSize: 20,
      fontFamily: 'Baloo2-Bold',
      color: '#FFFFFF',
    },
  }), [C, insets]);
};
