import React, { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';
import { useThemeColors } from '@/hooks/useThemeColors';

interface SkeletonShimmerProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * A pulsing placeholder rectangle used for loading states.
 * Respects reduced motion (renders static grey when enabled).
 */
export function SkeletonShimmer({ width, height = 16, borderRadius = 8, style }: SkeletonShimmerProps) {
  const colors = useThemeColors();
  const opacity = useSharedValue(0.3);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 0.5;
      return;
    }
    opacity.value = withRepeat(withTiming(0.7, { duration: 750 }), -1, true);
  }, [reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.surfaceContainerHigh,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}
