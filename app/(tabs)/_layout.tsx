import { FloatingTabBar } from '@/components/FloatingTabBar';
import { useUI } from '@/contexts/UIContext';
import { hapticFeedback } from '@/utils/haptics';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';

const TAB_ORDER = ['index', 'history', 'profile', 'settings'] as const;
type TabName = (typeof TAB_ORDER)[number];

const TAB_ROUTES: Record<string, string> = {
  index: '/(tabs)/',
  history: '/(tabs)/history',
  profile: '/(tabs)/profile',
  settings: '/(tabs)/settings',
};

const ROUTE_TO_TAB: Record<string, string> = {
  '/': 'index',
  '/(tabs)': 'index',
  '/(tabs)/': 'index',
  '/(tabs)/history': 'history',
  '/(tabs)/profile': 'profile',
  '/(tabs)/settings': 'settings',
};

function getActiveTab(pathname: string): TabName {
  if (ROUTE_TO_TAB[pathname]) return ROUTE_TO_TAB[pathname] as TabName;
  const segments = pathname.split('/').filter(Boolean);
  const last = segments[segments.length - 1];
  if (['history', 'profile', 'settings'].includes(last)) return last as TabName;
  return 'index';
}

const EmptyTabBar = () => null;

const SWIPE_THRESHOLD = 50;

export default function TabLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = getActiveTab(pathname);
  const hasSwiped = useSharedValue(0); // 0 = not swiped, 1 = swiped (worklet-safe)

  const { wakeUI } = useUI();
  const handleTabPress = useCallback(
    (route: string) => {
      wakeUI();
      router.push(route as Parameters<typeof router.push>[0]);
    },
    [router, wakeUI],
  );

  const navigateToTab = useCallback(
    (tabName: string) => {
      const route = TAB_ROUTES[tabName];
      if (route) {
        hapticFeedback.selection();
        router.push(route as Parameters<typeof router.push>[0]);
      }
    },
    [router],
  );

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-15, 15])
    .onBegin(() => {
      'worklet';
      hasSwiped.value = 0;
      runOnJS(wakeUI)();
    })
    .onUpdate((event) => {
      'worklet';
      if (hasSwiped.value === 1) return;
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        hasSwiped.value = 1;
        const currentIndex = TAB_ORDER.indexOf(activeTab);
        if (currentIndex === -1) return;

        let nextIndex: number;
        if (event.translationX < 0) {
          nextIndex = Math.min(currentIndex + 1, TAB_ORDER.length - 1);
        } else {
          nextIndex = Math.max(currentIndex - 1, 0);
        }

        if (nextIndex !== currentIndex) {
          runOnJS(navigateToTab)(TAB_ORDER[nextIndex]);
        }
      }
    });

  return (
    <GestureHandlerRootView style={styles.container}>
      <Pressable
        onPress={wakeUI}
        style={styles.container}
        android_ripple={null}
      >
        <GestureDetector gesture={swipeGesture}>
          <View style={styles.container}>
            <Tabs
              tabBar={EmptyTabBar}
              screenOptions={{
                headerShown: false,
              }}
            >
              <Tabs.Screen name="index" />
              <Tabs.Screen name="history" />
              <Tabs.Screen name="profile" />
              <Tabs.Screen name="settings" />
            </Tabs>
          </View>
        </GestureDetector>
        <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />
      </Pressable>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
