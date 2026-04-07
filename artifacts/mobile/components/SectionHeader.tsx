import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { useThemeColors } from '@/hooks/useThemeColors';

interface SectionHeaderProps {
  label: string;
  title: string;
  actionText?: string;
  onAction?: () => void;
}

export function SectionHeader({ label, title, actionText, onAction }: SectionHeaderProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={[Typography.labelLarge, { color: colors.outline }]}>{label}</Text>
        <Text style={[Typography.headlineLarge, { color: colors.onSurface }]}>{title}</Text>
      </View>
      {actionText && onAction && (
        <Pressable onPress={onAction} hitSlop={12} accessibilityRole="button" accessibilityLabel={actionText}>
          <Text style={[Typography.titleSmall, { color: colors.primary }]}>{actionText}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.page,
    marginBottom: Spacing.md,
  },
  textContainer: {
    gap: 4,
    flex: 1,
  },
});
