import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Platform, StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { useThemeColors } from "@/hooks/useThemeColors";
import { Radius } from "@/constants/radius";
import { useApp } from "@/context/AppContext";

export const TAB_BAR_HEIGHT = 56;

export default function TabLayout() {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const app = useApp();
  const groceryBadgeCount = useMemo(
    () => app.groceryItems.filter((i) => !i.checked && !i.excluded).length,
    [app.groceryItems]
  );

  const tabBarBackground = () => {
    if (Platform.OS === 'web') {
      return (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: `${colors.surface}F2` },
          ]}
        />
      );
    }
    return (
      <BlurView
        intensity={80}
        tint={colors.isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      >
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: `${colors.surface}CC`,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: `${colors.outlineVariant}40`,
            },
          ]}
        />
      </BlurView>
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.outline,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 11,
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
          borderTopColor: "transparent",
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarBackground,
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
            <MaterialCommunityIcons
              name={focused ? "compass" : "compass-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarAccessibilityLabel: "Search tab",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name="magnify"
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: "Plan",
          tabBarAccessibilityLabel: "Plan tab",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "calendar-month" : "calendar-month-outline"}
              size={24}
              color={color}
            />
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
            <MaterialCommunityIcons
              name={focused ? "cart" : "cart-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cook"
        options={{
          title: "Cook",
          tabBarAccessibilityLabel: "Cook tab",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name="chef-hat"
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
