import { useEffect,useRef,useState } from 'react';
import {
  Animated,
  Easing,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

interface MarqueeTextProps {
  text: string;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  speed?: number;
  delay?: number;
  pauseAfterScroll?: number;
}

export function MarqueeText({
  text,
  style,
  containerStyle,
  speed = 40,
  delay = 1200,
  pauseAfterScroll = 1400,
}: Readonly<MarqueeTextProps>) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const needsScroll = textWidth > containerWidth && containerWidth > 0;

  useEffect(() => {
    if (!needsScroll) {
      translateX.setValue(0);
      return;
    }

    const distance = textWidth - containerWidth + 16;
    const duration = (distance / speed) * 1000;

    const sequence = Animated.sequence([
      Animated.delay(delay),
      Animated.timing(translateX, {
        toValue: -distance,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.delay(pauseAfterScroll),
      Animated.timing(translateX, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);

    animRef.current = Animated.loop(sequence);
    animRef.current.start();

    return () => {
      if (animRef.current) {
        animRef.current.stop();
      }
      translateX.setValue(0);
    };
  }, [needsScroll, textWidth, containerWidth, speed, delay, pauseAfterScroll]);

  return (
    <View
      style={[styles.container, containerStyle]}
      onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}
      pointerEvents="none"
    >
      <Animated.Text
        style={[style, needsScroll && { transform: [{ translateX }] }]}
        numberOfLines={1}
        onLayout={e => setTextWidth(e.nativeEvent.layout.width)}
      >
        {text}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    flexShrink: 1,
  },
});
