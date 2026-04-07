import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { GlassView } from '@/components/GlassView';
import { useApp } from '@/context/AppContext';

const TAB_BAR_HEIGHT = 56;

export function CookingPill() {
  const colors = useThemeColors();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { activeCookSession } = useApp();

  if (!activeCookSession || pathname.startsWith('/cook-mode')) return null;

  // Position above the docked tab bar
  const pillBottom = insets.bottom + TAB_BAR_HEIGHT + 12;

  const stepProgress = `Step ${activeCookSession.currentStepIndex + 1}/${activeCookSession.totalSteps}`;

  return (
    <Pressable
      onPress={() => router.push(`/cook-mode/${activeCookSession.recipeId}`)}
      style={[styles.container, { bottom: pillBottom }]}
      accessibilityRole="button"
      accessibilityLabel={`Resume cooking ${activeCookSession.recipeName}, ${stepProgress}`}
    >
      <GlassView style={styles.pill}>
        <MaterialCommunityIcons name="chef-hat" size={16} color={colors.primary} />
        <Text style={[Typography.titleSmall, { color: colors.primary }]} numberOfLines={1}>
          {activeCookSession.recipeName}
        </Text>
        <Text style={[Typography.caption, { color: colors.outline }]}>
          {stepProgress}
        </Text>
        <MaterialCommunityIcons name="chevron-right" size={16} color={colors.primary} />
      </GlassView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.page,
    right: Spacing.page,
    zIndex: 60,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    height: 48,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    maxWidth: 360,
  },
});
