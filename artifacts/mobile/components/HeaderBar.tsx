import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { Shadows } from '@/constants/shadows';

interface HeaderBarProps {
  transparent?: boolean;
}

export function HeaderBar({ transparent = false }: HeaderBarProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const content = (
    <View style={[styles.inner, { paddingTop: insets.top + 8 }]}>
      <View style={styles.left}>
        <Pressable
          onPress={() => router.push('/profile')}
          style={[styles.avatar, { backgroundColor: colors.surfaceContainerHigh }]}
          accessibilityRole="button"
          accessibilityLabel="Profile"
        >
          <MaterialCommunityIcons name="account-outline" size={20} color={colors.outline} />
        </Pressable>
        <Text style={[Typography.title, { color: colors.onSurface, fontStyle: 'italic' }]}>
          Fork & Compass
        </Text>
      </View>
      <Pressable
        hitSlop={12}
        onPress={() => router.push('/bookmarks')}
        style={[styles.iconBtn, { backgroundColor: transparent ? 'rgba(255,255,255,0.2)' : 'transparent' }]}
        accessibilityRole="button"
        accessibilityLabel="Bookmarks"
      >
        <MaterialCommunityIcons name="bookmark-outline" size={22} color={colors.primary} />
      </Pressable>
    </View>
  );

  if (transparent) {
    return (
      <View style={[styles.container, styles.absolute]}>
        {content}
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          styles.container,
          styles.absolute,
          {
            backgroundColor: `${colors.surface}B3`,
            ...Shadows.subtle,
          },
        ]}
      >
        {content}
      </View>
    );
  }

  return (
    <BlurView
      intensity={60}
      tint={colors.isDark ? 'dark' : 'light'}
      style={[styles.container, styles.absolute]}
    >
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: `${colors.surface}B3`,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: 'rgba(255,255,255,0.35)',
          },
        ]}
      />
      {content}
    </BlurView>
  );
}

const HEADER_HEIGHT = 48;

const styles = StyleSheet.create({
  container: {
    zIndex: 70,
    overflow: 'hidden',
  },
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  inner: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.page,
    paddingBottom: Spacing.sm,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
