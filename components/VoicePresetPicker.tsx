import { VOICE_PRESETS } from '@/constants/voicePresets';
import { BORDER_RADIUS, FONTS, SHADOWS, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { analytics } from '@/services/analyticsService';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Lock } from 'lucide-react-native';
import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
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

export function VoicePresetPicker({
  selectedVoice,
  onSelect,
  isPremium,
  languageCode,
}: Readonly<VoicePresetPickerProps>) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  const flatListRef = useRef<FlatList>(null);

  const styles = useMemo(
    () => createStyles(isTablet, colors),
    [isTablet, colors],
  );

  const voices = useMemo(() => {
    const presets = VOICE_PRESETS as VoicePresetLike[];
    const languageFiltered = presets.filter((preset) =>
      preset.languages.includes(languageCode),
    );
    return languageFiltered.length > 0 ? languageFiltered : presets;
  }, [languageCode]);

  // Infinite Buffer logic
  const LOOP_FACTOR = 3;
  const loopedData = useMemo(
    () => Array(LOOP_FACTOR).fill(voices).flat(),
    [voices],
  );
  const cardWidth = isTablet ? 200 : 160;
  const cardGap = isTablet ? 16 : 12;
  const itemWidth = useMemo(() => cardWidth + cardGap, [cardWidth, cardGap]);

  useEffect(() => {
    if (loopedData.length > voices.length) {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({
          offset: voices.length * itemWidth,
          animated: false,
        });
      }, 100);
    }
  }, [voices.length, itemWidth, loopedData.length]);

  const handleInfiniteScroll = (offset: number) => {
    const totalContentWidth = voices.length * itemWidth;
    if (offset <= 0 || offset >= totalContentWidth * 2) {
      flatListRef.current?.scrollToOffset({
        offset: totalContentWidth,
        animated: false,
      });
    }
  };

  const handleCardPress = useCallback(
    async (preset: VoicePresetLike) => {
      const locked =
        (preset.premium ?? preset.isPremium ?? false) && !isPremium;
      if (locked) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        );
        return;
      }
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const nextVoiceId = selectedVoice === preset.id ? null : preset.id;
      onSelect(nextVoiceId);
      if (nextVoiceId) {
        analytics.trackVoicePresetSelected(
          preset.id,
          preset.label,
          Boolean(preset.premium ?? preset.isPremium ?? false),
        );
      }
    },
    [isPremium, selectedVoice, onSelect],
  );

  const renderItem = useCallback(
    ({ item: preset, index }: { item: VoicePresetLike; index: number }) => {
      const locked =
        (preset.premium ?? preset.isPremium ?? false) && !isPremium;
      const selected = selectedVoice === preset.id;

      return (
        <View style={{ marginRight: cardGap }}>
          <Animated.View
            entering={FadeInRight.delay(80 + (index % voices.length) * 60)
              .springify()
              .damping(18)
              .stiffness(90)}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => void handleCardPress(preset)}
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
              {locked && (
                <View style={styles.lockedBadge}>
                  <Crown size={isTablet ? 18 : 14} color="#FFD700" />
                  <Lock
                    size={isTablet ? 14 : 12}
                    color={colors.text.secondary}
                  />
                </View>
              )}
              <Text style={styles.emoji}>{preset.emoji}</Text>
              <Text style={styles.label}>{preset.label}</Text>
              <Text style={styles.description}>{preset.description}</Text>
              <View style={styles.vibePill}>
                <Text style={styles.vibeText}>{preset.vibe}</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      );
    },
    [
      colors,
      voices.length,
      selectedVoice,
      isPremium,
      isTablet,
      cardGap,
      styles,
      handleCardPress,
    ],
  );

  return (
    <View style={[styles.section, { paddingTop: SPACING.xs }]}>
      {voices.length > 0 ? (
        <FlatList
          ref={flatListRef}
          data={loopedData}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, index) => index.toString()}
          snapToInterval={itemWidth}
          decelerationRate="fast"
          contentContainerStyle={styles.scrollContent}
          onScroll={(e) => handleInfiniteScroll(e.nativeEvent.contentOffset.x)}
          scrollEventThrottle={16}
          renderItem={renderItem}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
        />
      ) : (
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={styles.emptyContainer}
        >
          <Text style={styles.emptyText}>
            No voices available for this language yet
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const createStyles = (
  isTablet: boolean,
  colors: ReturnType<typeof useTheme>['currentTheme']['colors'],
) => {
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
      paddingHorizontal: 24,
      paddingTop: SPACING.md,
      paddingBottom: 2,
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
