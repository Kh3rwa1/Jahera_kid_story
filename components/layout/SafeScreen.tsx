import { useScreenClass } from '@/hooks/useScreenClass';
import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

interface SafeScreenProps {
  children: ReactNode;
  backgroundColor?: string;
  edges?: Edge[];
  padded?: boolean;
  centered?: boolean;
  maxWidth?: number | false;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

export function SafeScreen({
  children,
  backgroundColor = '#FFFFFF',
  edges = ['top', 'bottom', 'left', 'right'],
  padded = true,
  centered = false,
  maxWidth,
  style,
  contentStyle,
  testID,
}: SafeScreenProps) {
  const screen = useScreenClass();
  const resolvedMaxWidth =
    maxWidth === false ? undefined : (maxWidth ?? screen.contentMaxWidth);

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.root, { backgroundColor }, style]}
      testID={testID}
    >
      <View
        style={[
          styles.content,
          padded && { paddingHorizontal: screen.horizontalPadding },
          centered && styles.centerContent,
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
