import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export const Skeleton = ({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#E0E0E0',
          opacity,
        },
        style,
      ]}
    />
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
