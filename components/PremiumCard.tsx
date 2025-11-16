import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import { hapticFeedback } from '@/utils/haptics';

interface PremiumCardProps {
  children: React.ReactNode;
  gradient?: string[];
  onPress?: () => void;
  style?: ViewStyle;
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  padding?: number;
  animated?: boolean;
}

export const PremiumCard: React.FC<PremiumCardProps> = ({
  children,
  gradient,
  onPress,
  style,
  shadow = 'md',
  padding = SPACING.lg,
  animated = true,
}) => {
  const handlePress = () => {
    if (onPress) {
      hapticFeedback.light();
      onPress();
    }
  };

  const shadowStyle = SHADOWS[shadow];
  const cardStyle: ViewStyle = {
    borderRadius: BORDER_RADIUS.xl,
    padding,
    ...shadowStyle,
  };

  if (gradient) {
    if (onPress) {
      return (
        <Pressable
          onPress={handlePress}
          style={({ pressed }) => [
            style,
            {
              transform: [{ scale: pressed && animated ? 0.98 : 1 }],
              opacity: pressed && animated ? 0.9 : 1,
            },
          ]}
        >
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={cardStyle}
          >
            {children}
          </LinearGradient>
        </Pressable>
      );
    }

    return (
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[cardStyle, style]}
      >
        {children}
      </LinearGradient>
    );
  }

  // Non-gradient card
  const baseCardStyle: ViewStyle = {
    ...cardStyle,
    backgroundColor: COLORS.cardBackground,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          baseCardStyle,
          style,
          {
            transform: [{ scale: pressed && animated ? 0.98 : 1 }],
            opacity: pressed && animated ? 0.9 : 1,
          },
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[baseCardStyle, style]}>{children}</View>;
};
