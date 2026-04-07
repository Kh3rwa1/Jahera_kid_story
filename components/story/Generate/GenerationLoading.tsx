import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  interpolate,
  Easing as ReEasing,
  FadeInUp,
  ZoomIn,
  SlideInDown,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { Check, Sparkles, Wand as Wand2, MapPin, Volume2 } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { generateAudio } from '@/services/audioService';
import { formatLocationLabel, LocationContext } from '@/services/locationService';
import { FUN_FACTS } from '@/constants/storyOptions';
import { FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import { ThemeColors } from '@/types/theme';
import { GenerationStep } from '@/hooks/useStoryGeneration';
import { hapticFeedback } from '@/utils/haptics';

interface GenerationLoadingProps {
  colors: ThemeColors;
  status: string;
  progress: number;
  steps: GenerationStep[];
  locationCtx: LocationContext | null;
  languageCode: string;
  profile: any;
}

export function GenerationLoading({
  colors, status, progress, steps, locationCtx, languageCode, profile
}: GenerationLoadingProps) {
  const { width: winWidth } = Dimensions.get('window');
  
  const [funFactIndex, setFunFactIndex] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlayingFact, setIsPlayingFact] = useState(false);
  
  const pulseScale = useSharedValue(1);
  const orbRotate = useSharedValue(0);

  useEffect(() => {
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

    const factInterval = setInterval(() => {
      setFunFactIndex(prev => (prev + 1) % FUN_FACTS.length);
    }, 10000);

    return () => {
      clearInterval(factInterval);
      if (sound) sound.unloadAsync();
    };
  }, []);

  // Speak fun fact whenever it changes
  useEffect(() => {
    const text = FUN_FACTS[funFactIndex];
    let mounted = true;
    (async () => {
      try {
        if (sound) {
          await sound.stopAsync();
          await sound.unloadAsync();
        }
        setIsPlayingFact(true);
        const url = await generateAudio(text, languageCode, undefined, true);
        if (!url || !mounted) return;
        const { sound: newSound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
        setSound(newSound);
      } catch (e) {
        setIsPlayingFact(false);
      }
    })();
    return () => { mounted = false; };
  }, [funFactIndex]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${orbRotate.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#F0F9FF', '#FFFFFF']} style={StyleSheet.absoluteFill} />

      <View style={styles.content}>
        <Animated.View entering={ZoomIn.duration(600)} style={styles.orbContainer}>
          <Animated.View style={[styles.orbRing, orbStyle, { borderColor: colors.primary + '20' }]} />
          <Animated.View style={[styles.pulseWrap, pulseStyle]}>
            <LinearGradient
              colors={['#FF8C42', '#FF5C00']}
              style={styles.iconCircle}
            >
              <LottieView
                source={{ uri: 'https://lottie.host/505437a6-0683-431c-99d8-9c5957096752/Q5W4n5W5nG.json' }}
                autoPlay
                loop
                style={{ width: 80, height: 80 }}
              />
            </LinearGradient>
          </Animated.View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200)} style={styles.statusBlock}>
          <Text style={[styles.title, { color: colors.text.primary }]}>Creating Your Story</Text>
          {locationCtx && (
            <View style={[styles.locationBadge, { backgroundColor: colors.primary + '10' }]}>
              <MapPin size={12} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 13, fontFamily: FONTS.bold }}>
                Set in {formatLocationLabel(locationCtx)}
              </Text>
            </View>
          )}
          <Text style={[styles.statusText, { color: colors.text.secondary }]}>{status}</Text>
        </Animated.View>

        <View style={styles.progressContainer}>
          <View style={[styles.track, { backgroundColor: colors.text.light + '15' }]}>
            <LinearGradient
              colors={['#FF8C42', '#FF5C00']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.fill, { width: `${progress}%` }]}
            />
          </View>
          <Text style={[styles.progressPct, { color: colors.primary }]}>{progress}%</Text>
        </View>

        <View style={styles.timeline}>
          {steps.map((step, i) => (
            <View key={step.id} style={styles.stepRow}>
              <View style={[
                styles.dot,
                { backgroundColor: step.completed ? colors.success : (progress > (i * 25) ? colors.primary : colors.text.light + '30') }
              ]}>
                {step.completed ? <Check size={12} color="#FFF" strokeWidth={3} /> : null}
              </View>
              <Text style={[
                styles.stepLabel,
                { color: step.completed ? colors.text.primary : colors.text.light }
              ]}>
                {step.label}
              </Text>
            </View>
          ))}
        </View>

        <Animated.View entering={FadeInUp.delay(500)} style={[styles.factCard, { backgroundColor: colors.primary + '08' }]}>
          <View style={styles.factHeader}>
            <Sparkles size={14} color={colors.primary} />
            <Text style={[styles.factTitle, { color: colors.primary }]}>Did you know?</Text>
          </View>
          <Text style={[styles.factText, { color: colors.text.secondary }]}>
            {FUN_FACTS[funFactIndex]}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { width: '100%', paddingHorizontal: 30, alignItems: 'center' },
  orbContainer: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  orbRing: { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 1.5, borderStyle: 'dashed' },
  pulseWrap: { ...SHADOWS.lg },
  iconCircle: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
  statusBlock: { alignItems: 'center', gap: 8, marginBottom: 30 },
  title: { fontSize: 28, fontFamily: FONTS.display },
  locationBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 16, fontFamily: FONTS.medium },
  progressContainer: { width: '100%', gap: 10, marginBottom: 40 },
  track: { height: 10, borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
  progressPct: { textAlign: 'center', fontSize: 14, fontFamily: FONTS.bold },
  timeline: { width: '100%', gap: 16, marginBottom: 40, paddingHorizontal: 10 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  dot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepLabel: { fontSize: 15, fontFamily: FONTS.semibold },
  factCard: { width: '100%', padding: 20, borderRadius: 20, gap: 8 },
  factHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  factTitle: { fontSize: 14, fontFamily: FONTS.bold, textTransform: 'uppercase' },
  factText: { fontSize: 14, fontFamily: FONTS.medium, lineHeight: 22 },
});
