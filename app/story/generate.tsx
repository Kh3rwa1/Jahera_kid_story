import { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  cancelAnimation,
  interpolate,
  Easing as ReEasing,
  FadeInUp,
  FadeInDown,
  FadeInLeft,
  ZoomIn,
  SlideInDown,
} from 'react-native-reanimated';
import { useEffect as useEffectGen } from 'react';
import { profileService, storyService, quizService, familyMemberService, friendService } from '@/services/database';
import { generateAdventureStory, QuotaExceededError, StoryOptions } from '@/services/aiService';
import { generateAudio } from '@/services/audioService';
import { getCurrentContext } from '@/utils/contextUtils';
import { getLocationContext, formatLocationLabel, LocationContext } from '@/services/locationService';
import { Sparkles, BookOpen, Volume2, Circle as HelpCircle, Check, Zap, ChevronLeft, Wand as Wand2, MapPin, Globe } from 'lucide-react-native';
import { SUPPORTED_LANGUAGES, Language } from '@/constants/languages';
import { ErrorState } from '@/components/ErrorState';
import { CharacterManager } from '@/components/CharacterManager';
import { SPACING, BORDER_RADIUS, SHADOWS, FONTS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useApp } from '@/contexts/AppContext';
import { hapticFeedback } from '@/utils/haptics';
import { FamilyMember, Friend } from '@/types/database';
import { Audio } from 'expo-av';


const FUN_FACTS = [
  'Did you know? Dolphins sleep with one eye open!',
  'Did you know? Octopuses have 3 hearts!',
  'Did you know? Honey never spoils!',
  'Did you know? Sloths can hold their breath for 40 minutes!',
  'Did you know? The moon has moonquakes!',
  'Did you know? Butterflies taste with their feet!',
  'Did you know? Cats have over 20 vocalizations!',
  'Did you know? Penguins propose with pebbles!',
  'Did you know? Bananas glow blue under UV light!',
  'Did you know? A group of flamingos is called a flamboyance!',
];

const THEMES = [
  { id: 'adventure', label: 'Adventure', emoji: '🗺️', gradient: ['#F97316', '#EF4444'] as [string, string] },
  { id: 'fantasy', label: 'Fantasy', emoji: '🐉', gradient: ['#8B5CF6', '#6D28D9'] as [string, string] },
  { id: 'space', label: 'Space', emoji: '🚀', gradient: ['#0EA5E9', '#1D4ED8'] as [string, string] },
  { id: 'animals', label: 'Animals', emoji: '🦁', gradient: ['#F59E0B', '#D97706'] as [string, string] },
  { id: 'ocean', label: 'Ocean', emoji: '🌊', gradient: ['#06B6D4', '#0284C7'] as [string, string] },
  { id: 'superheroes', label: 'Heroes', emoji: '🦸', gradient: ['#EC4899', '#BE185D'] as [string, string] },
  { id: 'nature', label: 'Nature', emoji: '🌿', gradient: ['#10B981', '#059669'] as [string, string] },
  { id: 'science', label: 'Science', emoji: '🔬', gradient: ['#6366F1', '#4338CA'] as [string, string] },
];

const MOODS = [
  { id: 'exciting', label: 'Exciting', emoji: '⚡', color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'funny', label: 'Funny', emoji: '😄', color: '#10B981', bg: '#ECFDF5' },
  { id: 'calming', label: 'Calming', emoji: '🌙', color: '#6366F1', bg: '#EEF2FF' },
  { id: 'educational', label: 'Learn', emoji: '📚', color: '#0EA5E9', bg: '#F0F9FF' },
];

const LENGTHS = [
  { id: 'short', label: 'Quick', desc: '~50 words', emoji: '⚡' },
  { id: 'medium', label: 'Medium', desc: '~120 words', emoji: '📖' },
  { id: 'long', label: 'Long', desc: '~250 words', emoji: '📜', pro: true },
];

// A compact pill for the language picker
function LanguagePill({ lang, selected, styles, colors_C, onPress }: {
  lang: Language;
  selected: boolean;
  styles: any;
  colors_C: any;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const glow = useSharedValue(selected ? 1 : 0);
  
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolate(glow.value, [0, 1], [0, 1]) > 0.5 ? colors_C.primary : colors_C.cardBackground,
    borderColor: interpolate(glow.value, [0, 1], [0, 1]) > 0.5 ? colors_C.primary : colors_C.text.light + '25',
  }));

  useEffectGen(() => {
    glow.value = withSpring(selected ? 1 : 0);
  }, [selected]);

  const handlePress = () => {
    scale.value = withSequence(withSpring(0.9, { damping: 10 }), withSpring(1, { damping: 12 }));
    onPress();
    hapticFeedback.light();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1}>
      <ReAnimated.View style={[styles.langPill, animStyle]}>
        <Text style={styles.langFlag}>{lang.flag}</Text>
        <Text style={[styles.langName, { color: selected ? '#fff' : colors_C.text.secondary }]}>
          {lang.nativeName}
        </Text>
        {selected && (
          <ReAnimated.View entering={ZoomIn.duration(200)}>
            <Check size={13} color="#fff" strokeWidth={3} />
          </ReAnimated.View>
        )}
      </ReAnimated.View>
    </TouchableOpacity>
  );
}

interface GenerationStep {
  id: string;
  label: string;
  icon: typeof BookOpen;
  completed: boolean;
}

type Phase = 'options' | 'generating';

