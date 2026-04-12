/**
 * Global motion kill-switch.
 *
 * Animations across the app were producing inconsistent behavior
 * from screen to screen (different reanimated versions, race
 * conditions with layout measurement, gesture conflicts with the
 * new BottomSheet PanResponder). This module provides a single
 * place to turn all of them off while we stabilize everything
 * else, then flip back on later.
 *
 * Usage:
 *
 *   // In any component that previously did:
 *   //   import { useReducedMotion } from 'react-native-reanimated';
 *   // Do this instead:
 *   import { useReducedMotion } from '@/utils/motion';
 *
 *   // The returned value respects both the OS "reduce motion"
 *   // accessibility setting AND this module's MOTION_DISABLED flag.
 *   // When MOTION_DISABLED is true, reduceMotion is ALWAYS true
 *   // regardless of OS setting, so every `reduceMotion ? undefined : ...`
 *   // branch in the app skips its animation.
 *
 *   // For scroll-handler worklets, use withManagedSpring instead of withSpring:
 *   //   import { withManagedSpring } from '@/utils/motion';
 *   //   navBarTranslateY.value = withManagedSpring(0, springConfig);
 *   // This respects MOTION_DISABLED without needing a manual reduceMotion check.
 *
 * To re-enable animations later:
 *   Flip `MOTION_DISABLED` to false. That's it — nothing else
 *   needs to change.
 *
 * Scope:
 *   - Reanimated entering/exiting layout transitions (FadeInDown, etc.)
 *   - useAnimatedStyle / withSpring / withTiming / withSequence values
 *     (components check reduceMotion before driving shared values)
 *   - BottomSheet spring-in (see components/BottomSheet.tsx)
 *   - Scroll-driven nav bar hide/show on plan.tsx (withManagedSpring)
 *
 * NOT in scope (left alone because they're cheap and not buggy):
 *   - expo-image `transition={200}` cross-fades
 *   - React Native Animated.View scroll-driven transforms
 *     (these are native-driver and perform fine)
 */
import {
  useReducedMotion as useReducedMotionReanimated,
  withSpring,
} from 'react-native-reanimated';

/**
 * Master kill switch. When true, every consumer of the
 * useReducedMotion hook below sees `true` and skips their
 * animation. Flip to false once rendering is stable.
 */
export const MOTION_DISABLED = true;

/**
 * Drop-in replacement for reanimated's useReducedMotion.
 * Returns true when either:
 *   (a) MOTION_DISABLED is true (kill-switch), OR
 *   (b) the OS "reduce motion" accessibility setting is on.
 */
export function useReducedMotion(): boolean {
  const osReducedMotion = useReducedMotionReanimated();
  return MOTION_DISABLED || osReducedMotion;
}

/**
 * Worklet-safe spring helper. Respects MOTION_DISABLED so that
 * callers inside useAnimatedScrollHandler (or any other worklet)
 * don't need to manually check reduceMotion — they call this
 * instead of withSpring and the kill-switch is applied here.
 *
 * Usage inside worklets:
 *   navBarTranslateY.value = withManagedSpring(0, springConfig);
 *
 * When MOTION_DISABLED is true the value is set instantly (no spring).
 * When MOTION_DISABLED is false it delegates to Reanimated's withSpring.
 */
export function withManagedSpring(
  toValue: number,
  config?: Parameters<typeof withSpring>[1],
): number {
  'worklet';
  if (MOTION_DISABLED) return toValue;
  return withSpring(toValue, config);
}
