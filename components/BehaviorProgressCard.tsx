import { BORDER_RADIUS, FONTS, SHADOWS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { analytics } from '@/services/analyticsService';
import { BehaviorProgressItem, computeBehaviorProgress } from '@/utils/behaviorProgress';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

interface BehaviorProgressCardProps {
  stories?: Array<{ behavior_goal?: string | null; created_at?: string | null }> ;
  progress?: BehaviorProgressItem[];
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
}: Readonly<ProgressRowProps>): React.ReactElement {
  return (
    <Animated.View entering={FadeInRight.delay(100 + index * 60).springify().damping(14)}>
      <View style={[styles.row, index > -1 && styles.rowSpacing]}>
        <Text style={[styles.emoji, { fontSize: isTablet ? 28 : 22, width: isTablet ? 44 : 36 }]}>{emoji}</Text>

        <View style={styles.middle}>
          <View style={styles.rowTop}>
            <Text style={[styles.label, { fontSize: isTablet ? 15 : 13 }]}>{label}</Text>
            <Text style={[styles.count, { color: mutedTextColor, fontSize: isTablet ? 14 : 12 }]}>{count} stories</Text>
          </View>

          <View
            style={[
              styles.progressOuter,
              {
                height: isTablet ? 10 : 8,
                borderRadius: isTablet ? 5 : 4,
                backgroundColor: barTrackColor,
              },
            ]}
          >
            <View
              style={[
                styles.progressInner,
                {
                  width: `${percentage}%`,
                  backgroundColor: primaryColor,
                  borderRadius: isTablet ? 5 : 4,
                },
              ]}
            />
          </View>
        </View>

        <Text
          style={[
            styles.percentage,
            {
              color: primaryColor,
              width: isTablet ? 48 : 40,
              fontSize: isTablet ? 14 : 12,
            },
          ]}
        >
          {percentage}%
        </Text>
      </View>
    </Animated.View>
  );
}

export function BehaviorProgressCard({ stories = [], progress: progressProp }: Readonly<BehaviorProgressCardProps>): React.ReactElement {
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
  const barTrackColor = `${colors.text.light}22` || '#F0F0F0';

  useEffect(() => {
    if (progress.length > 0) {
      analytics.trackBehaviorProgressViewed(progress.length, progress[0]?.label || null);
    }
  }, [progress]);

  return (
    <View style={styles.section}>
      <Animated.View entering={FadeInDown.delay(50).springify()}>
        <Text style={[styles.headerTitle, { fontSize: isTablet ? 22 : 18, color: colors.text.primary }]}>📊 Behavior Progress</Text>
        <Text style={[styles.headerSubtitle, { fontSize: isTablet ? 15 : 13, color: mutedTextColor }]}>Last 30 days</Text>
      </Animated.View>

      {progress.length === 0 ? (
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={[styles.emptyCard, { backgroundColor: cardBackground }]}
        >
          <Text style={{ fontSize: isTablet ? 52 : 40 }}>📈</Text>
          <Text style={[styles.emptyTitle, { fontSize: isTablet ? 18 : 16, color: colors.text.primary }]}>No behavior stories yet</Text>
          <Text style={[styles.emptySubtitle, { fontSize: isTablet ? 15 : 13, color: mutedTextColor }]}>
            Start creating stories with learning goals to see your child's progress here!
          </Text>
        </Animated.View>
      ) : (
        <View
          style={[
            styles.filledCard,
            {
              backgroundColor: cardBackground,
              padding: isTablet ? SPACING.xl : SPACING.lg,
            },
          ]}
        >
          <LinearGradient
            colors={[`${primaryColor}12`, `${primaryColor}00`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientAccent}
          />

          {progress.map((item, index) => (
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
  },
  headerTitle: {
    fontFamily: FONTS.bold,
  },
  headerSubtitle: {
    fontFamily: FONTS.regular,
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  emptyCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  emptyTitle: {
    fontFamily: FONTS.semibold,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginTop: SPACING.sm,
    maxWidth: 280,
  },
  filledCard: {
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.md,
    overflow: 'hidden',
  },
  gradientAccent: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 48,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowSpacing: {
    marginBottom: SPACING.md,
  },
  emoji: {
    textAlign: 'center',
  },
  middle: {
    flex: 1,
    marginHorizontal: SPACING.sm,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontFamily: FONTS.medium,
    flex: 1,
    marginRight: SPACING.sm,
  },
  count: {
    fontFamily: FONTS.regular,
  },
  progressOuter: {
    marginTop: 4,
    overflow: 'hidden',
  },
  progressInner: {
    height: '100%',
  },
  percentage: {
    fontFamily: FONTS.semibold,
    textAlign: 'right',
  },
});

export default BehaviorProgressCard;
