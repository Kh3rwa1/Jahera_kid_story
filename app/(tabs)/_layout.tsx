import { useEffect } from 'react';
import { StyleSheet, Platform, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Hop as Home, Library, Award, Settings } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS } from '@/constants/theme';

function TabIcon({
  icon: Icon,
  color,
  focused,
  size,
  label,
}: {
  icon: typeof Home;
  color: string;
  focused: boolean;
  size: number;
  label: string;
}) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const pillScale = useSharedValue(0);
  const pillOpacity = useSharedValue(0);

  useEffect(() => {
    if (focused) {
      scale.value = withSequence(
        withSpring(1.35, { damping: 5, stiffness: 500 }),
        withSpring(1.15, { damping: 12, stiffness: 200 })
      );
      translateY.value = withSpring(-3, { damping: 10, stiffness: 280 });
      pillScale.value = withDelay(40, withSpring(1, { damping: 10, stiffness: 300 }));
      pillOpacity.value = withDelay(40, withTiming(1, { duration: 180 }));
    } else {
      scale.value = withSpring(1, { damping: 14, stiffness: 200 });
      translateY.value = withSpring(0, { damping: 14, stiffness: 200 });
      pillScale.value = withTiming(0, { duration: 160 });
      pillOpacity.value = withTiming(0, { duration: 160 });
    }
  }, [focused]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: pillScale.value }],
    opacity: pillOpacity.value,
  }));

  return (
    <View style={styles.iconContainer}>
      <Animated.View style={[styles.activePill, { backgroundColor: color + '22' }, pillStyle]} />
      <Animated.View style={[styles.iconWrap, iconStyle]}>
        <Icon size={size} color={color} strokeWidth={focused ? 2.5 : 1.8} />
      </Animated.View>
    </View>
  );
}

export default function TabLayout() {
  const { currentTheme } = useTheme();
  const COLORS = currentTheme.colors;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.text.light,
        tabBarStyle: {
          backgroundColor: COLORS.cardBackground,
          borderTopWidth: 0,
          paddingBottom: Platform.OS === 'ios' ? 26 : 10,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 92 : 70,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.07,
          shadowRadius: 20,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        },
        tabBarLabelStyle: {
          fontFamily: FONTS.bold,
          fontSize: 10,
          marginTop: 1,
          letterSpacing: 0.2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color, focused }) => (
            <TabIcon icon={Home} size={size} color={color} focused={focused} label="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Library',
          tabBarIcon: ({ size, color, focused }) => (
            <TabIcon icon={Library} size={size} color={color} focused={focused} label="Library" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Progress',
          tabBarIcon: ({ size, color, focused }) => (
            <TabIcon icon={Award} size={size} color={color} focused={focused} label="Progress" />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color, focused }) => (
            <TabIcon icon={Settings} size={size} color={color} focused={focused} label="Settings" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 36,
  },
  activePill: {
    position: 'absolute',
    width: 48,
    height: 32,
    borderRadius: 16,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
