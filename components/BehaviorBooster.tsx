import React, { memo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Sparkles, ArrowRight } from 'lucide-react-native';
import { BEHAVIOR_GOALS, BehaviorGoal } from '@/constants/behaviorGoals';
import { FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ensureLottieAsset, getAppwriteLottieUrl } from '@/services/lottieService';
import { logger } from '@/utils/logger';

interface BehaviorBoosterProps {
  colors: any;
  profileId?: string;
  languageCode?: string;
}

const BoosterCard = memo(({
  goal,
  colors,
  onPress,
  index,
}: {
  goal: BehaviorGoal;
  colors: any;
  onPress: () => void;
  index: number;
}) => {
  const [lottieSource, setLottieSource] = useState<any | null>(null);
  const [lottieError, setLottieError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const scale = useSharedValue(1);

  // Resolve Asset Source (Appwrite ID takes priority over static URL)
  useEffect(() => {
    let isMounted = true;

    async function resolveAsset() {
      // 1. Try Appwrite first
      const appwriteUrl = getAppwriteLottieUrl(goal.id);
      let source = await ensureLottieAsset(appwriteUrl, goal.id, true);
      
      // 2. Fallback to static lottieUrl if Appwrite fails or returns invalid data
      if (!source && goal.lottieUrl) {
        source = await ensureLottieAsset(goal.lottieUrl, `${goal.id}_static`, false);
      }
      
      if (isMounted) {
        if (source) {
          setLottieSource(source);
          setLottieError(false);
        } else {
          setLottieError(true);
        }
      }
    }

    resolveAsset();
    return () => { isMounted = false; };
  }, [goal]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const onLottieError = useCallback(() => {
    logger.warn(`Lottie render failed for ${goal.label}`);
    setLottieError(true);
  }, [goal]);

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 100).springify().damping(15)}
      style={[styles.cardContainer, animatedStyle]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.cardTouch}
      >
        <LinearGradient
          colors={[colors.cardBackground, colors.background]}
          style={styles.cardGradient}
        >
          <View style={styles.lottieContainer}>
            {(!lottieError && lottieSource) ? (
              <LottieView
                source={lottieSource}
                autoPlay
                loop
                style={styles.lottie}
                onError={onLottieError}
              />
            ) : (
              <View style={styles.fallBackWrap}>
                <Text style={styles.emojiFallback}>{goal.emoji}</Text>
              </View>
            )}
            
            <View style={styles.glowOverlay} />
          </View>

          <View style={styles.content}>
            <View>
              <Text style={[styles.label, { color: colors.text.primary }]}>{goal.label}</Text>
              <Text style={[styles.description, { color: colors.text.secondary }]} numberOfLines={2}>
                {goal.description}
              </Text>
            </View>
            
            <View style={[styles.actionBtn, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.actionText, { color: colors.primary }]}>Grow {goal.label}</Text>
              <Sparkles size={14} color={colors.primary} />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
});

export const BehaviorBooster = ({ colors, profileId, languageCode }: BehaviorBoosterProps) => {
  const router = useRouter();

  const handleGenerate = async (goal: BehaviorGoal) => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push({
      pathname: '/story/generate',
      params: {
        profileId,
        languageCode,
        behaviorGoal: goal.id,
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text.primary }]}>Nature & Habits</Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            Build a beautiful character through magic stories
          </Text>
        </View>
        <TouchableOpacity style={styles.seeAll}>
          <Text style={[styles.seeAllText, { color: colors.primary }]}>Mastery</Text>
          <ArrowRight size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={220 + SPACING.md}
        decelerationRate="fast"
      >
        {BEHAVIOR_GOALS.map((goal, index) => (
          <BoosterCard
            key={goal.id}
            goal={goal}
            colors={colors}
            index={index}
            onPress={() => handleGenerate(goal)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 22,
    fontFamily: FONTS.display,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    opacity: 0.8,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: FONTS.extrabold,
  },
  scrollContent: {
    paddingLeft: SPACING.xl,
    paddingRight: SPACING.md,
    gap: SPACING.md,
    paddingBottom: SPACING.md,
  },
  cardContainer: {
    width: 220,
    height: 280,
    borderRadius: BORDER_RADIUS.xxl,
    ...SHADOWS.md,
    backgroundColor: '#FFF',
  },
  cardTouch: {
    flex: 1,
  },
  cardGradient: {
    flex: 1,
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  lottieContainer: {
    height: 140,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  lottie: {
    width: 180,
    height: 180,
  },
  fallBackWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiFallback: {
    fontSize: 64,
  },
  loaderEmoji: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  description: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    lineHeight: 18,
    marginVertical: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.pill,
    marginTop: 8,
  },
  actionText: {
    fontSize: 13,
    fontFamily: FONTS.extrabold,
  },
});
