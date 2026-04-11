import React, { useEffect } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';

interface AnimatedProgressBarProps {
  /** Value 0-1 (or 0-100 if `outOf100` is true) */
  progress: number;
  outOf100?: boolean;
  height?: number;
  trackColor: string;
  fillColor: string;
  borderRadius?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * A progress bar whose fill width animates smoothly on change with a
 * deceleration curve. Respects reduced motion.
 */
export function AnimatedProgressBar({
  progress,
  outOf100 = false,
  height = 6,
  trackColor,
  fillColor,
  borderRadius,
  duration = 600,
  style,
}: AnimatedProgressBarProps) {
  const pct = Math.max(0, Math.min(1, outOf100 ? progress / 100 : progress));
  const width = useSharedValue(pct);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      width.value = pct;
    } else {
      width.value = withTiming(pct, { duration, easing: Easing.out(Easing.cubic) });
    }
  }, [pct, duration, reduceMotion]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View
      style={[
        {
          height,
          backgroundColor: trackColor,
          borderRadius: borderRadius ?? height / 2,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            height: '100%',
            backgroundColor: fillColor,
            borderRadius: borderRadius ?? height / 2,
          },
          fillStyle,
        ]}
      />
    </View>
  );
}
