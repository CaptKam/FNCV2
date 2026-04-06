import React from 'react';
import { View, StyleSheet, Platform, StyleProp, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useThemeColors } from '@/hooks/useThemeColors';

interface GlassViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
}

export function GlassView({ children, style, intensity }: GlassViewProps) {
  const { isDark, glass } = useThemeColors();

  const blurIntensity = intensity ?? glass.blurIntensity;

  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          {
            backgroundColor: glass.background,
            ...glass.specularHighlight,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <BlurView
      intensity={blurIntensity}
      tint={isDark ? 'dark' : 'light'}
      style={[styles.blur, style]}
    >
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: glass.background,
            ...glass.specularHighlight,
          },
        ]}
      />
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  blur: {
    overflow: 'hidden',
  },
});
