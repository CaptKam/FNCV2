import React, { useCallback } from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useReducedMotion } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PRESS_SPRING = { damping: 15, stiffness: 300, mass: 0.8 };
const RELEASE_SPRING = { damping: 20, stiffness: 400, mass: 0.8 };

interface PressableScaleProps extends PressableProps {
  scaleValue?: number;
  haptic?: 'light' | 'medium' | 'heavy' | false;
  style?: StyleProp<ViewStyle>;
}

export function PressableScale({
  children,
  scaleValue = 0.96,
  haptic = false,
  style,
  onPressIn,
  onPressOut,
  onPress,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const reduceMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(
    (e: any) => {
      if (!reduceMotion) {
        scale.value = withSpring(scaleValue, PRESS_SPRING);
      }
      onPressIn?.(e);
    },
    [reduceMotion, scaleValue, onPressIn, scale]
  );

  const handlePressOut = useCallback(
    (e: any) => {
      scale.value = withSpring(1, RELEASE_SPRING);
      onPressOut?.(e);
    },
    [onPressOut, scale]
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
