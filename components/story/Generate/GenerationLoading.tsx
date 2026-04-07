import { FUN_FACTS } from '@/constants/storyOptions';
import { FONTS,SHADOWS } from '@/constants/theme';
import { GenerationStep } from '@/hooks/useStoryGeneration';
import { generateAudio } from '@/services/audioService';
import { formatLocationLabel,LocationContext } from '@/services/locationService';
import { ThemeColors } from '@/types/theme';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { Check,MapPin,Sparkles } from 'lucide-react-native';
import { useEffect,useState } from 'react';
import {
  StyleSheet,
  Text,
  View
} from 'react-native';
import Animated,{
cancelAnimation,
FadeInUp,
Easing as ReEasing,
useAnimatedStyle,
useSharedValue,
withRepeat,
withSequence,
withTiming,
ZoomIn
} from 'react-native-reanimated';

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
}: Readonly<GenerationLoadingProps>) {
  const [funFactIndex, setFunFactIndex] = useState(0);
  const pulseScale = useSharedValue(1);
  const orbRotate = useSharedValue(0);

  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

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

    const cycleFacts = () => {
      if (!mounted) return;
      setFunFactIndex(prev => (prev + 1) % FUN_FACTS.length);
      timeoutId = setTimeout(cycleFacts, 10000);
    };

    timeoutId = setTimeout(cycleFacts, 10000);

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      cancelAnimation(orbRotate);
      cancelAnimation(pulseScale);
    };
  }, [orbRotate, pulseScale]);


  // Speak fun fact whenever it changes
  useEffect(() => {
    let mounted = true;
    let activeSound: Audio.Sound | null = null;

    const playFact = async () => {
      const text = FUN_FACTS[funFactIndex];
      try {
        const url = await generateAudio(text, languageCode, undefined, true);
        if (!url || !mounted) return;

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: true }
        );
        
        if (!mounted) {
          await newSound.unloadAsync().catch(() => {});
          return;
        }

        activeSound = newSound;

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            // Fact finished
          }
        });
      } catch (e) {
        console.debug('Fun fact audio playback failed', e);
      }
    };

    playFact();

    return () => {
      mounted = false;
      if (activeSound) {
        activeSound.unloadAsync().catch(() => {});
      }
    };
  }, [funFactIndex, languageCode]);

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
