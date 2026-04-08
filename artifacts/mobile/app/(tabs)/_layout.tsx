import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Platform, StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassView } from "@/components/GlassView";
import { useThemeColors } from "@/hooks/useThemeColors";
import { Radius } from "@/constants/radius";
import { Shadows } from "@/constants/shadows";
import { useApp } from "@/context/AppContext";

const TAB_BAR_HEIGHT = 64;

export default function TabLayout() {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
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
          <GlassView
            style={StyleSheet.absoluteFill}
          />
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
            <View
              style={[
                styles.iconWrap,
                focused && { backgroundColor: colors.primaryMuted, transform: [{ scale: 1.1 }] },
              ]}
            >
              <MaterialCommunityIcons name="compass-outline" size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarAccessibilityLabel: "Search tab",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconWrap,
                focused && { backgroundColor: colors.primaryMuted, transform: [{ scale: 1.1 }] },
              ]}
            >
              <MaterialCommunityIcons name="magnify" size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: "Plan",
          tabBarAccessibilityLabel: "Plan tab",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconWrap,
                focused && { backgroundColor: colors.primaryMuted, transform: [{ scale: 1.1 }] },
              ]}
            >
              <MaterialCommunityIcons name="calendar-month-outline" size={24} color={color} />
            </View>
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
            <View
              style={[
                styles.iconWrap,
                focused && { backgroundColor: colors.primaryMuted, transform: [{ scale: 1.1 }] },
              ]}
            >
              <MaterialCommunityIcons name="cart-outline" size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="cook"
        options={{
          title: "Cook",
          tabBarAccessibilityLabel: "Cook tab",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconWrap,
                focused && { backgroundColor: colors.primaryMuted, transform: [{ scale: 1.1 }] },
              ]}
            >
              <MaterialCommunityIcons name="chef-hat" size={24} color={color} />
            </View>
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
