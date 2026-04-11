import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme, View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, useReducedMotion } from 'react-native-reanimated';
import { Storage } from '@/utils/storage';

const STORAGE_KEY = '@fork_compass_theme';

export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  preference: 'system',
  setPreference: () => {},
  isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const reduceMotion = useReducedMotion();

  // Dimming overlay for theme-change crossfade
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    Storage.get<ThemePreference>(STORAGE_KEY, 'system').then((val) => {
      if (val === 'light' || val === 'dark' || val === 'system') {
        setPreferenceState(val);
      }
    });
  }, []);

  const setPreference = useCallback((pref: ThemePreference) => {
    if (reduceMotion) {
      setPreferenceState(pref);
      Storage.set(STORAGE_KEY, pref);
      return;
    }
    // Fade overlay in (lights dim), swap theme, fade back out (lights brighten)
    overlayOpacity.value = withTiming(0.5, { duration: 100 }, (finished) => {
      if (finished) {
        overlayOpacity.value = withTiming(0, { duration: 200 });
      }
    });
    // Swap shortly after the dim begins so the change happens behind the overlay
    setTimeout(() => {
      setPreferenceState(pref);
      Storage.set(STORAGE_KEY, pref);
    }, 80);
  }, [reduceMotion]);

  const isDark =
    preference === 'dark' || (preference === 'system' && systemScheme === 'dark');

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  return (
    <ThemeContext.Provider value={{ preference, setPreference, isDark }}>
      <View style={{ flex: 1 }}>
        {children}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: isDark ? '#000000' : '#FFFFFF' },
            overlayStyle,
          ]}
        />
      </View>
    </ThemeContext.Provider>
  );
}

export function useThemePreference() {
  return useContext(ThemeContext);
}
