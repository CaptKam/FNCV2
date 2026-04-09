import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, StyleProp, ViewStyle, AccessibilityInfo } from 'react-native';
import { BlurView } from 'expo-blur';
import { useThemeColors } from '@/hooks/useThemeColors';

interface GlassViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
}

export function GlassView({ children, style, intensity }: GlassViewProps) {
  const colors = useThemeColors();
  const { isDark, glass } = colors;
  const blurIntensity = intensity ?? glass.blurIntensity;

  // Respect iOS Reduce Transparency setting
  const [reduceTransparency, setReduceTransparency] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    AccessibilityInfo.isReduceTransparencyEnabled().then(setReduceTransparency);
    const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduceTransparency);
    return () => sub.remove();
  }, []);

  // Fallback: solid surface color when transparency is reduced or on web
  if (reduceTransparency || Platform.OS === 'web') {
    return (
      <View
        style={[
          {
            backgroundColor: colors.surfaceContainer,
            ...(!reduceTransparency ? glass.specularHighlight : {}),
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
