import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
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
  const groceryBadgeCount = app.getUncheckedCount();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.outline,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 10,
          marginTop: 2,
        },
        tabBarStyle: {
          position: "absolute",
          bottom: Platform.OS === "web" ? 34 : Math.max(insets.bottom, 16) + 16,
          left: SCREEN_WIDTH * 0.05,
          right: SCREEN_WIDTH * 0.05,
          height: TAB_BAR_HEIGHT,
          borderRadius: Radius.full,
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          maxWidth: 400,
          alignSelf: "center",
          overflow: "hidden",
          ...Shadows.ambient,
        },
        tabBarBackground: () => (
          <GlassView
            style={[StyleSheet.absoluteFill, { borderRadius: Radius.full }]}
          />
        ),
        tabBarItemStyle: {
          paddingTop: 8,
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
                focused && { backgroundColor: `${colors.primary}18`, transform: [{ scale: 1.1 }] },
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
                focused && { backgroundColor: `${colors.primary}18`, transform: [{ scale: 1.1 }] },
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
                focused && { backgroundColor: `${colors.primary}18`, transform: [{ scale: 1.1 }] },
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
                focused && { backgroundColor: `${colors.primary}18`, transform: [{ scale: 1.1 }] },
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
                focused && { backgroundColor: `${colors.primary}18`, transform: [{ scale: 1.1 }] },
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
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
