import { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
  useWindowDimensions,
  Platform,
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Welcome() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentTheme, isLoading: themeLoading } = useTheme();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useApp();

  const COLORS = currentTheme.colors;
  const styles = useStyles(COLORS, insets, width);

  const glowPulse = useSharedValue(0.3);
  const orbFloat = useSharedValue(0);
  const blob1Float = useSharedValue(0);
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
      withSequence(withTiming(-18, { duration: 4600, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 4600, easing: Easing.inOut(Easing.ease) })),
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
    setTimeout(() => router.push('/auth/register'), 40);
  };

  const glowStyle = useAnimatedStyle(() => ({ opacity: glowPulse.value }));
  const orbStyle = useAnimatedStyle(() => ({ transform: [{ translateY: orbFloat.value }] }));
  const blob1Style = useAnimatedStyle(() => ({ transform: [{ translateY: blob1Float.value }] }));
  const logoStyle = useAnimatedStyle(() => ({ opacity: logoOpacity.value, transform: [{ scale: logoScale.value }] }));
  const tapScaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: tapScale.value }] }));
  const ctaGlowStyle = useAnimatedStyle(() => ({ opacity: ctaGlow.value }));
  const badge1Style = useAnimatedStyle(() => ({ transform: [{ translateY: badge1Float.value }] }));
  const badge2Style = useAnimatedStyle(() => ({ transform: [{ translateY: badge2Float.value }] }));
  const badge3Style = useAnimatedStyle(() => ({ transform: [{ translateY: badge3Float.value }] }));
  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0, 1, 0]),
    transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-200, 200]) }],
  }));

  if (authLoading || profileLoading || themeLoading) {
    return (
      <View style={styles.loadingScreen}>
        <LinearGradient colors={COLORS.backgroundGradient} style={StyleSheet.absoluteFill} />
        <Animated.View entering={FadeIn.duration(600)}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
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
        colors={[COLORS.backgroundGradient[1], COLORS.backgroundGradient[0], COLORS.primary + '15', COLORS.backgroundGradient[1]]}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Primary glow — top right */}
      <Animated.View style={[styles.ambientBlob, styles.ambientTopRight, blob1Style]}>
        <LinearGradient
          colors={[COLORS.primary + '30', COLORS.primary + '00']}
          style={{ flex: 1 }}
        />
      </Animated.View>

      {/* Secondary wash — bottom left */}
      <Animated.View style={[styles.ambientBlob, styles.ambientBottomLeft, blob1Style]}>
        <LinearGradient
          colors={[COLORS.primaryDark + '20', COLORS.primary + '00']}
          style={{ flex: 1 }}
        />
      </Animated.View>

      {/* Accent glow — mid right */}
      <Animated.View style={[styles.ambientBlob, styles.ambientMidRight]}>
        <LinearGradient
          colors={[COLORS.primary + '18', COLORS.primary + '00']}
          style={{ flex: 1 }}
        />
      </Animated.View>

      {/* Floating feature badges */}
      <Animated.View style={[styles.floatingBadge, styles.badge1, badge1Style]}>
        <Animated.View entering={FadeInDown.delay(1100).springify()} style={styles.badgeInner}>
          <BookOpen size={13} color={COLORS.primaryDark} strokeWidth={2} />
          <Text style={styles.badgeText}>100+ Languages</Text>
        </Animated.View>
      </Animated.View>

      <Animated.View style={[styles.floatingBadge, styles.badge2, badge2Style]}>
        <Animated.View entering={FadeInDown.delay(1350).springify()} style={styles.badgeInner}>
          <Mic2 size={13} color={COLORS.primaryDark} strokeWidth={2} />
          <Text style={styles.badgeText}>AI Narration</Text>
        </Animated.View>
      </Animated.View>

      <Animated.View style={[styles.floatingBadge, styles.badge3, badge3Style]}>
        <Animated.View entering={FadeIn.delay(1600)} style={styles.badgeInner}>
          <Zap size={13} color={COLORS.primaryDark} strokeWidth={2} />
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
              colors={[COLORS.primary + '40', COLORS.primary + '00']}
              style={{ flex: 1, borderRadius: 160 }}
            />
          </Animated.View>

          {/* Inner glow ring */}
          <View style={styles.glowRing} />

          {/* Main orb */}
          <LinearGradient
            colors={[COLORS.cardBackground, COLORS.background]}
            style={styles.orbContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
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
            <Text style={[styles.appName, { fontSize: Math.min(width * 0.18, 72) }]}>Jahera</Text>
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
            colors={[COLORS.primary + '00', COLORS.primary + '90', COLORS.primary + '00']}
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
        style={[styles.bottom, { paddingBottom: Math.max(insets.bottom + 44, 60) }]}
      >
        {/* CTA button */}
        <View style={styles.ctaWrapper}>
          <Animated.View style={[styles.ctaGlowHalo, ctaGlowStyle]}>
            <LinearGradient
              colors={[COLORS.primary + '30', COLORS.primary + '00']}
              style={{ flex: 1, borderRadius: 48 }}
            />
          </Animated.View>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
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
            <Text style={[styles.signInLink, { color: COLORS.primaryDark }]}>Sign in</Text>
          </Pressable>
        </View>
      </Animated.View>
    </AnimatedPressable>
  );
}

const useStyles = (C: any, insets: any, width: number) => {
  return useMemo(() => StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: C.background,
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
      bottom: '10%',
      left: -130,
    },
    ambientMidRight: {
      width: 220,
      height: 220,
      top: '42%',
      right: -80,
    },
  
    // Floating badges
    floatingBadge: {
      position: 'absolute',
      zIndex: 10,
    },
    badge1: {
      top: '13%',
      left: 20,
    },
    badge2: {
      top: '21%',
      right: 18,
    },
    badge3: {
      top: '56%',
      left: 16,
    },
    badgeInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: BORDER_RADIUS.pill,
      backgroundColor: C.cardBackground + 'BF',
      borderWidth: 1,
      borderColor: C.primary + '40',
    },
    badgeText: {
      fontSize: 11,
      fontFamily: FONTS.semibold,
      color: C.text.secondary,
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
      borderColor: C.primary + '30',
    },
    orbContainer: {
      width: 130,
      height: 130,
      borderRadius: 65,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: C.primary + '35',
      shadowColor: C.primary,
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
      color: C.text.primary,
      letterSpacing: -3,
      textAlign: 'center',
      lineHeight: 78,
      textShadowColor: C.primary + '30',
      textShadowOffset: { width: 0, height: 3 },
      textShadowRadius: 16,
    },
    shimmerStripe: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 200,
    },
    tagline: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.medium,
      color: C.text.secondary,
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
      backgroundColor: C.text.light + '20',
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
      backgroundColor: C.cardBackground + '99',
      borderWidth: 1,
      borderColor: C.primary + '25',
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
      color: C.text.secondary,
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
      shadowColor: C.primaryDark,
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
      color: C.text.secondary,
      letterSpacing: 0.2,
      opacity: 0.6,
    },
    signInLink: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.semibold,
      letterSpacing: 0.2,
    },
  }), [C, insets, width]);
};
