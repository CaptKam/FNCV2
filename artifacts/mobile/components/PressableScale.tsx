import React, { useCallback } from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useReducedMotion } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends PressableProps {
  scaleValue?: number;
  haptic?: 'light' | 'medium' | 'heavy' | false;
  style?: StyleProp<ViewStyle>;
}

/**
 * A Pressable that scales down on press for tactile feedback.
 * Uses Reanimated for 60fps UI-thread animation.
 * Respects reduceMotion — disables animation if user prefers.
 */
export function PressableScale({
  children,
  scaleValue = 0.97,
  haptic = false,
  style,
  onPressIn,
  onPressOut,
  onPress,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const reduceMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = useCallback(
    (e: any) => {
      if (!reduceMotion) {
        scale.value = withTiming(scaleValue, { duration: 150, easing: Easing.in(Easing.ease) });
        opacity.value = withTiming(0.85, { duration: 150 });
      }
      onPressIn?.(e);
    },
    [reduceMotion, scaleValue, onPressIn, scale, opacity]
  );

  const handlePressOut = useCallback(
    (e: any) => {
      scale.value = withTiming(1, { duration: 150, easing: Easing.out(Easing.ease) });
      opacity.value = withTiming(1, { duration: 150 });
      onPressOut?.(e);
    },
    [onPressOut, scale, opacity]
  );

  const handlePress = useCallback(
    (e: any) => {
      if (haptic) {
        try {
          const style =
            haptic === 'light'
              ? Haptics.ImpactFeedbackStyle.Light
              : haptic === 'medium'
              ? Haptics.ImpactFeedbackStyle.Medium
              : Haptics.ImpactFeedbackStyle.Heavy;
          Haptics.impactAsync(style);
        } catch {}
      }
      onPress?.(e);
    },
    [haptic, onPress]
  );

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[animatedStyle, style]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
