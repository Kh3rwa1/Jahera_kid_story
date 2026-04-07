import { FONTS } from '@/constants/theme';
import { useAudio,useAudioProgress } from '@/contexts/AudioContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useUI } from '@/contexts/UIContext';
import { hapticFeedback } from '@/utils/haptics';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Award,Disc,House,Library,Pause,Play,Settings } from 'lucide-react-native';
import React,{ useEffect } from 'react';
import {
Platform,
Pressable,
StyleSheet,
Text,
useWindowDimensions,
View,
} from 'react-native';
import Animated,{
interpolate,
useAnimatedStyle,
useSharedValue,
withSpring,
withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS = [
  { name: 'index',    icon: House,   label: 'Home',     route: '/(tabs)/' },
  { name: 'history',  icon: Library, label: 'Library',  route: '/(tabs)/history' },
  { name: 'profile',  icon: Award,   label: 'Progress', route: '/(tabs)/profile' },
  { name: 'settings', icon: Settings, label: 'Settings', route: '/(tabs)/settings' },
];

function TabItem({
  tab,
  focused,
  onPress,
  activeColor,
  inactiveColor,
}: Readonly<{
  tab: (typeof TABS)[0];
  focused: boolean;
  onPress: () => void;
  activeColor: string;
  inactiveColor: string;
}>) {
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
      { scale: interpolate(progress.value, [0, 1], [1, 1.25]) },
      { translateY: interpolate(progress.value, [0, 1], [0, -2]) },
    ],
    opacity: interpolate(progress.value, [0, 1], [0.5, 1]),
  }));

  return (
    <Pressable
      onPress={onPress}
      style={styles.tabItem}
      android_ripple={null}
    >
      <Animated.View style={[styles.tabContent, iconStyle]}>
        <Icon
          size={focused ? 26 : 28}
          color={focused ? activeColor : inactiveColor}
          strokeWidth={focused ? 2.5 : 1.8}
        />
        {focused && (
          <Animated.Text
            entering={require('react-native-reanimated').FadeIn.duration(200)}
            style={[styles.tabLabel, { color: activeColor }]}
          >
            {tab.label}
          </Animated.Text>
        )}
        {!focused && <Animated.View style={[styles.activeDot, { backgroundColor: 'transparent' }]} />}
      </Animated.View>
    </Pressable>
  );
}

