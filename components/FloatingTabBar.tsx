import { useEffect } from 'react';
import { StyleSheet, Platform, View, Pressable, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hop as Home, Library, Award, Settings } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TABS = [
  { name: 'index', icon: Home, label: 'Home', route: '/(tabs)/' },
  { name: 'history', icon: Library, label: 'Library', route: '/(tabs)/history' },
  { name: 'profile', icon: Award, label: 'Progress', route: '/(tabs)/profile' },
  { name: 'settings', icon: Settings, label: 'Settings', route: '/(tabs)/settings' },
];

function TabItem({
  tab,
  focused,
  onPress,
  activeColor,
  inactiveColor,
}: {
  tab: (typeof TABS)[0];
  focused: boolean;
  onPress: () => void;
  activeColor: string;
  inactiveColor: string;
}) {
  const Icon = tab.icon;
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const dotOpacity = useSharedValue(0);
  const dotScale = useSharedValue(0);
  const labelOpacity = useSharedValue(focused ? 1 : 0);
  const labelTranslateY = useSharedValue(focused ? 0 : 4);

  useEffect(() => {
    if (focused) {
      scale.value = withSequence(
        withSpring(1.3, { damping: 5, stiffness: 500 }),
        withSpring(1.1, { damping: 12, stiffness: 200 })
      );
      translateY.value = withSpring(-2, { damping: 10, stiffness: 280 });
      dotOpacity.value = withDelay(60, withTiming(1, { duration: 200 }));
      dotScale.value = withDelay(60, withSpring(1, { damping: 10, stiffness: 300 }));
      labelOpacity.value = withDelay(80, withTiming(1, { duration: 180 }));
      labelTranslateY.value = withDelay(80, withSpring(0, { damping: 14, stiffness: 300 }));
    } else {
      scale.value = withSpring(1, { damping: 14, stiffness: 200 });
      translateY.value = withSpring(0, { damping: 14, stiffness: 200 });
      dotOpacity.value = withTiming(0, { duration: 150 });
      dotScale.value = withTiming(0, { duration: 150 });
      labelOpacity.value = withTiming(0, { duration: 120 });
      labelTranslateY.value = withTiming(4, { duration: 120 });
    }
  }, [focused]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
    transform: [{ scale: dotScale.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    transform: [{ translateY: labelTranslateY.value }],
  }));

  const color = focused ? activeColor : inactiveColor;

  return (
    <Pressable onPress={onPress} style={styles.tabItem}>
      <View style={styles.tabContent}>
        <Animated.View style={iconStyle}>
          <Icon size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
        </Animated.View>
        <Animated.Text
          style={[
            styles.tabLabel,
            { color, fontFamily: FONTS.bold },
            labelStyle,
          ]}>
          {tab.label}
        </Animated.Text>
        <Animated.View
          style={[styles.activeDot, { backgroundColor: activeColor }, dotStyle]}
        />
      </View>
    </Pressable>
  );
}

export function FloatingTabBar({
  activeTab,
  onTabPress,
}: {
  activeTab: string;
  onTabPress: (route: string) => void;
}) {
  const { currentTheme, isDark } = useTheme();
  const COLORS = currentTheme.colors;
  const insets = useSafeAreaInsets();

  const bottomOffset = insets.bottom > 0 ? insets.bottom + 12 : 20;

  const blurTint = isDark ? 'dark' : 'light';

  return (
    <View
      style={[
        styles.wrapper,
        {
          bottom: bottomOffset,
        },
      ]}
      pointerEvents="box-none">
      <View style={styles.shadowContainer}>
        <View style={[styles.barContainer, { borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.6)' }]}>
          {Platform.OS === 'web' ? (
            <View
              style={[
                styles.blurFallback,
                {
                  backgroundColor: isDark
                    ? 'rgba(20,20,28,0.88)'
                    : 'rgba(255,255,255,0.82)',
                },
              ]}
            />
          ) : (
            <BlurView
              intensity={isDark ? 72 : 80}
              tint={blurTint}
              style={StyleSheet.absoluteFillObject}
            />
          )}

          <View
            style={[
              styles.tintOverlay,
              {
                backgroundColor: isDark
                  ? 'rgba(20,20,28,0.3)'
                  : 'rgba(255,255,255,0.35)',
              },
            ]}
          />

          <View style={styles.tabsRow}>
            {TABS.map((tab) => {
              const focused = activeTab === tab.name;
              return (
                <TabItem
                  key={tab.name}
                  tab={tab}
                  focused={focused}
                  onPress={() => onTabPress(tab.route)}
                  activeColor={COLORS.primary}
                  inactiveColor={isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.32)'}
                />
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const BAR_WIDTH = Math.min(SCREEN_WIDTH - 48, 420);

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  shadowContainer: {
    width: BAR_WIDTH,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 20,
  },
  barContainer: {
    width: BAR_WIDTH,
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 1,
  },
  blurFallback: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 36,
  },
  tintOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minHeight: 44,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.1,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 1,
  },
});
