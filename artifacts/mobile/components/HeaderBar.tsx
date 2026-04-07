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
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export function HeaderBar({ transparent = false, showBack = false, rightAction }: HeaderBarProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const titleColor = transparent ? '#FFFFFF' : colors.onSurface;
  const iconColor = transparent ? '#FFFFFF' : colors.primary;
  const glassBg = transparent ? 'rgba(255,255,255,0.2)' : colors.surfaceContainerHigh;

  const content = (
    <View style={[styles.inner, { paddingTop: insets.top + 8 }]}>
      <View style={styles.left}>
        {showBack ? (
          <Pressable
            onPress={() => router.back()}
            style={[styles.avatar, { backgroundColor: glassBg }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={12}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={transparent ? '#FFFFFF' : colors.onSurface} />
          </Pressable>
        ) : (
          <Pressable
            onPress={() => router.push('/profile')}
            style={[styles.avatar, { backgroundColor: glassBg }]}
            accessibilityRole="button"
            accessibilityLabel="Profile"
          >
            <MaterialCommunityIcons name="account-outline" size={20} color={transparent ? '#FFFFFF' : colors.outline} />
          </Pressable>
        )}
        <Text style={[Typography.title, { color: titleColor, fontStyle: 'italic' }]}>
          Fork & Compass
        </Text>
      </View>
      <View style={styles.rightActions}>
        {rightAction}
        <Pressable
          hitSlop={12}
          onPress={() => router.push('/bookmarks')}
          style={[styles.iconBtn, { backgroundColor: transparent ? 'rgba(255,255,255,0.2)' : 'transparent' }]}
          accessibilityRole="button"
          accessibilityLabel="Bookmarks"
        >
          <MaterialCommunityIcons name="bookmark-outline" size={22} color={iconColor} />
        </Pressable>
      </View>
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

const HEADER_HEIGHT = 56;

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
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
