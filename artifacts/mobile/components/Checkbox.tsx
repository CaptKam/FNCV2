import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
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
  const iconSize = size === 'large' ? 18 : size === 'sm' ? 12 : 14;

  const scale = useSharedValue(1);
  const checkOpacity = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    checkOpacity.value = withTiming(checked ? 1 : 0, { duration: 150 });
    scale.value = withSpring(checked ? 1.15 : 0.9, { damping: 12, stiffness: 200 });
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  }, [checked]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
  }));

  const handlePress = () => {
    if (!checked) {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    }
    onToggle();
  };

  return (
    <Animated.View style={animatedStyle}>
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
            backgroundColor: checked ? colors.primary : 'transparent',
            borderColor: checked ? colors.primary : colors.outlineVariant,
            borderWidth: checked ? 0 : 2,
          },
        ]}
      >
        <Animated.View style={iconStyle}>
          <MaterialCommunityIcons name="check" size={iconSize} color="#FFFFFF" />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
