import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { Shadows } from '@/constants/shadows';
import { GlassView } from '@/components/GlassView';
import { recipes } from '@/data/recipes';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const PLANNED_DAYS: Record<string, string> = {
  Monday: 'it-1',
  Wednesday: 'fr-1',
  Friday: 'mx-2',
  Saturday: 'jp-1',
};

export default function PlanScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const getRecipe = (id: string) => recipes.find((r) => r.id === id);
  const plannedCount = Object.keys(PLANNED_DAYS).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140, paddingTop: insets.top + 16 }}
      >
        <View style={styles.header}>
          <Text style={[Typography.title, { color: colors.onSurface, fontStyle: 'italic' }]}>
            Fork & Compass
          </Text>
          <Pressable hitSlop={12}>
            <Feather name="shopping-bag" size={22} color={colors.onSurface} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: Spacing.page, marginBottom: Spacing.lg }}>
          <Text style={[Typography.labelLarge, { color: colors.outline, marginBottom: 4 }]}>
            CURRENT PLANNING
          </Text>
          <GlassView style={[styles.weekPill, { ...Shadows.subtle }]}>
            <Pressable hitSlop={12}>
              <Feather name="chevron-left" size={20} color={colors.onSurface} />
            </Pressable>
            <Text style={[Typography.headline, { color: colors.onSurface }]}>This Week</Text>
            <Pressable hitSlop={12}>
              <Feather name="chevron-right" size={20} color={colors.onSurface} />
            </Pressable>
          </GlassView>
        </View>

        <View style={[styles.alertBanner, { paddingHorizontal: Spacing.page }]}>
          <View style={[styles.alertContent, { backgroundColor: `${colors.primary}15` }]}>
            <Feather name="shopping-cart" size={18} color={colors.primary} />
            <Text style={[Typography.bodySmall, { color: colors.onSurface, flex: 1 }]}>
              {plannedCount * 8} items across {plannedCount} meals this week
            </Text>
          </View>
        </View>

        <View style={styles.timeline}>
          <View style={[styles.timelineLine, { backgroundColor: `${colors.primary}33` }]} />
          {DAYS.map((day, index) => {
            const recipeId = PLANNED_DAYS[day];
            const recipe = recipeId ? getRecipe(recipeId) : null;

            return (
              <View key={day} style={styles.dayRow}>
                <View style={styles.dayLeft}>
                  <View
                    style={[
                      styles.timelineNode,
                      {
                        backgroundColor: recipe ? colors.primary : colors.surfaceContainerHigh,
                        borderColor: recipe ? colors.primary : colors.outline,
                      },
                    ]}
                  />
                  <Text style={[Typography.caption, { color: colors.outline, width: 30 }]}>
                    {day.slice(0, 3)}
                  </Text>
                </View>
                <View style={styles.dayRight}>
                  {recipe ? (
                    <Pressable
                      onPress={() => router.push(`/recipe/${recipe.id}`)}
                      style={[styles.mealCard, { backgroundColor: colors.surfaceContainerLow }]}
                    >
                      <Image
                        source={{ uri: recipe.image }}
                        style={styles.mealImage}
                        contentFit="cover"
                        transition={300}
                      />
                      <View style={styles.dinnerBadge}>
                        <GlassView style={styles.dinnerBadgeGlass}>
                          <Text style={[Typography.labelSmall, { color: '#FFFFFF' }]}>DINNER</Text>
                        </GlassView>
                      </View>
                      <View style={styles.mealContent}>
                        <Text style={[Typography.headline, { color: colors.onSurface, fontSize: 17 }]} numberOfLines={1}>
                          {recipe.title}
                        </Text>
                        <Text style={[Typography.caption, { color: colors.outline }]}>
                          {recipe.prepTime + recipe.cookTime} min
                        </Text>
                      </View>
                    </Pressable>
                  ) : (
                    <View
                      style={[
                        styles.emptyCard,
                        { borderColor: colors.outlineVariant },
                      ]}
                    >
                      <Feather name="plus-circle" size={24} color={colors.outline} />
                      <Text style={[Typography.bodySmall, { color: colors.outline }]}>
                        No meals planned yet
                      </Text>
                      <Pressable
                        onPress={() => router.push('/(tabs)/search')}
                        style={[styles.browseBtn, { backgroundColor: colors.primary }]}
                      >
                        <Text style={[Typography.titleSmall, { color: colors.onPrimary }]}>
                          Browse Recipes
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.readyCTA, { bottom: 100, left: Spacing.page, right: Spacing.page }]}>
        <GlassView style={[styles.readyCTAInner, { ...Shadows.ambient }]}>
          <View style={[styles.playCircle, { backgroundColor: `${colors.primary}20` }]}>
            <Feather name="play" size={18} color={colors.primary} />
          </View>
          <Text style={[Typography.titleMedium, { color: colors.primary }]}>Ready to Cook</Text>
        </GlassView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.page,
    marginBottom: Spacing.lg,
  },
  weekPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderRadius: Radius.full,
  },
  alertBanner: { marginBottom: Spacing.lg },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  timeline: {
    paddingHorizontal: Spacing.page,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: Spacing.page + 5,
    top: 0,
    bottom: 0,
    width: 2,
  },
  dayRow: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    minHeight: 80,
  },
  dayLeft: {
    alignItems: 'center',
    width: 50,
    gap: 6,
  },
  timelineNode: {
    width: 12,
    height: 12,
    borderRadius: Radius.full,
    borderWidth: 2,
  },
  dayRight: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  mealCard: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  mealImage: {
    width: '100%',
    height: 160,
  },
  dinnerBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
  },
  dinnerBadgeGlass: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  mealContent: {
    padding: Spacing.md,
    gap: 4,
  },
  emptyCard: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  browseBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    marginTop: 4,
  },
  readyCTA: {
    position: 'absolute',
  },
  readyCTAInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    borderRadius: Radius.full,
  },
  playCircle: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
