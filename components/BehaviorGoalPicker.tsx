import { BEHAVIOR_CATEGORIES, BEHAVIOR_GOALS } from '@/constants/behaviorGoals';
import { BORDER_RADIUS, BREAKPOINTS, FONTS, SHADOWS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface Props {
  selectedGoal: string | null;
  onSelect: (goalId: string | null) => void;
  isPremium: boolean;
}

export function BehaviorGoalPicker({ selectedGoal, onSelect, isPremium }: Readonly<Props>) {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  const [activeCategory, setActiveCategory] = useState(BEHAVIOR_CATEGORIES[0].id);

  const { width: winWidth } = useWindowDimensions();
  const isTablet = winWidth >= BREAKPOINTS.tablet;

  const visibleGoals = useMemo(() => {
    const scoped = BEHAVIOR_GOALS.filter(g => g.category === activeCategory);
    return scoped;
  }, [activeCategory]);

  const isLocked = (goalId: string) => !isPremium && BEHAVIOR_GOALS.findIndex(g => g.id === goalId) >= 4;

  // Responsive sizing — derived once per render, not recreated in StyleSheet
  const tabTextSize   = isTablet ? 16 : 13;
  const tabEmojiSize  = isTablet ? 18 : 14;
  const tabPadH       = isTablet ? 20 : SPACING.md;
  const tabPadV       = isTablet ? 14 : 10;
  const cardPad       = isTablet ? SPACING.xl : SPACING.md;
  const emojiSize     = isTablet ? 32 : 22;
  const labelSize     = isTablet ? 19 : 16;
  const descSize      = isTablet ? 14 : 12;
  const lockIconSize  = isTablet ? 18 : 14;
  const gridGap       = isTablet ? SPACING.md : SPACING.sm;

  return (
    <Animated.View entering={FadeInDown.delay(100).springify()}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.tabRow, { gap: gridGap }]}>
        {BEHAVIOR_CATEGORIES.map(cat => {
          const selected = cat.id === activeCategory;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setActiveCategory(cat.id)}
              style={[
                styles.tab,
                {
                  backgroundColor: selected ? colors.primary + '15' : colors.cardBackground,
                  borderColor: selected ? colors.primary : colors.text.light + '20',
                  paddingHorizontal: tabPadH,
                  paddingVertical: tabPadV,
                },
              ]}
            >
              <Text style={[styles.tabEmoji, { fontSize: tabEmojiSize }]}>{cat.emoji}</Text>
              <Text style={[styles.tabText, { color: selected ? colors.primary : colors.text.secondary, fontSize: tabTextSize }]}>{cat.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.grid, { gap: gridGap }]}>
        {visibleGoals.map(goal => {
          const locked = isLocked(goal.id);
          const selected = selectedGoal === goal.id;
          const CardInner = (
            <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: selected ? 'transparent' : colors.text.light + '20', padding: cardPad }]}>
              <View style={styles.cardTop}>
                <Text style={{ fontSize: emojiSize }}>{goal.emoji}</Text>
                {locked && <Lock size={lockIconSize} color={colors.text.light} />}
              </View>
              <Text style={[styles.label, { color: colors.text.primary, fontSize: labelSize }]}>{goal.label}</Text>
              <Text style={[styles.desc, { color: colors.text.secondary, fontSize: descSize }]}>{goal.description}</Text>
            </View>
          );

          return (
            <TouchableOpacity key={goal.id} disabled={locked} onPress={() => onSelect(selected ? null : goal.id)} activeOpacity={0.8} style={styles.cardWrap}>
              {selected ? (
                <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.gradientBorder}>
                  {CardInner}
                </LinearGradient>
              ) : CardInner}
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tabRow: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: BORDER_RADIUS.round },
  tabEmoji: {},
  tabText: { fontFamily: FONTS.semibold },
  grid: { paddingHorizontal: SPACING.lg },
  cardWrap: { borderRadius: BORDER_RADIUS.lg },
  gradientBorder: { borderRadius: BORDER_RADIUS.lg, padding: 2 },
  card: { borderRadius: BORDER_RADIUS.lg, borderWidth: 1.5, ...SHADOWS.xs },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontFamily: FONTS.bold, marginTop: SPACING.xs },
  desc: { fontFamily: FONTS.medium, marginTop: 4 },
});
