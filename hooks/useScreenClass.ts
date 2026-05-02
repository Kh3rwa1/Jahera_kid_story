import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useScreenClass() {
  const { width, height, scale, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const shortestSide = Math.min(width, height);
    const longestSide = Math.max(width, height);
    const isLandscape = width > height;
    const isTablet = shortestSide >= 768;
    const isPhone = !isTablet;
    const isSmallWidth = width < 360;
    const isCompactHeight = height < 760;
    const isTinyHeight = height < 690;
    const isSmallPhone = isPhone && (isSmallWidth || isTinyHeight);
    const usableHeight = height - insets.top - insets.bottom;

    return {
      width,
      height,
      scale,
      fontScale,
      insets,
      shortestSide,
      longestSide,
      usableHeight,
      isLandscape,
      isPhone,
      isTablet,
      isSmallWidth,
      isCompactHeight,
      isTinyHeight,
      isSmallPhone,
      horizontalPadding: isSmallWidth ? 16 : 24,
      compactHorizontalPadding: isSmallWidth ? 14 : 20,
      contentMaxWidth: isTablet ? 720 : undefined,
      formMaxWidth: isTablet ? 460 : undefined,
    };
  }, [width, height, scale, fontScale, insets]);
}
