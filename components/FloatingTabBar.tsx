import { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Platform,
  View,
  Pressable,
  Dimensions,
  Text,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  interpolateColor,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { House, Library, Award, Settings } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TABS = [
  { name: 'index',    icon: House,   label: 'Home',     route: '/(tabs)/' },
  { name: 'history',  icon: Library, label: 'Library',  route: '/(tabs)/history' },
  { name: 'profile',  icon: Award,   label: 'Progress', route: '/(tabs)/profile' },
  { name: 'settings', icon: Settings, label: 'Settings', route: '/(tabs)/settings' },
];

const BAR_WIDTH = Math.min(SCREEN_WIDTH - 32, 440);
const TAB_WIDTH = BAR_WIDTH / TABS.length;
const PILL_WIDTH = TAB_WIDTH - 12;
const PILL_HEIGHT = 46;

function TabItem({
  tab,
  index,
  focused,
  onPress,
  activeColor,
  inactiveColor,
}: {
  tab: (typeof TABS)[0];
  index: number;
  focused: boolean;
  onPress: () => void;
  activeColor: string;
  inactiveColor: string;
}) {
  const Icon = tab.icon;
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(focused ? 1 : 0, {
      damping: 18,
      stiffness: 300,
      mass: 0.8,
    });
  }, [focused]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(progress.value, [0, 1], [1, 1.12]) },
      { translateY: interpolate(progress.value, [0, 1], [0, -1]) },
    ],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0, 1]),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [6, 0]) },
      { scale: interpolate(progress.value, [0, 1], [0.85, 1]) },
    ],
    maxHeight: interpolate(progress.value, [0, 0.4, 1], [0, 0, 16]),
  }));

  return (
    <Pressable
      onPress={onPress}
      style={styles.tabItem}
      android_ripple={null}
    >
      <Animated.View style={[styles.tabContent, iconStyle]}>
        <Icon
          size={21}
          color={focused ? activeColor : inactiveColor}
          strokeWidth={focused ? 2.5 : 1.8}
        />
      </Animated.View>
      <Animated.Text
        style={[
          styles.tabLabel,
          { color: activeColor, fontFamily: FONTS.bold },
          labelStyle,
        ]}
        numberOfLines={1}
      >
        {tab.label}
      </Animated.Text>
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
  const { currentTheme } = useTheme();
  const COLORS = currentTheme.colors;
  const isDark = COLORS.background < '#888888';
  const insets = useSafeAreaInsets();

  const activeIndex = TABS.findIndex(t => t.name === activeTab);
  const safeActiveIndex = activeIndex === -1 ? 0 : activeIndex;

  const pillX = useSharedValue(safeActiveIndex * TAB_WIDTH + 6);

  useEffect(() => {
    pillX.value = withSpring(safeActiveIndex * TAB_WIDTH + 6, {
      damping: 20,
      stiffness: 320,
      mass: 0.9,
    });
  }, [safeActiveIndex]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
  }));

  const bottomOffset = insets.bottom > 0 ? insets.bottom + 10 : 18;

  const glowColor = COLORS.primary + '45';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.7)';
  const bgColor = isDark ? 'rgba(18,18,26,0.92)' : 'rgba(255,255,255,0.88)';

  return (
    <View
      style={[styles.wrapper, { bottom: bottomOffset }]}
      pointerEvents="box-none"
    >
      {/* Outer glow halo */}
      <View style={[styles.glowHalo, { backgroundColor: glowColor }]} />

      {/* Shadow layers (stacked for depth) */}
      <View style={styles.shadow1} />
      <View style={styles.shadow2} />

      {/* Main pill container */}
      <View
        style={[
          styles.barContainer,
          {
            borderColor,
            width: BAR_WIDTH,
          },
        ]}
      >
        {/* Background blur / solid */}
        {Platform.OS !== 'web' ? (
          <BlurView
            intensity={isDark ? 80 : 90}
            tint={isDark ? 'dark' : 'extraLight'}
            style={StyleSheet.absoluteFillObject}
          />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: bgColor }]} />
        )}

        {/* Subtle inner top highlight */}
        <View
          style={[
            styles.innerHighlight,
            {
              backgroundColor: isDark
                ? 'rgba(255,255,255,0.04)'
                : 'rgba(255,255,255,0.55)',
            },
          ]}
        />

        {/* Sliding active pill */}
        <Animated.View
          style={[
            styles.activePill,
            {
              backgroundColor: COLORS.primary + (isDark ? '22' : '16'),
              borderColor: COLORS.primary + '30',
              width: PILL_WIDTH,
              height: PILL_HEIGHT,
            },
            pillStyle,
          ]}
        />

        {/* Tab items */}
        <View style={styles.tabsRow}>
          {TABS.map((tab, index) => (
            <TabItem
              key={tab.name}
              tab={tab}
              index={index}
              focused={activeTab === tab.name}
              onPress={() => onTabPress(tab.route)}
              activeColor={COLORS.primary}
              inactiveColor={
                isDark ? 'rgba(255,255,255,0.35)' : 'rgba(30,30,40,0.32)'
              }
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const HALO_SIZE = BAR_WIDTH + 40;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },

  /* Layered depth shadows */
  glowHalo: {
    position: 'absolute',
    width: HALO_SIZE,
    height: 64,
    borderRadius: 40,
    bottom: -8,
    alignSelf: 'center',
    opacity: 0.35,
    filter: Platform.OS === 'web' ? 'blur(20px)' : undefined,
  } as any,
  shadow1: {
    position: 'absolute',
    width: BAR_WIDTH - 16,
    height: 60,
    borderRadius: 36,
    bottom: 2,
    alignSelf: 'center',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 40,
    elevation: 24,
  },
  shadow2: {
    position: 'absolute',
    width: BAR_WIDTH,
    height: 60,
    borderRadius: 36,
    bottom: 0,
    alignSelf: 'center',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 12,
  },

  barContainer: {
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },

  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    borderRadius: 36,
  },

  activePill: {
    position: 'absolute',
    top: (Platform.OS === 'web' ? 68 : 64) / 2 - PILL_HEIGHT / 2,
    borderRadius: 22,
    borderWidth: 1,
  },

  tabsRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 4,
    height: 64,
    alignItems: 'center',
  },

  tabItem: {
    flex: 1,
    height: PILL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },

  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabLabel: {
    fontSize: 10.5,
    letterSpacing: 0.15,
    lineHeight: 13,
  },
});
