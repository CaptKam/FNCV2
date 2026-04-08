import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Radius } from '@/constants/radius';
import { OVERLAY_BUTTON } from '@/constants/icons';

interface DismissButtonProps {
  onPress: () => void;
  variant: 'overlay' | 'surface';
  icon?: 'close' | 'arrow-left';
}

export function DismissButton({ onPress, variant, icon = 'close' }: DismissButtonProps) {
  const colors = useThemeColors();

  const isOverlay = variant === 'overlay';
  const bg = isOverlay ? OVERLAY_BUTTON.background : colors.surfaceContainerHigh;
  const iconColor = isOverlay ? OVERLAY_BUTTON.iconColor : colors.onSurfaceVariant;
  const dim = OVERLAY_BUTTON.size;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={icon === 'close' ? 'Close' : 'Go back'}
      style={[
        styles.btn,
        {
          width: dim,
          height: dim,
          backgroundColor: bg,
          borderWidth: isOverlay ? OVERLAY_BUTTON.borderWidth : 0,
          borderColor: isOverlay ? OVERLAY_BUTTON.borderColor : 'transparent',
        },
      ]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={OVERLAY_BUTTON.iconSize}
        color={iconColor}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
