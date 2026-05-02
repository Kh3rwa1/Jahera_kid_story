import { useScreenClass } from '@/hooks/useScreenClass';
import { ReactNode } from 'react';
import {
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';

export const FIXED_BOTTOM_ACTION_RESERVED_HEIGHT = 120;

interface FixedBottomActionProps {
  children: ReactNode;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  elevated?: boolean;
  padded?: boolean;
  bottomOffset?: number;
  maxWidth?: number | false;
  pointerEvents?: ViewProps['pointerEvents'];
}

export function FixedBottomAction({
  children,
  backgroundColor = 'transparent',
  style,
  contentStyle,
  elevated = true,
  padded = true,
  bottomOffset = 0,
  maxWidth,
  pointerEvents = 'box-none',
}: FixedBottomActionProps) {
  const screen = useScreenClass();
  const resolvedMaxWidth =
    maxWidth === false ? undefined : (maxWidth ?? screen.contentMaxWidth);

  return (
    <View
      pointerEvents={pointerEvents}
      style={[
        styles.root,
        {
          paddingBottom: screen.insets.bottom + bottomOffset,
          backgroundColor,
        },
        padded && { paddingHorizontal: screen.horizontalPadding },
        elevated && styles.elevated,
        style,
      ]}
    >
      <View
        style={[
          styles.content,
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
    </View>
  );
}

export function useFixedBottomActionPadding(extra = 24) {
  const screen = useScreenClass();
  return screen.insets.bottom + FIXED_BOTTOM_ACTION_RESERVED_HEIGHT + extra;
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 16,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: Platform.OS === 'ios' ? 0.08 : 0,
    shadowRadius: 18,
    elevation: Platform.OS === 'android' ? 10 : 0,
  },
  content: {
    width: '100%',
  },
});
