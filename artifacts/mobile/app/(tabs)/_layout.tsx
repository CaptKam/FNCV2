import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassView } from "@/components/GlassView";
import { useThemeColors } from "@/hooks/useThemeColors";
import { Radius } from "@/constants/radius";
import { Shadows } from "@/constants/shadows";

const TAB_BAR_HEIGHT = 64;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function TabLayout() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

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
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconWrap,
                focused && { backgroundColor: `${colors.primary}18`, transform: [{ scale: 1.1 }] },
              ]}
            >
              <Feather name="compass" size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconWrap,
                focused && { backgroundColor: `${colors.primary}18`, transform: [{ scale: 1.1 }] },
              ]}
            >
              <Feather name="search" size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: "Plan",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconWrap,
                focused && { backgroundColor: `${colors.primary}18`, transform: [{ scale: 1.1 }] },
              ]}
            >
              <Feather name="calendar" size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="grocery"
        options={{
          title: "Grocery",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconWrap,
                focused && { backgroundColor: `${colors.primary}18`, transform: [{ scale: 1.1 }] },
              ]}
            >
              <Feather name="shopping-cart" size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="cook"
        options={{
          title: "Cook",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconWrap,
                focused && { backgroundColor: `${colors.primary}18`, transform: [{ scale: 1.1 }] },
              ]}
            >
              <Feather name="award" size={22} color={color} />
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
