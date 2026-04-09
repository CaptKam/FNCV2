import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts as useInterFonts,
} from "@expo-google-fonts/inter";
import {
  NotoSerif_400Regular,
  NotoSerif_500Medium,
  NotoSerif_600SemiBold,
  NotoSerif_700Bold,
  useFonts as useNotoFonts,
} from "@expo-google-fonts/noto-serif";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useRouter, useSegments } from "expo-router";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CookingPill } from "@/components/CookingPill";
import { AppProvider, useApp } from "@/context/AppContext";
import { BookmarksProvider } from "@/context/BookmarksContext";
import { ThemeProvider } from "@/context/ThemeContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { hasCompletedOnboarding, isHydrated } = useApp();
  const router = useRouter();
  const segments = useSegments();

  React.useEffect(() => {
    if (!isHydrated) return;
    const inOnboarding = segments[0] === 'onboarding';
    if (!hasCompletedOnboarding && !inOnboarding) {
      router.replace('/onboarding');
    } else if (hasCompletedOnboarding && inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [hasCompletedOnboarding, isHydrated, segments]);

  if (!isHydrated) {
    return (
      <View style={hydrationStyles.container}>
        <ActivityIndicator size="large" color="#9A4100" />
      </View>
    );
  }

  return <>{children}</>;
}

const hydrationStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FEF9F3' },
});

const FADE_SLIDE = {
  animation: 'fade_from_bottom' as const,
  animationDuration: 240,
  contentStyle: { backgroundColor: '#FEF9F3' },
};

const SLIDE = {
  animation: 'slide_from_right' as const,
  animationDuration: 280,
  contentStyle: { backgroundColor: '#FEF9F3' },
};

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, ...SLIDE }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'none' }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false, animation: 'fade' as const, animationDuration: 350 }} />
      <Stack.Screen name="profile" options={{ headerShown: false, presentation: 'modal', ...FADE_SLIDE }} />
      <Stack.Screen name="bookmarks" options={{ headerShown: false }} />
      <Stack.Screen name="country/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="recipe/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="technique/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="cooking-schedule" options={{ headerShown: false }} />
      <Stack.Screen name="dinner-setup" options={{ headerShown: false, ...FADE_SLIDE }} />
      <Stack.Screen name="dinner-complete" options={{ headerShown: false, ...FADE_SLIDE }} />
      <Stack.Screen
        name="cook-mode/[id]"
        options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'fade' as const, animationDuration: 300 }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [interLoaded, interError] = useInterFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [notoLoaded, notoError] = useNotoFonts({
    NotoSerif_400Regular,
    NotoSerif_500Medium,
    NotoSerif_600SemiBold,
    NotoSerif_700Bold,
  });

  const fontsLoaded = interLoaded && notoLoaded;
  const fontError = interError || notoError;

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <ThemeProvider>
              <BookmarksProvider>
                <AppProvider>
                  <KeyboardProvider>
                    <OnboardingGuard>
                      <RootLayoutNav />
                      <CookingPill />
                    </OnboardingGuard>
                  </KeyboardProvider>
                </AppProvider>
              </BookmarksProvider>
            </ThemeProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
