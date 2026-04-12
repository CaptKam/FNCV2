/**
 * CheckRow — unified checklist row for Fork & Compass.
 *
 * Used by:
 *   • Recipe page   — ingredient rows  (label + trailing amount/subs button)
 *   • Grocery page  — shopping items   (leading icon + label + sublabel + trailing delete)
 *   • Cook page     — kitchen checklist (label only)
 *
 * Layout:
 *   [Checkbox] [leading?] [label + sublabel?] [trailing?]
 *
 * When checked the label gets line-through + opacity 0.5 automatically.
 * The whole row is tappable; individual leading/trailing slots can also
 * have their own press handlers by stopping propagation.
 */
import React from 'react';
import {
  Pressable,
  View,
  Text,
  StyleSheet,
  type PressableProps,
} from 'react-native';
import { Checkbox } from '@/components/Checkbox';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import * as Haptics from 'expo-haptics';

interface CheckRowProps {
  checked: boolean;
  onToggle: () => void;

  /** Primary label text */
  label: string;
  /** Secondary line below label (amount, category hint, etc.) */
  sublabel?: string;

  /**
   * Element rendered between the checkbox and the text column.
   * Used by grocery rows to show a coloured category icon.
   */
  leading?: React.ReactNode;

  /**
   * Element rendered after the text column, right-aligned.
   * Use for amounts, substitutions buttons, delete buttons, etc.
   */
  trailing?: React.ReactNode;

  /** Whether to apply line-through when checked. Default: true */
  strikethrough?: boolean;

  /** Size of the checkbox circle. Default: 'default' (24 px) */
  checkboxSize?: 'sm' | 'default' | 'large';

  accessibilityLabel?: string;

  /** Additional pressable style overrides */
  style?: PressableProps['style'];
}

export function CheckRow({
  checked,
  onToggle,
  label,
  sublabel,
  leading,
  trailing,
  strikethrough = true,
  checkboxSize = 'default',
  accessibilityLabel,
  style,
}: CheckRowProps) {
  const colors = useThemeColors();

  const handlePress = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    onToggle();
  };

  const textColor = checked ? colors.outline : colors.onSurface;
  const lineThrough = checked && strikethrough ? 'line-through' : 'none';
  const dim = checked ? 0.55 : 1;

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={[styles.row, style]}
    >
      {/* ── Checkbox ── */}
      <Checkbox checked={checked} onToggle={onToggle} size={checkboxSize} />

      {/* ── Optional leading slot (e.g. category icon) ── */}
      {leading != null && <View style={styles.leadingSlot}>{leading}</View>}

      {/* ── Text column ── */}
      <View style={styles.textCol}>
        <Text
          style={[
            Typography.body,
            {
              color: textColor,
              textDecorationLine: lineThrough,
              opacity: dim,
            },
          ]}
        >
          {label}
        </Text>

        {sublabel != null && (
          <Text
            style={[
              Typography.caption,
              {
                color: colors.outline,
                textDecorationLine: lineThrough,
                opacity: dim,
                marginTop: 1,
              },
            ]}
          >
            {sublabel}
          </Text>
        )}
      </View>

      {/* ── Optional trailing slot (amount, delete btn, etc.) ── */}
      {trailing != null && <View style={styles.trailingSlot}>{trailing}</View>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 44,
  },
  leadingSlot: {
    flexShrink: 0,
  },
  textCol: {
    flex: 1,
  },
  trailingSlot: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
});