function ThemeCard({ theme, selected, cardSize, styles, colors_C, onPress }: {
  theme: typeof THEMES[0];
  selected: boolean;
  cardSize: number;
  styles: any;
  colors_C: any;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const glow = useSharedValue(selected ? 1 : 0);
  
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: selected ? theme.gradient[0] : 'transparent',
    borderWidth: selected ? 2 : 0,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0, 0.6]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [0.8, 1.1]) }],
  }));

  useEffectGen(() => {
    glow.value = withSpring(selected ? 1 : 0, { damping: 12 });
  }, [selected]);

  const handlePress = () => {
    scale.value = withSequence(withSpring(0.9, { damping: 10 }), withSpring(1, { damping: 12 }));
    onPress();
    hapticFeedback.light();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1}>
      <ReAnimated.View style={[animStyle, { position: 'relative' }]}>
        <ReAnimated.View 
          style={[
            StyleSheet.absoluteFill, 
            { borderRadius: BORDER_RADIUS.xl, backgroundColor: theme.gradient[0], shadowColor: theme.gradient[0], shadowOpacity: 0.5, shadowRadius: 15 }, 
            glowStyle
          ]} 
        />
        <View style={[styles.themeCard, { width: cardSize, height: cardSize, backgroundColor: colors_C.cardBackground }]}>
          <LinearGradient
            colors={selected ? theme.gradient : ['transparent', 'transparent']}
            style={styles.themeCardGradient}
          >
            <View style={[styles.themeCardInner, !selected && { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
              <Text style={[styles.themeCardEmoji, { opacity: selected ? 1 : 0.7 }]}>{theme.emoji}</Text>
              <Text style={[
                selected ? styles.themeCardLabelSelected : styles.themeCardLabel,
                { color: selected ? '#fff' : colors_C.text.secondary }
              ]}>
                {theme.label}
              </Text>
            </View>
          </LinearGradient>
          {selected && (
             <ReAnimated.View entering={ZoomIn.springify()} style={styles.themeCheckBadge}>
                <Check size={10} color="#fff" strokeWidth={4} />
             </ReAnimated.View>
          )}
        </View>
      </ReAnimated.View>
    </TouchableOpacity>
  );
}

function MoodCard({ mood, selected, styles, colors_C, onPress }: {
  mood: typeof MOODS[0];
  selected: boolean;
  styles: any;
  colors_C: any;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const active = useSharedValue(selected ? 1 : 0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: interpolate(active.value, [0, 1], [0, 1]) > 0.5 ? mood.color : 'transparent',
    backgroundColor: interpolate(active.value, [0, 1], [0, 1]) > 0.5 ? mood.bg : colors_C.cardBackground,
    shadowOpacity: withTiming(selected ? 0.2 : 0, { duration: 200 }),
  }));

  useEffectGen(() => {
    active.value = withSpring(selected ? 1 : 0);
  }, [selected]);

  const handlePress = () => {
    scale.value = withSequence(withSpring(0.92, { damping: 10 }), withSpring(1, { damping: 12 }));
    onPress();
    hapticFeedback.light();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1} style={{ flex: 1 }}>
      <ReAnimated.View style={[styles.moodCard, animStyle]}>
        <Text style={styles.moodEmoji}>{mood.emoji}</Text>
        <Text style={[styles.moodLabel, { color: selected ? mood.color : colors_C.text.secondary }]}>
          {mood.label}
        </Text>
        {selected && (
          <ReAnimated.View entering={ZoomIn.delay(100)} style={[styles.moodDot, { backgroundColor: mood.color }]} />
        )}
      </ReAnimated.View>
    </TouchableOpacity>
  );
}

function LengthCard({ len, selected, isPro, styles, colors_C, onPress }: {
  len: typeof LENGTHS[0];
  selected: boolean;
  isPro: boolean;
  styles: any;
  colors_C: any;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: selected ? colors_C.primary : colors_C.text.light + '20',
    backgroundColor: selected ? colors_C.primary + '0F' : colors_C.cardBackground,
  }));

  const handlePress = () => {
    scale.value = withSequence(withSpring(0.92, { damping: 10 }), withSpring(1, { damping: 12 }));
    onPress();
    hapticFeedback.light();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1} style={{ flex: 1 }}>
      <ReAnimated.View style={[styles.lengthCard, animStyle]}>
        {len.pro && !isPro && (
          <View style={styles.proCrown}>
            <Text style={styles.proText}>PRO</Text>
          </View>
        )}
        <Text style={styles.lengthEmoji}>{len.emoji}</Text>
        <Text style={[styles.lengthTitle, { color: selected ? colors_C.primary : colors_C.text.primary }]}>
          {len.label}
        </Text>
        <Text style={[styles.lengthWords, { color: selected ? colors_C.primary + 'AA' : colors_C.text.light }]}>
          {len.desc}
        </Text>
      </ReAnimated.View>
    </TouchableOpacity>
  );
}

function CtaButton({ gradient, styles, onPress }: { gradient: [string, string]; styles: any; onPress: () => void }) {
  const shimmerX = useSharedValue(-1);
  const scale = useSharedValue(1);

  useEffectGen(() => {
    shimmerX.value = withRepeat(
      withTiming(1, { duration: 2600, easing: ReEasing.linear }),
      -1, false
    );
    return () => cancelAnimation(shimmerX);
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmerX.value, [-1, 1], [-200, 200]) }],
  }));
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <ReAnimated.View style={scaleStyle}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.96, { damping: 14 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
        activeOpacity={1}
      >
        <LinearGradient colors={gradient} style={styles.ctaButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderRadius: BORDER_RADIUS.xxl }]}>
            <ReAnimated.View style={[styles.ctaShimmer, shimmerStyle]} />
          </View>
          <View style={styles.ctaButtonInner}>
            <Wand2 size={22} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.ctaText}>Create Story</Text>
            <View style={styles.ctaArrow}>
              <Sparkles size={16} color="rgba(255,255,255,0.8)" />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </ReAnimated.View>
  );
}


