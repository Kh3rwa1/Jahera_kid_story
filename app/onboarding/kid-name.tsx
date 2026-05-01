import { BrandVideoBackground } from '@/components/BrandVideoBackground';
import { FONTS, SHADOWS, SPACING } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNarrationAudio } from '@/hooks/useNarrationAudio';
import { profileService, languageService } from '@/services/database';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { ArrowLeft, Check, Sparkles } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ColorScheme } from '@/constants/themeSchemes';

export default function KidName() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { currentTheme } = useTheme();
  const C = currentTheme.colors;
  const styles = useStyles(C);
  const { speak } = useNarrationAudio('kid-name');
  const { user } = useAuth();
  const { loadProfile } = useApp();
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const cardScale = useSharedValue(1);

  useEffect(() => {
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
    };
  }, [params.languages, speak]);

  const handleContinue = async () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      if (Platform.OS !== 'web')
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        );
      cardScale.value = withSequence(withSpring(1.05), withSpring(1));
      return;
    }

    if (!user) {
      setErrorMsg('You must be signed in to create a profile.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (Platform.OS !== 'web')
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      if (!params.languages) {
        setErrorMsg('Session expired. Please restart onboarding.');
        setIsLoading(false);
        return;
      }

      const languages = JSON.parse(params.languages as string);
      const primaryLanguage = languages[0]?.code || 'en';

      const profile = await profileService.create(
        user.$id,
        trimmedName,
        primaryLanguage,
        {
          consent_given_at: (params.consentGivenAt as string) || null,
        },
      );

      if (!profile) {
        setErrorMsg('Failed to create profile. Please try again.');
        setIsLoading(false);
        return;
      }

      await Promise.all(
        languages.map((lang: { code: string; name: string }) =>
          languageService.add(profile.id, lang.code, lang.name),
        ),
      );

      await loadProfile();

      if (Platform.OS !== 'web')
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );

      router.replace('/(tabs)');
    } catch {
      if (Platform.OS !== 'web')
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMsg('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = async () => {
    if (Platform.OS !== 'web')
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const canContinue = name.trim().length >= 2;
  const charsNeeded = Math.max(0, 2 - name.trim().length);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    borderColor: withSpring(name.trim().length >= 2 ? C.primary : '#F1F5F9', {
      damping: 12,
    }),
    backgroundColor: withSpring(
      name.trim().length >= 2 ? C.primary + '08' : '#FFFFFF',
      { damping: 12 },
    ),
  }));

  const inputGlowStyle = useAnimatedStyle(() => ({
    opacity: withSpring(name.trim().length >= 2 ? 1 : 0),
    transform: [{ scale: withSpring(name.trim().length >= 2 ? 1 : 0.8) }],
  }));

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <BrandVideoBackground
        videoId="onboarding_video"
        fallbackSource={require('@/assets/jahera.mp4')}
        overlayOpacity={0.25}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 }]}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={false}
        >
          <View
            style={[styles.header, { paddingTop: insets.top + SPACING.md }]}
          >
            <View style={styles.topRow}>
              <TouchableOpacity
                onPress={handleBack}
                style={styles.backButton}
                disabled={isLoading}
              >
                <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>
              <View style={styles.progressLineOuter}>
                <View
                  style={[
                    styles.progressFill,
                    { width: '100%', backgroundColor: '#FFFFFF' },
                  ]}
                />
              </View>
              <Text style={styles.stepLabel}>Final Step!</Text>
            </View>

            <View style={styles.characterContainer}>
              <LottieView
                source={{
                  uri: 'https://lottie.host/67e23118-8f81-4277-bc0c-99c0d12521c7/yX71f3o7Xp.json',
                }}
                autoPlay
                loop
                style={styles.lottieRobot}
              />
              <Animated.View
                entering={ZoomIn.delay(300)}
                style={styles.nameSparkle}
              >
                <Sparkles size={32} color="#FFD700" fill="#FFD700" />
              </Animated.View>
            </View>

            <Animated.Text
              entering={FadeInDown.delay(200).springify()}
              style={styles.title}
            >
              Who's the Hero?
            </Animated.Text>
            <Animated.Text
              entering={FadeInDown.delay(300).springify()}
              style={styles.subtitle}
            >
              Enter your name so I can make you{'\n'}the star of every
              adventure!
            </Animated.Text>
          </View>

          <View style={styles.body}>
            <Animated.View
              entering={FadeInUp.delay(500).springify()}
              style={[styles.inputWrapper, cardAnimStyle]}
            >
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="Magic Name"
                placeholderTextColor="#CBD5E1"
                value={name}
                onChangeText={setName}
                autoFocus
                autoCapitalize="words"
                selectionColor={C.primary}
                editable={!isLoading}
              />
              <Animated.View style={[styles.inputGlow, inputGlowStyle]} />
              {canContinue ? (
                <Animated.View
                  entering={ZoomIn.springify()}
                  style={[styles.checkCircle, { backgroundColor: C.primary }]}
                >
                  <Check size={20} color="#FFFFFF" strokeWidth={4} />
                </Animated.View>
              ) : (
                <View style={styles.emptyCheck} />
              )}
            </Animated.View>

            {!canContinue && name.length > 0 && (
              <Animated.Text
                entering={FadeInDown.springify()}
                style={styles.errorHint}
              >
                Almost there... {charsNeeded} more letter
                {charsNeeded > 1 ? 's' : ''}
              </Animated.Text>
            )}

            {errorMsg && (
              <Animated.Text
                entering={FadeInDown.springify()}
                style={styles.errorText}
              >
                {errorMsg}
              </Animated.Text>
            )}

            <Animated.View
              entering={FadeInUp.delay(700).springify()}
              style={styles.tipCard}
            >
              <Sparkles size={16} color={C.primary} />
              <Text style={styles.tipText}>
                This will be your name in all your stories!
              </Text>
            </Animated.View>
          </View>
        </ScrollView>

        <Animated.View
          entering={FadeInUp.delay(400).springify()}
          style={[styles.footer, { paddingBottom: insets.bottom + SPACING.lg }]}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)']}
            style={styles.footerGradient}
          />
          <TouchableOpacity
            onPress={handleContinue}
            disabled={!canContinue || isLoading}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={
                canContinue
                  ? ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.95)']
                  : ['rgba(255,255,255,0.5)', 'rgba(255,255,255,0.4)']
              }
              style={styles.cta}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <ActivityIndicator color={C.primaryDark} size="small" />
              ) : (
                <>
                  <Text
                    style={[
                      styles.ctaText,
                      { color: canContinue ? C.primaryDark : '#CBD5E1' },
                    ]}
                  >
                    {canContinue ? 'Create Magic!' : 'Enter Your Name'}
                  </Text>
                  {canContinue && (
                    <View style={styles.ctaArrow}>
                      <Sparkles
                        size={22}
                        color={C.primaryDark}
                        strokeWidth={3}
                      />
                    </View>
                  )}
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = (C: ColorScheme['colors']) => {
  return useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: '#000' },
        kav: { flex: 1 },
        scroll: { flex: 1 },
        scrollContent: { flexGrow: 1 },
        header: {
          paddingHorizontal: SPACING.xl,
          paddingBottom: SPACING.xxxl,
          alignItems: 'center',
          overflow: 'hidden',
        },
        topRow: {
          width: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          marginBottom: SPACING.xl,
        },
        backButton: {
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: 'rgba(255,255,255,0.15)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        progressLineOuter: {
          flex: 1,
          height: 8,
          backgroundColor: 'rgba(255,255,255,0.2)',
          borderRadius: 4,
          overflow: 'hidden',
        },
        progressFill: {
          height: '100%',
          borderRadius: 4,
        },
        stepLabel: {
          fontSize: 10,
          fontFamily: FONTS.extrabold,
          color: '#FFFFFF',
          letterSpacing: 1.2,
          opacity: 0.85,
        },
        characterContainer: {
          width: 160,
          height: 160,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          marginBottom: 8,
        },
        lottieRobot: {
          width: 200,
          height: 200,
        },
        nameSparkle: {
          position: 'absolute',
          bottom: 20,
          left: -20,
        },
        title: {
          fontSize: 34,
          fontFamily: FONTS.extrabold,
          color: '#FFFFFF',
          textAlign: 'center',
          marginBottom: 6,
          letterSpacing: -0.5,
          textShadowColor: 'rgba(0,0,0,0.5)',
          textShadowOffset: { width: 0, height: 4 },
          textShadowRadius: 10,
        },
        subtitle: {
          fontSize: 16,
          fontFamily: FONTS.medium,
          color: '#FFFFFF',
          textAlign: 'center',
          lineHeight: 22,
          textShadowColor: 'rgba(0,0,0,0.5)',
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: 6,
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
          backgroundColor: 'rgba(255,255,255,0.85)',
          borderRadius: 32,
          paddingHorizontal: 28,
          paddingVertical: Platform.OS === 'ios' ? 20 : 10,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.5)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          marginBottom: 20,
        },
        inputGlow: {
          position: 'absolute',
          top: -4,
          left: -4,
          right: -4,
          bottom: -4,
          borderRadius: 36,
          borderWidth: 2,
          borderColor: C.primary + '40',
          zIndex: -1,
        },
        input: {
          flex: 1,
          fontSize: 26,
          fontFamily: FONTS.extrabold,
          color: C.text.primary,
          letterSpacing: -0.5,
          paddingRight: 12,
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
        errorHint: {
          fontSize: 14,
          fontFamily: FONTS.extrabold,
          color: '#F59E0B',
          marginBottom: 16,
          letterSpacing: 0.3,
        },
        errorText: {
          fontSize: 14,
          fontFamily: FONTS.bold,
          color: '#FF6B6B',
          marginBottom: 16,
          textAlign: 'center',
        },
        tipCard: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: 'rgba(255,255,255,0.85)',
          paddingHorizontal: 20,
          paddingVertical: 14,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.5)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
        tipText: {
          fontSize: 13,
          fontFamily: FONTS.bold,
          color: C.text.secondary,
          opacity: 0.8,
        },
        footerGradient: {
          position: 'absolute',
          top: -60,
          left: 0,
          right: 0,
          height: 120,
        },
        footer: {
          paddingHorizontal: SPACING.xl,
          paddingTop: SPACING.md,
          backgroundColor: 'transparent',
        },
        cta: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 20,
          borderRadius: 32,
          gap: 12,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.7)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 20,
        },
        ctaText: {
          fontSize: 20,
          fontFamily: FONTS.extrabold,
          color: C.primaryDark,
          letterSpacing: -0.2,
        },
        ctaArrow: {
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: C.primary + '15',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 4,
        },
      }),
    [C],
  );
};
