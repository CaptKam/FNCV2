import React, { useEffect } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  useReducedMotion,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Radius } from '@/constants/radius';

interface SkeletonBoxProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Shimmer skeleton placeholder for loading states.
 * Uses Reanimated for smooth 60fps shimmer sweep.
 * Falls back to static grey box if user prefers reduced motion.
 */
export function SkeletonBox({ width, height, borderRadius = Radius.md, style }: SkeletonBoxProps) {
  const colors = useThemeColors();
  const reduceMotion = useReducedMotion();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    if (!reduceMotion) {
      shimmer.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [reduceMotion, shimmer]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-200, 200]) }],
  }));

  return (
    <View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.surfaceContainerHigh,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {!reduceMotion && (
        <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
          <LinearGradient
            colors={[
              'transparent',
              `${colors.surfaceContainerHighest}60`,
              'transparent',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, { width: 200 }]}
          />
        </Animated.View>
      )}
    </View>
  );
}

/**
 * A row of skeleton boxes for common patterns.
 */
export function SkeletonRow({ count = 3, height = 16, gap = 8 }: { count?: number; height?: number; gap?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBox key={i} width={80} height={height} borderRadius={Radius.full} />
      ))}
    </View>
  );
}
