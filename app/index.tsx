import { BrandVideoBackground } from '@/components/BrandVideoBackground';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeColors } from '@/types/theme';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useRouter } from 'expo-router';
import {
  BookOpen,
  ChevronRight,
  Mic as Mic2,
  Moon,
  Sparkles,
  Zap,
} from 'lucide-react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo, useRef } from 'react';
import { Image } from 'expo-image';
import {
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { i18n } from '@/lib/i18n';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Welcome() {
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentTheme, isLoading: themeLoading } = useTheme();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useApp();

  const C = currentTheme.colors;
  const isCompact = height < 760;
  const isTiny = height < 690;
  const titleSize = Math.min(
    width * (isCompact ? 0.17 : 0.2),
    isCompact ? 66 : 82,
  );

  const styles = useStyles(C, width, isCompact, isTiny);

  const glowPulse = useSharedValue(0.3);
  const orbFloat = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const tapScale = useSharedValue(1);
  const ctaGlow = useSharedValue(0.6);
  const shimmer = useSharedValue(0);

  const badge1Float = useSharedValue(0);
  const badge2Float = useSharedValue(0);
  const badge3Float = useSharedValue(0);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, [C]);

  useEffect(() => {
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
    orbFloat.value = withRepeat(
      withSequence(
        withTiming(-14, { duration: 3800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
    badge1Float.value = withDelay(
      200,
      withRepeat(
        withSequence(
          withTiming(-9, { duration: 2600 }),
          withTiming(0, { duration: 2600 }),
        ),
        -1,
        true,
      ),
    );
    badge2Float.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(-12, { duration: 3200 }),
          withTiming(0, { duration: 3200 }),
        ),
        -1,
        true,
      ),
    );
    badge3Float.value = withDelay(
      1400,
      withRepeat(
        withSequence(
          withTiming(-7, { duration: 2400 }),
          withTiming(0, { duration: 2400 }),
        ),
        -1,
        true,
      ),
    );
    logoOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));
    logoScale.value = withDelay(
      300,
      withSpring(1, { damping: 13, stiffness: 90 }),
    );
    ctaGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.55, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
    shimmer.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.linear }),
      -1,
      false,
    );
  }, [
    badge1Float,
    badge2Float,
    badge3Float,
    ctaGlow,
    glowPulse,
    logoOpacity,
    logoScale,
    orbFloat,
    shimmer,
  ]);

  const handleTap = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    tapScale.value = withSequence(
      withSpring(0.975, { damping: 15 }),
      withSpring(1, { damping: 12 }),
    );
    setTimeout(() => {
      if (isMounted.current) router.push('/auth/register');
    }, 40);
  };

  const glowStyle = useAnimatedStyle(() => ({ opacity: glowPulse.value }));
  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: orbFloat.value }],
  }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const tapScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tapScale.value }],
  }));
  const ctaGlowStyle = useAnimatedStyle(() => ({ opacity: ctaGlow.value }));
  const badge1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: badge1Float.value }],
  }));
  const badge2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: badge2Float.value }],
  }));
  const badge3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: badge3Float.value }],
  }));
  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0, 1, 0]),
    transform: [
      { translateX: interpolate(shimmer.value, [0, 1], [-250, 250]) },
    ],
  }));

  useEffect(() => {
    if (!authLoading && !profileLoading && !themeLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [authLoading, profileLoading, themeLoading]);

  if (authLoading || profileLoading || themeLoading) {
    return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  }

  // Auto-redirect authenticated users
  if (isAuthenticated && profile) {
    return <Redirect href="/(tabs)" />;
  }
  if (isAuthenticated && !profile && !profileLoading) {
    return <Redirect href="/onboarding/consent" />;
  }

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
        overlayOpacity={0}
      />

      {/* Floating feature badges */}
      <Animated.View style={[styles.floatingBadge, styles.badge1, badge1Style]}>
        <Animated.View
          entering={FadeInDown.delay(1200).springify()}
          style={styles.badgeInner}
        >
          <BookOpen size={12} color={C.primaryDark} strokeWidth={2.5} />
          <Text style={styles.badgeText}>
            {i18n.t('welcome.badges.stories')}
          </Text>
        </Animated.View>
      </Animated.View>

      <Animated.View style={[styles.floatingBadge, styles.badge2, badge2Style]}>
        <Animated.View
          entering={FadeInDown.delay(1450).springify()}
          style={styles.badgeInner}
        >
          <Mic2 size={12} color={C.primaryDark} strokeWidth={2.5} />
          <Text style={styles.badgeText}>{i18n.t('welcome.badges.voice')}</Text>
        </Animated.View>
      </Animated.View>

      <Animated.View style={[styles.floatingBadge, styles.badge3, badge3Style]}>
        <Animated.View entering={FadeIn.delay(1700)} style={styles.badgeInner}>
          <Zap size={12} color={C.primaryDark} strokeWidth={2.5} />
          <Text style={styles.badgeText}>{i18n.t('welcome.badges.magic')}</Text>
        </Animated.View>
      </Animated.View>

      {/* Center content */}
      <View
        style={[
          styles.center,
          { paddingTop: insets.top + (isCompact ? 12 : 28) },
        ]}
      >
        {/* Cinematic Logo Area */}
        <Animated.View style={[styles.logoArea, logoStyle, orbStyle]}>
          <Animated.View style={[styles.halo, glowStyle]}>
            <LinearGradient
              colors={[C.primary + '45', C.primary + '00']}
              style={{ flex: 1, borderRadius: 160 }}
            />
          </Animated.View>

          <View style={styles.glowRing} />

          <LinearGradient
            colors={[C.cardBackground, C.background]}
            style={styles.orbContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <LinearGradient
              colors={[C.primary, C.primaryDark]}
              style={styles.orbGold}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.logoImage}
                contentFit="contain"
              />
              <View style={styles.orbReflection} />
            </LinearGradient>
          </LinearGradient>

          {/* Floating Particles around Logo */}
          <View style={styles.logoParticleWrap}>
            <View style={[styles.logoParticle, { top: -10, left: 20 }]} />
            <View style={[styles.logoParticle, { bottom: 10, right: 30 }]} />
            <View
              style={[
                styles.logoParticle,
                { top: 40, right: -10, width: 4, height: 4, opacity: 0.4 },
              ]}
            />
          </View>
        </Animated.View>

        {/* Shimmering Title */}
        <Animated.View
          entering={FadeInUp.delay(500).springify()}
          style={styles.nameContainer}
        >
          <View style={styles.nameOverflow}>
            <Text
              style={[
                styles.appName,
                { fontSize: titleSize, lineHeight: titleSize * 1.05 },
              ]}
            >
              {i18n.t('welcome.title')}
            </Text>
            <Animated.View style={[styles.shimmerStripe, shimmerStyle]}>
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1 }}
              />
            </Animated.View>
          </View>

          <Text style={styles.tagline}>{i18n.t('welcome.tagline')}</Text>
        </Animated.View>

        {/* Premium Divider */}
        <Animated.View entering={FadeIn.delay(850)} style={styles.dividerRow}>
          <View
            style={[styles.dividerLine, { backgroundColor: C.primary + '15' }]}
          />
          <LinearGradient
            colors={['transparent', C.primary + '80', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.dividerGold}
          />
          <View
            style={[styles.dividerLine, { backgroundColor: C.primary + '15' }]}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(900).springify()}
          style={styles.pillRow}
        >
          {[
            { emoji: '✨', label: i18n.t('welcome.pills.magic'), id: 'magic' },
            {
              emoji: '🌙',
              label: i18n.t('welcome.pills.dreams'),
              id: 'dreams',
            },
            {
              emoji: '🧩',
              label: i18n.t('welcome.pills.learning'),
              id: 'learning',
            },
          ].map((item) => (
            <View key={item.id} style={styles.pill}>
              {item.id === 'magic' && (
                <Sparkles size={14} color={C.primaryDark} />
              )}
              {item.id === 'dreams' && <Moon size={14} color={C.primaryDark} />}
              {item.id === 'learning' && (
                <BookOpen size={14} color={C.primaryDark} />
              )}
              <Text style={styles.pillText}>{item.label}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* Tactile Bottom CTA */}
      <Animated.View
        entering={FadeInUp.delay(1100).springify()}
        style={[
          styles.bottom,
          {
            paddingBottom: Math.max(insets.bottom + (isCompact ? 18 : 32), 28),
          },
        ]}
      >
        <AnimatedPressable
          style={[styles.ctaWrapper, tapScaleStyle]}
          onPress={handleTap}
        >
          <Animated.View style={[styles.ctaGlowHalo, ctaGlowStyle]}>
            <LinearGradient
              colors={[C.primary + '35', C.primary + '00']}
              style={{ flex: 1, borderRadius: 100 }}
            />
          </Animated.View>

          <LinearGradient
            colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButton}
          >
            <View style={styles.ctaInner}>
              <Text style={styles.ctaText}>{i18n.t('welcome.cta')}</Text>
              <View style={styles.ctaArrow}>
                <ChevronRight size={20} color={C.primaryDark} strokeWidth={3} />
              </View>
            </View>
          </LinearGradient>
        </AnimatedPressable>

        <View style={styles.signInRow}>
          <Text style={styles.signInLabel}>
            {i18n.t('welcome.login.label')}
          </Text>
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              router.push('/auth/login');
            }}
            hitSlop={12}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Text
              style={[
                styles.signInLink,
                {
                  color: '#FFFFFF',
                  textShadowColor: 'rgba(0,0,0,0.8)',
                  textShadowRadius: 10,
                },
              ]}
            >
              {i18n.t('welcome.login.action')}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const useStyles = (
  C: ThemeColors,
  width: number,
  isCompact: boolean,
  isTiny: boolean,
) => {
  return useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: '#000',
        },
        loadingScreen: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        loadingOrbOuter: {
          width: 220,
          height: 220,
          borderRadius: 110,
          borderWidth: 2,
          borderColor: C.primary + '20',
          alignItems: 'center',
          justifyContent: 'center',
        },
        loadingOrb: {
          width: 180,
          height: 180,
          borderRadius: 90,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: C.primary,
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.4,
          shadowRadius: 30,
          elevation: Platform.OS === 'android' ? 0 : 20,
        },
        loadingInnerOrb: {
          position: 'absolute',
          width: 240,
          height: 240,
          borderRadius: 120,
          borderWidth: 2,
          borderColor: C.primary + '30',
        },
        loadingOrbText: {
          fontSize: 42,
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
          width: 450,
          height: 450,
          top: -150,
          right: -150,
        },
        ambientBottomLeft: {
          width: 350,
          height: 350,
          bottom: '10%',
          left: -150,
        },
        ambientMidRight: {
          width: 250,
          height: 250,
          top: '45%',
          right: -100,
        },

        // Floating badges
        floatingBadge: {
          position: 'absolute',
          zIndex: 10,
        },
        badge1: {
          top: '15%',
          left: 24,
        },
        badge2: {
          top: '25%',
          right: 24,
        },
        badge3: {
          display: isCompact ? 'none' : 'flex',
          top: '55%',
          left: 20,
        },
        badgeInner: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: isCompact ? 6 : 8,
          paddingHorizontal: isCompact ? 12 : 16,
          paddingVertical: isCompact ? 8 : 10,
          borderRadius: BORDER_RADIUS.pill,
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.5)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
        badgeText: {
          fontSize: isCompact ? 10.5 : 12,
          fontFamily: FONTS.extrabold,
          color: C.primaryDark,
          letterSpacing: 0.5,
        },

        // Center layout
        center: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingHorizontal: SPACING.xl,
          paddingBottom: isTiny ? 8 : 16,
        },

        // Logo orb
        logoArea: {
          width: Math.min(
            width * (isCompact ? 0.46 : 0.58),
            isCompact ? 210 : 270,
          ),
          height: Math.min(
            width * (isCompact ? 0.46 : 0.58),
            isCompact ? 210 : 270,
          ),
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: isCompact ? 18 : SPACING.xxl,
        },
        halo: {
          position: 'absolute',
          width: Math.min(width * 0.9, 420),
          height: Math.min(width * 0.9, 420),
          borderRadius: 210,
        },
        glowRing: {
          position: 'absolute',
          width: isCompact ? 185 : 230,
          height: isCompact ? 185 : 230,
          borderRadius: 999,
          borderWidth: 1.5,
          borderColor: C.primary + '25',
        },
        orbContainer: {
          width: Math.min(
            width * (isCompact ? 0.38 : 0.5),
            isCompact ? 180 : 240,
          ),
          height: Math.min(
            width * (isCompact ? 0.38 : 0.5),
            isCompact ? 180 : 240,
          ),
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: '#FFFFFF60',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 20 },
          shadowOpacity: 0.5,
          shadowRadius: 40,
          elevation: Platform.OS === 'android' ? 0 : 32,
        },
        orbGold: {
          width: '85%',
          height: '85%',
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        logoImage: {
          width: '100%',
          height: '100%',
          borderRadius: 999,
          borderWidth: 3,
          borderColor: '#FFFFFF',
        },
        orbReflection: {
          position: 'absolute',
          top: -20,
          left: -20,
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: 'rgba(255,255,255,0.15)',
        },
        logoParticleWrap: {
          position: 'absolute',
          width: '140%',
          height: '140%',
        },
        logoParticle: {
          position: 'absolute',
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: C.primary,
          opacity: 0.6,
        },

        // App name
        nameContainer: {
          alignItems: 'center',
          gap: isCompact ? 8 : SPACING.md,
          marginBottom: isCompact ? 14 : SPACING.xl,
        },
        nameOverflow: {
          overflow: 'hidden',
          borderRadius: 12,
        },
        appName: {
          fontFamily: FONTS.extrabold,
          color: '#FFFFFF',
          letterSpacing: -4,
          textAlign: 'center',

          textShadowColor: 'rgba(0,0,0,0.8)',
          textShadowOffset: { width: 0, height: 6 },
          textShadowRadius: 20,
          elevation: Platform.OS === 'android' ? 0 : 10,
        },
        shimmerStripe: {
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: 250,
        },
        tagline: {
          fontSize: isCompact ? 15 : 17,
          fontFamily: FONTS.medium,
          color: '#FFFFFF',
          textAlign: 'center',
          lineHeight: isCompact ? 22 : 26,
          letterSpacing: 0.2,
          opacity: 0.9,
          textShadowColor: 'rgba(0,0,0,0.5)',
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: 8,
        },

        // Divider
        dividerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          width: '85%',
          marginBottom: isCompact ? 14 : SPACING.xl,
          gap: 12,
          display: isTiny ? 'none' : 'flex',
        },
        dividerLine: {
          flex: 1,
          height: 1.5,
        },
        dividerGold: {
          width: 80,
          height: 2,
        },

        // Feature pills
        pillRow: {
          flexDirection: 'row',
          gap: isCompact ? 8 : SPACING.md,
          justifyContent: 'center',
          flexWrap: 'wrap',
          display: isTiny ? 'none' : 'flex',
        },
        pill: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: isCompact ? 5 : 6,
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.5)',
          paddingHorizontal: isCompact ? 12 : 16,
          paddingVertical: isCompact ? 8 : 10,
          borderRadius: BORDER_RADIUS.pill,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
        pillText: {
          fontSize: isCompact ? 11.5 : 13,
          fontFamily: FONTS.extrabold,
          color: C.primaryDark,
          letterSpacing: 0.5,
        },

        // Bottom section
        bottom: {
          alignItems: 'center',
          paddingHorizontal: SPACING.xl,
          gap: isCompact ? 16 : SPACING.xl,
          paddingTop: isCompact ? 12 : 20,
        },
        ctaWrapper: {
          width: '100%',
          alignItems: 'center',
        },
        ctaGlowHalo: {
          position: 'absolute',
          top: -24,
          left: -24,
          right: -24,
          bottom: -24,
        },
        ctaButton: {
          width: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 100,
          padding: 4,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.7)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 20,
        },
        ctaInner: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: isCompact ? 24 : 32,
          paddingRight: 10,
          paddingVertical: isCompact ? 7 : 10,
        },
        ctaText: {
          fontSize: isCompact ? 17 : 20,
          fontFamily: FONTS.extrabold,
          color: C.primaryDark,
          letterSpacing: -0.2,
        },
        ctaArrow: {
          width: isCompact ? 40 : 44,
          height: isCompact ? 40 : 44,
          borderRadius: 999,
          backgroundColor: C.primary + '15',
          alignItems: 'center',
          justifyContent: 'center',
        },
        signInRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          minHeight: 44,
          justifyContent: 'center',
        },
        signInLabel: {
          fontSize: 15,
          fontFamily: FONTS.medium,
          color: '#FFFFFF',
          opacity: 0.8,
          textShadowColor: 'rgba(0,0,0,0.5)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 4,
        },
        signInLink: {
          fontSize: 15,
          fontFamily: FONTS.extrabold,
          color: '#FFFFFF',
          letterSpacing: 0.3,
          textShadowColor: 'rgba(0,0,0,0.5)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 4,
        },
      }),
    [C, width, isCompact, isTiny],
  );
};
