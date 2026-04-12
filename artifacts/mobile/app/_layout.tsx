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
import { View, ActivityIndicator, StyleSheet, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useRouter, useSegments } from "expo-router";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CookingPill } from "@/components/CookingPill";
import { AppProvider, useApp } from "@/context/AppContext";
import { BookmarksProvider } from "@/context/BookmarksContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { hasCompletedOnboarding, isHydrated } = useApp();
  const router = useRouter();
  const segments = useSegments();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

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
      <View style={[hydrationStyles.container, { backgroundColor: isDark ? '#161412' : '#FEF9F3' }]}>
        <ActivityIndicator size="large" color={isDark ? '#FFB690' : '#9A4100'} />
      </View>
    );
  }

  return <>{children}</>;
}

const hydrationStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

const FADE_SLIDE = {
  animation: 'fade_from_bottom' as const,
  animationDuration: 240,
  contentStyle: { backgroundColor: 'transparent' },
};

const SLIDE = {
  animation: 'slide_from_right' as const,
  animationDuration: 280,
  contentStyle: { backgroundColor: 'transparent' },
};

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, ...SLIDE }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'none' }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false, animation: 'fade' as const, animationDuration: 350 }} />
      <Stack.Screen name="profile" options={{ headerShown: false, presentation: 'modal', ...FADE_SLIDE }} />
      <Stack.Screen name="bookmarks" options={{ headerShown: false }} />
      <Stack.Screen
        name="category/[label]"
        options={{
          headerShown: false,
          gestureEnabled: false,
          animation: 'slide_from_bottom' as const,
          animationDuration: 280,
        }}
      />
      <Stack.Screen name="country/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="recipe/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="technique/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="cooking-schedule" options={{ headerShown: false }} />
      <Stack.Screen name="dinner-setup" options={{ headerShown: false, ...FADE_SLIDE }} />
      <Stack.Screen name="dinner-complete" options={{ headerShown: false, ...FADE_SLIDE }} />
      <Stack.Screen name="passport" options={{ headerShown: false }} />
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
                  <ToastProvider>
                    <KeyboardProvider>
                      <OnboardingGuard>
                        <RootLayoutNav />
                        <CookingPill />
                      </OnboardingGuard>
                    </KeyboardProvider>
                  </ToastProvider>
                </AppProvider>
              </BookmarksProvider>
            </ThemeProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
