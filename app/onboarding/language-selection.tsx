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

  const dotStyle = (i: number) => useAnimatedStyle(() => ({
    backgroundColor: i < selectedLanguages.length ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
    transform: [{ scale: withSpring(i < selectedLanguages.length ? 1.2 : 1) }]
  }));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 140 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={[C.primary, C.primaryDark]}
          style={[styles.header, { paddingTop: insets.top + SPACING.md }]}
        >
          {/* Mesh Gradient Accents */}
          <View style={styles.headerMesh1} />
          <View style={styles.headerMesh2} />

          <View style={styles.topRow}>
            <View style={styles.progressContainer}>
              <View style={styles.progressLineOuter}>
                <Animated.View 
                  entering={FadeInDown.delay(200)}
                  style={[styles.progressFill, { width: '25%', backgroundColor: '#FFFFFF' }]} 
                />
              </View>
              <Text style={styles.progressText}>JOURNEY START</Text>
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
              <Sparkles size={28} color="#FFD700" fill="#FFD700" />
            </Animated.View>
          </View>

          <Animated.Text entering={FadeInUp.delay(300).springify()} style={styles.title}>
            Choose Your Tongue
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(400).springify()} style={styles.subtitle}>
            Select the languages for your magical{'\n'}adventure to begin.
          </Animated.Text>

          <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.selectionPill}>
             <View style={styles.pillGlow} />
            <Text style={styles.selectionLabel}>
              {selectedLanguages.length === 0 
                ? 'Pick up to 3' 
                : `${selectedLanguages.length} Languages Selected`}
            </Text>
            <View style={styles.dotRow}>
              {[0, 1, 2].map(i => (
                <Animated.View 
                  key={i} 
                  style={[styles.dot, dotStyle(i)]} 
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
                entering={FadeInDown.delay(600 + idx * 60).springify().damping(12)}
              >
                <TouchableOpacity
                  onPress={() => toggleLanguage(lang)}
                  activeOpacity={0.85}
                  style={[
                    styles.card,
                    isSelected && styles.cardSelected,
                  ]}
                >
                  <View style={[styles.flagCircle, { backgroundColor: isSelected ? C.primary + '15' : '#F8FAFC' }]}>
                    <Text style={styles.flagEmoji}>{lang.flag}</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.langName, { color: isSelected ? C.primary : C.text.primary }]}>
                      {lang.name}
                    </Text>
                    <Text style={styles.langNative}>{lang.nativeName}</Text>
                  </View>
                  {isSelected ? (
                    <Animated.View entering={ZoomIn.springify()} style={[styles.checkCircle, { backgroundColor: C.primary }]}>
                      <Check size={18} color="#FFFFFF" strokeWidth={3} />
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
        entering={FadeInUp.delay(300).springify()}
        style={[styles.footer, { paddingBottom: insets.bottom + SPACING.lg }]}
      >
        <LinearGradient
           colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.95)', 'rgba(255,255,255,1)']}
           style={styles.footerGradient}
        />
        <Animated.View style={btnAnimStyle}>
          <TouchableOpacity 
            onPress={handleContinue} 
            disabled={!canContinue} 
            activeOpacity={0.9}
            style={styles.ctaWrapper}
          >
            <LinearGradient
              colors={canContinue ? [C.primary, C.primaryDark] : ['#E2E8F0', '#CBD5E1']}
              style={styles.cta}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.ctaText, !canContinue && { color: '#94A3B8' }]}>
                {canContinue ? 'Continue Journey' : 'Choose a Language'}
              </Text>
              {canContinue && (
                <View style={styles.ctaArrow}>
                   <ChevronRight size={22} color="#FFFFFF" strokeWidth={3} />
                </View>
              )}
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
      paddingBottom: SPACING.xxxl,
      borderBottomLeftRadius: 48,
      borderBottomRightRadius: 48,
      alignItems: 'center',
      ...SHADOWS.lg,
      overflow: 'hidden',
    },
    headerMesh1: {
      position: 'absolute', top: -50, right: -50, width: 200, height: 200,
      borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.1)',
    },
    headerMesh2: {
      position: 'absolute', bottom: -30, left: -40, width: 150, height: 150,
      borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.05)',
    },
    topRow: {
      width: '100%',
      marginBottom: SPACING.xl,
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    progressLineOuter: {
      flex: 1,
      height: 8,
      borderRadius: 4,
      backgroundColor: 'rgba(255,255,255,0.2)',
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    progressText: {
      fontSize: 10,
      fontFamily: FONTS.extrabold,
      color: '#FFFFFF',
      letterSpacing: 1.5,
      opacity: 0.8,
    },
    heroSection: {
      position: 'relative',
      width: 160,
      height: 160,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.md,
    },
    lottieGlobe: {
      width: 200,
      height: 200,
    },
    sparkleIcon: {
      position: 'absolute',
      top: 0,
      right: 0,
    },
    title: {
      fontSize: 34,
      fontFamily: FONTS.extrabold,
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: 6,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 16,
      fontFamily: FONTS.medium,
      color: 'rgba(255,255,255,0.9)',
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: SPACING.xl,
    },
    selectionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.15)',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 30,
      gap: 14,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.25)',
    },
    pillGlow: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: '#FFFFFF',
      opacity: 0.05,
      borderRadius: 30,
    },
    selectionLabel: {
      fontSize: 14,
      fontFamily: FONTS.extrabold,
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    dotRow: {
      flexDirection: 'row',
      gap: 6,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    listSection: {
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.xxl,
      gap: 16,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 28,
      padding: 18,
      borderWidth: 2,
      borderColor: '#F1F5F9',
      ...SHADOWS.sm,
    },
    cardSelected: {
      borderColor: C.primary,
      backgroundColor: C.primary + '08',
      ...SHADOWS.md,
    },
    flagCircle: {
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 18,
      ...SHADOWS.xs,
    },
    flagEmoji: { fontSize: 34 },
    cardInfo: { flex: 1, gap: 2 },
    langName: {
      fontSize: 20,
      fontFamily: FONTS.extrabold,
      letterSpacing: -0.3,
    },
    langNative: {
      fontSize: 13,
      color: C.text.light,
      opacity: 0.7,
    },
    checkCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      ...SHADOWS.sm,
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
      paddingTop: SPACING.xl,
    },
    footerGradient: {
       position: 'absolute',
       top: -40, left: 0, right: 0, height: 160,
    },
    ctaWrapper: {
       width: '100%',
    },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
      borderRadius: 32,
      gap: 12,
      ...SHADOWS.md,
    },
    ctaText: {
      fontSize: 20,
      fontFamily: FONTS.extrabold,
      color: '#FFFFFF',
      letterSpacing: -0.2,
    },
    ctaArrow: {
       width: 40,
       height: 40,
       borderRadius: 20,
       backgroundColor: 'rgba(255,255,255,0.2)',
       alignItems: 'center',
       justifyContent: 'center',
       marginLeft: 4,
    },
  }), [C, insets]);
};
