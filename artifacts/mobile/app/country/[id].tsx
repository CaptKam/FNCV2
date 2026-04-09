import React, { useState, useMemo, useRef, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { GlassView } from '@/components/GlassView';
import { HeaderBar } from '@/components/HeaderBar';
import { countries } from '@/data/countries';
import { recipes } from '@/data/recipes';
import { REGION_IMAGES, RECIPE_REGION_MAP } from '@/data/maps';
import { formatCookTime } from '@/data/helpers';
import { useApp } from '@/context/AppContext';
import { AnimatedListItem } from '@/components/AnimatedListItem';
import { todayLocal } from '@/utils/dates';

export default function CountryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const app = useApp();

  const handleQuickAdd = useCallback((recipe: typeof recipes[0]) => {
    const todayDate = todayLocal();
    app.addCourseToDay(todayDate, 'main', recipe);
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setToastMsg(`Added ${recipe.title} to today's plan`);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2500);
  }, [app]);

  const country = countries.find((c) => c.id === id);
  const countryRecipes = recipes.filter((r) => r.countryId === id);
  const regions = id ? REGION_IMAGES[id] ?? [] : [];

  const filteredRecipes = useMemo(() => {
    if (!selectedRegion) return countryRecipes;
    return countryRecipes.filter((r) => RECIPE_REGION_MAP[r.id] === selectedRegion);
  }, [countryRecipes, selectedRegion]);

  if (!country) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <Text style={[Typography.body, { color: colors.onSurface, textAlign: 'center', marginTop: 100 }]}>
          Country not found
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <HeaderBar transparent showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.tabClearance }}>
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: country.heroImage }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
            accessible={false}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.6)']}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroText}>
            <GlassView style={styles.flagPill}>
              <Text style={{ fontSize: 16 }}>{country.flag}</Text>
              <Text style={[Typography.caption, { color: colors.textOnImage }]}>{country.region}</Text>
            </GlassView>
            <Text style={[Typography.displayMedium, { color: colors.textOnImage }]}>{country.name}</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: Spacing.page, marginTop: Spacing.xl }}>
          <Text style={[Typography.labelLarge, { color: colors.outline, marginBottom: Spacing.xs }]}>
            ABOUT THE FOOD
          </Text>
          <Text style={[Typography.headlineLarge, { color: colors.onSurface, marginBottom: Spacing.md }]}>
            {country.cuisineLabel}
          </Text>
          <Text style={[Typography.body, { color: colors.onSurfaceVariant, marginBottom: Spacing.xl, lineHeight: 26 }]}>
            {country.description}
          </Text>
        </View>

        {/* Regions Section */}
        {regions.length > 0 && (
          <View style={{ marginBottom: Spacing.xl }}>
            <View style={{ paddingHorizontal: Spacing.page }}>
              <Text style={[Typography.labelLarge, { color: colors.outline, marginBottom: Spacing.xs }]}>
                EXPLORE REGIONS
              </Text>
              <Text style={[Typography.headlineLarge, { color: colors.onSurface, marginBottom: Spacing.lg }]}>
                Discover {country.name}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: Spacing.page, gap: Spacing.md }}
            >
              {regions.map((region) => {
                const isSelected = selectedRegion === region.name;
                const recipeCount = countryRecipes.filter((r) => RECIPE_REGION_MAP[r.id] === region.name).length;
                return (
                  <Pressable
                    key={region.name}
                    onPress={() => setSelectedRegion(isSelected ? null : region.name)}
                    style={[
                      styles.regionCard,
                      { backgroundColor: colors.surfaceContainerHigh },
                      isSelected && { borderWidth: 2, borderColor: colors.primary },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${region.name}, ${region.subtitle}`}
                  >
                    {region.image ? (
                      <>
                        <Image source={{ uri: region.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={StyleSheet.absoluteFill} />
                        <View style={styles.regionContent}>
                          <Text style={[Typography.titleMedium, { color: colors.textOnImage }]}>{region.name}</Text>
                          <Text style={[Typography.caption, { color: 'rgba(255,255,255,0.7)' }]}>{region.subtitle}</Text>
                        </View>
                      </>
                    ) : (
                      <View style={styles.regionContentNoImage}>
                        <Text style={{ fontSize: 36 }}>{country.flag}</Text>
                        <Text style={[Typography.titleMedium, { color: colors.onSurface }]}>{region.name}</Text>
                        <Text style={[Typography.caption, { color: colors.onSurfaceVariant }]} numberOfLines={2}>{region.subtitle}</Text>
                        {recipeCount > 0 && (
                          <Text style={[Typography.caption, { color: colors.primary, marginTop: Spacing.xs }]}>
                            {recipeCount} recipe{recipeCount !== 1 ? 's' : ''}
                          </Text>
                        )}
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Signature Recipes */}
        <View style={{ paddingHorizontal: Spacing.page }}>
          <Text style={[Typography.labelLarge, { color: colors.outline, marginBottom: Spacing.xs }]}>
            RECIPES
          </Text>
          <Text style={[Typography.headlineLarge, { color: colors.onSurface, marginBottom: Spacing.md }]}>
            {selectedRegion ? `${selectedRegion} Recipes` : 'Recipes'}
          </Text>

          {/* Region filter pill */}
          {selectedRegion && (
            <Pressable
              onPress={() => setSelectedRegion(null)}
              style={[styles.filterPill, { backgroundColor: `${colors.primary}15` }]}
              accessibilityRole="button"
              accessibilityLabel={`Clear ${selectedRegion} filter`}
            >
              <Text style={[Typography.titleSmall, { color: colors.primary }]}>
                Showing {selectedRegion} recipes
              </Text>
              <MaterialCommunityIcons name="close-circle" size={16} color={colors.primary} />
            </Pressable>
          )}

          {filteredRecipes.length === 0 ? (
            <View style={styles.emptyRegion}>
              <Text style={[Typography.bodySmall, { color: colors.outline, textAlign: 'center' }]}>
                No recipes mapped to this region yet.
              </Text>
              <Pressable onPress={() => setSelectedRegion(null)}>
                <Text style={[Typography.titleSmall, { color: colors.primary, marginTop: Spacing.sm }]}>Show all recipes</Text>
              </Pressable>
            </View>
          ) : (
            filteredRecipes.map((recipe, index) => (
              <AnimatedListItem key={recipe.id} index={index}>
                <Pressable
                  onPress={() => router.push(`/recipe/${recipe.id}`)}
                  style={[styles.recipeRow, { backgroundColor: colors.surfaceContainerLow }]}
                  accessibilityRole="button"
                  accessibilityLabel={`${recipe.title}, ${recipe.cookTime} minutes, ${recipe.difficulty}`}
                >
                  <Image
                    source={{ uri: recipe.image }}
                    style={styles.recipeThumb}
                    contentFit="cover"
                    transition={300}
                    accessibilityLabel={recipe.title}
                  />
                  <View style={styles.recipeInfo}>
                    <Text style={[Typography.headline, { color: colors.onSurface, fontSize: 17 }]} numberOfLines={1}>
                      {recipe.title}
                    </Text>
                    <Text style={[Typography.caption, { color: colors.outline }]}>
                      {formatCookTime(recipe.cookTime)} {'\u00B7'} {recipe.difficulty}
                      {RECIPE_REGION_MAP[recipe.id] ? ` · ${RECIPE_REGION_MAP[recipe.id]}` : ''}
                    </Text>
                  </View>
                  <Pressable
                    onPress={(e) => { e.stopPropagation(); handleQuickAdd(recipe); }}
                    hitSlop={4}
                    style={[styles.addBtn, { backgroundColor: colors.surfaceContainerHigh }]}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${recipe.title} to today's plan`}
                  >
                    <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
                  </Pressable>
                </Pressable>
              </AnimatedListItem>
            ))
          )}
        </View>
      </ScrollView>

      {/* Toast */}
      {toastMsg && (
        <View style={[styles.toast, { backgroundColor: colors.inverseSurface }]}>
          <MaterialCommunityIcons name="check-circle" size={16} color={colors.inversePrimary} />
          <Text style={[Typography.titleSmall, { color: colors.inverseOnSurface }]}>{toastMsg}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroContainer: {
    height: 400,
    position: 'relative',
  },
  heroText: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.page,
    right: Spacing.page,
    gap: Spacing.sm,
  },
  flagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  regionCard: {
    width: 160,
    height: 200,
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  regionContent: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    gap: 2,
  },
  regionContentNoImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    marginBottom: Spacing.lg,
  },
  emptyRegion: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.md,
    marginBottom: Spacing.md,
    minHeight: 56,
  },
  recipeThumb: {
    width: 88,
    height: 88,
    borderRadius: Radius.md,
  },
  recipeInfo: {
    flex: 1,
    gap: 4,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toast: {
    position: 'absolute',
    bottom: 100,
    left: Spacing.page,
    right: Spacing.page,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderRadius: Radius.full,
  },
});
