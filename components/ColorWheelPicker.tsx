import React, { useCallback, useRef, useState } from 'react';
import { View, StyleSheet, PanResponder, useWindowDimensions, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, RotateCcw } from 'lucide-react-native';
import { SPACING, BORDER_RADIUS, SHADOWS, FONTS } from '@/constants/theme';

function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = ln - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 70, 50];
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

function generatePalette(hex: string) {
  const [h, s, l] = hexToHsl(hex);
  return {
    primary: hex,
    primaryDark: hslToHex(h, Math.min(s + 10, 100), Math.max(l - 12, 15)),
    primaryLight: hslToHex(h, Math.max(s - 10, 10), Math.min(l + 15, 90)),
    secondary: hslToHex((h + 30) % 360, Math.max(s - 15, 20), Math.min(l + 20, 85)),
    background: hslToHex(h, Math.max(s - 50, 5), 97),
    cardBackground: '#FFFFFF',
    gradientStart: hslToHex(h, Math.max(s - 5, 20), Math.min(l + 10, 80)),
    gradientMid: hex,
    gradientEnd: hslToHex(h, Math.min(s + 10, 100), Math.max(l - 10, 20)),
  };
}

interface ColorWheelPickerProps {
  initialColor: string;
  onColorSelect: (color: string) => void;
  onReset?: () => void;
  textPrimary: string;
  textSecondary: string;
  cardBg: string;
}

