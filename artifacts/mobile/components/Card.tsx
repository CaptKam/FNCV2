/**
 * Standardized card wrapper — consistent background, corner radius,
 * and padding for every card-like container in the app.
 *
 * Spec from constants/designSystem.ts:
 *   background: surfaceContainerLow, borderRadius: 24, padding: 16.
 */
import React from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { DESIGN } from '@/constants/designSystem';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Override the default padding (e.g. 0 for edge-to-edge images). */
  padding?: number;
}

export function Card({ children, style, padding }: CardProps) {
  const colors = useThemeColors();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceContainerLow,
          padding: padding ?? DESIGN.card.padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: DESIGN.card.borderRadius,
    overflow: 'hidden',
  },
});
