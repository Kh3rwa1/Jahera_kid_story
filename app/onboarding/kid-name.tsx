import { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import LottieView from 'lottie-react-native';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONTS, SHADOWS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  ZoomIn, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence 
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, ChevronRight, Check, Sparkles } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { generateAudio } from '@/services/audioService';

export default function KidName() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { width: winWidth } = useWindowDimensions();
  const { currentTheme } = useTheme();
  const C = currentTheme.colors;
  const styles = useStyles(C, insets, winWidth);
  const [name, setName] = useState('');
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const inputRef = useRef<TextInput>(null);

  const cardScale = useSharedValue(1);

  useEffect(() => {
    // Greeting narration
    const timer = setTimeout(() => {
      let lang = 'en';
      try {
        const langs = JSON.parse(params.languages as string);
        if (langs && langs.length > 0) lang = langs[0].code;
      } catch {}
      speak("Got it! Now, what is the little adventurer's name?", lang);
    }, 800);

    return () => {
      clearTimeout(timer);
      if (sound) {
        sound.unloadAsync().catch(() => {});
      }
    };
  }, []);

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
      console.error('TTS Error (Kid Name):', err);
    }
  };

  const handleContinue = async () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      cardScale.value = withSequence(withSpring(1.05), withSpring(1));
      return;
    }
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push({
      pathname: '/onboarding/family-members',
      params: { languages: params.languages as string, kidName: trimmedName },
    });
  };

  const handleBack = async () => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const canContinue = name.trim().length >= 2;
  const charsNeeded = Math.max(0, 2 - name.trim().length);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }]
  }));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={false}
        >
        <LinearGradient
          colors={[C.primary, C.primaryDark]}
          style={[styles.header, { paddingTop: insets.top + SPACING.md }]}
        >
          <View style={styles.topRow}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
            <View style={styles.progressLine}>
              <View style={[styles.progressFill, { width: '50%', backgroundColor: '#FFFFFF' }]} />
            </View>
            <Text style={styles.stepLabel}>2 of 4</Text>
          </View>

          <View style={styles.characterContainer}>
            <LottieView
              source={{ uri: 'https://lottie.host/67e23118-8f81-4277-bc0c-99c0d12521c7/yX71f3o7Xp.json' }}
              autoPlay
              loop
              style={styles.lottieRobot}
            />
            <Animated.View entering={ZoomIn.delay(300)} style={styles.nameSparkle}>
              <Sparkles size={24} color="#FFD700" fill="#FFD700" />
            </Animated.View>
          </View>

          <Animated.Text entering={FadeInDown.delay(200)} style={styles.title}>
            What's your name?
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(300)} style={styles.subtitle}>
            Enter your name so I can{'\n'}make you the star of the story!
          </Animated.Text>
        </LinearGradient>

        <View style={styles.body}>
          <Animated.View entering={FadeInUp.delay(500)} style={[styles.inputWrapper, cardAnimStyle]}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Child's Name"
              placeholderTextColor="#CBD5E1"
              value={name}
              onChangeText={setName}
              autoFocus
              autoCapitalize="words"
              selectionColor={C.primary}
            />
            {canContinue && (
              <Animated.View entering={ZoomIn} style={[styles.checkCircle, { backgroundColor: C.primary }]}>
                <Check size={20} color="#FFFFFF" strokeWidth={3} />
              </Animated.View>
            )}
          </Animated.View>

          {!canContinue && name.length > 0 && (
            <Animated.Text entering={FadeInDown} style={styles.errorHint}>
              Keep typing! {charsNeeded} more letter{charsNeeded > 1 ? 's' : ''}...
            </Animated.Text>
          )}

          <Animated.Text entering={FadeInDown.delay(600)} style={styles.infoHint}>
            This name will be used in every adventure! 🌟
          </Animated.Text>
        </View>
        </ScrollView>

        <Animated.View
          entering={FadeInUp.delay(400)}
          style={[styles.footer, { paddingBottom: insets.bottom + SPACING.lg }]}
        >
          <TouchableOpacity onPress={handleContinue} disabled={!canContinue} activeOpacity={0.8}>
            <LinearGradient
              colors={canContinue ? [C.primary, C.primaryDark] : ['#E2E8F0', '#CBD5E1']}
              style={styles.cta}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.ctaText, !canContinue && { color: '#94A3B8' }]}>
                {canContinue ? 'Continue' : 'Almost there...'}
              </Text>
              {canContinue && <ChevronRight size={22} color="#FFFFFF" strokeWidth={3} />}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = (C: any, insets: any, winWidth: number) => {
  return useMemo(() => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    kav: { flex: 1 },
    scroll: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    header: {
      paddingHorizontal: SPACING.xl,
      paddingBottom: SPACING.xxxl,
      borderBottomLeftRadius: 40,
      borderBottomRightRadius: 40,
      alignItems: 'center',
      ...SHADOWS.md,
    },
    topRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: SPACING.lg,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressLine: {
      flex: 1,
      height: 6,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
    stepLabel: {
      fontSize: 13,
      fontFamily: FONTS.bold,
      color: 'rgba(255,255,255,0.7)',
    },
    characterContainer: {
      width: 180,
      height: 180,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    lottieRobot: {
      width: 220,
      height: 220,
    },
    nameSparkle: {
      position: 'absolute',
      top: 20,
      left: 0,
    },
    title: {
      fontSize: 32,
      fontFamily: 'Baloo2-Bold',
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 17,
      fontFamily: 'Baloo2-Medium',
      color: 'rgba(255,255,255,0.85)',
      textAlign: 'center',
      lineHeight: 22,
    },
    body: {
      flex: 1,
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.xxxl,
      alignItems: 'center',
    },
    inputWrapper: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 30,
      paddingHorizontal: 24,
      paddingVertical: Platform.OS === 'ios' ? 18 : 8,
      borderWidth: 3,
      borderColor: '#F1F5F9',
      ...SHADOWS.md,
      marginBottom: 16,
    },
    input: {
      flex: 1,
      fontSize: 24,
      fontFamily: 'Baloo2-Bold',
      color: C.text.primary,
      paddingRight: 12,
    },
    checkCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorHint: {
      fontSize: 14,
      fontFamily: FONTS.bold,
      color: '#F59E0B',
      marginBottom: 12,
    },
    infoHint: {
      fontSize: 14,
      fontFamily: FONTS.medium,
      color: '#94A3B8',
      textAlign: 'center',
      marginTop: 8,
    },
    footer: {
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
