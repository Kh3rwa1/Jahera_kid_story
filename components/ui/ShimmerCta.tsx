import { BORDER_RADIUS,FONTS,SHADOWS } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import React,{ useEffect } from 'react';
import {
ActivityIndicator,
StyleSheet,
Text,
TextStyle,
TouchableOpacity,
View,
ViewStyle,
} from 'react-native';
import Animated,{
Easing,
interpolate,
useAnimatedStyle,
useSharedValue,
withRepeat,
withSpring,
withTiming,
} from 'react-native-reanimated';

interface ShimmerCtaProps {
  onPress: () => void;
  isLoading?: boolean;
  label: string;
  gradient?: readonly [string, string, ...string[]];
  containerStyle?: ViewStyle;
  buttonStyle?: ViewStyle;
  textStyle?: TextStyle;
  renderIcon?: () => React.ReactNode;
  disabled?: boolean;
}

export function ShimmerCta({
  onPress,
  isLoading = false,
  label,
  gradient = ['#FF8C42', '#FF5C00'],
  containerStyle,
  buttonStyle,
  textStyle,
  renderIcon,
  disabled = false,
}: Readonly<ShimmerCtaProps>) {
  const shimmerX = useSharedValue(-1);
  const scale = useSharedValue(1);

  useEffect(() => {
    shimmerX.value = withRepeat(
      withTiming(1, { duration: 2800, easing: Easing.linear }),
      -1,
      false
    );
  }, [shimmerX]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmerX.value, [-1, 1], [-220, 220]) }],
  }));

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 14 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12 });
  };

  return (
    <Animated.View style={[scaleStyle, containerStyle]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        disabled={disabled || isLoading}
      >
        <LinearGradient
          colors={gradient as [string, string]}
          style={[styles.ctaButton, buttonStyle]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.shimmerContainer}>
            <Animated.View style={[styles.ctaShimmer, shimmerStyle]} />
          </View>
          
          <View style={styles.content}>
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              renderIcon?.()
            )}
            <Text style={[styles.ctaButtonText, textStyle]}>
              {isLoading ? 'Processing...' : label}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  ctaButton: {
    borderRadius: BORDER_RADIUS.pill,
    paddingVertical: 18,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  shimmerContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: BORDER_RADIUS.pill,
  },
  ctaShimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    transform: [{ skewX: '-25deg' }],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: FONTS.display,
    letterSpacing: -0.2,
  },
});
