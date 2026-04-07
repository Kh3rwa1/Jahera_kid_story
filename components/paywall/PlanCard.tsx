import { BORDER_RADIUS, FONTS, SHADOWS } from '@/constants/theme';
import { Plan } from '@/hooks/usePurchase';
import { ThemeColors } from '@/types/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Check } from 'lucide-react-native';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

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

export function PlanCard({ plan, selected, onSelect, colors }: Readonly<PlanCardProps>) {
  const scale = useSharedValue(1);
  const isBestValue = plan.id === 'yearly';

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

  if (isBestValue) {
    return (
      <Animated.View style={animStyle}>
        <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
          <LinearGradient
            colors={['#FF5C00', '#FF9F0A']}
            style={[styles.card, styles.bestValueCard, selected && styles.selectedBestValue]}
          >
            <View style={styles.featuredPlanBadgeRow}>
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredBadgeText}>BEST VALUE</Text>
              </View>
              {plan.save && (
                <View style={[styles.saveBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text style={[styles.saveBadgeText, { color: '#FFF' }]}>{plan.save}</Text>
                </View>
              )}
            </View>
            <PlanInfo plan={plan} selected={selected} colors={colors} featured />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        style={[
          styles.card,
          { backgroundColor: colors.cardBackground, borderColor: selected ? colors.primary : colors.text.light + '15' },
          selected && styles.selectedCard,
        ]}
      >
        <PlanInfo plan={plan} selected={selected} colors={colors} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.xl,
    padding: 16,
    borderWidth: 2,
    marginBottom: 12,
    ...SHADOWS.sm,
  },
  selectedCard: {
    ...SHADOWS.md,
  },
  bestValueCard: {
    borderColor: 'transparent',
    ...SHADOWS.lg,
  },
  selectedBestValue: {
    borderWidth: 2,
    borderColor: '#FFF',
  },
  planInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planLabel: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    marginBottom: 4,
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
