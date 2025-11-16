import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Sparkles, Heart, Star, Wand2, BookOpen } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '@/constants/theme';
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
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

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

export default function Welcome() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const scaleButton = useSharedValue(1);

  useEffect(() => {
    checkProfile();
  }, []);

  const checkProfile = async () => {
    try {
      const profileId = await AsyncStorage.getItem('profileId');

      if (profileId) {
        router.replace('/(tabs)');
      } else {
        setIsLoading(false);
      }
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
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
      {/* Floating decorative icons */}
      <View style={styles.floatingIconsContainer}>
        <View style={[styles.floatingIcon, { top: 80, left: 30 }]}>
          <FloatingIcon icon={Star} delay={0} />
        </View>
        <View style={[styles.floatingIcon, { top: 120, right: 40 }]}>
          <FloatingIcon icon={Heart} delay={300} />
        </View>
        <View style={[styles.floatingIcon, { top: 200, left: width - 60 }]}>
          <FloatingIcon icon={Wand2} delay={600} />
        </View>
        <View style={[styles.floatingIcon, { top: 280, left: 50 }]}>
          <FloatingIcon icon={BookOpen} delay={900} />
        </View>
      </View>

      <View style={styles.content}>
        {/* Hero icon with gradient background */}
        <Animated.View entering={FadeInUp.delay(200).springify()}>
          <LinearGradient
            colors={[COLORS.primaryLight, COLORS.primary]}
            style={styles.iconContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Sparkles size={80} color="#FFFFFF" strokeWidth={2} />
          </LinearGradient>
        </Animated.View>

        {/* Title with animation */}
        <Animated.Text
          entering={FadeInUp.delay(400).springify()}
          style={styles.title}
        >
          DreamTales
        </Animated.Text>

        <Animated.Text
          entering={FadeInUp.delay(500).springify()}
          style={styles.subtitle}
        >
          Where imagination comes to life! ✨
        </Animated.Text>

        {/* Premium feature cards */}
        <View style={styles.features}>
          <Animated.View entering={FadeInDown.delay(600).springify()}>
            <LinearGradient
              colors={['#FFE8DB', '#FFDCC9']}
              style={styles.featureItem}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.featureIconContainer}>
                <Text style={styles.featureIcon}>📚</Text>
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Magical Stories</Text>
                <Text style={styles.featureDescription}>Personalized tales just for you</Text>
              </View>
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(700).springify()}>
            <LinearGradient
              colors={['#E8F5E9', '#D4EDD7']}
              style={styles.featureItem}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.featureIconContainer}>
                <Text style={styles.featureIcon}>🎮</Text>
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Fun Quizzes</Text>
                <Text style={styles.featureDescription}>Test your knowledge & earn rewards</Text>
              </View>
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(800).springify()}>
            <LinearGradient
              colors={['#FFF3E0', '#FFE9C5']}
              style={styles.featureItem}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.featureIconContainer}>
                <Text style={styles.featureIcon}>🌍</Text>
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Multi-Language</Text>
                <Text style={styles.featureDescription}>Stories in your favorite language</Text>
              </View>
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(900).springify()}>
            <LinearGradient
              colors={['#F3E5F5', '#E1BEE7']}
              style={styles.featureItem}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.featureIconContainer}>
                <Text style={styles.featureIcon}>🎨</Text>
              </View>
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
              colors={[COLORS.primary, COLORS.primaryDark]}
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
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
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
    paddingTop: 80,
    paddingHorizontal: SPACING.xxl,
    alignItems: 'center',
    zIndex: 1,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xxl,
    ...SHADOWS.xl,
  },
  title: {
    fontSize: 42,
    fontWeight: FONT_WEIGHTS.extrabold,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: SPACING.xxxl,
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
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.md,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
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
    padding: SPACING.xxl,
    paddingBottom: SPACING.xxxl + 10,
    alignItems: 'center',
    zIndex: 1,
  },
  startButton: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxxl + SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    ...SHADOWS.colored,
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