const useStyles = (C: any, winWidth: number, insets: any) => {
  return useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    scrollContent: { paddingBottom: SPACING.xxxl },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.xl,
      marginBottom: SPACING.lg,
    },
    backBtn: {
      width: 42, height: 42, borderRadius: 21,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: C.cardBackground, ...SHADOWS.sm,
    },
    locationPill: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 12, paddingVertical: 7, borderRadius: BORDER_RADIUS.pill,
      borderWidth: 1, backgroundColor: C.info + '10', borderColor: C.info + '30',
    },
    locationPillText: {
      fontSize: 12,
      fontFamily: FONTS.semibold,
    },
    header: {
      paddingHorizontal: SPACING.xl,
      marginBottom: SPACING.xl,
    },
    headerAccent: {
      width: 48,
      height: 6,
      borderRadius: 3,
      marginBottom: 16,
    },
    pageTitle: {
      fontSize: 42, fontFamily: FONTS.display, lineHeight: 50,
      letterSpacing: -1.2, marginBottom: 6, color: C.text.primary,
    },
    pageSubtitle: {
      fontSize: 16, fontFamily: FONTS.medium,
      opacity: 0.8, color: C.text.secondary,
    },
    section: {
      marginBottom: SPACING.xl,
    },
    sectionHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.xl,
      marginBottom: SPACING.md,
    },
    sectionLabel: {
      fontSize: 15, fontFamily: FONTS.displayBold, textTransform: 'uppercase',
      letterSpacing: 1.5, color: C.text.secondary,
    },
    sectionBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: BORDER_RADIUS.pill,
    },
    sectionBadgeText: {
      fontSize: 13,
      fontFamily: FONTS.displayBold,
    },
    themeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: SPACING.xl,
      gap: SPACING.sm,
    },
    themeCard: {
      borderRadius: BORDER_RADIUS.xl,
      overflow: 'hidden',
      ...SHADOWS.sm,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    themeCardSelected: {
      ...SHADOWS.md,
      borderColor: 'transparent',
    },
    themeCardGradient: {
      flex: 1,
      padding: 2,
    },
    themeCardInner: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: SPACING.xs,
      overflow: 'hidden',
      borderRadius: BORDER_RADIUS.xl - 2,
    },
    themeCheckBadge: {
      position: 'absolute',
      top: 6,
      right: 6,
      backgroundColor: 'rgba(255,255,255,0.3)',
      width: 18,
      height: 18,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: '#fff',
    },
    themeCardEmoji: { fontSize: 32, marginBottom: 2 },
    themeCardLabel: { fontSize: 12, fontFamily: FONTS.displayBold },
    themeCardLabelSelected: { fontSize: 12, fontFamily: FONTS.display, color: '#FFFFFF' },

    moodRow: {
      flexDirection: 'row',
      paddingHorizontal: SPACING.xl,
      gap: SPACING.sm,
    },
    moodCard: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: SPACING.lg,
      paddingHorizontal: SPACING.xs,
      borderRadius: BORDER_RADIUS.xl,
      borderWidth: 2,
      gap: 6,
      ...SHADOWS.xs,
      position: 'relative',
    },
    moodEmoji: { fontSize: 34 },
    moodLabel: { fontSize: 16, fontFamily: FONTS.displayBold },
    moodDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },

    lengthRow: {
      flexDirection: 'row',
      gap: SPACING.sm,
    },
    lengthCard: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: SPACING.lg,
      paddingHorizontal: SPACING.xs,
      borderRadius: BORDER_RADIUS.xl,
      borderWidth: 2,
      gap: 4,
      position: 'relative',
      ...SHADOWS.xs,
    },
    lengthEmoji: { fontSize: 30 },
    lengthTitle: {
      fontSize: 17,
      fontFamily: FONTS.displayBold,
    },
    lengthWords: {
      fontSize: 13,
      fontFamily: FONTS.displayMedium,
    },
    proCrown: {
      position: 'absolute', top: -8, right: -4,
      backgroundColor: C.accent.gold, paddingHorizontal: 6, paddingVertical: 2,
      borderRadius: BORDER_RADIUS.pill,
    },
    proText: {
      fontSize: 8,
      fontFamily: FONTS.extrabold,
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },

    ctaSection: {
      paddingHorizontal: SPACING.xl,
      gap: SPACING.md,
      alignItems: 'center',
    },
    quotaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    quotaDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.text.light },
    quotaText: { fontSize: 13, fontFamily: FONTS.medium, color: C.text.light },
    ctaButton: {
      borderRadius: BORDER_RADIUS.xxl,
      ...SHADOWS.lg,
      overflow: 'hidden',
    },
    ctaButtonInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
      paddingHorizontal: 48,
      gap: SPACING.sm,
    },
    ctaText: {
      fontSize: 20,
      fontFamily: FONTS.display,
      color: '#FFFFFF',
      letterSpacing: -0.2,
    },
    ctaArrow: {
      marginLeft: 4,
    },
    ctaShimmer: {
      position: 'absolute',
      top: 0, bottom: 0,
      width: 60,
      backgroundColor: 'rgba(255,255,255,0.18)',
      transform: [{ skewX: '-20deg' }],
    },

    quotaContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: SPACING.xxxl,
      gap: SPACING.lg,
    },
    quotaIconWrap: { marginBottom: SPACING.sm },
    quotaIconBg: {
      width: 88,
      height: 88,
      borderRadius: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quotaTitle: {
      fontSize: 24, fontFamily: FONTS.extrabold, color: C.text.primary,
      textAlign: 'center', letterSpacing: -0.5,
    },
    quotaSubtitle: {
      fontSize: 15, fontFamily: FONTS.medium, color: C.text.secondary,
      textAlign: 'center', lineHeight: 23,
    },
    fullWidth: { width: '100%' },
    upgradeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.sm,
      paddingVertical: 18,
      borderRadius: BORDER_RADIUS.xxl,
      ...SHADOWS.lg,
    },
    upgradeButtonText: {
      fontSize: 16,
      fontFamily: FONTS.extrabold,
      color: '#FFFFFF',
    },
    backLink: { paddingVertical: SPACING.md },
    backLinkText: { fontSize: 14, fontFamily: FONTS.medium, color: C.text.light },
    
    // Generating
    generatingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: C.background },
    genAmbientOrb1: {
      position: 'absolute',
      width: 300,
      height: 300,
      borderRadius: 150,
      top: -80,
      right: -80,
    },
    genAmbientOrb2: {
      position: 'absolute',
      width: 240,
      height: 240,
      borderRadius: 120,
      bottom: 60,
      left: -80,
    },
    generatingContent: {
      width: '100%',
      maxWidth: 400,
      paddingHorizontal: SPACING.xl,
      alignItems: 'center',
    },
    orbContainer: {
      width: 180,
      height: 180,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.xxl,
    },
    orbRingOuter: {
      position: 'absolute',
      width: 180,
      height: 180,
      borderRadius: 90,
      borderWidth: 1,
      borderColor: 'rgba(99,102,241,0.15)',
      borderStyle: 'dashed',
    },
    orbRingMid: {
      position: 'absolute',
      width: 148,
      height: 148,
      borderRadius: 74,
      borderWidth: 1.5,
    },
    pulseWrap: { ...SHADOWS.lg },
    iconCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      alignItems: 'center',
      justifyContent: 'center',
    },
    genTitleBlock: {
      alignItems: 'center',
      gap: SPACING.sm,
      marginBottom: SPACING.md,
    },
    genTitle: {
      fontSize: 26,
      fontFamily: FONTS.extrabold,
      textAlign: 'center',
      letterSpacing: -0.5,
      lineHeight: 32,
    },
    locationBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: BORDER_RADIUS.pill,
      borderWidth: 1,
    },
    locationBadgeText: {
      fontSize: 12,
      fontFamily: FONTS.semibold,
    },
    activeStepChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      marginBottom: SPACING.xl,
    },
    activeStepDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
    },
    activeStepText: {
      fontSize: 12,
      fontFamily: FONTS.medium,
      lineHeight: 18,
    },
    progressWrap: {
      width: '100%',
      marginBottom: SPACING.xl,
      gap: SPACING.sm,
    },
    progressTrack: {
      height: 9,
      borderRadius: 5,
      overflow: 'hidden',
      position: 'relative',
    },
    progressFill: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      borderRadius: 5,
    },
    progressShimmer: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      borderRadius: 5,
      overflow: 'hidden',
    },
    progressPct: {
      fontSize: 12,
      fontFamily: FONTS.bold,
      textAlign: 'center',
    },
    timelineCard: {
      width: '100%',
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.lg,
      paddingBottom: SPACING.sm,
      borderRadius: BORDER_RADIUS.xl,
      marginBottom: SPACING.lg,
      backgroundColor: C.cardBackground + '90',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
      ...SHADOWS.sm,
    },
    timelineRow: {
      flexDirection: 'row',
    },
    timelineLeft: {
      alignItems: 'center',
      width: 32,
      marginRight: SPACING.md,
    },
    timelineDot: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    timelineConnector: {
      width: 2,
      flex: 1,
      minHeight: SPACING.lg,
      marginTop: 3,
      marginBottom: 3,
      borderRadius: 1,
    },
    timelineContent: {
      flex: 1,
      paddingTop: 5,
      gap: 3,
    },
    timelineLabel: {
      fontSize: 13,
      fontFamily: FONTS.semibold,
      lineHeight: 18,
    },
    activePulseRow: {
      flexDirection: 'row',
      gap: 3,
      alignItems: 'center',
      marginTop: 2,
    },
    activePulseDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      opacity: 0.6,
    },
    stepDoneText: {
      fontSize: 11,
      fontFamily: FONTS.semibold,
      marginTop: 1,
    },
    funFactCard: {
      width: '100%',
      flexDirection: 'column',
      gap: SPACING.xs,
      padding: SPACING.lg,
      borderRadius: BORDER_RADIUS.xl,
      borderWidth: 1,
      marginBottom: SPACING.md,
    },
    funFactHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    funFact: {
      flex: 1,
      fontSize: 12,
      fontFamily: FONTS.medium,
      lineHeight: 18,
    },
    longWaitCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      borderRadius: BORDER_RADIUS.xl,
      ...SHADOWS.xs,
    },
    longWaitText: {
      fontSize: 13,
      fontFamily: FONTS.medium,
    },
    // ── Language picker ───────────────────────────────────────────────
    langRow: {
      paddingHorizontal: SPACING.xl,
      gap: SPACING.sm,
      paddingVertical: 4,
    },
    langPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: BORDER_RADIUS.pill,
      borderWidth: 1.5,
      ...SHADOWS.xs,
    },
    langFlag: { fontSize: 18 },
    langName: { fontSize: 14, fontFamily: FONTS.displayBold },
  }), [C, winWidth, insets]);
};

