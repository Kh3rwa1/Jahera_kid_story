import { BEHAVIOR_CATEGORIES, BEHAVIOR_GOALS } from '@/constants/behaviorGoals';
import { BORDER_RADIUS, FONTS, SHADOWS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

  const visibleGoals = useMemo(() => {
    const scoped = BEHAVIOR_GOALS.filter(g => g.category === activeCategory);
    return scoped;
  }, [activeCategory]);

  const isLocked = (goalId: string) => !isPremium && BEHAVIOR_GOALS.findIndex(g => g.id === goalId) >= 4;

  return (
    <Animated.View entering={FadeInDown.delay(100).springify()}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
        {BEHAVIOR_CATEGORIES.map(cat => {
          const selected = cat.id === activeCategory;
          return (
            <TouchableOpacity key={cat.id} onPress={() => setActiveCategory(cat.id)} style={[styles.tab, { backgroundColor: selected ? colors.primary + '15' : colors.cardBackground, borderColor: selected ? colors.primary : colors.text.light + '20' }]}>
              <Text style={styles.tabEmoji}>{cat.emoji}</Text>
              <Text style={[styles.tabText, { color: selected ? colors.primary : colors.text.secondary }]}>{cat.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.grid}>
        {visibleGoals.map(goal => {
          const locked = isLocked(goal.id);
          const selected = selectedGoal === goal.id;
          const CardInner = (
            <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: selected ? 'transparent' : colors.text.light + '20' }]}>
              <View style={styles.cardTop}>
                <Text style={styles.emoji}>{goal.emoji}</Text>
                {locked && <Lock size={14} color={colors.text.light} />}
              </View>
              <Text style={[styles.label, { color: colors.text.primary }]}>{goal.label}</Text>
              <Text style={[styles.desc, { color: colors.text.secondary }]}>{goal.description}</Text>
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
  tabRow: { gap: SPACING.sm, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: BORDER_RADIUS.round, paddingHorizontal: SPACING.md, paddingVertical: 10 },
  tabEmoji: { fontSize: 14 },
  tabText: { fontFamily: FONTS.semibold, fontSize: 13 },
  grid: { gap: SPACING.sm, paddingHorizontal: SPACING.lg },
  cardWrap: { borderRadius: BORDER_RADIUS.lg },
  gradientBorder: { borderRadius: BORDER_RADIUS.lg, padding: 2 },
  card: { borderRadius: BORDER_RADIUS.lg, borderWidth: 1.5, padding: SPACING.md, ...SHADOWS.xs },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emoji: { fontSize: 22 },
  label: { fontFamily: FONTS.bold, fontSize: 16, marginTop: SPACING.xs },
  desc: { fontFamily: FONTS.medium, fontSize: 12, marginTop: 4 },
});
