import { BrandVideoBackground } from '@/components/BrandVideoBackground';
import { BORDER_RADIUS,FONTS,SHADOWS,SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useNarrationAudio } from '@/hooks/useNarrationAudio';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams,useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { ArrowLeft,Check,ChevronRight,MapPin,Sparkles,X } from 'lucide-react-native';
import { useEffect,useMemo,useRef,useState } from 'react';
import {
KeyboardAvoidingView,
Platform,
ScrollView,
StatusBar,
StyleSheet,
Text,
TextInput,
TouchableOpacity,
useWindowDimensions,
View,
} from 'react-native';
import Animated,{
FadeInDown,
FadeInUp,
useAnimatedStyle,
useSharedValue,
withSequence,
withSpring,
ZoomIn
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CityOption,POPULAR_CITIES } from '@/constants/indianCities';

export default function KidName() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { width: winWidth } = useWindowDimensions();
  const { currentTheme } = useTheme();
  const C = currentTheme.colors;
  const styles = useStyles(C, insets, winWidth);
  const { speak } = useNarrationAudio('kid-name');
  const [name, setName] = useState('');
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(null);
  const [customCity, setCustomCity] = useState<string>('');
  const [showCityInput, setShowCityInput] = useState<boolean>(false);
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
    };
  }, [params.languages, speak]);

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
      params: {
        languages: params.languages as string,
        kidName: trimmedName,
        city: selectedCity?.city || null,
        region: selectedCity?.region || null,
        country: selectedCity?.country || 'India',
        consentGivenAt: params.consentGivenAt as string,
      },
    });
  };

  const handleBack = async () => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const canContinue = name.trim().length >= 2;
  const charsNeeded = Math.max(0, 2 - name.trim().length);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    borderColor: withSpring(name.trim().length >= 2 ? C.primary : '#F1F5F9', { damping: 12 }),
    backgroundColor: withSpring(name.trim().length >= 2 ? C.primary + '08' : '#FFFFFF', { damping: 12 }),
  }));

  const inputGlowStyle = useAnimatedStyle(() => ({
    opacity: withSpring(name.trim().length >= 2 ? 1 : 0),
    transform: [{ scale: withSpring(name.trim().length >= 2 ? 1 : 0.8) }],
  }));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <BrandVideoBackground videoId="onboarding_video" fallbackSource={require('@/assets/jahera.mp4')} overlayOpacity={0.25} />
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 }]}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={false}
        >
        <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
          <View style={styles.topRow}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ArrowLeft size={22} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
            <View style={styles.progressLineOuter}>
              <View style={[styles.progressFill, { width: '50%', backgroundColor: '#FFFFFF' }]} />
            </View>
            <Text style={styles.stepLabel}>Step 2 of 4</Text>
          </View>

          <View style={styles.characterContainer}>
            <LottieView
              source={{ uri: 'https://lottie.host/67e23118-8f81-4277-bc0c-99c0d12521c7/yX71f3o7Xp.json' }}
              autoPlay
              loop
              style={styles.lottieRobot}
            />
            <Animated.View entering={ZoomIn.delay(300)} style={styles.nameSparkle}>
              <Sparkles size={32} color="#FFD700" fill="#FFD700" />
            </Animated.View>
          </View>

          <Animated.Text entering={FadeInDown.delay(200).springify()} style={styles.title}>
            Who's the Hero?
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(300).springify()} style={styles.subtitle}>
            Enter your name so I can make you{'\n'}the star of every adventure!
          </Animated.Text>
        </View>

        <View style={styles.body}>
          <Animated.View entering={FadeInUp.delay(500).springify()} style={[styles.inputWrapper, cardAnimStyle]}>
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
            />
            <Animated.View style={[styles.inputGlow, inputGlowStyle]} />
            {canContinue ? (
              <Animated.View entering={ZoomIn.springify()} style={[styles.checkCircle, { backgroundColor: C.primary }]}>
                <Check size={20} color="#FFFFFF" strokeWidth={4} />
              </Animated.View>
            ) : (
                <View style={styles.emptyCheck} />
            )}
          </Animated.View>

          {!canContinue && name.length > 0 && (
            <Animated.Text entering={FadeInDown.springify()} style={styles.errorHint}>
               Almost there... {charsNeeded} more letter{charsNeeded > 1 ? 's' : ''} ✨
            </Animated.Text>
          )}


          {/* City Selection - Optional */}
          <Animated.View entering={FadeInDown.delay(200).springify()} style={{ marginTop: SPACING.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md }}>
              <MapPin size={18} color={C.primary} />
              <Text style={{ fontFamily: FONTS.semibold, fontSize: 16, color: '#FFFFFF', marginLeft: SPACING.sm }}>
                Where do you live?
              </Text>
              <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: 'rgba(255,255,255,0.75)', marginLeft: SPACING.sm }}>
                (Optional)
              </Text>
            </View>

            <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: SPACING.md }}>
              Stories will mention your city to make them feel real ✨
            </Text>

            {selectedCity && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: C.primary + '30',
                paddingHorizontal: SPACING.md,
                paddingVertical: SPACING.sm,
                borderRadius: BORDER_RADIUS.lg,
                marginBottom: SPACING.md,
              }}>
                <MapPin size={16} color={'#FFFFFF'} />
                <Text style={{
                  fontFamily: FONTS.medium,
                  fontSize: 14,
                  color: '#FFFFFF',
                  marginLeft: SPACING.sm,
                  flex: 1,
                }}>
                  {selectedCity.city}{selectedCity.region ? `, ${selectedCity.region}` : ''}
                </Text>
                <TouchableOpacity onPress={() => { setSelectedCity(null); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
                  <X size={16} color={'#FFFFFF'} />
                </TouchableOpacity>
              </View>
            )}

            {!selectedCity && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: SPACING.sm, gap: 8 }}
              >
                {POPULAR_CITIES.map((cityOption) => (
                  <TouchableOpacity
                    key={cityOption.city}
                    onPress={() => {
                      setSelectedCity(cityOption);
                      setCustomCity('');
                      setShowCityInput(false);
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: 'rgba(255,255,255,0.12)',
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.3)',
                    }}
                  >
                    <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: '#FFFFFF' }}>
                      {cityOption.city}
                    </Text>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  onPress={() => {
                    setShowCityInput(true);
                    setSelectedCity(null);
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: C.primary + '40',
                    borderWidth: 1,
                    borderColor: C.primary + 'AA',
                  }}
                >
                  <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: '#FFFFFF' }}>
                    Other ✏️
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {showCityInput && !selectedCity && (
              <TextInput
                value={customCity}
                onChangeText={(text) => {
                  setCustomCity(text);
                  if (text.length >= 2) {
                    setSelectedCity({ city: text.trim(), region: '', country: 'India' });
                  }
                }}
                placeholder="Type your city or town name..."
                placeholderTextColor={'rgba(255,255,255,0.5)'}
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: 15,
                  color: '#FFFFFF',
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.3)',
                  borderRadius: BORDER_RADIUS.lg,
                  paddingHorizontal: SPACING.md,
                  paddingVertical: SPACING.md,
                  marginTop: SPACING.sm,
                }}
                autoFocus
                maxLength={50}
              />
            )}
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(700).springify()} style={styles.tipCard}>
             <Sparkles size={16} color={C.primary} />
             <Text style={styles.tipText}>This will be your name in all your stories!</Text>
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
          <TouchableOpacity onPress={handleContinue} disabled={!canContinue} activeOpacity={0.9}>
            <LinearGradient
              colors={canContinue ? ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.95)'] : ['rgba(255,255,255,0.5)', 'rgba(255,255,255,0.4)']}
              style={styles.cta}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.ctaText, { color: canContinue ? C.primaryDark : '#CBD5E1' }]}>
                {canContinue ? 'Continue Adventure' : 'Enter Your Name'}
              </Text>
              {canContinue && (
                <View style={styles.ctaArrow}>
                  <ChevronRight size={22} color="#FFFFFF" strokeWidth={3} />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = (C: any, insets: any, winWidth: number) => {
  return useMemo(() => StyleSheet.create({
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
      top: -4, left: -4, right: -4, bottom: -4,
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
      top: -60, left: 0, right: 0, height: 120,
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
  }), [C, insets, winWidth]);
};
