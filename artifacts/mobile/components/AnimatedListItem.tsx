import React, { useEffect } from 'react';
import { ViewStyle, StyleProp, Easing } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  LinearTransition,
  FadeOut,
} from 'react-native-reanimated';
import { useReducedMotion } from '@/utils/motion';

const ENTRANCE_SPRING = { damping: 20, stiffness: 180, mass: 0.8 };
const STAGGER_MS = 60;
const SLIDE_DISTANCE = 20;

interface AnimatedListItemProps {
  index: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function AnimatedListItem({ index, children, style }: AnimatedListItemProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(SLIDE_DISTANCE);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    const delay = index * STAGGER_MS;
    opacity.value = withDelay(delay, withSpring(1, ENTRANCE_SPRING));
    translateY.value = withDelay(delay, withSpring(0, ENTRANCE_SPRING));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      layout={reduceMotion ? undefined : LinearTransition.springify().damping(18).stiffness(150)}
      exiting={reduceMotion ? undefined : FadeOut.duration(200)}
      style={[animatedStyle, style]}
    >
      {children}
    </Animated.View>
  );
}
