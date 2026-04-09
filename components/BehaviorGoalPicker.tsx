import React, { useMemo, useState, useEffect, useRef, memo } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View, Platform, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock } from 'lucide-react-native';
import LottieView from 'lottie-react-native';

import { BEHAVIOR_CATEGORIES, BEHAVIOR_GOALS, BehaviorGoal } from '@/constants/behaviorGoals';
import { BORDER_RADIUS, FONTS, SHADOWS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { analytics } from '@/services/analyticsService';
import { ensureLottieAsset, getAppwriteLottieUrl } from '@/services/lottieService';

interface BehaviorGoalPickerProps {
  selectedGoal: string | null;
  onSelect: (goalId: string | null) => void;
  isPremium: boolean;
}

const LOOP_FACTOR = 3; 

const GoalCard = memo(({ 
  goal, 
  isSelected, 
  isLocked, 
  colors, 
  isTablet, 
  onPress 
}: { 
  goal: BehaviorGoal; 
  isSelected: boolean; 
  isLocked: boolean;
  colors: Record<string, any>;
  isTablet: boolean;
  onPress: () => void;
}) => {
  const [lottieSource, setLottieSource] = useState<any | null>(null);
  const [lottieError, setLottieError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function resolveAsset() {
      const appwriteUrl = getAppwriteLottieUrl(goal.id);
      const source = await ensureLottieAsset(appwriteUrl, goal.id, false);
      if (isMounted) {
        if (source) setLottieSource(source);
        else setLottieError(true);
      }
    }
    resolveAsset();
    return () => { isMounted = false; };
  }, [goal.id]);

  const cardWidth = isTablet ? 180 : 140;
  const cardPadding = isTablet ? SPACING.xl : SPACING.md;
  const cardEmojiSize = isTablet ? 40 : 28;
  const cardTitleSize = isTablet ? 17 : 14;
  const cardDescSize = isTablet ? 14 : 12;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[
        styles.cardTouchable,
        {
          width: cardWidth,
          borderColor: isSelected ? colors.primary : 'transparent',
          opacity: isLocked ? 0.5 : 1,
          backgroundColor: colors.cardBackground,
        },
      ]}
    >
      <View style={[styles.cardInner, { padding: cardPadding, minHeight: isTablet ? 200 : 160 }]}>
        {isLocked && (
          <View style={styles.lockBadge}>
            <Lock size={16} color={colors.text.primary} />
          </View>
        )}
        
        <View style={styles.lottieWrap}>
          {!lottieError && lottieSource ? (
            <LottieView
              source={lottieSource}
              autoPlay
              loop
              style={{ width: cardEmojiSize * 2.5, height: cardEmojiSize * 2.5 }}
            />
          ) : (
            <Text style={[styles.cardEmoji, { fontSize: cardEmojiSize }]}>{goal.emoji}</Text>
          )}
        </View>

        <Text style={[styles.cardLabel, { fontSize: cardTitleSize, color: colors.text.primary }]} numberOfLines={2}>
          {goal.label}
        </Text>
        <Text style={[styles.cardDescription, { fontSize: cardDescSize, color: colors.text.secondary }]}>
          {goal.description}
        </Text>
      </View>
      {isSelected && (
        <LinearGradient
          colors={[`${colors.primary}20`, `${colors.primary}08`]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}
    </TouchableOpacity>
  );
});

GoalCard.displayName = 'GoalCard';

export const BehaviorGoalPicker = ({ selectedGoal, onSelect, isPremium }: Readonly<BehaviorGoalPickerProps>) => {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const flatListRef = useRef<FlatList>(null);

  const normalizedCategories = useMemo(() => {
    const base = BEHAVIOR_CATEGORIES.map(c => typeof c === 'string' ? { id: c, label: c } : { id: String(c.id), label: String(c.label) });
    return base.some(c => c.id.toLowerCase() === 'all') ? base : [{ id: 'all', label: 'All' }, ...base];
  }, []);

  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredGoals = useMemo(() => {
    if (activeCategory === 'all') return BEHAVIOR_GOALS;
    return BEHAVIOR_GOALS.filter(g => g.category.toLowerCase() === activeCategory.toLowerCase());
  }, [activeCategory]);

  const loopedData = useMemo(() => {
    return Array(LOOP_FACTOR).fill(filteredGoals).flat();
  }, [filteredGoals]);

  const cardWidth = isTablet ? 180 : 140;
  const cardGap = 12;
  const itemWidth = cardWidth + cardGap;

  useEffect(() => {
    if (loopedData.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({
          offset: filteredGoals.length * itemWidth,
          animated: false,
        });
      }, 100);
    }
  }, [filteredGoals.length, itemWidth, loopedData.length]);

  const handleInfiniteScroll = (offset: number) => {
    const totalContentWidth = filteredGoals.length * itemWidth;
    if (offset <= 0 || offset >= totalContentWidth * 2) {
      flatListRef.current?.scrollToOffset({ offset: totalContentWidth, animated: false });
    }
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
      if (goal) analytics.trackBehaviorGoalSelected(goal.id, goal.label, goal.category);
    }
  };

  return (
    <View style={styles.section}>
      <Animated.View entering={FadeInDown.delay(50).springify().damping(18).stiffness(90)}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryContent}>
          {normalizedCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              activeOpacity={0.85}
              onPress={() => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveCategory(category.id); }}
              style={[styles.categoryPill, { backgroundColor: activeCategory === category.id ? colors.primary : colors.cardBackground }]}
            >
              <Text style={[styles.categoryPillText, { color: activeCategory === category.id ? '#FFFFFF' : colors.text.primary }]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      <FlatList
        ref={flatListRef}
        data={loopedData}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => index.toString()}
        snapToInterval={itemWidth}
        decelerationRate="fast"
        contentContainerStyle={styles.cardsContent}
        onScroll={(e) => handleInfiniteScroll(e.nativeEvent.contentOffset.x)}
        scrollEventThrottle={16}
        renderItem={({ item: goal, index }) => (
          <View style={{ marginRight: cardGap }}>
            <GoalCard
              goal={goal}
              isSelected={selectedGoal === goal.id}
              isLocked={!isPremium && (index % filteredGoals.length) >= 4}
              colors={colors}
              isTablet={isTablet}
              onPress={() => void onPressGoal(goal.id, !isPremium && (index % filteredGoals.length) >= 4)}
            />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: { paddingVertical: SPACING.md },
  categoryContent: { paddingHorizontal: 24, marginBottom: 16 },
  categoryPill: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8 },
  categoryPillText: { fontFamily: FONTS.semibold, fontSize: 13 },
  cardsContent: { paddingHorizontal: 24 },
  cardTouchable: { borderRadius: BORDER_RADIUS.xl, borderWidth: 2, overflow: 'hidden', ...SHADOWS.md },
  cardInner: { alignItems: 'center', justifyContent: 'center' },
  lottieWrap: { height: 64, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  cardEmoji: { textAlign: 'center' },
  cardLabel: { fontFamily: FONTS.semibold, textAlign: 'center', marginBottom: 4 },
  cardDescription: { fontFamily: FONTS.regular, textAlign: 'center', paddingHorizontal: 8 },
  lockBadge: { position: 'absolute', right: 8, top: 8, zIndex: 2 },
});

export default BehaviorGoalPicker;
