import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { GlassView } from '@/components/GlassView';
import { useApp } from '@/context/AppContext';

export function CookingPill() {
  const colors = useThemeColors();
  const router = useRouter();
  const pathname = usePathname();
  const { activeCookSession } = useApp();

  // Hide if no session or if already on cook-mode screen
  if (!activeCookSession || pathname.startsWith('/cook-mode')) return null;

  const stepProgress = `Step ${activeCookSession.currentStepIndex + 1}/${activeCookSession.totalSteps}`;

  return (
    <Pressable
      onPress={() => router.push(`/cook-mode/${activeCookSession.recipeId}`)}
      style={styles.container}
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
    bottom: 148,
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
