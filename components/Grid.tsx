import { SPACING } from '@/constants/theme';
import React from 'react';
import { View,ViewStyle,useWindowDimensions } from 'react-native';

interface GridProps {
  children: React.ReactNode;
  columns?: number;
  gap?: keyof typeof SPACING;
  style?: ViewStyle;
  itemMinWidth?: number; // Auto-calculates columns based on min width
  accessibilityLabel?: string;
}

export const Grid: React.FC<GridProps> = ({
  children,
  columns = 2,
  gap = 'md',
  style,
  itemMinWidth,
  accessibilityLabel,
}) => {
  const { width: winWidth } = useWindowDimensions();
  const gapValue = SPACING[gap];

  // Calculate responsive columns based on min width
  const calculatedColumns = itemMinWidth
    ? Math.max(1, Math.floor(winWidth / (itemMinWidth + gapValue)))
    : columns;

  const gridStyle: ViewStyle = {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: gapValue,
  };

  const childrenArray = React.Children.toArray(children);

  return (
    <View style={[gridStyle, style]} accessibilityLabel={accessibilityLabel}>
      {childrenArray.map((child, index) => {
        const itemStyle: ViewStyle = {
          width: `${(100 - (calculatedColumns - 1) * ((gapValue / winWidth) * 100)) / calculatedColumns}%`,
        };

        return (
          <View key={(React.isValidElement(child) && child.key) ? String(child.key) : `grid-item-${index}`} style={itemStyle}>
            {child}
          </View>
        );
      })}
    </View>
  );
};
