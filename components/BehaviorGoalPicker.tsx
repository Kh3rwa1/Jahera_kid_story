import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock } from 'lucide-react-native';

import { BEHAVIOR_CATEGORIES, BEHAVIOR_GOALS } from '@/constants/behaviorGoals';
import { BORDER_RADIUS, FONTS, SHADOWS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { analytics } from '@/services/analyticsService';

interface BehaviorGoalPickerProps {
  selectedGoal: string | null;
  onSelect: (goalId: string | null) => void;
  isPremium: boolean;
}

type GoalCategory = {
  id: string;
  label: string;
};

export const BehaviorGoalPicker = ({ selectedGoal, onSelect, isPremium }: Readonly<BehaviorGoalPickerProps>) => {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const normalizedCategories = useMemo<GoalCategory[]>(() => {
    const baseCategories = BEHAVIOR_CATEGORIES.map((category) => {
      if (typeof category === 'string') {
        return { id: category, label: category };
      }

      return {
        id: String(category.id),
        label: String(category.label),
      };
    });

    const hasAll = baseCategories.some((category) => category.id.toLowerCase() === 'all' || category.label.toLowerCase() === 'all');

    if (hasAll) {
      return baseCategories;
    }

    return [{ id: 'all', label: 'All' }, ...baseCategories];
  }, []);

  const [activeCategory, setActiveCategory] = useState<string>(normalizedCategories[0]?.id ?? 'all');

  const filteredGoals = useMemo(() => {
    const active = normalizedCategories.find((category) => category.id === activeCategory);
    const activeLabel = active?.label ?? 'All';

    if (activeCategory.toLowerCase() === 'all' || activeLabel.toLowerCase() === 'all') {
      return BEHAVIOR_GOALS;
    }

    return BEHAVIOR_GOALS.filter((goal) => {
      const normalizedGoalCategory = goal.category.toLowerCase();
      return normalizedGoalCategory === activeCategory.toLowerCase() || normalizedGoalCategory === activeLabel.toLowerCase();
    });
  }, [activeCategory, normalizedCategories]);

  const sectionTitleSize = isTablet ? 22 : 18;
  const sectionSubtitleSize = isTablet ? 15 : 13;
  const cardWidth = isTablet ? 180 : 140;
  const cardPadding = isTablet ? SPACING.xl : SPACING.md;
  const cardGap = isTablet ? 16 : 12;
  const cardEmojiSize = isTablet ? 40 : 28;
  const cardTitleSize = isTablet ? 17 : 14;
  const cardDescSize = isTablet ? 14 : 12;
  const lockSize = isTablet ? 20 : 16;

  const onPressCategory = async (categoryId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveCategory(categoryId);
  };

  const onPressGoal = async (goalId: string, isLocked: boolean) => {
    if (isLocked) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const nextGoalId = selectedGoal === goalId ? null : goalId;
    onSelect(nextGoalId);

    if (nextGoalId) {
      const goal = BEHAVIOR_GOALS.find((item) => item.id === nextGoalId);
      if (goal) {
        analytics.trackBehaviorGoalSelected(goal.id, goal.label, goal.category);
      }
    }
  };

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          marginBottom: SPACING.lg,
        },
        title: {
          fontFamily: FONTS.bold,
          fontSize: sectionTitleSize,
          color: colors.text.primary,
          marginBottom: SPACING.xs,
        },
        subtitle: {
          fontFamily: FONTS.regular,
          fontSize: sectionSubtitleSize,
          color: colors.text.secondary,
        },
        categoryPill: {
          borderRadius: BORDER_RADIUS.round,
          paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
          paddingVertical: isTablet ? SPACING.sm + 2 : SPACING.sm,
          marginRight: 8,
        },
        categoryPillText: {
          fontFamily: FONTS.semibold,
          fontSize: isTablet ? 15 : 13,
        },
        cardsContent: {
          paddingHorizontal: SPACING.lg,
          paddingBottom: SPACING.xs,
        },
        cardWrap: {
          marginRight: cardGap,
        },
        cardTouchable: {
          width: cardWidth,
          borderRadius: BORDER_RADIUS.xl,
          borderWidth: 2,
          overflow: 'hidden',
          ...SHADOWS.md,
        },
        cardInner: {
          padding: cardPadding,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: isTablet ? 190 : 160,
        },
        cardEmoji: {
          fontSize: cardEmojiSize,
          textAlign: 'center',
          marginBottom: SPACING.sm,
        },
        cardLabel: {
          fontFamily: FONTS.semibold,
          fontSize: cardTitleSize,
          color: colors.text.primary,
          textAlign: 'center',
          marginBottom: SPACING.xs,
        },
        cardDescription: {
          fontFamily: FONTS.regular,
          fontSize: cardDescSize,
          color: colors.text.secondary,
          textAlign: 'center',
        },
        lockBadge: {
          position: 'absolute',
          right: isTablet ? 10 : 8,
          top: isTablet ? 10 : 8,
          zIndex: 2,
        },
      }),
    [
      cardDescSize,
      cardEmojiSize,
      cardGap,
      cardPadding,
      cardTitleSize,
      cardWidth,
      colors.text.primary,
      colors.text.secondary,
      isTablet,
      lockSize,
      sectionSubtitleSize,
      sectionTitleSize,
    ],
  );

  return (
    <View style={dynamicStyles.section}>
      <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.headerWrap}>
        <Text style={dynamicStyles.title}>🎯 What should today&apos;s story teach?</Text>
        <Text style={dynamicStyles.subtitle}>Pick a learning goal for the story</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContent}
        >
          {normalizedCategories.map((category) => {
            const isActive = category.id === activeCategory;

            return (
              <TouchableOpacity
                key={category.id}
                activeOpacity={0.85}
                onPress={() => void onPressCategory(category.id)}
                style={[
                  dynamicStyles.categoryPill,
                  {
                    backgroundColor: isActive ? colors.primary : colors.cardBackground,
                  },
                ]}
              >
                <Text
                  style={[
                    dynamicStyles.categoryPillText,
                    {
                      color: isActive ? '#FFFFFF' : colors.text.primary,
                    },
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={dynamicStyles.cardsContent}
      >
        {filteredGoals.map((goal, index) => {
          const isSelected = selectedGoal === goal.id;
          const isLocked = !isPremium && index >= 4;

          return (
            <Animated.View
              key={goal.id}
              entering={FadeInRight.delay(120 + index * 70).springify().damping(14)}
              style={dynamicStyles.cardWrap}
            >
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => void onPressGoal(goal.id, isLocked)}
                style={[
                  dynamicStyles.cardTouchable,
                  {
                    borderColor: isSelected ? colors.primary : 'transparent',
                    opacity: isLocked ? 0.5 : 1,
                    backgroundColor: colors.cardBackground,
                  },
                ]}
              >
                {isSelected ? (
                  <LinearGradient
                    colors={[`${colors.primary}20`, `${colors.primary}08`]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={dynamicStyles.cardInner}
                  >
                    {isLocked && (
                      <View style={dynamicStyles.lockBadge}>
                        <Lock size={lockSize} color={colors.text.primary} />
                      </View>
                    )}
                    <Text style={dynamicStyles.cardEmoji}>{goal.emoji}</Text>
                    <Text style={dynamicStyles.cardLabel} numberOfLines={2}>
                      {goal.label}
                    </Text>
                    <Text style={dynamicStyles.cardDescription}>{goal.description}</Text>
                  </LinearGradient>
                ) : (
                  <View style={dynamicStyles.cardInner}>
                    {isLocked && (
                      <View style={dynamicStyles.lockBadge}>
                        <Lock size={lockSize} color={colors.text.primary} />
                      </View>
                    )}
                    <Text style={dynamicStyles.cardEmoji}>{goal.emoji}</Text>
                    <Text style={dynamicStyles.cardLabel} numberOfLines={2}>
                      {goal.label}
                    </Text>
                    <Text style={dynamicStyles.cardDescription}>{goal.description}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrap: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  categoryContent: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
});

export default BehaviorGoalPicker;
