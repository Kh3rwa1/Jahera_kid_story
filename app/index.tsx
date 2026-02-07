import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Sparkles, BookOpen, Globe, Gamepad2, ArrowRight } from 'lucide-react-native';
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
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375 || height < 667;

export default function Welcome() {
  const router = useRouter();
  const { currentTheme, isLoading: themeLoading } = useTheme();
  const themeColors = currentTheme.colors;
  const [isLoading, setIsLoading] = useState(true);
  const scaleButton = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  useEffect(() => {
    checkProfile();
  }, []);

  const checkProfile = async () => {
    try {
      const profileId = await AsyncStorage.getItem('profileId');
      if (profileId) {
        router.replace('/(tabs)');
        return;
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking profile:', error);
      setIsLoading(false);
    }
  };

  const handleGetStarted = () => {
    scaleButton.value = withSequence(
      withSpring(0.95, { damping: 10 }),
      withSpring(1, { damping: 10 })
    );
    setTimeout(() => {
      router.push('/onboarding/language-selection');
    }, 100);
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: scaleButton.value }],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    'worklet';
    return { opacity: glowOpacity.value };
  });

  if (isLoading || themeLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom']}>
        <LinearGradient colors={themeColors.backgroundGradient} style={StyleSheet.absoluteFill} />
        <View style={styles.loadingContent}>
          <Animated.View
            entering={FadeInUp.delay(100).springify()}
            style={styles.loadingIconWrap}
          >
            <Sparkles size={40} color={themeColors.primary} strokeWidth={1.5} />
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  const features = [
    {
      icon: BookOpen,
      title: 'Magical Stories',
      description: 'Personalized tales just for you',
      colors: ['rgba(184, 234, 224, 0.95)', 'rgba(127, 216, 190, 0.85)'],
      emoji: '📚',
    },
    {
      icon: Gamepad2,
      title: 'Fun Quizzes',
      description: 'Test your knowledge & earn rewards',
      colors: ['rgba(212, 241, 232, 0.95)', 'rgba(168, 230, 207, 0.85)'],
      emoji: '🎮',
    },
    {
      icon: Globe,
      title: 'Multi-Language',
      description: 'Stories in your favorite language',
      colors: ['rgba(196, 228, 243, 0.95)', 'rgba(133, 193, 226, 0.85)'],
      emoji: '🌍',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient colors={themeColors.backgroundGradient} style={StyleSheet.absoluteFill} />

      <View style={styles.content}>
        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.heroContainer}>
          <Animated.View style={[styles.heroGlow, glowStyle]}>
            <LinearGradient
              colors={[themeColors.primary + '30', themeColors.primary + '05']}
              style={styles.heroGlowGradient}
            />
          </Animated.View>
          <View style={styles.heroIconCircle}>
            <LinearGradient
              colors={[themeColors.primary, themeColors.primaryDark]}
              style={styles.heroIconGradient}
            >
              <Sparkles size={isSmallDevice ? 44 : 52} color="#FFFFFF" strokeWidth={1.8} />
            </LinearGradient>
          </View>
        </Animated.View>

        <Animated.Text entering={FadeInUp.delay(350).springify()} style={styles.title}>
          Jahera
        </Animated.Text>

        <Animated.Text entering={FadeInUp.delay(450).springify()} style={styles.subtitle}>
          Where imagination comes to life
        </Animated.Text>

        <View style={styles.features}>
          {features.map((feature, index) => (
            <Animated.View
              key={feature.title}
              entering={FadeInDown.delay(550 + index * 100).springify()}
            >
              <LinearGradient
                colors={feature.colors}
                style={styles.featureItem}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.featureIconContainer}>
                  <Text style={styles.featureEmoji}>{feature.emoji}</Text>
                </View>
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </LinearGradient>
            </Animated.View>
          ))}
        </View>
      </View>

      <Animated.View entering={FadeInUp.delay(900).springify()} style={styles.footer}>
        <Animated.View style={buttonAnimatedStyle}>
          <TouchableOpacity onPress={handleGetStarted} activeOpacity={0.9}>
            <LinearGradient
              colors={[themeColors.primary, themeColors.primaryDark]}
              style={styles.startButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.startButtonText}>Start Your Adventure</Text>
              <ArrowRight size={20} color="#FFFFFF" strokeWidth={2.5} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.Text entering={FadeInUp.delay(1000).springify()} style={styles.footerText}>
          No signup required
        </Animated.Text>
      </Animated.View>
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
  loadingIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: isSmallDevice ? SPACING.xl : SPACING.xxxl * 1.5,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    zIndex: 1,
  },
  heroContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: isSmallDevice ? SPACING.lg : SPACING.xxl,
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    width: isSmallDevice ? 180 : 220,
    height: isSmallDevice ? 180 : 220,
    borderRadius: isSmallDevice ? 90 : 110,
  },
  heroGlowGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 110,
  },
  heroIconCircle: {
    width: isSmallDevice ? 100 : 120,
    height: isSmallDevice ? 100 : 120,
    borderRadius: isSmallDevice ? 50 : 60,
    overflow: 'hidden',
    ...SHADOWS.xl,
  },
  heroIconGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: isSmallDevice ? 36 : 44,
    fontWeight: FONT_WEIGHTS.extrabold,
    color: '#1A1F36',
    marginBottom: SPACING.sm,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: isSmallDevice ? FONT_SIZES.md : FONT_SIZES.lg,
    color: '#6C7A89',
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
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  featureIconContainer: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  featureEmoji: {
    fontSize: 26,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: '#1A1F36',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: FONT_SIZES.sm,
    color: '#6C7A89',
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
    minHeight: 56,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: 0.3,
  },
  footerText: {
    marginTop: SPACING.lg,
    fontSize: FONT_SIZES.sm,
    color: '#6C7A89',
    fontWeight: FONT_WEIGHTS.medium,
  },
});
