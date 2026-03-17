import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles, BookOpen, Globe, Trophy } from 'lucide-react-native';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONTS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  useSharedValue,
  FadeIn,
  FadeInDown,
  FadeInUp,
  withTiming,
  Easing,
  interpolate,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentTheme, isLoading: themeLoading } = useTheme();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useApp();
  const themeColors = currentTheme.colors;

  const glowOpacity = useSharedValue(0.4);
  const float1 = useSharedValue(0);
  const float2 = useSharedValue(0);
  const float3 = useSharedValue(0);
  const logoScale = useSharedValue(0.85);
  const logoOpacity = useSharedValue(0);
  const tapScale = useSharedValue(1);
  const pulseRing = useSharedValue(1);
  const badge1Float = useSharedValue(0);
  const badge2Float = useSharedValue(0);
  const badge3Float = useSharedValue(0);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 2800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 2800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    float1.value = withRepeat(
      withSequence(withTiming(-18, { duration: 3200, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 3200, easing: Easing.inOut(Easing.ease) })),
      -1, true
    );
    float2.value = withRepeat(
      withSequence(withTiming(-24, { duration: 4000, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 4000, easing: Easing.inOut(Easing.ease) })),
      -1, true
    );
    float3.value = withRepeat(
      withSequence(withTiming(-12, { duration: 2600, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 2600, easing: Easing.inOut(Easing.ease) })),
      -1, true
    );
    badge1Float.value = withDelay(0, withRepeat(
      withSequence(withTiming(-10, { duration: 2400 }), withTiming(0, { duration: 2400 })),
      -1, true
    ));
    badge2Float.value = withDelay(600, withRepeat(
      withSequence(withTiming(-14, { duration: 3000 }), withTiming(0, { duration: 3000 })),
      -1, true
    ));
    badge3Float.value = withDelay(1200, withRepeat(
      withSequence(withTiming(-8, { duration: 2200 }), withTiming(0, { duration: 2200 })),
      -1, true
    ));
    logoOpacity.value = withDelay(200, withTiming(1, { duration: 700 }));
    logoScale.value = withDelay(200, withSpring(1, { damping: 14, stiffness: 100 }));
    pulseRing.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1800, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 1800, easing: Easing.in(Easing.ease) })
      ),
      -1, true
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

  const handleTap = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    tapScale.value = withSequence(
      withSpring(0.97, { damping: 12 }),
      withSpring(1, { damping: 12 })
    );
    setTimeout(() => router.push('/auth/register'), 80);
  };

  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));
  const float1Style = useAnimatedStyle(() => ({ transform: [{ translateY: float1.value }] }));
  const float2Style = useAnimatedStyle(() => ({ transform: [{ translateY: float2.value }] }));
  const float3Style = useAnimatedStyle(() => ({ transform: [{ translateY: float3.value }] }));
  const logoStyle = useAnimatedStyle(() => ({ opacity: logoOpacity.value, transform: [{ scale: logoScale.value }] }));
  const tapScaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: tapScale.value }] }));
  const pulseRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseRing.value }],
    opacity: interpolate(pulseRing.value, [1, 1.15], [0.35, 0]),
  }));
  const badge1Style = useAnimatedStyle(() => ({ transform: [{ translateY: badge1Float.value }] }));
  const badge2Style = useAnimatedStyle(() => ({ transform: [{ translateY: badge2Float.value }] }));
  const badge3Style = useAnimatedStyle(() => ({ transform: [{ translateY: badge3Float.value }] }));

  if (authLoading || profileLoading || themeLoading) {
    return (
      <View style={styles.loadingScreen}>
        <LinearGradient colors={['#0F0F1A', '#1A0A2E', '#0D1B2A']} style={StyleSheet.absoluteFill} />
        <Animated.View entering={FadeIn.duration(600)}>
          <LinearGradient
            colors={[themeColors.primary, themeColors.primaryDark]}
            style={styles.loadingOrb}
          >
            <Sparkles size={32} color="#FFF" strokeWidth={1.5} />
          </LinearGradient>
        </Animated.View>
      </View>
    );
  }

  return (
    <AnimatedPressable style={[styles.root, tapScaleStyle]} onPress={handleTap}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <LinearGradient
        colors={['#0F0F1A', '#1A0A2E', '#0D1B2A']}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient gradient blobs */}
      <Animated.View style={[styles.blob, styles.blob1, float1Style]}>
        <LinearGradient
          colors={[themeColors.primary + '55', themeColors.primary + '00']}
          style={styles.blobInner}
        />
      </Animated.View>
      <Animated.View style={[styles.blob, styles.blob2, float2Style]}>
        <LinearGradient
          colors={['#4F46E5' + '30', '#4F46E5' + '00']}
          style={styles.blobInner}
        />
      </Animated.View>
      <Animated.View style={[styles.blob, styles.blob3, float3Style]}>
        <LinearGradient
          colors={[themeColors.primaryLight + '25', themeColors.primaryLight + '00']}
          style={styles.blobInner}
        />
      </Animated.View>

      {/* Floating feature badges */}
      <Animated.View style={[styles.floatingBadge, styles.badge1, badge1Style]}>
        <Animated.View entering={FadeInDown.delay(1200).springify()} style={[styles.badgeInner, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }]}>
          <BookOpen size={14} color="rgba(255,255,255,0.8)" strokeWidth={2} />
          <Text style={styles.badgeText}>100+ Languages</Text>
        </Animated.View>
      </Animated.View>
      <Animated.View style={[styles.floatingBadge, styles.badge2, badge2Style]}>
        <Animated.View entering={FadeInDown.delay(1400).springify()} style={[styles.badgeInner, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }]}>
          <Trophy size={14} color="rgba(255,255,255,0.8)" strokeWidth={2} />
          <Text style={styles.badgeText}>Daily Quizzes</Text>
        </Animated.View>
      </Animated.View>
      <Animated.View style={[styles.floatingBadge, styles.badge3, badge3Style]}>
        <Animated.View entering={FadeIn.delay(1600)} style={[styles.badgeInner, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }]}>
          <Globe size={14} color="rgba(255,255,255,0.8)" strokeWidth={2} />
          <Text style={styles.badgeText}>AI Powered</Text>
        </Animated.View>
      </Animated.View>

      {/* Center content */}
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Animated.View style={[styles.logoArea, logoStyle]}>
          {/* Pulse ring */}
          <Animated.View style={[styles.pulseRing, { borderColor: themeColors.primary }, pulseRingStyle]} />

          {/* Glow halo */}
          <Animated.View style={[styles.glow, glowStyle]}>
            <LinearGradient
              colors={[themeColors.primary + '50', themeColors.primary + '00']}
              style={styles.glowGrad}
            />
          </Animated.View>

          {/* Icon orb */}
          <LinearGradient
            colors={[themeColors.primary, themeColors.primaryDark]}
            style={styles.iconOrb}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Sparkles size={52} color="#FFFFFF" strokeWidth={1.5} />
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.textGroup}>
          <Text style={styles.appName}>Jahera</Text>
          <Text style={styles.tagline}>Where every child becomes{'\n'}the hero of their story</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(700).springify()} style={styles.pillRow}>
          {['📚 Stories', '🎮 Quizzes', '🌍 Languages'].map((item, i) => (
            <View key={i} style={styles.pill}>
              <Text style={styles.pillText}>{item}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* Bottom CTA zone */}
      <Animated.View
        entering={FadeInUp.delay(900).springify()}
        style={[styles.bottom, { paddingBottom: insets.bottom + 40 }]}
      >
        <View style={styles.tapHint}>
          <View style={styles.tapDot} />
          <Text style={styles.tapHintText}>Tap anywhere to begin</Text>
          <View style={styles.tapDot} />
        </View>

        <View style={styles.signInRow}>
          <Text style={styles.signInLabel}>Already have an account?</Text>
          <Pressable onPress={(e) => { e.stopPropagation?.(); router.push('/auth/login'); }}>
            <Text style={[styles.signInLink, { color: themeColors.primary }]}>Sign in</Text>
          </Pressable>
        </View>
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOrb: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    overflow: 'hidden',
  },
  blob1: {
    width: 320,
    height: 320,
    top: -80,
    right: -100,
  },
  blob2: {
    width: 260,
    height: 260,
    top: height * 0.38,
    left: -110,
  },
  blob3: {
    width: 200,
    height: 200,
    bottom: height * 0.18,
    right: -60,
  },
  blobInner: {
    flex: 1,
  },
  floatingBadge: {
    position: 'absolute',
    zIndex: 10,
  },
  badge1: {
    top: height * 0.14,
    left: 28,
  },
  badge2: {
    top: height * 0.22,
    right: 24,
  },
  badge3: {
    top: height * 0.58,
    left: 20,
  },
  badgeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.pill,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: FONTS.semibold,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.3,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  logoArea: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xxl + SPACING.lg,
  },
  pulseRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
  },
  glow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  glowGrad: {
    flex: 1,
    borderRadius: 120,
  },
  iconOrb: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C01F1F',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.55,
    shadowRadius: 32,
    elevation: 24,
  },
  textGroup: {
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  appName: {
    fontSize: 58,
    fontFamily: FONTS.extrabold,
    color: '#FFFFFF',
    letterSpacing: -2,
    textAlign: 'center',
  },
  tagline: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 28,
  },
  pillRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.pill,
  },
  pillText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.semibold,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.4,
  },
  bottom: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.lg,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  tapDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tapHintText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.5,
  },
  signInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  signInLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.4)',
  },
  signInLink: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
  },
});
