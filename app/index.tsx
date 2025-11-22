import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Sparkles, Heart, Star, Wand2, BookOpen } from 'lucide-react-native';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  useSharedValue,
  FadeInDown,
  FadeInUp,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375 || height < 667;

export default function Welcome() {
  const router = useRouter();
  const { currentTheme } = useTheme();
  const COLORS = currentTheme.colors;
  const [isLoading, setIsLoading] = useState(true);
  const scaleButton = useSharedValue(1);
  const loadingAnimation = useRef<LottieView>(null);
  const successAnimation = useRef<LottieView>(null);

  // Floating icon component
  const FloatingIcon = ({ icon: Icon, delay = 0, duration = 2000 }: any) => {
    const translateY = useSharedValue(0);

    useEffect(() => {
      translateY.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withSpring(-15, { damping: 2, stiffness: 80 }),
            withSpring(0, { damping: 2, stiffness: 80 })
          ),
          -1,
          false
        )
      );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
    }));

    return (
      <Animated.View style={animatedStyle}>
        <Icon size={32} color={COLORS.primary} strokeWidth={2} />
      </Animated.View>
    );
  };

  useEffect(() => {
    checkProfile();
  }, []);

  const checkProfile = async () => {
    try {
      // Clear any old profile data for now
      await AsyncStorage.removeItem('profileId');
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking profile:', error);
      setIsLoading(false);
    }
  };

  const handleGetStarted = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scaleButton.value = withSequence(
      withSpring(0.95, { damping: 10 }),
      withSpring(1, { damping: 10 })
    );
    setTimeout(() => {
      router.push('/onboarding/language-selection');
    }, 100);
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleButton.value }],
  }));

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom']}>
        <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill}>
          <View style={styles.loadingContent}>
            <LottieView
              ref={loadingAnimation}
              source={require('@/assets/lottie/loading.json')}
              autoPlay
              loop
              style={styles.lottieLoading}
            />
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill}>
        {/* Floating decorative icons - only show on larger devices */}
        {!isSmallDevice && (
          <View style={styles.floatingIconsContainer}>
            <View style={[styles.floatingIcon, { top: '10%', left: '8%' }]}>
              <FloatingIcon icon={Star} delay={0} />
            </View>
            <View style={[styles.floatingIcon, { top: '15%', right: '10%' }]}>
              <FloatingIcon icon={Heart} delay={300} />
            </View>
            <View style={[styles.floatingIcon, { top: '25%', right: '15%' }]}>
              <FloatingIcon icon={Wand2} delay={600} />
            </View>
            <View style={[styles.floatingIcon, { top: '35%', left: '12%' }]}>
              <FloatingIcon icon={BookOpen} delay={900} />
            </View>
          </View>
        )}

      <View style={styles.content}>
        {/* Hero Lottie animation */}
        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.heroAnimationContainer}>
          <LottieView
            ref={successAnimation}
            source={require('@/assets/lottie/success.json')}
            autoPlay
            loop
            style={styles.lottieHero}
          />
          <View style={styles.heroIconOverlay}>
            <Sparkles size={80} color={COLORS.primary} strokeWidth={2} />
          </View>
        </Animated.View>

        {/* Title with animation */}
        <Animated.Text
          entering={FadeInUp.delay(400).springify()}
          style={styles.title}
        >
          Jahera
        </Animated.Text>

        <Animated.Text
          entering={FadeInUp.delay(500).springify()}
          style={styles.subtitle}
        >
          Where imagination comes to life! ✨
        </Animated.Text>

        {/* Premium feature cards with enhanced design */}
        <View style={styles.features}>
          <Animated.View entering={FadeInDown.delay(600).springify()}>
            <LinearGradient
              colors={['rgba(184, 234, 224, 0.95)', 'rgba(127, 216, 190, 0.85)']}
              style={styles.featureItem}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <LinearGradient
                colors={['#FFFFFF', 'rgba(184, 234, 224, 0.5)']}
                style={styles.featureIconContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.featureIcon}>📚</Text>
              </LinearGradient>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Magical Stories</Text>
                <Text style={styles.featureDescription}>Personalized tales just for you</Text>
              </View>
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(700).springify()}>
            <LinearGradient
              colors={['rgba(212, 241, 232, 0.95)', 'rgba(168, 230, 207, 0.85)']}
              style={styles.featureItem}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <LinearGradient
                colors={['#FFFFFF', 'rgba(212, 241, 232, 0.5)']}
                style={styles.featureIconContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.featureIcon}>🎮</Text>
              </LinearGradient>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Fun Quizzes</Text>
                <Text style={styles.featureDescription}>Test your knowledge & earn rewards</Text>
              </View>
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(800).springify()}>
            <LinearGradient
              colors={['rgba(196, 228, 243, 0.95)', 'rgba(133, 193, 226, 0.85)']}
              style={styles.featureItem}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <LinearGradient
                colors={['#FFFFFF', 'rgba(196, 228, 243, 0.5)']}
                style={styles.featureIconContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.featureIcon}>🌍</Text>
              </LinearGradient>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Multi-Language</Text>
                <Text style={styles.featureDescription}>Stories in your favorite language</Text>
              </View>
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(900).springify()}>
            <LinearGradient
              colors={['rgba(217, 255, 245, 0.95)', 'rgba(152, 255, 224, 0.85)']}
              style={styles.featureItem}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <LinearGradient
                colors={['#FFFFFF', 'rgba(217, 255, 245, 0.5)']}
                style={styles.featureIconContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.featureIcon}>🎨</Text>
              </LinearGradient>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Beautiful Design</Text>
                <Text style={styles.featureDescription}>Kid-friendly & delightful</Text>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </View>

      {/* Premium CTA button */}
      <Animated.View
        entering={FadeInUp.delay(1000).springify()}
        style={styles.footer}
      >
        <Animated.View style={buttonAnimatedStyle}>
          <TouchableOpacity onPress={handleGetStarted} activeOpacity={0.9}>
            <LinearGradient
              colors={['#7FD8BE', '#66C3A8']}
              style={styles.startButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.startButtonText}>Start Your Adventure</Text>
              <Sparkles size={20} color="#FFFFFF" strokeWidth={2.5} style={styles.buttonIcon} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.Text
          entering={FadeInUp.delay(1100).springify()}
          style={styles.footerText}
        >
          No signup required • Free to start
        </Animated.Text>
      </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  floatingIconsContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  floatingIcon: {
    position: 'absolute',
    opacity: 0.3,
  },
  content: {
    flex: 1,
    paddingTop: isSmallDevice ? SPACING.xl : SPACING.xxxl * 2,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    zIndex: 1,
  },
  heroAnimationContainer: {
    width: isSmallDevice ? 120 : 160,
    height: isSmallDevice ? 120 : 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: isSmallDevice ? SPACING.lg : SPACING.xxl,
    position: 'relative',
  },
  lottieHero: {
    width: isSmallDevice ? 200 : 260,
    height: isSmallDevice ? 200 : 260,
    position: 'absolute',
  },
  lottieLoading: {
    width: 150,
    height: 150,
  },
  heroIconOverlay: {
    width: isSmallDevice ? 120 : 160,
    height: isSmallDevice ? 120 : 160,
    borderRadius: isSmallDevice ? 60 : 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    ...SHADOWS.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  title: {
    fontSize: isSmallDevice ? 36 : 42,
    fontWeight: FONT_WEIGHTS.extrabold,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: isSmallDevice ? FONT_SIZES.md : FONT_SIZES.lg,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: isSmallDevice ? 22 : 26,
    marginBottom: isSmallDevice ? SPACING.xl : SPACING.xxxl,
    paddingHorizontal: SPACING.md,
    fontWeight: FONT_WEIGHTS.medium,
  },
  features: {
    width: '100%',
    gap: SPACING.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  featureIconContainer: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
    ...SHADOWS.sm,
  },
  featureIcon: {
    fontSize: 28,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  footer: {
    padding: SPACING.xl,
    paddingBottom: isSmallDevice ? SPACING.lg : SPACING.xxl,
    alignItems: 'center',
    zIndex: 1,
  },
  startButton: {
    paddingVertical: isSmallDevice ? SPACING.lg : SPACING.xl,
    paddingHorizontal: isSmallDevice ? SPACING.xxl + SPACING.sm : SPACING.xxxl + SPACING.xl,
    borderRadius: BORDER_RADIUS.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    ...SHADOWS.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minHeight: 56,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: 0.3,
  },
  buttonIcon: {
    marginLeft: SPACING.xs,
  },
  footerText: {
    marginTop: SPACING.lg,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
});
