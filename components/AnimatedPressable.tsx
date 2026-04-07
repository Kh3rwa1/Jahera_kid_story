import { type ReactNode } from 'react';
import { StyleProp,TouchableOpacity,ViewStyle } from 'react-native';
import Animated,{
useAnimatedStyle,
useSharedValue,
withSequence,
withSpring,
} from 'react-native-reanimated';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface AnimatedPressableProps {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  activeOpacity?: number;
  scaleDown?: number;
  delayLongPress?: number;
  disabled?: boolean;
}

export function AnimatedPressable({
  children,
  onPress,
  onLongPress,
  style,
  activeOpacity = 0.9,
  scaleDown = 0.96,
  delayLongPress,
  disabled,
}: Readonly<AnimatedPressableProps>) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      style={[animStyle, style]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={delayLongPress}
      activeOpacity={activeOpacity}
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(scaleDown, { damping: 8, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSequence(
          withSpring(1.02, { damping: 10, stiffness: 300 }),
          withSpring(1, { damping: 12, stiffness: 200 })
        );
      }}
    >
      {children}
    </AnimatedTouchable>
  );
}

export function AnimatedBounce({
  children,
  onPress,
  style,
  activeOpacity = 0.85,
}: Readonly<{
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  activeOpacity?: number;
}>) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      style={[animStyle, style]}
      onPress={() => {
        scale.value = withSequence(
          withSpring(0.9, { damping: 6, stiffness: 400 }),
          withSpring(1.05, { damping: 8, stiffness: 300 }),
          withSpring(1, { damping: 10, stiffness: 200 })
        );
        onPress?.();
      }}
      activeOpacity={activeOpacity}
    >
      {children}
    </AnimatedTouchable>
  );
}
