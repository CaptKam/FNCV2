/**
 * Standardized selection pill — the single source of truth for
 * every "pick one of these" chip in the app.
 *
 * Enforced dimensions (from the design audit):
 *   Height:           44px minimum (iOS touch target)
 *   Horizontal pad:   20px
 *   Border radius:    full (pill shape)
 *   Font:             labelMedium (14px, medium)
 *   Gap between:      8px
 *
 * States:
 *   UNSELECTED  → surfaceContainerHigh bg, onSurface text,
 *                 1px outlineVariant border
 *   SELECTED    → primary bg, onPrimary text, no border
 *
 * Variants:
 *   'radio'   (default) — one selected at a time, matches Standard
 *   'check'   — multi-select, selected adds a leading checkmark
 *
 * Usage:
 *   <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
 *     {days.map((day) => (
 *       <SelectionPill
 *         key={day}
 *         label={day}
 *         selected={day === selectedDay}
 *         onPress={() => setSelectedDay(day)}
 *       />
 *     ))}
 *   </View>
 *
 * Multi-select example:
 *   <SelectionPill
 *     label="Vegetarian"
 *     variant="check"
 *     selected={flags.includes('vegetarian')}
 *     onPress={() => toggle('vegetarian')}
 *   />
 */
import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Radius } from '@/constants/radius';

interface SelectionPillProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  variant?: 'radio' | 'check';
  disabled?: boolean;
  /** Optional leading icon (MaterialCommunityIcons name). */
  icon?: string;
  /** Optional test id for integration tests. */
  testID?: string;
}

export function SelectionPill({
  label,
  selected,
  onPress,
  variant = 'radio',
  disabled = false,
  icon,
  testID,
}: SelectionPillProps) {
  const colors = useThemeColors();

  const backgroundColor = selected
    ? variant === 'check'
      ? colors.primaryContainer
      : colors.primary
    : colors.surfaceContainerHigh;
  const textColor = selected
    ? variant === 'check'
      ? colors.onPrimaryContainer
      : colors.onPrimary
    : colors.onSurface;
  const borderColor = selected ? 'transparent' : colors.outlineVariant;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      style={({ pressed }) => [
        styles.pill,
        {
          backgroundColor,
          borderColor,
          opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
        },
      ]}
    >
      {variant === 'check' && selected && (
        <MaterialCommunityIcons
          name="check"
          size={16}
          color={textColor}
          style={styles.icon}
        />
      )}
      {icon && !(variant === 'check' && selected) && (
        <MaterialCommunityIcons
          // @ts-expect-error — MaterialCommunityIcons typing is strict about icon names;
          // caller is responsible for passing a valid icon.
          name={icon}
          size={16}
          color={textColor}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          Typography.labelMedium,
          { color: textColor, fontWeight: '600' },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Standardized action button for the bottom of a bottom sheet.
 * Height 52px, full width, primary color, rounded full.
 */
interface ActionButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
  loading?: boolean;
  testID?: string;
}

export function ActionButton({
  label,
  onPress,
  disabled = false,
  destructive = false,
  loading = false,
  testID,
}: ActionButtonProps) {
  const colors = useThemeColors();
  const backgroundColor = destructive ? colors.error : colors.primary;
  const textColor = destructive ? '#FFFFFF' : colors.onPrimary;

  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      style={({ pressed }) => [
        actionStyles.button,
        {
          backgroundColor,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text
        style={[
          Typography.titleSmall,
          { color: textColor, fontWeight: '600' },
        ]}
      >
        {loading ? 'Please wait…' : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: Radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  icon: {
    marginRight: -2,
  },
});

const actionStyles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
});
