import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { Check } from 'lucide-react-native';
import { Plan } from '@/hooks/usePurchase';
import { BORDER_RADIUS, FONTS, SHADOWS } from '@/constants/theme';
import { ThemeColors } from '@/types/theme';

interface PlanCardProps {
  plan: Plan;
  selected: boolean;
  onSelect: () => void;
  colors: ThemeColors;
}

function PlanInfo({ plan, selected, colors, featured }: { plan: Plan; selected: boolean; colors: ThemeColors; featured?: boolean }) {
  return (
    <View style={styles.planInfo}>
      <View>
        <Text style={[styles.planLabel, { color: featured && selected ? "#FFF" : colors.text.primary }]}>
          {plan.label}
        </Text>
        <Text style={[styles.planPeriod, { color: featured && selected ? "rgba(255,255,255,0.8)" : colors.text.light }]}>
          {plan.price} / {plan.period}
        </Text>
      </View>
      <View style={[styles.checkCircle, { backgroundColor: featured ? (selected ? "#FFF" : "rgba(0,0,0,0.05)") : (selected ? colors.primary : "rgba(0,0,0,0.05)") }]}>
        {selected && <Check size={featured ? 14 : 12} color={featured ? "#FF5C00" : "#FFFFFF"} strokeWidth={3} />}
      </View>
    </View>
  );
}

export function PlanCard({ plan, selected, onSelect, colors }: PlanCardProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.97, { damping: 15 }),
      withSpring(1, { damping: 15 })
    );
    onSelect();
  };

  if (plan.isPopular) {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
        <Animated.View style={animStyle}>
          <LinearGradient
            colors={selected ? ['#FF8C42', '#FF5C00'] : [colors.cardBackground, colors.cardBackground]}
            style={[styles.featuredPlanCard, selected && styles.featuredPlanCardSelected]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.featuredPlanBadgeRow}>
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredBadgeText}>BEST VALUE</Text>
              </View>
              {plan.save && (
                <View style={[styles.saveBadge, { backgroundColor: selected ? 'rgba(255, 255, 255, 0.2)' : '#FFEEDB' }]}>
                  <Text style={[styles.saveBadgeText, { color: selected ? '#FFF' : '#FF5C00' }]}>
                    SAVE {plan.save}
                  </Text>
                </View>
              )}
            </View>

            <PlanInfo plan={plan} selected={selected} colors={colors} featured />
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8} style={styles.standardWrapper}>
      <Animated.View
        style={[
          styles.planCard,
          { backgroundColor: colors.cardBackground, borderColor: selected ? colors.primary : 'rgba(0,0,0,0.06)' },
          selected && styles.planCardSelected,
          animStyle,
        ]}
      >
        <PlanInfo plan={plan} selected={selected} colors={colors} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  standardWrapper: {
    marginBottom: 12,
  },
  planCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: 20,
    borderWidth: 2,
    ...SHADOWS.xs,
  },
  planCardSelected: {
    ...SHADOWS.md,
  },
  featuredPlanCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: 20,
    marginBottom: 14,
    ...SHADOWS.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  featuredPlanCardSelected: {
    ...SHADOWS.lg,
  },
  planInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planLabel: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    marginBottom: 2,
  },
  planPeriod: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredPlanBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  featuredBadge: {
    backgroundColor: '#000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featuredBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: FONTS.extrabold,
  },
  saveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  saveBadgeText: {
    fontSize: 11,
    fontFamily: FONTS.extrabold,
  },
});