export function FloatingTabBar({
  activeTab,
  onTabPress,
}: Readonly<{
  activeTab: string;
  onTabPress: (route: string) => void;
}>) {
  const { width: winWidth } = useWindowDimensions();
  const { currentTheme } = useTheme();
  const COLORS = currentTheme.colors;
  const isDark = COLORS.background < '#888888';
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { activeStory, isPlaying, playPause } = useAudio();
  const { isUIDormant } = useUI();

  const showPlayer = isUIDormant && activeStory !== null;

  const BAR_WIDTH = Math.min(winWidth - 40, 360); 
  const TAB_WIDTH = BAR_WIDTH / TABS.length;
  const PILL_WIDTH = TAB_WIDTH - 8;
  const PILL_HEIGHT = 50;
  const HALO_SIZE = BAR_WIDTH + 60;

  const modeProgress = useSharedValue(0); // 0 = Tabs, 1 = Player

  useEffect(() => {
    modeProgress.value = withSpring(showPlayer ? 1 : 0, {
      damping: 20,
      stiffness: 300,
    });
  }, [showPlayer]);

  const handleTabPress = (route: string) => {
    hapticFeedback.selection();
    onTabPress(route);
  };

  const activeIndex = TABS.findIndex(t => t.name === activeTab);
  const safeActiveIndex = activeIndex === -1 ? 0 : activeIndex;

  const pillX = useSharedValue(safeActiveIndex * TAB_WIDTH + 4);

  useEffect(() => {
    pillX.value = withSpring(safeActiveIndex * TAB_WIDTH + 4, {
      damping: 20,
      stiffness: 350,
      mass: 0.6,
    });
  }, [safeActiveIndex, TAB_WIDTH]);

  const pillStyle = useAnimatedStyle(() => {
    // When in player mode, the pill expands to fill the entire bar
    const width = interpolate(modeProgress.value, [0, 1], [PILL_WIDTH, BAR_WIDTH - 8]);
    const translateX = interpolate(modeProgress.value, [0, 1], [pillX.value, 4]);

    return {
      transform: [{ translateX }],
      width,
    };
  });

  const tabsContainerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(modeProgress.value, [0, 0.5], [1, 0]),
    transform: [
      { scale: interpolate(modeProgress.value, [0, 0.5], [1, 0.9]) },
      { translateY: interpolate(modeProgress.value, [0, 0.5], [0, 10]) }
    ],
    pointerEvents: showPlayer ? 'none' : 'auto',
  }));

  const playerContainerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(modeProgress.value, [0.5, 1], [0, 1]),
    transform: [
      { scale: interpolate(modeProgress.value, [0.5, 1], [0.9, 1]) },
      { translateY: interpolate(modeProgress.value, [0.5, 1], [-10, 0]) }
    ],
    pointerEvents: showPlayer ? 'auto' : 'none',
  }));

  const bottomOffset = insets.bottom > 0 ? insets.bottom + 8 : 20;
  const glowColor = COLORS.primary + '35';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)';
  const bgColor = isDark ? 'rgba(12,12,18,0.95)' : 'rgba(255,255,255,0.92)';


  return (
    <View
      style={[styles.wrapper, { bottom: bottomOffset }]}
      pointerEvents="box-none"
    >
      <View style={[styles.glowHalo, { backgroundColor: glowColor, width: HALO_SIZE }]} />

      <View
        style={[
          styles.barContainer,
          {
            borderColor,
            width: BAR_WIDTH,
            backgroundColor: bgColor,
          },
        ]}
      >
        {Platform.OS !== 'web' && (
          <BlurView
            intensity={isDark ? 60 : 70}
            tint={isDark ? 'dark' : 'extraLight'}
            style={StyleSheet.absoluteFillObject}
          />
        )}

        <Animated.View
          style={[
            styles.activePill,
            { height: PILL_HEIGHT },
            pillStyle,
          ]}
        >
          <LinearGradient
            colors={[COLORS.primary + '20', COLORS.primary + '05'] as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFillObject, { borderRadius: 25 }]}
          />
        </Animated.View>

        {/* TABS MODE */}
        <Animated.View style={[StyleSheet.absoluteFill, tabsContainerStyle, { justifyContent: 'center' }]}>
          <View style={styles.tabsRow}>
            {TABS.map((tab, index) => (
              <TabItem
                key={tab.name}
                tab={tab}
                focused={activeTab === tab.name}
                onPress={() => handleTabPress(tab.route)}
                activeColor={COLORS.primary}
                inactiveColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(30,30,40,0.35)'}
              />
            ))}
          </View>
        </Animated.View>

        {/* PLAYER MODE */}
        <Animated.View style={[StyleSheet.absoluteFill, playerContainerStyle, styles.playerRow]}>
          <Pressable 
            style={styles.playerInfo} 
            onPress={() => router.push({ pathname: '/story/playback', params: { storyId: activeStory?.id } })}
          >
            <View style={[styles.discIconBg, { backgroundColor: COLORS.primary + '15' }]}>
              {isPlaying ? (
                <View style={styles.eqContainer}>
                  {[14, 10, 16, 8].map((h, i) => (
                    <Animated.View
                      key={`eq-${h}-${i}`}
                      style={[styles.eqBar, { backgroundColor: COLORS.primary, height: h }]}
                    />
                  ))}
                </View>
              ) : (
                <Disc size={20} color={COLORS.primary} />
              )}
            </View>
            <View style={styles.playerTextCol}>
              <Text style={[styles.playerTitle, { color: COLORS.text.primary }]} numberOfLines={1}>
                {activeStory?.title || 'Loading Story...'}
              </Text>
              <Text style={[styles.playerSub, { color: COLORS.text.secondary }]} numberOfLines={1}>
                {activeStory?.theme || 'Custom'} Concept
              </Text>
            </View>
          </Pressable>

          <Pressable 
            style={styles.playerBtn}
            onPress={playPause}
          >
            {isPlaying ? (
              <Pause size={24} color={COLORS.primary} fill={COLORS.primary} />
            ) : (
              <Play size={24} color={COLORS.primary} fill={COLORS.primary} />
            )}
          </Pressable>
          
          {/* Mini progress bar at the bottom */}
          <MiniProgressBar color={COLORS.primary} />
        </Animated.View>
      </View>
    </View>
  );
}

const MiniProgressBar = React.memo(({ color }: { color: string }) => {
  const { position, duration } = useAudioProgress();
  const progress = useSharedValue(0);

  useEffect(() => {
    const pct = duration > 0 ? (position / duration) : 0;
    progress.value = withTiming(pct, { duration: 250 }); // smooth transition between 200ms updates
  }, [position, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.miniProgressBarContainer}>
      <Animated.View style={[styles.miniProgressBar, { backgroundColor: color }, animatedStyle]} />
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  glowHalo: {
    position: 'absolute',
    height: 80,
    borderRadius: 50,
    bottom: -15,
    alignSelf: 'center',
    opacity: 0.6,
  },
  barContainer: {
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
    height: 66,
    ...(Platform.OS !== 'web' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 10,
    } : {}),
  },
  activePill: {
    position: 'absolute',
    top: 8,
    borderRadius: 22,
    overflow: 'hidden',
  },
  tabsRow: {
    flexDirection: 'row',
    height: '100%',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    marginTop: 1,
    letterSpacing: 0.3,
  },
  eqContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 20,
  },
  eqBar: {
    width: 3,
    borderRadius: 1.5,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  playerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  discIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  playerTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    marginBottom: 2,
  },
  playerSub: {
    fontFamily: FONTS.medium,
    fontSize: 11,
  },
  playerBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniProgressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  miniProgressBar: {
    height: '100%',
    borderRadius: 1,
  }
});
