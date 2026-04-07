import { useCallback, useRef, memo } from 'react';
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

export const StatsTicker = memo(({ 
  stories, 
  languages, 
  characters, 
  primaryColor, 
  cardBackground, 
  textPrimary, 
  textSecondary, 
  styles 
}: StatsTickerProps) => {
  const translateX = useSharedValue(0);
  const halfWidth = useSharedValue(0);
  const ready = useRef(false);

  const baseItems = [
    { value: stories, label: 'Stories', icon: <BookOpen size={13} color={primaryColor} strokeWidth={2} />, color: primaryColor },
    { value: languages, label: 'Languages', icon: <Globe size={13} color="#F59E0B" strokeWidth={2} />, color: '#F59E0B' },
    { value: characters, label: 'Characters', icon: <Users size={13} color="#10B981" strokeWidth={2} />, color: '#10B981' },
  ];
  
  // Multiply items for seamless loop
  const items = [...baseItems, ...baseItems, ...baseItems, ...baseItems];

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
        {items.map((s, i) => (
          <View key={`${s.label}-${i % baseItems.length}`} style={[styles.statsTickerPill, { backgroundColor: cardBackground }]}>
            <View style={[styles.statsTickerIcon, { backgroundColor: s.color + '20' }]}>
              {s.icon}
            </View>
            <Text style={[styles.statsTickerVal, { color: textPrimary }]}>{s.value}</Text>
            <Text style={[styles.statsTickerLbl, { color: textSecondary }]}>{s.label}</Text>
          </View>
        ))}
      </Animated.View>
    </Animated.View>
  );
});
