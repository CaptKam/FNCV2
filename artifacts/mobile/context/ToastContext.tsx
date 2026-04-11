import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useReducedMotion } from '@/utils/motion';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { Shadows } from '@/constants/shadows';

type ToastType = 'success' | 'error' | 'info';

interface ToastAction {
  label: string;
  onPress: () => void;
}

interface ToastState {
  message: string;
  type: ToastType;
  action?: ToastAction;
  id: number;
}

interface ToastContextValue {
  success: (message: string, options?: { action?: ToastAction }) => void;
  error: (message: string) => void;
  info: (message: string, options?: { action?: ToastAction }) => void;
  dismiss: () => void;
}

const ToastContext = createContext<ToastContextValue>({
  success: () => {},
  error: () => {},
  info: () => {},
  dismiss: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counter = useRef(0);

  const show = useCallback((message: string, type: ToastType, options?: { action?: ToastAction }) => {
    if (timeout.current) clearTimeout(timeout.current);
    counter.current += 1;
    const id = counter.current;
    setToast({ message, type, action: options?.action, id });
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    const duration = options?.action ? 5000 : 3000;
    timeout.current = setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, duration);
  }, []);

  const dismiss = useCallback(() => {
    if (timeout.current) clearTimeout(timeout.current);
    setToast(null);
  }, []);

  const value: ToastContextValue = {
    success: useCallback((msg, opts) => show(msg, 'success', opts), [show]),
    error: useCallback((msg) => show(msg, 'error'), [show]),
    info: useCallback((msg, opts) => show(msg, 'info', opts), [show]),
    dismiss,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && <ToastDisplay toast={toast} onDismiss={dismiss} />}
    </ToastContext.Provider>
  );
}

function ToastDisplay({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

  const iconMap: Record<ToastType, { name: React.ComponentProps<typeof MaterialCommunityIcons>['name']; color: string }> = {
    success: { name: 'check-circle', color: colors.success },
    error: { name: 'alert-circle', color: colors.error },
    info: { name: 'information', color: colors.primary },
  };

  const icon = iconMap[toast.type];

  return (
    <Animated.View
      key={toast.id}
      entering={reduceMotion ? undefined : FadeInUp.springify().damping(20)}
      exiting={reduceMotion ? undefined : FadeOutUp.duration(200)}
      style={[
        styles.toast,
        {
          top: insets.top + 12,
          backgroundColor: colors.inverseSurface,
          ...Shadows.hero,
        },
      ]}
    >
      <MaterialCommunityIcons name={icon.name} size={16} color={icon.color} />
      <Text style={[Typography.bodySmall, { color: colors.inverseOnSurface, flex: 1 }]} numberOfLines={2}>
        {toast.message}
      </Text>
      {toast.action && (
        <Pressable
          onPress={() => { toast.action?.onPress(); onDismiss(); }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={toast.action.label}
        >
          <Text style={[Typography.titleSmall, { color: colors.inversePrimary }]}>{toast.action.label}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: Spacing.page,
    right: Spacing.page,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: Radius.full,
    zIndex: 1000,
  },
});
