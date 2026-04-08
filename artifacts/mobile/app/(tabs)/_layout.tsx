import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassView } from "@/components/GlassView";
import { useThemeColors } from "@/hooks/useThemeColors";
import { Radius } from "@/constants/radius";
import { useApp } from "@/context/AppContext";

const TAB_BAR_HEIGHT = 64;
const ICON_SPRING = { damping: 16, stiffness: 260, mass: 0.6 };

function AnimatedIcon({
  name,
  color,
  focused,
  colors,
}: {
  name: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color: string;
  focused: boolean;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const scale = useSharedValue(focused ? 1.1 : 1);
  const bgOpacity = useSharedValue(focused ? 1 : 0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      scale.value = focused ? 1.1 : 1;
      bgOpacity.value = focused ? 1 : 0;
      return;
    }
    scale.value = withSpring(focused ? 1.1 : 1, ICON_SPRING);
    bgOpacity.value = withSpring(focused ? 1 : 0, ICON_SPRING);
  }, [focused]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  return (
    <Animated.View style={[styles.iconWrap, animStyle]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors.primaryMuted, borderRadius: Radius.full },
          bgStyle,
        ]}
      />
      <MaterialCommunityIcons name={name} size={24} color={color} />
    </Animated.View>
  );
}

export default function TabLayout() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const app = useApp();
  const groceryBadgeCount = useMemo(
    () => app.groceryItems.filter((i) => !i.checked && !i.excluded).length,
    [app.groceryItems]
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.outline,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 12,
          marginTop: 2,
        },
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () => (
          <GlassView style={StyleSheet.absoluteFill} />
        ),
        tabBarItemStyle: {
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Discover",
          tabBarAccessibilityLabel: "Discover tab",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIcon name="compass-outline" color={color} focused={focused} colors={colors} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarAccessibilityLabel: "Search tab",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIcon name="magnify" color={color} focused={focused} colors={colors} />
          ),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: "Plan",
          tabBarAccessibilityLabel: "Plan tab",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIcon name="calendar-month-outline" color={color} focused={focused} colors={colors} />
          ),
        }}
      />
      <Tabs.Screen
        name="grocery"
        options={{
          title: "Grocery",
          tabBarAccessibilityLabel: "Grocery tab",
          tabBarBadge: groceryBadgeCount > 0 ? groceryBadgeCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.primary, color: colors.onPrimary, fontSize: 10 },
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIcon name="cart-outline" color={color} focused={focused} colors={colors} />
          ),
        }}
      />
      <Tabs.Screen
        name="cook"
        options={{
          title: "Cook",
          tabBarAccessibilityLabel: "Cook tab",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIcon name="chef-hat" color={color} focused={focused} colors={colors} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
