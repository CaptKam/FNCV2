/**
 * Checkbox
 *
 * Single-source checkbox visual that matches the design system:
 *   Unchecked — round circle, soft terracotta tint fill + 20% border
 *   Checked   — solid terracotta fill, white checkmark
 *
 * Sizes:
 *   sm      20 × 20   used inside compact rows (recipe ingredients)
 *   default 24 × 24   standard use
 *   large   32 × 32   prominent single-action contexts
 *
 * Animations respect MOTION_DISABLED via the motion util.
 */
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Radius } from '@/constants/radius';

interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  size?: 'sm' | 'default' | 'large';
}

export function Checkbox({ checked, onToggle, size = 'default' }: CheckboxProps) {
  const colors = useThemeColors();
  const dim = size === 'large' ? 32 : size === 'sm' ? 20 : 24;
  const iconSize = size === 'large' ? 16 : size === 'sm' ? 11 : 14;

  const handlePress = () => {
    if (!checked) {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    }
    onToggle();
  };

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={size === 'large' ? 8 : 10}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={[
        styles.circle,
        {
          width: dim,
          height: dim,
          backgroundColor: checked ? colors.primary : `${colors.primary}1A`,
          borderWidth: checked ? 0 : 1.5,
          borderColor: `${colors.primary}38`,
        },
      ]}
    >
      {checked && (
        <MaterialCommunityIcons
          name="check"
          size={iconSize}
          color="#FFFFFF"
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
