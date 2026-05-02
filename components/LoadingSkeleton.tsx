import { BORDER_RADIUS, SPACING } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
  color?: string;
  shimmerColor?: string;
}

export const Skeleton = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
  color = '#E8E8E8',
  shimmerColor = 'rgba(255, 255, 255, 0.5)',
}: Readonly<SkeletonProps>) => {
  const { width: winWidth } = useWindowDimensions();
  const shimmerProgress = useSharedValue(-1);

  useEffect(() => {
    shimmerProgress.value = withRepeat(
      withTiming(1, {
        duration: 1800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
      -1,
      false,
    );
  }, [shimmerProgress]);

  const shimmerStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        {
          translateX: interpolate(
            shimmerProgress.value,
            [-1, 1],
            [-winWidth * 0.5, winWidth * 0.8],
          ),
        },
      ],
    };
  });

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: color,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[StyleSheet.absoluteFill, shimmerStyle, { width: '150%' }]}
      >
        <LinearGradient
          colors={['transparent', shimmerColor, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

export const StoryCardSkeleton = ({
  horizontal = true,
}: {
  horizontal?: boolean;
}) => (
  <View style={[styles.storyCard, !horizontal && styles.gridStoryCard]}>
    <Skeleton
      width="100%"
      height={horizontal ? 180 : 160}
      borderRadius={BORDER_RADIUS.xl}
      color="rgba(0,0,0,0.05)"
    />
    <View style={styles.storyCardContent}>
      <Skeleton
        width="90%"
        height={16}
        borderRadius={4}
        style={{ marginBottom: SPACING.sm }}
        color="rgba(0,0,0,0.08)"
      />
      <Skeleton
        width="60%"
        height={12}
        borderRadius={4}
        color="rgba(0,0,0,0.04)"
      />
    </View>
  </View>
);

export const ListItemSkeleton = () => (
  <View style={styles.listItem}>
    <Skeleton
      width={80}
      height={80}
      borderRadius={BORDER_RADIUS.lg}
      color="rgba(0,0,0,0.06)"
    />
    <View style={styles.listItemContent}>
      <Skeleton
        width="75%"
        height={16}
        borderRadius={4}
        style={{ marginBottom: SPACING.xs }}
        color="rgba(0,0,0,0.08)"
      />
      <Skeleton
        width="45%"
        height={12}
        borderRadius={4}
        color="rgba(0,0,0,0.04)"
      />
    </View>
  </View>
);

export const HeroSkeleton = () => (
  <View style={styles.heroSkeleton}>
    <View style={styles.heroTop}>
      <Skeleton
        width={100}
        height={100}
        borderRadius={50}
        color="rgba(0,0,0,0.08)"
      />
      <View style={{ flex: 1, gap: 12 }}>
        <Skeleton
          width="90%"
          height={32}
          borderRadius={8}
          color="rgba(0,0,0,0.1)"
        />
        <Skeleton
          width="50%"
          height={24}
          borderRadius={12}
          color="rgba(0,0,0,0.06)"
        />
      </View>
    </View>
    <View style={styles.heroStatsRow}>
      <Skeleton
        width="28%"
        height={60}
        borderRadius={16}
        color="rgba(0,0,0,0.05)"
      />
      <Skeleton
        width="28%"
        height={60}
        borderRadius={16}
        color="rgba(0,0,0,0.05)"
      />
      <Skeleton
        width="28%"
        height={60}
        borderRadius={16}
        color="rgba(0,0,0,0.05)"
      />
    </View>
  </View>
);

export const QuickActionSkeleton = () => (
  <View style={styles.quickActionRow}>
    <Skeleton
      width="48%"
      height={80}
      borderRadius={20}
      color="rgba(0,0,0,0.05)"
    />
    <Skeleton
      width="48%"
      height={80}
      borderRadius={20}
      color="rgba(0,0,0,0.05)"
    />
  </View>
);

export const StatCardSkeleton = () => (
  <View style={styles.statCard}>
    <Skeleton
      width={44}
      height={44}
      borderRadius={22}
      style={{ marginBottom: 12 }}
      color="rgba(0,0,0,0.08)"
    />
    <Skeleton
      width={60}
      height={24}
      style={{ marginBottom: 4 }}
      color="rgba(0,0,0,0.1)"
    />
    <Skeleton width={40} height={12} color="rgba(0,0,0,0.05)" />
  </View>
);

interface LoadingSkeletonProps {
  type?:
    | 'card'
    | 'list'
    | 'profile'
    | 'hero'
    | 'grid'
    | 'quick-actions'
    | 'stats';
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  type = 'card',
  count = 3,
}) => {
  const renderItem = () => {
    switch (type) {
      case 'list':
        return <ListItemSkeleton />;
      case 'hero':
        return <HeroSkeleton />;
      case 'quick-actions':
        return <QuickActionSkeleton />;
      case 'stats':
        return <StatCardSkeleton />;
      case 'grid':
        return <StoryCardSkeleton horizontal={false} />;
      case 'card':
      default:
        return <StoryCardSkeleton />;
    }
  };

  return (
    <View
      style={
        type === 'grid' || type === 'stats' ? styles.gridRow : styles.column
      }
    >
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={`${type}-${index}`}
          style={type === 'grid' ? { width: '48%', marginBottom: 16 } : null}
        >
          {renderItem()}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  column: { width: '100%' },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  storyCard: {
    width: 220,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    marginRight: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  gridStoryCard: {
    width: '100%',
    marginRight: 0,
  },
  storyCardContent: {
    padding: SPACING.md,
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.4)',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  listItemContent: {
    flex: 1,
    marginLeft: SPACING.lg,
    justifyContent: 'center',
  },
  heroSkeleton: {
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: BORDER_RADIUS.xxl + 8,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 20,
  },
  quickActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
});
