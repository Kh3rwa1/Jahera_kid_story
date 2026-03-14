import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { FloatingTabBar } from '@/components/FloatingTabBar';

const ROUTE_TO_TAB: Record<string, string> = {
  '/': 'index',
  '/(tabs)': 'index',
  '/(tabs)/': 'index',
  '/(tabs)/history': 'history',
  '/(tabs)/profile': 'profile',
  '/(tabs)/settings': 'settings',
};

function getActiveTab(pathname: string): string {
  if (ROUTE_TO_TAB[pathname]) return ROUTE_TO_TAB[pathname];
  const segments = pathname.split('/').filter(Boolean);
  const last = segments[segments.length - 1];
  if (['history', 'profile', 'settings'].includes(last)) return last;
  return 'index';
}

export default function TabLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = getActiveTab(pathname);

  const handleTabPress = useCallback(
    (route: string) => {
      router.push(route as any);
    },
    [router]
  );

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="history" />
        <Tabs.Screen name="profile" />
        <Tabs.Screen name="settings" />
      </Tabs>
      <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
