/**
 * Standardized text input — single visual treatment across every
 * screen in the app. Search bars, guest forms, manual-entry fields,
 * profile name — all use this component so they're pixel-identical.
 *
 * Spec from constants/designSystem.ts:
 *   height: 48, borderRadius: 16, borderWidth: 1,
 *   borderColor: outlineVariant, background: surfaceContainerHigh,
 *   fontSize: 16, paddingHorizontal: 16.
 */
import React, { useState } from 'react';
import { TextInput, View, StyleSheet, type TextInputProps } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { DESIGN } from '@/constants/designSystem';

interface StyledInputProps extends Omit<TextInputProps, 'style'> {
  /** Optional leading icon (MaterialCommunityIcons name). */
  icon?: string;
}

export function StyledInput({ icon, ...rest }: StyledInputProps) {
  const colors = useThemeColors();
  const [focused, setFocused] = useState(false);
  const spec = DESIGN.input;

  // Resolve theme-token strings into actual color values.
  const c = colors as unknown as Record<string, string>;

  return (
    <View
      style={[
        styles.container,
        {
          height: spec.height,
          borderRadius: spec.borderRadius,
          borderWidth: spec.borderWidth,
          borderColor: focused
            ? c[spec.focusBorderColor] ?? colors.primary
            : c[spec.borderColor] ?? colors.outlineVariant,
          backgroundColor: c[spec.background] ?? colors.surfaceContainerHigh,
        },
      ]}
    >
      {icon && (
        <MaterialCommunityIcons
          // @ts-expect-error — caller provides a valid icon name string
          name={icon}
          size={20}
          color={colors.outline}
          style={styles.icon}
        />
      )}
      <TextInput
        {...rest}
        placeholderTextColor={c[spec.placeholderColor] ?? colors.outline}
        style={[
          styles.input,
          {
            fontSize: spec.fontSize,
            color: colors.onSurface,
          },
        ]}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DESIGN.input.paddingHorizontal,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
  },
});
