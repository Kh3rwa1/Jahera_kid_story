import { FONTS,SPACING } from '@/constants/theme';
import { ThemeColors } from '@/types/theme';
import { BookOpen,Clock,Headphones,Sparkles,Users } from 'lucide-react-native';
import React from 'react';
import {
StyleSheet,
Text,
View,
} from 'react-native';

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

const PREMIUM_FEATURES: Feature[] = [
  {
    icon: Sparkles,
    title: 'Unlimited Magic Stories',
    description: 'Create as many unique adventures as you want.',
    color: '#FF8C42',
  },
  {
    icon: Headphones,
    title: 'Premium Narration',
    description: 'High-quality AI voices that bring stories to life.',
    color: '#8B5CF6',
  },
  {
    icon: BookOpen,
    title: 'Educational Quizzes',
    description: 'Interactive learning after every single story.',
    color: '#10B981',
  },
  {
    icon: Users,
    title: 'Family Sharing',
    description: 'Up to 5 family members on the same plan.',
    color: '#0EA5E9',
  },
  {
    icon: Clock,
    title: 'No Waiting Time',
    description: 'Instant story generation & ad-free experience.',
    color: '#EC4899',
  },
];

export function FeatureList({ colors }: { colors: ThemeColors }) {
  return (
    <View style={styles.container}>
      {PREMIUM_FEATURES.map((feature, index) => (
        <View key={index} style={styles.featureItem}>
          <View style={[styles.iconContainer, { backgroundColor: feature.color + '15' }]}>
            <feature.icon size={22} color={feature.color} strokeWidth={2.5} />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.featureTitle, { color: colors.text.primary }]}>
              {feature.title}
            </Text>
            <Text style={[styles.featureDescription, { color: colors.text.light }]}>
              {feature.description}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    gap: 20,
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    lineHeight: 20,
  },
});
