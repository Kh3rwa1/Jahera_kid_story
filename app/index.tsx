import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, Mic as Mic2, Zap } from 'lucide-react-native';
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

const TEAL = '#00C4B4';
const TEAL_DARK = '#009E92';
const TEAL_DEEP = '#007A70';
const BG_BASE = '#D6F5F2';
const BG_MID = '#E8FAF8';
const BG_LIGHT = '#F0FFFE';
const DARK_TEXT = '#0D2926';
const BODY_TEXT = '#2A5550';

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentTheme, isLoading: themeLoading } = useTheme();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useApp();

  const glowPulse = useSharedValue(0.3);
  const orbFloat = useSharedValue(0);
  const blob1Float = useSharedValue(0);
  const blob2Float = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const tapScale = useSharedValue(1);
  const ctaGlow = useSharedValue(0.6);
  const shimmer = useSharedValue(0);

  const badge1Float = useSharedValue(0);
  const badge2Float = useSharedValue(0);
  const badge3Float = useSharedValue(0);

  useEffect(() => {
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
    orbFloat.value = withRepeat(
      withSequence(
        withTiming(-14, { duration: 3800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3800, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
    blob1Float.value = withRepeat(
      withSequence(withTiming(-22, { duration: 5000, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 5000, easing: Easing.inOut(Easing.ease) })),
      -1, true
    );
    blob2Float.value = withRepeat(
      withSequence(withTiming(-16, { duration: 4200, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 4200, easing: Easing.inOut(Easing.ease) })),
      -1, true
    );
    badge1Float.value = withDelay(200, withRepeat(
      withSequence(withTiming(-9, { duration: 2600 }), withTiming(0, { duration: 2600 })),
      -1, true
    ));
    badge2Float.value = withDelay(800, withRepeat(
      withSequence(withTiming(-12, { duration: 3200 }), withTiming(0, { duration: 3200 })),
      -1, true
    ));
    badge3Float.value = withDelay(1400, withRepeat(
      withSequence(withTiming(-7, { duration: 2400 }), withTiming(0, { duration: 2400 })),
      -1, true
    ));
    logoOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));
    logoScale.value = withDelay(300, withSpring(1, { damping: 13, stiffness: 90 }));
    ctaGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.55, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
    shimmer.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.linear }),
      -1, false
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
      withSpring(0.975, { damping: 15 }),
      withSpring(1, { damping: 12 })
    );
    setTimeout(() => router.push('/auth/register'), 80);
  };

  const glowStyle = useAnimatedStyle(() => ({ opacity: glowPulse.value }));
  const orbStyle = useAnimatedStyle(() => ({ transform: [{ translateY: orbFloat.value }] }));
  const blob1Style = useAnimatedStyle(() => ({ transform: [{ translateY: blob1Float.value }] }));
  const blob2Style = useAnimatedStyle(() => ({ transform: [{ translateY: blob2Float.value }] }));
  const logoStyle = useAnimatedStyle(() => ({ opacity: logoOpacity.value, transform: [{ scale: logoScale.value }] }));
  const tapScaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: tapScale.value }] }));
  const ctaGlowStyle = useAnimatedStyle(() => ({ opacity: ctaGlow.value }));
  const badge1Style = useAnimatedStyle(() => ({ transform: [{ translateY: badge1Float.value }] }));
  const badge2Style = useAnimatedStyle(() => ({ transform: [{ translateY: badge2Float.value }] }));
  const badge3Style = useAnimatedStyle(() => ({ transform: [{ translateY: badge3Float.value }] }));
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-width * 0.6, width * 1.2]) }],
  }));

  if (authLoading || profileLoading || themeLoading) {
    return (
      <View style={styles.loadingScreen}>
        <LinearGradient colors={[BG_BASE, BG_MID, BG_LIGHT]} style={StyleSheet.absoluteFill} />
        <Animated.View entering={FadeIn.duration(600)}>
          <LinearGradient
            colors={[TEAL, TEAL_DARK]}
            style={styles.loadingOrb}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.loadingOrbText}>J</Text>
          </LinearGradient>
        </Animated.View>
      </View>
    );
  }

  return (
    <AnimatedPressable style={[styles.root, tapScaleStyle]} onPress={handleTap}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <LinearGradient
        colors={[BG_MID, BG_BASE, '#C8EFEC', BG_MID]}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Teal glow — top right */}
      <Animated.View style={[styles.ambientBlob, styles.ambientTopRight, blob1Style]}>
        <LinearGradient
          colors={[TEAL + '30', TEAL + '00']}
          style={{ flex: 1 }}
        />
      </Animated.View>

      {/* Soft teal wash — bottom left */}
      <Animated.View style={[styles.ambientBlob, styles.ambientBottomLeft, blob2Style]}>
        <LinearGradient
          colors={[TEAL_DARK + '20', TEAL + '00']}
          style={{ flex: 1 }}
        />
      </Animated.View>

      {/* Accent glow — mid right */}
      <Animated.View style={[styles.ambientBlob, styles.ambientMidRight]}>
        <LinearGradient
          colors={[TEAL + '18', TEAL + '00']}
          style={{ flex: 1 }}
        />
      </Animated.View>

      {/* Floating feature badges */}
      <Animated.View style={[styles.floatingBadge, styles.badge1, badge1Style]}>
        <Animated.View entering={FadeInDown.delay(1100).springify()} style={styles.badgeInner}>
          <BookOpen size={13} color={TEAL_DARK} strokeWidth={2} />
          <Text style={styles.badgeText}>100+ Languages</Text>
        </Animated.View>
      </Animated.View>

      <Animated.View style={[styles.floatingBadge, styles.badge2, badge2Style]}>
        <Animated.View entering={FadeInDown.delay(1350).springify()} style={styles.badgeInner}>
          <Mic2 size={13} color={TEAL_DARK} strokeWidth={2} />
          <Text style={styles.badgeText}>AI Narration</Text>
        </Animated.View>
      </Animated.View>

      <Animated.View style={[styles.floatingBadge, styles.badge3, badge3Style]}>
        <Animated.View entering={FadeIn.delay(1600)} style={styles.badgeInner}>
          <Zap size={13} color={TEAL_DARK} strokeWidth={2} />
          <Text style={styles.badgeText}>Daily Quizzes</Text>
        </Animated.View>
      </Animated.View>

      {/* Center content */}
      <View style={[styles.center, { paddingTop: insets.top + 20 }]}>
        {/* Logo orb */}
        <Animated.View style={[styles.logoArea, logoStyle, orbStyle]}>
          {/* Outer glow halo */}
          <Animated.View style={[styles.halo, glowStyle]}>
            <LinearGradient
              colors={[TEAL + '40', TEAL + '00']}
              style={{ flex: 1, borderRadius: 160 }}
            />
          </Animated.View>

          {/* Inner glow ring */}
          <View style={styles.glowRing} />

          {/* Main orb */}
          <LinearGradient
            colors={['#FFFFFF', '#E8FDFB']}
            style={styles.orbContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <LinearGradient
              colors={[TEAL, TEAL_DARK, TEAL_DEEP]}
              style={styles.orbGold}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.orbLetter}>J</Text>
            </LinearGradient>
          </LinearGradient>
        </Animated.View>

        {/* App name */}
        <Animated.View entering={FadeInUp.delay(350).springify()} style={styles.nameContainer}>
          <View style={styles.nameOverflow}>
            <Text style={styles.appName}>Jahera</Text>
            {/* Shimmer overlay */}
            <Animated.View style={[styles.shimmerStripe, shimmerStyle]}>
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.25)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1 }}
              />
            </Animated.View>
          </View>

          <Text style={styles.tagline}>Where every child becomes{'\n'}the hero of their story</Text>
        </Animated.View>

        {/* Divider rule */}
        <Animated.View entering={FadeIn.delay(700)} style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <LinearGradient
            colors={[TEAL + '00', TEAL + '90', TEAL + '00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.dividerGold}
          />
          <View style={styles.dividerLine} />
        </Animated.View>

        {/* Feature pills */}
        <Animated.View entering={FadeInUp.delay(750).springify()} style={styles.pillRow}>
          {[
            { emoji: '📚', label: 'Stories' },
            { emoji: '🎮', label: 'Quizzes' },
            { emoji: '🌍', label: 'Languages' },
          ].map((item, i) => (
            <View key={i} style={styles.pill}>
              <Text style={styles.pillEmoji}>{item.emoji}</Text>
              <Text style={styles.pillText}>{item.label}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* Bottom CTA */}
      <Animated.View
        entering={FadeInUp.delay(950).springify()}
        style={[styles.bottom, { paddingBottom: insets.bottom + 44 }]}
      >
        {/* CTA button */}
        <View style={styles.ctaWrapper}>
          <Animated.View style={[styles.ctaGlowHalo, ctaGlowStyle]}>
            <LinearGradient
              colors={[TEAL + '30', TEAL + '00']}
              style={{ flex: 1, borderRadius: 48 }}
            />
          </Animated.View>
          <LinearGradient
            colors={[TEAL, TEAL_DARK, TEAL_DEEP]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>Begin Your Journey</Text>
          </LinearGradient>
        </View>

        <View style={styles.signInRow}>
          <Text style={styles.signInLabel}>Already have an account?</Text>
          <Pressable
            onPress={(e) => { e.stopPropagation?.(); router.push('/auth/login'); }}
            hitSlop={8}
          >
            <Text style={styles.signInLink}>Sign in</Text>
          </Pressable>
        </View>
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG_BASE,
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
  loadingOrbText: {
    fontSize: 36,
    fontFamily: FONTS.extrabold,
    color: '#FFFFFF',
    letterSpacing: -1,
  },

  // Ambient background blobs
  ambientBlob: {
    position: 'absolute',
    borderRadius: 999,
    overflow: 'hidden',
  },
  ambientTopRight: {
    width: 380,
    height: 380,
    top: -120,
    right: -140,
  },
  ambientBottomLeft: {
    width: 300,
    height: 300,
    bottom: height * 0.1,
    left: -130,
  },
  ambientMidRight: {
    width: 220,
    height: 220,
    top: height * 0.42,
    right: -80,
  },

  // Floating badges
  floatingBadge: {
    position: 'absolute',
    zIndex: 10,
  },
  badge1: {
    top: height * 0.13,
    left: 20,
  },
  badge2: {
    top: height * 0.21,
    right: 18,
  },
  badge3: {
    top: height * 0.56,
    left: 16,
  },
  badgeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: BORDER_RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1,
    borderColor: TEAL + '40',
  },
  badgeText: {
    fontSize: 11,
    fontFamily: FONTS.semibold,
    color: BODY_TEXT,
    letterSpacing: 0.4,
  },

  // Center layout
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },

  // Logo orb
  logoArea: {
    width: 148,
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xxl + 4,
  },
  halo: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  glowRing: {
    position: 'absolute',
    width: 158,
    height: 158,
    borderRadius: 79,
    borderWidth: 1,
    borderColor: TEAL + '30',
  },
  orbContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: TEAL + '35',
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 36,
    elevation: 28,
  },
  orbGold: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbLetter: {
    fontSize: 56,
    fontFamily: FONTS.extrabold,
    color: '#FFFFFF',
    letterSpacing: -2,
    lineHeight: 62,
  },

  // App name
  nameContainer: {
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  nameOverflow: {
    overflow: 'hidden',
    borderRadius: 6,
  },
  appName: {
    fontSize: 72,
    fontFamily: FONTS.extrabold,
    color: DARK_TEXT,
    letterSpacing: -3,
    textAlign: 'center',
    lineHeight: 78,
    textShadowColor: TEAL + '30',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 16,
  },
  shimmerStripe: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: width * 0.45,
  },
  tagline: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: BODY_TEXT,
    textAlign: 'center',
    lineHeight: 27,
    letterSpacing: 0.1,
    opacity: 0.65,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    marginBottom: SPACING.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 100, 90, 0.08)',
  },
  dividerGold: {
    width: 60,
    height: 1,
  },

  // Feature pills
  pillRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: TEAL + '25',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.pill,
  },
  pillEmoji: {
    fontSize: 13,
  },
  pillText: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
    color: BODY_TEXT,
    letterSpacing: 0.3,
    opacity: 0.8,
  },

  // Bottom section
  bottom: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.lg,
  },
  ctaWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  ctaGlowHalo: {
    position: 'absolute',
    top: -18,
    left: -18,
    right: -18,
    bottom: -18,
    borderRadius: 56,
  },
  ctaButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 48,
    alignItems: 'center',
    shadowColor: TEAL_DARK,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 20,
  },
  ctaText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  signInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  signInLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: BODY_TEXT,
    letterSpacing: 0.2,
    opacity: 0.6,
  },
  signInLink: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semibold,
    color: TEAL_DARK,
    letterSpacing: 0.2,
  },
});
