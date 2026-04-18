import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Height of the floating tab bar itself (excluding safe area) */
const TAB_BAR_HEIGHT = 64;

/** Extra bottom margin below the tab bar */
const TAB_BAR_MARGIN_BOTTOM = 16;

/**
 * Returns the exact pixel height that scrollable content needs as bottom padding
 * to avoid being hidden behind the floating tab bar.
 *
 * Usage:
 *   const tabBarPadding = useTabBarHeight();
 *   <ScrollView contentContainerStyle={{ paddingBottom: tabBarPadding }}>
 */
export function useTabBarHeight(): number {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + TAB_BAR_MARGIN_BOTTOM + insets.bottom + 20;
}

/**
 * Raw tab bar constants for when you can't use the hook (e.g. outside a SafeAreaProvider).
 */
export const TAB_BAR_CONSTANTS = {
  height: TAB_BAR_HEIGHT,
  marginBottom: TAB_BAR_MARGIN_BOTTOM,
} as const;