export default function GenerateStory() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { currentTheme } = useTheme();
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const C = currentTheme.colors;
  const { profile, subscription, refreshSubscription, refreshStories } = useApp();
  const styles = useStyles(C, winWidth, insets);

  const CARD_SIZE = (winWidth - SPACING.xl * 2 - SPACING.sm * 3) / 4;

  const [phase, setPhase] = useState<Phase>('options');
  const [selectedTheme, setSelectedTheme] = useState('adventure');
  const [selectedMood, setSelectedMood] = useState('exciting');
  const [selectedLength, setSelectedLength] = useState<'short' | 'medium' | 'long'>('short');
  const [selectedLanguage, setSelectedLanguage] = useState(
    (params.languageCode as string) || 'en'
  );

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [locationCtx, setLocationCtx] = useState<LocationContext | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);

  const [status, setStatus] = useState('Preparing your adventure...');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isQuotaError, setIsQuotaError] = useState(false);

  // Handle "Surprise Me" randomization
  useEffect(() => {
    if (params.surprise === 'true') {
      const randomTheme = THEMES[Math.floor(Math.random() * THEMES.length)].id;
      const randomMood = MOODS[Math.floor(Math.random() * MOODS.length)].id;
      
      // Don't surprise with 'long' if they aren't pro to avoid immediate paywall
      const availableLengths = subscription?.plan !== 'free' 
        ? LENGTHS 
        : LENGTHS.filter(l => !l.pro);
      const randomLength = availableLengths[Math.floor(Math.random() * availableLengths.length)].id;

      setSelectedTheme(randomTheme);
      setSelectedMood(randomMood);
      setSelectedLength(randomLength as any);
      
      hapticFeedback.success();
    }
  }, [params.surprise, subscription?.plan]);

  const [funFactIndex, setFunFactIndex] = useState(0);
  const [longWait, setLongWait] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const longWaitRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  // Audio State
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { 
      isMountedRef.current = false;
      if (sound) {
        sound.unloadAsync().catch(() => {});
      }
    };
  }, [sound]);

  const speak = async (text: string, id: string) => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }

      setPlayingId(id);
      const audioSettings = profile ? {
        voiceId: profile.elevenlabs_voice_id,
        modelId: profile.elevenlabs_model_id,
        stability: profile.elevenlabs_stability,
        similarity: profile.elevenlabs_similarity,
        style: profile.elevenlabs_style,
        speakerBoost: profile.elevenlabs_speaker_boost,
      } : undefined;
      const url = await generateAudio(text, params.languageCode as string || 'en', undefined, true, audioSettings);
      if (!url) {
        setPlayingId(null);
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingId(null);
        }
      });
    } catch (err) {
      console.error('TTS Error (Generate):', err);
      setPlayingId(null);
    }
  };

  const [steps, setSteps] = useState<GenerationStep[]>([
    { id: 'profile', label: 'Loading profile', icon: Sparkles, completed: false },
    { id: 'story', label: 'Creating story', icon: BookOpen, completed: false },
    { id: 'quiz', label: 'Generating quiz', icon: HelpCircle, completed: false },
    { id: 'audio', label: 'Adding narration', icon: Volume2, completed: false },
  ]);

  const pulseScale = useSharedValue(1);
  const orbRotate = useSharedValue(0);
  const [lottieSpeed, setLottieSpeed] = useState(1);
  const lottieRef = useRef<LottieView>(null);

  const handleOrbTap = () => {
    hapticFeedback.medium();
    setLottieSpeed(3);
    pulseScale.value = withSequence(
      withSpring(1.3, { damping: 10 }),
      withSpring(1, { damping: 12 })
    );
    setTimeout(() => {
      if (isMountedRef.current) setLottieSpeed(1);
    }, 1200);
  };

  const isPro = subscription?.plan !== 'free';

  // Resolve profileId: prefer URL param, fallback to AppContext profile
  const resolvedProfileId = (params.profileId as string) || profile?.id;

  useEffect(() => {
    if (!resolvedProfileId) return;

    Promise.all([
      familyMemberService.getByProfileId(resolvedProfileId),
      friendService.getByProfileId(resolvedProfileId),
    ]).then(([fm, fr]) => {
      if (fm) setFamilyMembers(fm);
      if (fr) setFriends(fr);
    });

    setLocationLoading(true);
    getLocationContext().then(ctx => {
      if (isMountedRef.current) {
        setLocationCtx(ctx);
        setLocationLoading(false);
      }
    });
  }, [resolvedProfileId]);

  useEffect(() => {
    if (phase !== 'generating') return;

    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1400, easing: ReEasing.inOut(ReEasing.quad) }),
        withTiming(1, { duration: 1400, easing: ReEasing.inOut(ReEasing.quad) })
      ),
      -1,
      true
    );

    orbRotate.value = withRepeat(
      withTiming(360, { duration: 8000, easing: ReEasing.linear }),
      -1,
      false
    );

    timerRef.current = setInterval(() => {
      setFunFactIndex(prev => {
        const next = (prev + 1) % FUN_FACTS.length;
        speak(FUN_FACTS[next], `fact_${next}`);
        return next;
      });
    }, 8000); // Slower interval for TTS completion

    longWaitRef.current = setTimeout(() => {
      setLongWait(true);
      speak("Making it extra special — hang tight!", "long_wait");
    }, 18000);

    runGeneration();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (longWaitRef.current) clearTimeout(longWaitRef.current);
    };
  }, [phase]);

  const pulseAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${orbRotate.value}deg` }],
  }));

  const completeStep = (stepId: string) => {
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, completed: true } : s));
    hapticFeedback.light();
  };

  const handleStartGeneration = () => {
    if (selectedLength === 'long' && !isPro) {
      router.push('/paywall');
      return;
    }
    setPhase('generating');
  };

  const runGeneration = async () => {
    try {
      const profileId = resolvedProfileId;
      const languageCode = selectedLanguage;

      if (!profileId) {
        setError('Profile not found. Please make sure you have created a profile first.');
        return;
      }

      if (!isMountedRef.current) return;
      setStatus('Loading your profile...');
      setProgress(20);

      const profile = await profileService.getWithRelations(profileId);
      if (!profile) {
        setError('Profile not found. Please make sure you have created a profile first.');
        return;
      }

      if (!isMountedRef.current) return;
      completeStep('profile');
      setStatus('Creating your adventure story...');
      setProgress(40);

      const context = getCurrentContext();
      const options: StoryOptions = {
        theme: selectedTheme,
        mood: selectedMood,
        length: selectedLength,
        locationContext: locationCtx,
      };

      const story = await generateAdventureStory(profile, languageCode, context, options);

      if (!story) {
        setError('Could not generate a story. Please try again.');
        return;
      }

      if (!isMountedRef.current) return;
      completeStep('story');
      setStatus('Creating quiz questions...');
      setProgress(60);

      const storyRecord = await storyService.create({
        profile_id: profileId,
        language_code: languageCode,
        title: story.title,
        content: story.content,
        audio_url: null,
        season: context.season,
        time_of_day: context.timeOfDay,
        theme: selectedTheme,
        mood: selectedMood,
        word_count: story.word_count || null,
        share_token: null,
        like_count: 0,
        generated_at: new Date().toISOString(),
        location_city: locationCtx?.city ?? null,
        location_country: locationCtx?.country ?? null,
      });

      if (!storyRecord) {
        setError('Failed to save story. Please check your internet connection and try again.');
        return;
      }

      setProgress(70);

      let quizCreatedCount = 0;
      for (let i = 0; i < story.quiz.length; i++) {
        const quizQuestion = story.quiz[i];
        const question = await quizService.createQuestion(storyRecord.id, quizQuestion.question, i + 1);
        if (question) {
          await quizService.createAnswer(question.id, quizQuestion.options.A, quizQuestion.correct_answer === 'A', 'A');
          await quizService.createAnswer(question.id, quizQuestion.options.B, quizQuestion.correct_answer === 'B', 'B');
          await quizService.createAnswer(question.id, quizQuestion.options.C, quizQuestion.correct_answer === 'C', 'C');
          quizCreatedCount++;
        }
      }

      if (quizCreatedCount === 0) {
        setError('Failed to create quiz questions. Please try generating a new story.');
        return;
      }

      if (!isMountedRef.current) return;
      completeStep('quiz');

      setStatus('Finalising your story...');
      setProgress(90);

      // Trigger audio in the background — server writes audio_url directly to DB
      // via its API key. No await needed; playback screen polls DB for audio_url.
      const audioSettings = profile ? {
        voiceId: profile.elevenlabs_voice_id,
        modelId: profile.elevenlabs_model_id,
        stability: profile.elevenlabs_stability,
        similarity: profile.elevenlabs_similarity,
        style: profile.elevenlabs_style,
        speakerBoost: profile.elevenlabs_speaker_boost,
      } : undefined;

      generateAudio(story.content, languageCode, storyRecord.id, false, audioSettings).then(audioPath => {
        if (audioPath) completeStep('audio');
      }).catch(() => {});

      setStatus('Story ready!');
      setProgress(100);
      hapticFeedback.success();
      await Promise.all([refreshSubscription(), refreshStories()]);

      if (!isMountedRef.current) return;
      setTimeout(() => {
        if (isMountedRef.current) {
          router.replace({ pathname: '/story/playback', params: { storyId: storyRecord.id } });
        }
      }, 800);
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        setIsQuotaError(true);
        setError(err.message);
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate story';
        setError(errorMessage);
      }
    }
  };

  const handleRetry = () => {
    setError(null);
    setIsQuotaError(false);
    setProgress(0);
    setLongWait(false);
    setStatus('Preparing your adventure...');
    setSteps(prev => prev.map(s => ({ ...s, completed: false })));
    setPhase('options');
    setTimeout(() => setPhase('generating'), 50);
  };

  if (isQuotaError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.quotaContainer}>
          <View style={styles.quotaIconWrap}>
            <LinearGradient colors={C.accent.goldGradient || ['#FEF3C7', '#FDE68A']} style={styles.quotaIconBg}>
              <Zap size={36} color={C.accent.gold} strokeWidth={2} />
            </LinearGradient>
          </View>
          <Text style={styles.quotaTitle}>Monthly Limit Reached</Text>
          <Text style={styles.quotaSubtitle}>
            You've used all your free stories this month. Upgrade to Pro for unlimited adventures!
          </Text>
          <TouchableOpacity onPress={() => router.push('/paywall')} activeOpacity={0.9} style={styles.fullWidth}>
            <LinearGradient
              colors={[...C.gradients.sunset]}
              style={styles.upgradeButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Sparkles size={18} color="#FFFFFF" />
              <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          type="general"
          title="Generation Failed"
          message={error}
          onRetry={handleRetry}
          onGoHome={() => router.back()}
          showDetails={false}
        />
      </SafeAreaView>
    );
  }

  if (phase === 'generating') {
    const activeStepIndex = steps.findIndex(s => !s.completed);
    const activeStep = activeStepIndex >= 0 ? steps[activeStepIndex] : steps[steps.length - 1];

    return (
      <SafeAreaView style={styles.generatingScreen}>
        <LinearGradient colors={C.backgroundGradient} style={StyleSheet.absoluteFill} />

        <View style={[styles.genAmbientOrb1, { backgroundColor: C.primary + '1A', width: 300, height: 300, borderRadius: 150, top: -100, left: -100, opacity: 0.4 }]} />
        <View style={[styles.genAmbientOrb2, { backgroundColor: C.gradients.sunset[0] + '15', width: 400, height: 400, borderRadius: 200, bottom: -150, right: -150, opacity: 0.3 }]} />

        <View style={styles.generatingContent}>
          <ReAnimated.View entering={ZoomIn.delay(0).springify()} style={styles.orbContainer}>
            <ReAnimated.View style={[styles.orbRingOuter, orbStyle]} />
            <View style={[styles.orbRingMid, { borderColor: C.primary + '18' }]} />
            <TouchableOpacity onPress={handleOrbTap} activeOpacity={1}>
              <ReAnimated.View style={[styles.pulseWrap, pulseAnimStyle]}>
                <LinearGradient
                  colors={[...C.gradients.sunset]}
                  style={styles.iconCircle}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <LottieView
                    ref={lottieRef}
                    source={{ uri: 'https://lottie.host/505437a6-0683-431c-99d8-9c5957096752/Q5W4n5W5nG.json' }}
                    autoPlay
                    loop
                    speed={lottieSpeed}
                    style={{ width: 80, height: 80 }}
                  />
                </LinearGradient>
              </ReAnimated.View>
            </TouchableOpacity>
          </ReAnimated.View>

          <ReAnimated.View entering={FadeInUp.delay(140).springify()} style={styles.genTitleBlock}>
            <Text style={[styles.genTitle, { color: C.text.primary }]}>
              Creating Your Story
            </Text>
            {locationCtx && (
              <View style={[styles.locationBadge, { backgroundColor: C.primary + '10', borderColor: C.primary + '20' }]}>
                <MapPin size={11} color={C.primary} strokeWidth={2.5} />
                <Text style={[styles.locationBadgeText, { color: C.primary }]}>
                  Set in {formatLocationLabel(locationCtx)}
                </Text>
              </View>
            )}
          </ReAnimated.View>

          <ReAnimated.View entering={FadeInUp.delay(200).springify()} style={styles.activeStepChip}>
            <View style={[styles.activeStepDot, { backgroundColor: C.primary }]} />
            <Text style={[styles.activeStepText, { color: C.text.secondary }]}>
              {status}
            </Text>
          </ReAnimated.View>

          <ReAnimated.View entering={FadeInUp.delay(260).springify()} style={styles.progressWrap}>
            <View style={[styles.progressTrack, { backgroundColor: C.text.light + '18' }]}>
              <LinearGradient
                colors={[...C.gradients.sunset]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.flatten([styles.progressFill, { width: `${progress}%` }])}
              />
              <View style={StyleSheet.flatten([styles.progressShimmer, { width: `${progress}%` }])}>
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.25)', 'transparent']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
            </View>
            <Text style={[styles.progressPct, { color: C.primary }]}>{progress}%</Text>
          </ReAnimated.View>

          <ReAnimated.View
            entering={FadeInUp.delay(320).springify()}
            style={styles.timelineCard}
          >
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isActive = !step.completed && activeStepIndex === i;
              const isPast = step.completed;
              const isFuture = !step.completed && activeStepIndex !== i;

              return (
                <View key={step.id} style={styles.timelineRow}>
                  <View style={styles.timelineLeft}>
                    <View style={[
                      styles.timelineDot,
                      isPast && { backgroundColor: C.success },
                      isActive && { backgroundColor: C.primary },
                      isFuture && { backgroundColor: C.text.light + '20' },
                    ]}>
                      {isPast
                        ? <Check size={11} color="#FFFFFF" strokeWidth={3} />
                        : <Icon size={11} color={isPast || isActive ? '#FFFFFF' : C.text.light} strokeWidth={2} />
                      }
                    </View>
                    {i < steps.length - 1 && (
                      <View style={[
                        styles.timelineConnector,
                        { backgroundColor: isPast ? C.success + '40' : C.text.light + '15' },
                      ]} />
                    )}
                  </View>

                  <View style={[styles.timelineContent, i < steps.length - 1 && { marginBottom: SPACING.md }]}>
                    <Text style={[
                      styles.timelineLabel,
                      isPast && { color: C.text.secondary },
                      isActive && { color: C.text.primary },
                      isFuture && { color: C.text.light },
                    ]}>
                      {step.label}
                    </Text>
                    {isActive && (
                      <ReAnimated.View entering={FadeInLeft.springify()} style={styles.activePulseRow}>
                        {[0, 1, 2].map(j => (
                          <View key={j} style={[styles.activePulseDot, { backgroundColor: C.primary }]} />
                        ))}
                      </ReAnimated.View>
                    )}
                    {isPast && (
                      <ReAnimated.Text entering={FadeInLeft.springify()} style={[styles.stepDoneText, { color: C.success }]}>
                        Done
                      </ReAnimated.Text>
                    )}
                  </View>
                </View>
              );
            })}
          </ReAnimated.View>

          <ReAnimated.View
            entering={FadeInUp.delay(420).springify()}
            style={[styles.funFactCard, { backgroundColor: C.primary + '09', borderColor: C.primary + '18' }]}
          >
            <View style={styles.funFactHeader}>
              <Sparkles size={14} color={C.primary} strokeWidth={2} />
              {playingId?.startsWith('fact_') && (
                <Volume2 size={14} color={C.primary} strokeWidth={2} />
              )}
            </View>
            <Text style={[styles.funFact, { color: C.text.secondary }]}>
              {FUN_FACTS[funFactIndex]}
            </Text>
          </ReAnimated.View>

          {longWait && (
            <ReAnimated.View entering={SlideInDown.springify()} style={styles.longWaitCard}>
              <Wand2 size={16} color={C.primary} strokeWidth={2} />
              <Text style={[styles.longWaitText, { color: C.text.secondary }]}>
                Making it extra special — hang tight!
              </Text>
            </ReAnimated.View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const selectedThemeObj = THEMES.find(t => t.id === selectedTheme)!;
  const locationLabel = formatLocationLabel(locationCtx);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ReAnimated.View entering={FadeInDown.delay(0).springify()} style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft size={22} color={C.text.primary} />
          </TouchableOpacity>

          <View style={styles.locationPill}>
            <MapPin size={12} color={locationLoading ? C.text.light : locationLabel ? C.info : C.text.light} strokeWidth={2.5} />
            <Text style={[
              styles.locationPillText,
              { color: locationLoading ? C.text.light : locationLabel ? C.info : C.text.light },
            ]}>
              {locationLoading ? 'Locating...' : locationLabel || 'Location unavailable'}
            </Text>
          </View>
        </ReAnimated.View>

      <ReAnimated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
        <LinearGradient
          colors={selectedThemeObj.gradient}
          style={styles.headerAccent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        <Text style={styles.pageTitle}>Craft Your{'\n'}Story</Text>
        <Text style={styles.pageSubtitle}>Choose theme, language, mood & length</Text>
      </ReAnimated.View>

        <ReAnimated.View entering={FadeInUp.delay(80).springify()} style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionLabel}>Story Theme</Text>
            <View style={[styles.sectionBadge, { backgroundColor: selectedThemeObj.gradient[0] + '18' }]}>
              <Text style={[styles.sectionBadgeText, { color: selectedThemeObj.gradient[0] }]}>
                {selectedThemeObj.emoji} {selectedThemeObj.label}
              </Text>
            </View>
          </View>
          <View style={styles.themeGrid}>
            {THEMES.map((theme, i) => (
              <ReAnimated.View key={theme.id} entering={FadeInUp.delay(100 + i * 30).springify()}>
                <ThemeCard
                  theme={theme}
                  selected={selectedTheme === theme.id}
                  cardSize={CARD_SIZE}
                  styles={styles}
                  onPress={() => setSelectedTheme(theme.id)}
                  colors_C={C}
                />
              </ReAnimated.View>
            ))}
          </View>
        </ReAnimated.View>

        <ReAnimated.View entering={FadeInUp.delay(200).springify()} style={styles.section}>
          <Text style={styles.sectionLabel}>Mood</Text>
          <View style={styles.moodRow}>
            {MOODS.map(mood => (
              <MoodCard
                key={mood.id}
                mood={mood}
                selected={selectedMood === mood.id}
                styles={styles}
                colors_C={C}
                onPress={() => setSelectedMood(mood.id)}
              />
            ))}
          </View>
        </ReAnimated.View>

        <ReAnimated.View entering={FadeInUp.delay(280).springify()} style={styles.section}>
          <Text style={styles.sectionLabel}>Story Length</Text>
          <View style={styles.lengthRow}>
            {LENGTHS.map(len => (
              <LengthCard
                key={len.id}
                len={len}
                selected={selectedLength === len.id}
                isPro={isPro}
                styles={styles}
                colors_C={C}
                onPress={() => setSelectedLength(len.id as 'short' | 'medium' | 'long')}
              />
            ))}
          </View>
        </ReAnimated.View>

        {/* ── Language ── */}
        <ReAnimated.View entering={FadeInUp.delay(240).springify()} style={styles.section}>
          <View style={styles.sectionHead}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <Globe size={14} color={C.text.secondary} strokeWidth={2.5} />
              <Text style={styles.sectionLabel}>Story Language</Text>
            </View>
            <View style={[styles.sectionBadge, { backgroundColor: C.primary + '15' }]}>
              <Text style={[styles.sectionBadgeText, { color: C.primary }]}>
                {SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.flag}{' '}
                {SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name}
              </Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.langRow}
          >
            {SUPPORTED_LANGUAGES.map(lang => (
              <LanguagePill
                key={lang.code}
                lang={lang}
                selected={selectedLanguage === lang.code}
                styles={styles}
                colors_C={C}
                onPress={() => setSelectedLanguage(lang.code)}
              />
            ))}
          </ScrollView>
        </ReAnimated.View>


        {/* ── Characters ── */}
        <ReAnimated.View entering={FadeInUp.delay(380).springify()} style={styles.section}>
          <CharacterManager
            profileId={params.profileId as string}
            familyMembers={familyMembers}
            friends={friends}
            onFamilyMembersChange={setFamilyMembers}
            onFriendsChange={setFriends}
          />
        </ReAnimated.View>

        <ReAnimated.View entering={FadeInUp.delay(440).springify()} style={styles.ctaSection}>
          {subscription && subscription.plan === 'free' && (
            <View style={styles.quotaRow}>
              <View style={styles.quotaDot} />
              <Text style={styles.quotaText}>
                {subscription.stories_remaining} free {subscription.stories_remaining === 1 ? 'story' : 'stories'} remaining
              </Text>
            </View>
          )}

          <CtaButton
            gradient={selectedThemeObj.gradient}
            styles={styles}
            onPress={handleStartGeneration}
          />
        </ReAnimated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

