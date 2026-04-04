import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export const Skeleton = ({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) => {
  const { width: winWidth } = useWindowDimensions();
  const shimmerProgress = useSharedValue(-1);

  useEffect(() => {
    shimmerProgress.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { translateX: interpolate(shimmerProgress.value, [-1, 1], [-winWidth, winWidth]) },
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
          backgroundColor: '#E8E8E8',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, shimmerStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255, 255, 255, 0.5)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

export const StoryCardSkeleton = () => (
  <View style={styles.storyCard}>
    <Skeleton width="100%" height={180} borderRadius={BORDER_RADIUS.xl} />
    <View style={styles.storyCardContent}>
      <Skeleton width="80%" height={16} style={{ marginBottom: SPACING.sm }} />
      <Skeleton width="60%" height={14} />
    </View>
  </View>
);

export const ListItemSkeleton = () => (
  <View style={styles.listItem}>
    <Skeleton width={80} height={80} borderRadius={BORDER_RADIUS.lg} />
    <View style={styles.listItemContent}>
      <Skeleton width="70%" height={16} style={{ marginBottom: SPACING.xs }} />
      <Skeleton width="50%" height={14} />
    </View>
  </View>
);

export const ProfileCardSkeleton = () => (
  <View style={styles.profileCard}>
    <Skeleton width={80} height={80} borderRadius={40} style={{ marginBottom: SPACING.lg }} />
    <Skeleton width={120} height={24} style={{ marginBottom: SPACING.xs }} />
    <Skeleton width={80} height={16} />
  </View>
);

interface LoadingSkeletonProps {
  type?: 'card' | 'list' | 'profile';
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type = 'card', count = 3 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'list':
        return <ListItemSkeleton />;
      case 'profile':
        return <ProfileCardSkeleton />;
      case 'card':
      default:
        return <StoryCardSkeleton />;
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index}>{renderSkeleton()}</View>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  storyCard: {
    width: 140,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    marginRight: SPACING.lg,
  },
  storyCardContent: {
    padding: SPACING.md,
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
  listItemContent: {
    flex: 1,
    marginLeft: SPACING.lg,
    justifyContent: 'center',
  },
  profileCard: {
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.xxl,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
  },
});
