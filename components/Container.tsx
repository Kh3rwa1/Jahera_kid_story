import { COLORS,LAYOUT } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView,ScrollViewProps,View,ViewStyle } from 'react-native';
import { Edge,SafeAreaView } from 'react-native-safe-area-context';

interface ContainerProps {
  children: React.ReactNode;
  safeArea?: boolean;
  safeAreaEdges?: Edge[];
  scroll?: boolean;
  scrollProps?: Partial<ScrollViewProps>;
  padding?: boolean;
  paddingHorizontal?: boolean;
  paddingVertical?: boolean;
  style?: ViewStyle;
  gradient?: boolean;
  gradientColors?: readonly [string, string, ...string[]];
  maxWidth?: boolean; // Centers content with max width on large screens
  centered?: boolean; // Vertically and horizontally centers content
  accessibilityLabel?: string;
  testID?: string;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  safeArea = true,
  safeAreaEdges = ['top', 'bottom', 'left', 'right'],
  scroll = false,
  scrollProps = {},
  padding = true,
  paddingHorizontal,
  paddingVertical,
  style,
  gradient = false,
  gradientColors = COLORS.backgroundGradient,
  maxWidth = false,
  centered = false,
  accessibilityLabel,
  testID,
}) => {
  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: gradient ? 'transparent' : COLORS.background,
    ...(padding && { padding: LAYOUT.screenPadding }),
    ...(paddingHorizontal !== undefined && { paddingHorizontal: paddingHorizontal ? LAYOUT.screenPadding : 0 }),
    ...(paddingVertical !== undefined && { paddingVertical: paddingVertical ? LAYOUT.screenPadding : 0 }),
    ...(centered && {
      justifyContent: 'center',
      alignItems: 'center',
    }),
  };

  const contentStyle: ViewStyle = maxWidth
    ? {
        maxWidth: LAYOUT.maxWidth,
        width: '100%',
        alignSelf: 'center',
      }
    : {};

  const renderContent = () => {
    if (scroll) {
      return (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            containerStyle, 
            { flexGrow: 1 },
            maxWidth && { alignItems: 'center' } // Centering the content wrapper
          ]}
          showsVerticalScrollIndicator={false}
          {...scrollProps}
          accessibilityLabel={accessibilityLabel}
          testID={testID}
        >
          <View style={[contentStyle, maxWidth && { flex: 0, width: '100%' }]}>
            {children}
          </View>
        </ScrollView>
      );
    }

    return (
      <View 
        style={[
          containerStyle, 
          style, 
          maxWidth && { alignItems: 'center' }
        ]} 
        accessibilityLabel={accessibilityLabel} 
        testID={testID}
      >
        <View style={[contentStyle, maxWidth && { flex: 1, width: '100%' }]}>
          {children}
        </View>
      </View>
    );
  };

  if (gradient) {
    const content = renderContent();
    const gradientContainer = (
      <LinearGradient colors={gradientColors} style={{ flex: 1 }}>
        {content}
      </LinearGradient>
    );

    if (safeArea) {
      return <SafeAreaView style={{ flex: 1 }} edges={safeAreaEdges}>{gradientContainer}</SafeAreaView>;
    }

    return gradientContainer;
  }

  if (safeArea) {
    return (
      <SafeAreaView style={[{ flex: 1, backgroundColor: COLORS.background }, style]} edges={safeAreaEdges}>
        {renderContent()}
      </SafeAreaView>
    );
  }

  return renderContent();
};
