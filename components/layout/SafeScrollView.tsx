import { useScreenClass } from '@/hooks/useScreenClass';
import { ReactNode } from 'react';
import {
  ScrollView,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

interface SafeScrollViewProps extends Omit<
  ScrollViewProps,
  'contentContainerStyle'
> {
  children: ReactNode;
  backgroundColor?: string;
  edges?: Edge[];
  padded?: boolean;
  centered?: boolean;
  maxWidth?: number | false;
  bottomOffset?: number;
  tabBarOffset?: number;
  safeAreaStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export function SafeScrollView({
  children,
  backgroundColor = '#FFFFFF',
  edges = ['top', 'bottom', 'left', 'right'],
  padded = true,
  centered = false,
  maxWidth,
  bottomOffset = 24,
  tabBarOffset = 0,
  keyboardShouldPersistTaps = 'handled',
  showsVerticalScrollIndicator = false,
  safeAreaStyle,
  contentContainerStyle,
  contentStyle,
  ...scrollProps
}: SafeScrollViewProps) {
  const screen = useScreenClass();
  const resolvedMaxWidth =
    maxWidth === false ? undefined : (maxWidth ?? screen.contentMaxWidth);

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.root, { backgroundColor }, safeAreaStyle]}
    >
      <ScrollView
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        {...scrollProps}
        contentContainerStyle={[
          styles.scrollContent,
          centered && styles.centerContent,
          {
            paddingBottom: screen.insets.bottom + bottomOffset + tabBarOffset,
          },
          padded && { paddingHorizontal: screen.horizontalPadding },
          contentContainerStyle,
        ]}
      >
        <View
          style={[
            resolvedMaxWidth !== undefined && {
              maxWidth: resolvedMaxWidth,
              width: '100%',
              alignSelf: 'center',
            },
            contentStyle,
          ]}
        >
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  centerContent: {
    justifyContent: 'center',
  },
});
