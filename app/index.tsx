import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles, BookOpen, Globe, Gamepad2, ArrowRight } from 'lucide-react-native';
import { SPACING, BORDER_RADIUS, FONT_SIZES, SHADOWS, FONTS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  useSharedValue,
  FadeInDown,
  FadeInUp,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375 || height < 667;

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentTheme, isLoading: themeLoading } = useTheme();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useApp();
  const themeColors = currentTheme.colors;
  const scaleButton = useSharedValue(1);
  const glowOpacity = useSharedValue(0.5);
  const float1 = useSharedValue(0);
  const float2 = useSharedValue(0);
  const float3 = useSharedValue(0);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 2200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    float1.value = withRepeat(
      withSequence(withTiming(-14, { duration: 2800 }), withTiming(0, { duration: 2800 })),
      -1,
      true
    );
    float2.value = withRepeat(
      withSequence(withTiming(-20, { duration: 3400 }), withTiming(0, { duration: 3400 })),
      -1,
      true
    );
    float3.value = withRepeat(
      withSequence(withTiming(-10, { duration: 2000 }), withTiming(0, { duration: 2000 })),
      -1,
      true
    );
  }, []);

  useEffect(() => {
    if (authLoading || profileLoading || themeLoading) return;
    if (isAuthenticated) {
      if (profile) {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding/language-selection');
      }
    }
  }, [authLoading, profileLoading, isAuthenticated, profile, themeLoading]);

  const handleGetStarted = () => {
    scaleButton.value = withSequence(
      withSpring(0.95, { damping: 10 }),
      withSpring(1, { damping: 10 })
    );
    setTimeout(() => {
      router.push('/auth/register');
    }, 100);
  };

  const buttonAnimStyle = useAnimatedStyle(() => {
    'worklet';
    return { transform: [{ scale: scaleButton.value }] };
  });

  const glowStyle = useAnimatedStyle(() => {
    'worklet';
    return { opacity: glowOpacity.value };
  });

  const float1Style = useAnimatedStyle(() => {
    'worklet';
    return { transform: [{ translateY: float1.value }] };
  });
  const float2Style = useAnimatedStyle(() => {
    'worklet';
    return { transform: [{ translateY: float2.value }] };
  });
  const float3Style = useAnimatedStyle(() => {
    'worklet';
    return { transform: [{ translateY: float3.value }] };
  });

  if (authLoading || profileLoading || themeLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={themeColors.backgroundGradient} style={StyleSheet.absoluteFill} />
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.loadingIconWrap}>
          <Sparkles size={40} color={themeColors.primary} strokeWidth={1.5} />
        </Animated.View>
      </View>
    );
  }

  const features = [
    { emoji: '📚', title: 'Magical Stories', description: 'Personalized tales starring your child' },
    { emoji: '🎮', title: 'Fun Quizzes', description: 'Test knowledge & earn rewards' },
    { emoji: '🌍', title: 'Multi-Language', description: 'Stories in any language' },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={themeColors.backgroundGradient} style={StyleSheet.absoluteFill} />

      {/* Ambient floating orbs */}
      <Animated.View style={[styles.orb, styles.orb1, float1Style]}>
        <LinearGradient
          colors={[themeColors.primary + '30', themeColors.primary + '00']}
          style={styles.orbGradient}
        />
      </Animated.View>
      <Animated.View style={[styles.orb, styles.orb2, float2Style]}>
        <LinearGradient
          colors={[themeColors.primaryLight + '25', themeColors.primaryLight + '00']}
          style={styles.orbGradient}
        />
      </Animated.View>
      <Animated.View style={[styles.orb, styles.orb3, float3Style]}>
        <LinearGradient
          colors={[themeColors.primary + '18', themeColors.primary + '00']}
          style={styles.orbGradient}
        />
      </Animated.View>

      {/* Hero section */}
      <View style={[styles.hero, { paddingTop: insets.top + (isSmallDevice ? 32 : 56) }]}>
        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.iconWrap}>
          <Animated.View style={[styles.glowRing, glowStyle]}>
            <LinearGradient
              colors={[themeColors.primary + '40', themeColors.primary + '00']}
              style={styles.glowRingGradient}
            />
          </Animated.View>
          <View style={[styles.iconCircle, { shadowColor: themeColors.primary }]}>
            <LinearGradient
              colors={[themeColors.primary, themeColors.primaryDark]}
              style={styles.iconGradient}
            >
              <Sparkles size={isSmallDevice ? 42 : 52} color="#FFFFFF" strokeWidth={1.8} />
            </LinearGradient>
          </View>
        </Animated.View>

        <Animated.Text
          entering={FadeInUp.delay(320).springify()}
          style={[styles.appName, { color: themeColors.text.primary }]}
        >
          Jahera
        </Animated.Text>

        <Animated.Text
          entering={FadeInUp.delay(420).springify()}
          style={[styles.tagline, { color: themeColors.text.secondary }]}
        >
          Where imagination comes to life
        </Animated.Text>
      </View>

      {/* Feature cards */}
      <View style={styles.featuresWrap}>
        {features.map((f, i) => (
          <Animated.View key={f.title} entering={FadeInDown.delay(540 + i * 90).springify()}>
            <LinearGradient
              colors={[themeColors.cardBackground, themeColors.cardBackground]}
              style={[styles.featureCard, { shadowColor: themeColors.primary }]}
            >
              <View style={[styles.featureEmojiBadge, { backgroundColor: themeColors.primary + '15' }]}>
                <Text style={styles.featureEmoji}>{f.emoji}</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: themeColors.text.primary }]}>{f.title}</Text>
                <Text style={[styles.featureDesc, { color: themeColors.text.secondary }]}>{f.description}</Text>
              </View>
              <View style={[styles.featureArrow, { backgroundColor: themeColors.primary + '15' }]}>
                <ArrowRight size={14} color={themeColors.primary} strokeWidth={2.5} />
              </View>
            </LinearGradient>
          </Animated.View>
        ))}
      </View>

      {/* CTA footer */}
      <Animated.View
        entering={FadeInUp.delay(860).springify()}
        style={[styles.footer, { paddingBottom: insets.bottom + SPACING.xl }]}
      >
        <Animated.View style={buttonAnimStyle}>
          <TouchableOpacity onPress={handleGetStarted} activeOpacity={0.9}>
            <LinearGradient
              colors={[themeColors.primary, themeColors.primaryDark]}
              style={styles.ctaButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.ctaText}>Start Your Adventure</Text>
              <ArrowRight size={20} color="#FFFFFF" strokeWidth={2.5} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity onPress={() => router.push('/auth/login')} activeOpacity={0.7}>
          <Animated.Text
            entering={FadeInUp.delay(980).springify()}
            style={[styles.noSignup, { color: themeColors.primary }]}
          >
            Already have an account? Sign in
          </Animated.Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    overflow: 'hidden',
  },
  orb1: {
    width: 280,
    height: 280,
    top: -60,
    right: -80,
  },
  orb2: {
    width: 220,
    height: 220,
    top: height * 0.35,
    left: -90,
  },
  orb3: {
    width: 180,
    height: 180,
    bottom: height * 0.2,
    right: -50,
  },
  orbGradient: {
    flex: 1,
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: isSmallDevice ? SPACING.lg : SPACING.xxl,
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    width: isSmallDevice ? 180 : 220,
    height: isSmallDevice ? 180 : 220,
    borderRadius: 110,
  },
  glowRingGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 110,
  },
  iconCircle: {
    width: isSmallDevice ? 96 : 116,
    height: isSmallDevice ? 96 : 116,
    borderRadius: isSmallDevice ? 48 : 58,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 16,
  },
  iconGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: isSmallDevice ? 40 : 52,
    fontFamily: FONTS.extrabold,
    letterSpacing: -1,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  tagline: {
    fontSize: isSmallDevice ? FONT_SIZES.md : FONT_SIZES.lg,
    fontFamily: FONTS.medium,
    textAlign: 'center',
    lineHeight: 26,
  },
  featuresWrap: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'center',
    gap: SPACING.md,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  featureEmojiBadge: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureEmoji: {
    fontSize: 26,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    lineHeight: 19,
  },
  featureArrow: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.md,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.xxxl + SPACING.xl,
    borderRadius: BORDER_RADIUS.pill,
    ...SHADOWS.xl,
    minHeight: 58,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    letterSpacing: 0.3,
  },
  noSignup: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semibold,
  },
});
