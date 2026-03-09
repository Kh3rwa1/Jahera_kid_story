import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Home, Library, Award, Settings } from 'lucide-react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS } from '@/constants/theme';

function TabIcon({ icon: Icon, color, focused, size }: {
  icon: typeof Home;
  color: string;
  focused: boolean;
  size: number;
}) {
  const animStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(focused ? 1.15 : 1, { damping: 12, stiffness: 200 }) }],
    };
  });

  return (
    <Animated.View style={[styles.iconWrap, animStyle]}>
      <Icon size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
      {focused && <View style={[styles.activeDot, { backgroundColor: color }]} />}
    </Animated.View>
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
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 10,
          height: Platform.OS === 'ios' ? 88 : 68,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
        },
        tabBarLabelStyle: {
          fontFamily: FONTS.semibold,
          fontSize: 11,
          marginTop: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color, focused }) => (
            <TabIcon icon={Home} size={size} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Library',
          tabBarIcon: ({ size, color, focused }) => (
            <TabIcon icon={Library} size={size} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Progress',
          tabBarIcon: ({ size, color, focused }) => (
            <TabIcon icon={Award} size={size} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color, focused }) => (
            <TabIcon icon={Settings} size={size} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