export function ColorWheelPicker({
  initialColor,
  onColorSelect,
  onReset,
  textPrimary,
  textSecondary,
  cardBg,
}: ColorWheelPickerProps) {
  const { width: winWidth } = useWindowDimensions();
  const WHEEL_SIZE = Math.min(winWidth - 80, 280);
  const WHEEL_RADIUS = WHEEL_SIZE / 2;
  const HANDLE_SIZE = 32;
  const RING_WIDTH = 36;

  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [hue, setHue] = useState(() => hexToHsl(initialColor)[0]);
  const [saturation] = useState(() => Math.max(hexToHsl(initialColor)[1], 60));
  const [lightness] = useState(() => {
    const l = hexToHsl(initialColor)[2];
    return l < 30 ? 45 : l > 70 ? 55 : l;
  });

  const handleScale = useSharedValue(1);
  const previewScale = useSharedValue(1);
  const wheelRef = useRef<View>(null);

  const palette = generatePalette(selectedColor);

  const updateColorFromPosition = useCallback(
    (x: number, y: number) => {
      const dx = x - WHEEL_RADIUS;
      const dy = y - WHEEL_RADIUS;
      const angle = Math.atan2(dy, dx);
      let newHue = ((angle * 180) / Math.PI + 360) % 360;
      setHue(newHue);
      const hex = hslToHex(newHue, saturation, lightness);
      setSelectedColor(hex);
      onColorSelect(hex);
    },
    [WHEEL_RADIUS, saturation, lightness, onColorSelect]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        handleScale.value = withSpring(1.3, { damping: 8, stiffness: 300 });
        previewScale.value = withSpring(1.05, { damping: 10, stiffness: 200 });
        const { locationX, locationY } = evt.nativeEvent;
        updateColorFromPosition(locationX, locationY);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        updateColorFromPosition(locationX, locationY);
      },
      onPanResponderRelease: () => {
        handleScale.value = withSpring(1, { damping: 12, stiffness: 200 });
        previewScale.value = withSpring(1, { damping: 12, stiffness: 200 });
      },
    })
  ).current;

  const handleAngle = (hue * Math.PI) / 180;
  const handleX = WHEEL_RADIUS + (WHEEL_RADIUS - RING_WIDTH / 2) * Math.cos(handleAngle) - HANDLE_SIZE / 2;
  const handleY = WHEEL_RADIUS + (WHEEL_RADIUS - RING_WIDTH / 2) * Math.sin(handleAngle) - HANDLE_SIZE / 2;

  const handleAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: handleScale.value }],
  }));

  const previewAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: previewScale.value }],
  }));

  const presetColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#EC4899', '#8B5CF6', '#06B6D4', '#F97316',
  ];

  return (
    <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.container}>
      <View style={styles.wheelSection}>
        <View
          ref={wheelRef}
          style={[styles.wheelContainer, { width: WHEEL_SIZE, height: WHEEL_SIZE, borderRadius: WHEEL_SIZE / 2 }]}
          {...panResponder.panHandlers}
        >
          {Array.from({ length: 360 }, (_, i) => i).map((deg) => (
            <View
              key={deg}
              style={[
                styles.wheelSlice,
                {
                  transform: [
                    { rotate: `${deg}deg` },
                    { translateX: WHEEL_RADIUS - RING_WIDTH / 2 },
                  ],
                  backgroundColor: hslToHex(deg, saturation, lightness),
                  width: RING_WIDTH,
                  height: 4,
                  left: WHEEL_RADIUS - RING_WIDTH / 2,
                  top: WHEEL_RADIUS - 2,
                },
              ]}
            />
          ))}

          <Animated.View
            style={[
              previewAnimStyle,
              styles.centerPreview,
              {
                width: WHEEL_SIZE - RING_WIDTH * 2 - 16,
                height: WHEEL_SIZE - RING_WIDTH * 2 - 16,
                borderRadius: (WHEEL_SIZE - RING_WIDTH * 2 - 16) / 2,
                left: RING_WIDTH + 8,
                top: RING_WIDTH + 8,
              },
            ]}
          >
            <LinearGradient
              colors={[palette.gradientStart, palette.gradientMid, palette.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.centerGradient}
            >
              <Text style={styles.colorHex}>{selectedColor.toUpperCase()}</Text>
            </LinearGradient>
          </Animated.View>

          <Animated.View
            style={[
              handleAnimStyle,
              styles.handle,
              {
                left: handleX,
                top: handleY,
                backgroundColor: selectedColor,
              },
            ]}
          >
            <View style={styles.handleInner} />
          </Animated.View>
        </View>
      </View>

      <Animated.View entering={FadeIn.delay(200)} style={styles.presetsSection}>
        <Text style={[styles.presetsLabel, { color: textSecondary }]}>Quick Pick</Text>
        <View style={styles.presetsRow}>
          {presetColors.map((color) => {
            const isActive = selectedColor.toLowerCase() === color.toLowerCase();
            return (
              <TouchableOpacity
                key={color}
                style={[
                  styles.presetButton,
                  { backgroundColor: color },
                  isActive && styles.presetActive,
                ]}
                onPress={() => {
                  setSelectedColor(color);
                  setHue(hexToHsl(color)[0]);
                  onColorSelect(color);
                }}
                activeOpacity={0.7}
              >
                {isActive && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(300)} style={styles.palettePreview}>
        <Text style={[styles.presetsLabel, { color: textSecondary }]}>Generated Palette</Text>
        <View style={styles.paletteRow}>
          <View style={[styles.paletteSwatch, { backgroundColor: palette.primaryLight }]} />
          <View style={[styles.paletteSwatch, styles.paletteSwatchLarge, { backgroundColor: palette.primary }]} />
          <View style={[styles.paletteSwatch, { backgroundColor: palette.primaryDark }]} />
          <View style={[styles.paletteSwatch, { backgroundColor: palette.secondary }]} />
          <View style={[styles.paletteSwatch, { backgroundColor: palette.background, borderWidth: 1, borderColor: textSecondary + '20' }]} />
        </View>
      </Animated.View>

      {onReset && (
        <Animated.View entering={FadeIn.delay(400)}>
          <TouchableOpacity
            style={[styles.resetButton, { borderColor: textSecondary + '30' }]}
            onPress={onReset}
            activeOpacity={0.7}
          >
            <RotateCcw size={16} color={textSecondary} />
            <Text style={[styles.resetText, { color: textSecondary }]}>Reset to preset theme</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: SPACING.xl,
  },
  wheelSection: {
    alignItems: 'center',
  },
  wheelContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  wheelSlice: {
    position: 'absolute',
    transformOrigin: '18px 2px',
  },
  centerPreview: {
    position: 'absolute',
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  centerGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  colorHex: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  handle: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },
  handleInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  presetsSection: {
    width: '100%',
    alignItems: 'center',
  },
  presetsLabel: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  presetButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  presetActive: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...SHADOWS.md,
  },
  palettePreview: {
    width: '100%',
    alignItems: 'center',
  },
  paletteRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  paletteSwatch: {
    width: 36,
    height: 36,
    borderRadius: 10,
    ...SHADOWS.xs,
  },
  paletteSwatchLarge: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.pill,
  },
  resetText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
});

export { generatePalette, hslToHex, hexToHsl };
