import { useMemo, memo, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Sparkles, TrendingUp } from 'lucide-react-native';
import { useEntranceSequence, useSpringPress } from '@/utils/animations';
import { useTheme } from '@/contexts/ThemeContext';

type QuickActionStyles = Record<string, StyleProp<ViewStyle & TextStyle>>;

interface QuickActionItemProps {
  item: {
    icon: ReactNode;
    label: string;
    sublabel: string;
    grad: readonly [string, string, ...string[]];
    onPress: () => void;
    textPrimary: string;
    textSecondary: string;
  };
  index: number;
  styles: QuickActionStyles;
}

const QuickActionItem = memo(
  ({ item, index, styles }: QuickActionItemProps) => {
    const entranceStyle = useEntranceSequence(index, 160, 60);
    const { style: pressStyle, onPressIn, onPressOut } = useSpringPress();

    return (
      <Animated.View style={[styles.quickItem, entranceStyle]}>
        <Animated.View style={pressStyle}>
          <TouchableOpacity
            onPress={item.onPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            activeOpacity={1}
            style={styles.quickCard}
          >
            <LinearGradient
              colors={item.grad as [string, string]}
              style={styles.quickIconCircle}
            >
              {item.icon}
            </LinearGradient>
            <Text style={[styles.quickLabel, { color: item.textPrimary }]}>
              {item.label}
            </Text>
            <Text style={[styles.quickSublabel, { color: item.textSecondary }]}>
              {item.sublabel}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    );
  },
);

QuickActionItem.displayName = 'QuickActionItem';

interface QuickActionsProps {
  handleLastStory: () => void;
  handleGenerateStory: () => void;
  storiesCount: number;
  textPrimary: string;
  textSecondary: string;
  onLibrary: () => void;
  continueStory?: { id: string; title: string; progress: number } | null;
  activeStoryId?: string | null;
  isPlaying: boolean;
  playPause: () => Promise<void>;
  styles: QuickActionStyles;
}

export const QuickActions = memo(
  ({
    handleLastStory,
    handleGenerateStory,
    storiesCount,
    textPrimary,
    textSecondary,
    onLibrary,
    continueStory,
    activeStoryId,
    isPlaying,
    playPause,
    styles,
  }: QuickActionsProps) => {
    const { currentTheme } = useTheme();
    const C = currentTheme.colors;

    const isCurrentActive = activeStoryId === continueStory?.id;

    const actions = useMemo(
      () => [
        {
          icon:
            isCurrentActive && isPlaying ? (
              <View
                style={{
                  width: 26,
                  height: 26,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 26,
                    backgroundColor: '#FFF',
                    borderRadius: 2,
                  }}
                />
                <View
                  style={{
                    width: 8,
                    height: 26,
                    backgroundColor: '#FFF',
                    borderRadius: 2,
                  }}
                />
              </View>
            ) : (
              <Play size={26} color="#FFFFFF" fill="#FFFFFF" strokeWidth={0} />
            ),
          label: isCurrentActive
            ? isPlaying
              ? 'Pause'
              : 'Resume'
            : continueStory
              ? 'Continue'
              : 'Play',
          sublabel: continueStory
            ? continueStory.title.length > 12
              ? continueStory.title.substring(0, 10) + '...'
              : continueStory.title
            : 'Last story',
          grad:
            isCurrentActive && isPlaying
              ? (['#EC4899', '#8B5CF6'] as const)
              : (['#6366F1', '#4F46E5'] as const),
          onPress: isCurrentActive ? playPause : handleLastStory,
          textPrimary,
          textSecondary,
        },
        {
          icon: <Sparkles size={26} color="#FFFFFF" strokeWidth={2.5} />,
          label: 'Create',
          sublabel: 'New story',
          grad: ['#F59E0B', '#D97706'] as const,
          onPress: handleGenerateStory,
          textPrimary,
          textSecondary,
        },
        {
          icon: <TrendingUp size={26} color="#FFFFFF" strokeWidth={2.5} />,
          label: 'Library',
          sublabel: `${storiesCount} stories`,
          grad: ['#10B981', '#059669'] as const,
          onPress: onLibrary,
          textPrimary,
          textSecondary,
        },
      ],
      [
        handleLastStory,
        handleGenerateStory,
        storiesCount,
        textPrimary,
        textSecondary,
        onLibrary,
        continueStory,
        isCurrentActive,
        isPlaying,
        playPause,
      ],
    );

    return (
      <View style={styles.quickWrapper}>
        <View
          style={[
            styles.quickBg,
            {
              backgroundColor: C.cardBackground,
              borderColor: C.text.light + '15',
            },
          ]}
        />
        <View style={styles.quickRow}>
          {actions.map((a, i) => (
            <QuickActionItem key={a.label} item={a} index={i} styles={styles} />
          ))}
        </View>
      </View>
    );
  },
);

QuickActions.displayName = 'QuickActions';
