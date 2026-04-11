import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Svg, { Line, Path, Circle } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useApp } from '@/context/AppContext';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { Shadows } from '@/constants/shadows';
import { OVERLAY_BUTTON, ICON_SIZE } from '@/constants/icons';

interface HeaderBarProps {
  transparent?: boolean;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

function CompassForkIcon({ tint = '#9A4100' }: { tint?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      {/* Fork tines */}
      <Line x1="7" y1="3" x2="7" y2="9" stroke={tint} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1="10" y1="3" x2="10" y2="9" stroke={tint} strokeWidth={1.6} strokeLinecap="round" />
      {/* Fork handle */}
      <Path d="M7 9 Q8.5 11 8.5 13 L8.5 21" stroke={tint} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M10 9 Q8.5 11 8.5 13" stroke={tint} strokeWidth={1.6} strokeLinecap="round" />
      {/* Compass needle */}
      <Line x1="14" y1="4" x2="20" y2="20" stroke="#C8651A" strokeWidth={1.4} strokeLinecap="round" />
      <Line x1="20" y1="4" x2="14" y2="20" stroke="#C8651A" strokeWidth={1.4} strokeLinecap="round" opacity={0.45} />
      {/* Compass centre dot */}
      <Circle cx="17" cy="12" r="1.8" fill={tint} />
    </Svg>
  );
}

export function HeaderBar({ transparent = false, showBack = false, rightAction }: HeaderBarProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { displayName } = useApp();

  const userInitial = displayName.trim().charAt(0).toUpperCase() || null;
  const iconColor = transparent ? '#FFFFFF' : colors.primary;
  const glassBg = transparent ? OVERLAY_BUTTON.background : 'rgba(154,65,0,0.10)';
  const wordmarkColor = transparent ? '#FFFFFF' : '#2D1A0E';
  const iconTint = transparent ? '#FFFFFF' : '#9A4100';

  const leftSlot = showBack ? (
    <Pressable
      onPress={() => router.back()}
      style={[
        styles.avatar,
        { backgroundColor: glassBg },
        transparent && {
          borderWidth: OVERLAY_BUTTON.borderWidth,
          borderColor: OVERLAY_BUTTON.borderColor,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={12}
    >
      <MaterialCommunityIcons
        name="arrow-left"
        size={20}
        color={transparent ? '#FFFFFF' : colors.onSurface}
      />
    </Pressable>
  ) : (
    <Pressable
      onPress={() => router.push('/profile')}
      style={[styles.avatar, { backgroundColor: glassBg }]}
      accessibilityRole="button"
      accessibilityLabel="Profile"
    >
      {userInitial ? (
        <Text style={[styles.initial, { color: iconTint }]}>{userInitial}</Text>
      ) : (
        <MaterialCommunityIcons
          name="account-outline"
          size={20}
          color={iconColor}
        />
      )}
    </Pressable>
  );

  const content = (
    <View style={[styles.inner, { paddingTop: insets.top + 8 }]}>
      {/* Left: avatar / back */}
      {leftSlot}

      {/* Centre: icon + wordmark — absolute so it is truly centred */}
      <View style={[styles.centreAnchor, { pointerEvents: 'none' }]}>
        <CompassForkIcon tint={iconTint} />
        <Text style={[styles.wordmark, { color: wordmarkColor }]}>
          {'Fork & Compass'}
        </Text>
      </View>

      {/* Right: optional extra action + bookmarks heart */}
      <View style={styles.rightActions}>
        {rightAction}
        <Pressable
          hitSlop={12}
          onPress={() => router.push('/bookmarks')}
          style={[
            styles.iconBtn,
            transparent
              ? {
                  backgroundColor: OVERLAY_BUTTON.background,
                  borderWidth: OVERLAY_BUTTON.borderWidth,
                  borderColor: OVERLAY_BUTTON.borderColor,
                }
              : { backgroundColor: 'transparent' },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Saved recipes"
        >
          <MaterialCommunityIcons
            name="heart-outline"
            size={ICON_SIZE.md}
            color={iconColor}
          />
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
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: 'rgba(154,65,0,0.10)',
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
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: 'rgba(154,65,0,0.10)',
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
  },
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  inner: {
    minHeight: HEADER_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.page,
    paddingBottom: 12,
  },
  centreAnchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  wordmark: {
    fontFamily: 'NotoSerif_700Bold',
    fontStyle: 'italic',
    fontSize: 17,
    letterSpacing: -0.2,
  },
  initial: {
    fontFamily: 'NotoSerif_700Bold',
    fontSize: 15,
  },
  avatar: {
    width: 38,
    height: 38,
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
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
