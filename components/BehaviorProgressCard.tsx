import { BORDER_RADIUS, FONTS, SHADOWS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { analytics } from '@/services/analyticsService';
import { BehaviorProgressItem, computeBehaviorProgress } from '@/utils/behaviorProgress';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View, Platform } from 'react-native';
import Animated, { 
  FadeInDown, 
  FadeInRight, 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  withDelay,
  Easing
} from 'react-native-reanimated';

interface BehaviorProgressCardProps {
  stories?: { behavior_goal?: string | null; created_at?: string | null }[] ;
  progress?: BehaviorProgressItem[];
  compact?: boolean;
}

interface ProgressRowProps {
  goalId: string;
  label: string;
  emoji: string;
  count: number;
  percentage: number;
  index: number;
  primaryColor: string;
  isTablet: boolean;
  mutedTextColor: string;
  barTrackColor: string;
  colors: any;
}

function ProgressRow({
  label,
  emoji,
  count,
  percentage,
  index,
  primaryColor,
  isTablet,
  mutedTextColor,
  barTrackColor,
  colors,
}: Readonly<ProgressRowProps>): React.ReactElement {
  const barWidth = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    barWidth.value = withDelay(
      300 + index * 100,
      withTiming(percentage, { duration: 1200, easing: Easing.out(Easing.exp) })
    );
    glowOpacity.value = withDelay(
      1500 + index * 100,
      withTiming(1, { duration: 800 })
    );
  }, [percentage, barWidth, glowOpacity, index]);

  const animatedBarStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%`,
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value * 0.5,
  }));

  return (
    <Animated.View entering={FadeInRight.delay(100 + index * 60).springify().damping(14)}>
      <View style={[styles.row, index > -1 && styles.rowSpacing]}>
        <View style={styles.emojiContainer}>
          <Text style={[styles.emoji, { fontSize: isTablet ? 24 : 18 }]}>{emoji}</Text>
        </View>

        <View style={styles.middle}>
          <View style={styles.rowTop}>
            <Text style={[styles.label, { fontSize: isTablet ? 15 : 13, color: colors.text.primary }]}>{label}</Text>
            <Text style={[styles.count, { color: mutedTextColor, fontSize: isTablet ? 12 : 11 }]}>{count} levels</Text>
          </View>

          <View style={[styles.progressOuter, { backgroundColor: barTrackColor }]}>
            <Animated.View style={[styles.progressInner, { backgroundColor: primaryColor }, animatedBarStyle]}>
              <LinearGradient
                colors={['rgba(255,255,255,0.4)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Animated.View style={[styles.barGlow, animatedGlowStyle]} />
            </Animated.View>
          </View>
        </View>

        <View style={styles.percentContainer}>
          <Text style={[styles.percentage, { color: primaryColor, fontSize: isTablet ? 14 : 12 }]}>
            {percentage}%
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

export function BehaviorProgressCard({ 
  stories = [], 
  progress: progressProp,
  compact = false 
}: Readonly<BehaviorProgressCardProps>): React.ReactElement {
  const { currentTheme } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const progress: BehaviorProgressItem[] = useMemo(
    () => progressProp ?? computeBehaviorProgress(stories as never, 30),
    [progressProp, stories]
  );

  const colors = currentTheme.colors;
  const primaryColor = colors.primary;
  const cardBackground = colors.cardBackground ?? '#FFFFFF';
  const mutedTextColor = colors.text.secondary;
  const barTrackColor = `${colors.text.light}15` || '#F0F0F0';

  useEffect(() => {
    if (progress.length > 0) {
      analytics.trackBehaviorProgressViewed(progress.length, progress[0]?.label || null);
    }
  }, [progress]);

  if (progress.length === 0 && compact) return <View />;

  return (
    <View style={styles.section}>
      {!compact && (
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <View style={styles.headerRow}>
             <View style={styles.headerIconWrap}>
                <LinearGradient colors={[primaryColor, colors.primaryDark]} style={styles.headerIcon}>
                    <Text style={{ fontSize: 14 }}>📈</Text>
                </LinearGradient>
             </View>
             <View>
                <Text style={[styles.headerTitle, { fontSize: isTablet ? 20 : 17, color: colors.text.primary }]}>Growth Journey</Text>
                <Text style={[styles.headerSubtitle, { fontSize: isTablet ? 13 : 12, color: mutedTextColor }]}>Tracking character development</Text>
             </View>
          </View>
        </Animated.View>
      )}

      {progress.length === 0 ? (
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={[styles.emptyCard, { backgroundColor: cardBackground, borderColor: colors.text.light + '20' }]}
        >
          <Text style={{ fontSize: isTablet ? 52 : 40 }}>🌱</Text>
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>Your Journey Starts Here</Text>
          <Text style={[styles.emptySubtitle, { color: mutedTextColor }]}>
            Generate stories to see how your hero's nature grows over time.
          </Text>
        </Animated.View>
      ) : (
        <View
          style={[
            styles.filledCard,
            {
              backgroundColor: cardBackground + (Platform.OS === 'ios' ? 'CC' : 'FF'),
              padding: isTablet ? SPACING.xl : SPACING.lg,
              borderColor: colors.text.light + '15',
            },
          ]}
        >
          {Platform.OS === 'ios' && (
             <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: BORDER_RADIUS.xxl }]} />
          )}
          
          <LinearGradient
            colors={[`${primaryColor}15`, `${primaryColor}00`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientAccent}
          />

          {progress.slice(0, compact ? 4 : 10).map((item, index) => (
            <View key={item.goalId} style={index < progress.length - 1 ? styles.rowSpacing : undefined}>
              <ProgressRow
                goalId={item.goalId}
                label={item.label}
                emoji={item.emoji}
                count={item.count}
                percentage={item.percentage}
                index={index}
                primaryColor={primaryColor}
                isTablet={isTablet}
                mutedTextColor={mutedTextColor}
                barTrackColor={barTrackColor}
                colors={colors}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: SPACING.md,
  },
  headerIconWrap: {
    padding: 2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.display,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontFamily: FONTS.medium,
    marginTop: -2,
    opacity: 0.7,
  },
  emptyCard: {
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    ...SHADOWS.sm,
  },
  emptyTitle: {
    fontFamily: FONTS.bold,
    marginTop: SPACING.md,
    fontSize: 16,
  },
  emptySubtitle: {
    fontFamily: FONTS.medium,
    textAlign: 'center',
    marginTop: SPACING.xs,
    fontSize: 13,
    maxWidth: 240,
    lineHeight: 18,
  },
  filledCard: {
    borderRadius: BORDER_RADIUS.xxl,
    ...SHADOWS.md,
    overflow: 'hidden',
    borderWidth: 1,
  },
  gradientAccent: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 60,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowSpacing: {
    marginBottom: SPACING.md,
  },
  emojiContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    textAlign: 'center',
  },
  middle: {
    flex: 1,
    marginHorizontal: SPACING.md,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontFamily: FONTS.bold,
    letterSpacing: -0.2,
  },
  count: {
    fontFamily: FONTS.extrabold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressOuter: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressInner: {
    height: '100%',
    borderRadius: 5,
    overflow: 'hidden',
  },
  barGlow: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 20,
    backgroundColor: '#FFF',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  percentContainer: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 45,
    alignItems: 'center',
  },
  percentage: {
    fontFamily: FONTS.extrabold,
  },
});

export default BehaviorProgressCard;
