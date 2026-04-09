import { useCallback, useRef, memo, useMemo } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { BookOpen, Globe, Users } from 'lucide-react-native';

interface StatsTickerProps {
  stories: number;
  languages: number;
  characters: number;
  primaryColor: string;
  cardBackground: string;
  textPrimary: string;
  textSecondary: string;
  styles: any;
}

const StatIcon = ({ type, color }: { type: 'stories' | 'languages' | 'characters'; color: string }) => {
  const size = 13;
  const strokeWidth = 2;
  switch (type) {
    case 'stories': return <BookOpen size={size} color={color} strokeWidth={strokeWidth} />;
    case 'languages': return <Globe size={size} color={color} strokeWidth={strokeWidth} />;
    case 'characters': return <Users size={size} color={color} strokeWidth={strokeWidth} />;
  }
};

export const StatsTicker = memo((props: StatsTickerProps) => {
  const { 
    stories, 
    languages, 
    characters, 
    primaryColor, 
    cardBackground, 
    textPrimary, 
    textSecondary, 
    styles 
  } = props;

  const translateX = useSharedValue(0);
  const halfWidth = useSharedValue(0);
  const ready = useRef(false);

  const baseItems = useMemo(() => [
    { value: stories, label: 'Stories', type: 'stories' as const, color: primaryColor || '#6366F1' },
    { value: languages, label: 'Languages', type: 'languages' as const, color: '#F59E0B' },
    { value: characters, label: 'Characters', type: 'characters' as const, color: '#10B981' },
  ], [stories, languages, characters, primaryColor]);
  
  // Multiply items for seamless loop
  const items = useMemo(() => [...baseItems, ...baseItems, ...baseItems, ...baseItems], [baseItems]);

  const startAnimation = useCallback((hw: number) => {
    cancelAnimation(translateX);
    translateX.value = 0;
    const SPEED = 45; // pixels per second
    const duration = (hw / SPEED) * 1000;
    translateX.value = withRepeat(
      withTiming(-hw, { duration, easing: Easing.linear }),
      -1,
      false
    );
  }, [translateX]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(220).springify()}
      style={styles.statsTickerWrapper}
    >
      <Animated.View
        style={[styles.statsTickerTrack, animStyle]}
        onLayout={(e) => {
          const totalW = e.nativeEvent.layout.width;
          const hw = totalW / 2;
          if (hw > 0 && !ready.current) {
            ready.current = true;
            halfWidth.value = hw;
            startAnimation(hw);
          }
        }}
      >
        {items.map((item, idx) => (
          <View key={`stats-${item.label}-${idx}`} style={[styles.statsTickerPill, { backgroundColor: cardBackground }]}>
            <View style={[styles.statsTickerIcon, { backgroundColor: item.color + '20' }]}>
              <StatIcon type={item.type} color={item.color} />
            </View>
            <Text style={[styles.statsTickerVal, { color: textPrimary }]}>{item.value}</Text>
            <Text style={[styles.statsTickerLbl, { color: textSecondary }]}>{item.label}</Text>
          </View>
        ))}
      </Animated.View>
    </Animated.View>
  );
});
