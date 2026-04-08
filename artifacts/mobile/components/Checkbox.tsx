import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Radius } from '@/constants/radius';

interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  size?: 'default' | 'large';
}

export function Checkbox({ checked, onToggle, size = 'default' }: CheckboxProps) {
  const colors = useThemeColors();
  const dim = size === 'large' ? 32 : 24;
  const iconSize = size === 'large' ? 18 : 14;

  const handlePress = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    onToggle();
  };

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={size === 'large' ? 8 : 10}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={[
        styles.box,
        {
          width: dim,
          height: dim,
          backgroundColor: checked ? colors.success : 'transparent',
          borderColor: checked ? colors.success : colors.outlineVariant,
          borderWidth: checked ? 0 : 2,
        },
      ]}
    >
      {checked && (
        <MaterialCommunityIcons name="check" size={iconSize} color="#FFFFFF" />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
