import React, { useEffect } from 'react';
import { TextInput, TextStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  style?: StyleProp<TextStyle>;
  prefix?: string;
  suffix?: string;
}

/**
 * Displays a number that smoothly animates between values via the
 * Reanimated-on-UI-thread TextInput trick. Respects reduced motion.
 */
export function AnimatedCounter({ value, duration = 400, style, prefix = '', suffix = '' }: AnimatedCounterProps) {
  const animated = useSharedValue(value);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      animated.value = value;
    } else {
      animated.value = withTiming(value, { duration });
    }
  }, [value, duration, reduceMotion]);

  const animatedProps = useAnimatedProps(() => {
    // `text` isn't in TextInput's animated props surface at the type
    // level but reanimated's text animation feature writes into a
    // native-side `text` field at runtime. This is the documented
    // escape hatch from the reanimated docs — the `as any` is
    // intentional and unavoidable without a type declaration patch.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return {
      text: `${prefix}${Math.round(animated.value)}${suffix}`,
    } as any;
  });

  return (
    <AnimatedTextInput
      underlineColorAndroid="transparent"
      editable={false}
      value={`${prefix}${Math.round(value)}${suffix}`}
      animatedProps={animatedProps}
      style={[{ padding: 0, margin: 0 }, style]}
    />
  );
}
