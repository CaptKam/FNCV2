import React, { useEffect } from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  useReducedMotion,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const BOUNCE_SPRING = { damping: 8, stiffness: 400, mass: 0.6 };
const SETTLE_SPRING = { damping: 14, stiffness: 200 };

interface AnimatedHeartProps {
  filled: boolean;
  onToggle: () => void;
  size?: number;
  filledColor: string;
  outlineColor: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  hitSlop?: number;
}

export function AnimatedHeart({
  filled,
  onToggle,
  size = 20,
  filledColor,
  outlineColor,
  style,
  accessibilityLabel,
  hitSlop = 8,
}: AnimatedHeartProps) {
  const scale = useSharedValue(1);
  const reduceMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = (e?: any) => {
    if (e?.stopPropagation) e.stopPropagation();
    if (!reduceMotion) {
      scale.value = withSequence(
        withSpring(1.35, BOUNCE_SPRING),
        withSpring(1, SETTLE_SPRING)
      );
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    onToggle();
  };

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={hitSlop}
      style={style}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: filled }}
    >
      <Animated.View style={animatedStyle}>
        <MaterialCommunityIcons
          name={filled ? 'heart' : 'heart-outline'}
          size={size}
          color={filled ? filledColor : outlineColor}
        />
      </Animated.View>
    </Pressable>
  );
}
