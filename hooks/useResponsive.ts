import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';
import { BREAKPOINTS } from '@/constants/theme';

export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'wide';

interface ResponsiveHook {
  width: number;
  height: number;
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
  scale: (size: number) => number;
}

export const useResponsive = (): ResponsiveHook => {
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }: { window: ScaledSize }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const { width, height } = dimensions;

  const getDeviceType = (): DeviceType => {
    if (width >= BREAKPOINTS.wide) return 'wide';
    if (width >= BREAKPOINTS.desktop) return 'desktop';
    if (width >= BREAKPOINTS.tablet) return 'tablet';
    return 'mobile';
  };

  const deviceType = getDeviceType();
  const isPortrait = height >= width;
  const isLandscape = width > height;

  // Scale function for responsive sizing
  const scale = (size: number): number => {
    const baseWidth = 375; // iPhone SE width as base
    return (width / baseWidth) * size;
  };

  return {
    width,
    height,
    deviceType,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    isWide: deviceType === 'wide',
    isPortrait,
    isLandscape,
    scale,
  };
};
