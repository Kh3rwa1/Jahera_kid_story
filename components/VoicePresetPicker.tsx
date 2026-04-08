import { VOICE_PRESETS } from '@/constants/voicePresets';
import { BORDER_RADIUS, FONTS, SHADOWS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { analytics } from '@/services/analyticsService';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Lock } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

interface VoicePresetPickerProps {
  selectedVoice: string | null;
  onSelect: (voiceId: string | null) => void;
  isPremium: boolean;
  languageCode: string;
}

type VoicePresetLike = {
  id: string;
  label: string;
  emoji: string;
  description: string;
  vibe: string;
  languages: string[];
  premium?: boolean;
  isPremium?: boolean;
};

export function VoicePresetPicker({ selectedVoice, onSelect, isPremium, languageCode }: Readonly<VoicePresetPickerProps>) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;

  const styles = useMemo(() => createStyles(isTablet, colors), [isTablet, colors]);

  const voices = useMemo(() => {
    const presets = VOICE_PRESETS as VoicePresetLike[];
    const languageFiltered = presets.filter((preset) => preset.languages.includes(languageCode));
    return languageFiltered.length > 0 ? languageFiltered : presets;
  }, [languageCode]);

  const handleCardPress = async (preset: VoicePresetLike) => {
    const locked = (preset.premium ?? preset.isPremium ?? false) && !isPremium;

    if (locked) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const nextVoiceId = selectedVoice === preset.id ? null : preset.id;
    onSelect(nextVoiceId);

    if (nextVoiceId) {
      analytics.trackVoicePresetSelected(preset.id, preset.label, Boolean(preset.premium ?? preset.isPremium ?? false));
    }
  };

  return (
    <View style={styles.section}>
      <Animated.View entering={FadeInDown.delay(50).springify()}>
        <Text style={styles.title}>🔊 Choose a storyteller</Text>
        <Text style={styles.subtitle}>Pick who tells the story</Text>
      </Animated.View>

      {voices.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {voices.map((preset, index) => {
            const locked = (preset.premium ?? preset.isPremium ?? false) && !isPremium;
            const selected = selectedVoice === preset.id;

            return (
              <Animated.View
                key={preset.id}
                entering={FadeInRight.delay(100 + index * 80).springify().damping(14)}
              >
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => {
                    void handleCardPress(preset);
                  }}
                  style={[
                    styles.card,
                    selected && styles.cardSelected,
                    locked && styles.cardLocked,
                  ]}
                >
                  {selected && (
                    <LinearGradient
                      colors={[colors.primary + '22', colors.primary + '08']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.selectedOverlay}
                    />
                  )}

                  {locked ? (
                    <View style={styles.lockedBadge}>
                      <Crown size={isTablet ? 18 : 14} color="#FFD700" />
                      <Lock size={isTablet ? 14 : 12} color={colors.text.secondary} />
                    </View>
                  ) : null}

                  <Text style={styles.emoji}>{preset.emoji}</Text>
                  <Text style={styles.label}>{preset.label}</Text>
                  <Text style={styles.description}>{preset.description}</Text>

                  <View style={styles.vibePill}>
                    <Text style={styles.vibeText}>{preset.vibe}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </ScrollView>
      ) : (
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No voices available for this language yet</Text>
        </Animated.View>
      )}
    </View>
  );
}

const createStyles = (
  isTablet: boolean,
  colors: ReturnType<typeof useTheme>['currentTheme']['colors'],
) => {
  const cardGap = isTablet ? 16 : 12;

  return StyleSheet.create({
    section: {
      marginBottom: SPACING.lg,
    },
    title: {
      fontFamily: FONTS.bold,
      fontSize: isTablet ? 22 : 18,
      color: colors.text.primary,
    },
    subtitle: {
      marginTop: 2,
      fontFamily: FONTS.regular,
      fontSize: isTablet ? 15 : 13,
      color: colors.text.secondary,
    },
    scrollContent: {
      paddingTop: SPACING.md,
      paddingBottom: 2,
      gap: cardGap,
    },
    card: {
      width: isTablet ? 200 : 160,
      padding: isTablet ? SPACING.xl : SPACING.lg,
      borderRadius: BORDER_RADIUS.xl,
      backgroundColor: colors.cardBackground ?? '#FFFFFF',
      borderWidth: 2,
      borderColor: 'transparent',
      alignItems: 'center',
      ...SHADOWS.md,
      overflow: 'hidden',
    },
    cardSelected: {
      borderColor: colors.primary,
    },
    cardLocked: {
      opacity: 0.5,
    },
    selectedOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
    lockedBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      zIndex: 2,
    },
    emoji: {
      fontSize: isTablet ? 44 : 32,
    },
    label: {
      marginTop: SPACING.sm,
      fontFamily: FONTS.semibold,
      fontSize: isTablet ? 17 : 14,
      color: colors.text.primary,
      textAlign: 'center',
    },
    description: {
      marginTop: 2,
      fontFamily: FONTS.regular,
      fontSize: isTablet ? 14 : 12,
      color: colors.text.secondary,
      textAlign: 'center',
    },
    vibePill: {
      marginTop: SPACING.sm,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 12,
      backgroundColor: colors.infoLight,
    },
    vibeText: {
      fontFamily: FONTS.medium,
      fontSize: isTablet ? 12 : 10,
      color: colors.text.secondary,
      textAlign: 'center',
    },
    emptyContainer: {
      paddingVertical: SPACING.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      fontFamily: FONTS.regular,
      fontSize: 14,
      color: colors.text.secondary,
      textAlign: 'center',
    },
  });
};

export default VoicePresetPicker;
