import { FloatingTabBar } from '@/components/FloatingTabBar';
import { useUI } from '@/contexts/UIContext';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

type TabName = 'index' | 'history' | 'profile' | 'settings';

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

export default function TabLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = getActiveTab(pathname);

  const { wakeUI } = useUI();
  const handleTabPress = useCallback(
    (route: string) => {
      wakeUI();
      router.push(route as Parameters<typeof router.push>[0]);
    },
    [router, wakeUI],
  );

  return (
    <GestureHandlerRootView style={styles.container}>
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
      <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
