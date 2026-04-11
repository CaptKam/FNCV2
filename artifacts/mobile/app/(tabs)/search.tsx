import React, { useState, useMemo, useCallback, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { HeaderBar } from '@/components/HeaderBar';
import { PressableScale } from '@/components/PressableScale';
import { AnimatedHeart } from '@/components/AnimatedHeart';
import { AnimatedListItem } from '@/components/AnimatedListItem';
import { AddToPlanSheet, AddToPlanButton } from '@/components/AddToPlanSheet';
import { OVERLAY_BUTTON } from '@/constants/icons';
import { recipes, Recipe } from '@/data/recipes';
import { countries } from '@/data/countries';
import { formatCookTime } from '@/data/helpers';
import { ALLERGEN_INFO, AllergenType } from '@/utils/allergens';
import { useApp } from '@/context/AppContext';
import { useBookmarks } from '@/context/BookmarksContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { todayLocal, getDayLabel } from '@/utils/dates';

// ─── Constants ───────────────────────────────────────────────────────────────

const MOODS = ['All Moods', 'Quick & Easy', 'Comfort Food', 'Date Night', 'Adventurous', 'Healthy', 'Sweet'];
const ALLERGEN_FILTERS: AllergenType[] = ['peanuts', 'milk', 'wheat', 'shellfish', 'egg', 'tree_nuts', 'fish', 'soy'];

const INGREDIENT_CIRCLES = [
  { label: 'Chicken', query: 'chicken', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d11bbc?w=200&h=200&fit=crop' },
  { label: 'Egg',     query: 'egg',     image: 'https://images.unsplash.com/photo-1607690424560-35d967d6ad7f?w=200&h=200&fit=crop' },
  { label: 'Pasta',   query: 'pasta',   image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=200&h=200&fit=crop' },
  { label: 'Lemon',   query: 'lemon',   image: 'https://images.unsplash.com/photo-1571735360272-e0427f4dc97f?w=200&h=200&fit=crop' },
  { label: 'Rice',    query: 'rice',    image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=200&h=200&fit=crop' },
  { label: 'Tomato',  query: 'tomato',  image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200&h=200&fit=crop' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function SearchScreen() {
  const { width } = useWindowDimensions();
  const CARD_WIDTH = (width - Spacing.page * 2 - 12) / 2;
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const app = useApp();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [activeMood, setActiveMood] = useState('All Moods');
  const [excludedAllergens, setExcludedAllergens] = useState<AllergenType[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [addSheetRecipe, setAddSheetRecipe] = useState<Recipe | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2500);
  }, []);

  React.useEffect(() => {
    return () => { if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current); };
  }, []);

  const handleAddToPlan = useCallback((date: string) => {
    if (!addSheetRecipe) return;
    app.addCourseToDay(date, 'main', addSheetRecipe);
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    const todayDate = todayLocal();
    const label = date === todayDate ? "tonight's" : getDayLabel(date) + "'s";
    showToast(`Added to ${label} plan.`);
    setAddSheetRecipe(null);
  }, [addSheetRecipe, app, showToast]);

  const toggleAllergenFilter = useCallback((a: AllergenType) => {
    try { Haptics.selectionAsync(); } catch {}
    setExcludedAllergens((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  }, []);

  const handleIngredientPress = useCallback((ingredientQuery: string) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setQuery(ingredientQuery);
    inputRef.current?.focus();
  }, []);

  const filteredRecipes = useMemo(() => {
    let results = recipes;

    if (activeMood !== 'All Moods') {
      const moodMap: Record<string, (r: Recipe) => boolean> = {
        'Quick & Easy': (r) => r.prepTime + r.cookTime <= 30 && r.difficulty === 'Easy',
        'Comfort Food': (r) => r.category === 'main' && r.cookTime >= 30,
        'Date Night':   (r) => r.difficulty === 'Hard' || r.cookTime >= 60,
        'Adventurous':  (r) => ['japan', 'thailand', 'morocco', 'india', 'mexico'].includes(r.countryId),
        'Healthy':      (r) => r.ingredients.some((i) => i.category === 'Produce'),
        'Sweet':        (r) => r.category === 'dessert',
      };
      const filter = moodMap[activeMood];
      if (filter) results = results.filter(filter);
    }

    if (excludedAllergens.length > 0) {
      results = results.filter((r) => !excludedAllergens.some((a) => r.allergens.includes(a)));
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.ingredients.some((i) => i.name.toLowerCase().includes(q))
      );
    }

    return results;
  }, [query, activeMood, excludedAllergens]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <HeaderBar />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: Spacing.tabClearance, paddingTop: insets.top + 76 }}
      >
        {/* Search bar */}
        <View style={{ paddingHorizontal: Spacing.page, marginBottom: Spacing.lg }}>
          <View style={[styles.searchBar, { backgroundColor: colors.surfaceContainerHigh }]}>
            <MaterialCommunityIcons name="magnify" size={22} color={colors.outline} />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Ingredients, dishes, or moods..."
              placeholderTextColor={colors.outline}
              style={[Typography.body, { color: colors.onSurface, flex: 1 }]}
              returnKeyType="search"
              accessibilityLabel="Search recipes"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <MaterialCommunityIcons name="close-circle" size={18} color={colors.outline} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Exclude Allergens */}
        <View style={{ paddingHorizontal: Spacing.page, marginBottom: Spacing.lg }}>
          <Text style={[styles.sectionLabel, { color: colors.outline }]}>EXCLUDE ALLERGENS</Text>
          <View style={styles.allergenWrap}>
            {ALLERGEN_FILTERS.map((a) => {
              const info = ALLERGEN_INFO[a];
              const isActive = excludedAllergens.includes(a);
              return (
                <Pressable
                  key={a}
                  onPress={() => toggleAllergenFilter(a)}
                  style={[
                    styles.allergenChip,
                    {
                      backgroundColor: isActive ? `${colors.error}18` : colors.surfaceContainerHigh,
                      borderWidth: 1,
                      borderColor: isActive ? colors.error : colors.outlineVariant,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text style={[Typography.caption, {
                    color: isActive ? colors.error : colors.onSurfaceVariant,
                    fontWeight: isActive ? '600' : '400',
                  }]}>
                    {info.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Moods */}
        <View style={{ marginBottom: Spacing.lg }}>
          <Text style={[styles.sectionLabel, { color: colors.outline, paddingHorizontal: Spacing.page }]}>MOODS</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.pillRow, { paddingHorizontal: Spacing.page }]}
          >
            {MOODS.map((mood) => {
              const isActive = activeMood === mood;
              return (
                <PressableScale
                  key={mood}
                  haptic="selection"
                  onPress={() => setActiveMood(mood)}
                  style={[
                    styles.moodPill,
                    {
                      backgroundColor: isActive ? colors.primary : colors.surfaceContainerHigh,
                      shadowColor: isActive ? colors.primary : 'transparent',
                      shadowOpacity: isActive ? 0.25 : 0,
                      shadowRadius: 4,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: isActive ? 3 : 0,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text style={[Typography.labelSmall, {
                    color: isActive ? colors.onPrimary : colors.onSurface,
                    fontWeight: '600',
                  }]}>
                    {mood}
                  </Text>
                </PressableScale>
              );
            })}
          </ScrollView>
        </View>

        {/* Search by Ingredient */}
        <View style={[styles.ingredientSection, { backgroundColor: colors.surfaceContainerLow }]}>
          <Text style={[Typography.headline, { color: colors.onSurface, paddingHorizontal: Spacing.page, marginBottom: Spacing.md }]}>
            Search by Ingredient
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: Spacing.page, gap: 20, paddingBottom: Spacing.sm }}
          >
            {INGREDIENT_CIRCLES.map((ing) => (
              <PressableScale
                key={ing.label}
                haptic="light"
                onPress={() => handleIngredientPress(ing.query)}
                style={styles.ingredientCircleWrap}
                accessibilityRole="button"
                accessibilityLabel={`Search by ${ing.label}`}
              >
                <View style={[styles.ingredientCircle, {
                  shadowColor: '#000',
                  shadowOpacity: 0.12,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 3,
                }]}>
                  <Image
                    source={{ uri: ing.image }}
                    style={styles.ingredientImg}
                    contentFit="cover"
                    transition={200}
                    accessible={false}
                  />
                </View>
                <Text style={[Typography.caption, { color: colors.onSurfaceVariant, fontWeight: '500', textAlign: 'center' }]}>
                  {ing.label}
                </Text>
              </PressableScale>
            ))}
          </ScrollView>
        </View>

        {/* Recipe results */}
        <View style={{ paddingHorizontal: Spacing.page, paddingTop: Spacing.lg }}>
          <View style={styles.sectionHeader}>
            <Text style={[Typography.headline, { color: colors.onSurface }]}>
              {query.trim() ? 'Results' : 'Curated for You'}
            </Text>
            {filteredRecipes.length > 0 && (
              <Text style={[Typography.caption, { color: colors.outline }]}>
                {filteredRecipes.length} recipes
              </Text>
            )}
          </View>

          {filteredRecipes.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceContainerHigh }]}>
                <MaterialCommunityIcons name="magnify" size={28} color={colors.outlineVariant} />
              </View>
              <Text style={[Typography.headline, { color: colors.onSurface, textAlign: 'center' }]}>No matches</Text>
              <Text style={[Typography.bodySmall, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
                Try different keywords or adjust your filters
              </Text>
            </View>
          ) : (
            <View style={styles.recipeGrid}>
              {filteredRecipes.map((recipe, index) => (
                <AnimatedListItem key={recipe.id} index={index}>
                  <PressableScale
                    onPress={() => router.push(`/recipe/${recipe.id}`)}
                    style={[styles.recipeCard, { width: CARD_WIDTH, backgroundColor: colors.surfaceContainerLow }]}
                    accessibilityRole="button"
                    accessibilityLabel={recipe.title}
                    scaleDown={0.97}
                  >
                    <View style={styles.recipeImageWrap}>
                      <Image
                        source={{ uri: recipe.image }}
                        style={styles.recipeImage}
                        contentFit="cover"
                        transition={300}
                        accessible={false}
                      />
                      <View style={styles.overlayStack}>
                        <Pressable
                          onPress={(e) => { e.stopPropagation(); toggleBookmark(recipe.id); }}
                          style={[styles.overlayBtn, {
                            backgroundColor: OVERLAY_BUTTON.background,
                            borderWidth: OVERLAY_BUTTON.borderWidth,
                            borderColor: OVERLAY_BUTTON.borderColor,
                          }]}
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityLabel={isBookmarked(recipe.id) ? 'Remove from saved' : 'Save recipe'}
                        >
                          <AnimatedHeart
                            filled={isBookmarked(recipe.id)}
                            onToggle={() => toggleBookmark(recipe.id)}
                            size={OVERLAY_BUTTON.iconSize}
                            filledColor={colors.primary}
                            outlineColor={OVERLAY_BUTTON.iconColor}
                            hitSlop={0}
                          />
                        </Pressable>
                        <AddToPlanButton onPress={() => setAddSheetRecipe(recipe)} recipeName={recipe.title} variant="overlay" />
                      </View>
                    </View>
                    <View style={styles.recipeCardContent}>
                      <Text style={[Typography.titleSmall, { color: colors.onSurface }]} numberOfLines={2}>
                        {recipe.title}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 12 }}>{countries.find((c) => c.id === recipe.countryId)?.flag}</Text>
                        <Text style={[Typography.caption, { color: colors.outline }]}>
                          {formatCookTime(recipe.prepTime + recipe.cookTime)} · {recipe.difficulty}
                        </Text>
                      </View>
                    </View>
                  </PressableScale>
                </AnimatedListItem>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {toastMessage && (
        <View style={[styles.toast, { backgroundColor: colors.inverseSurface }]}>
          <MaterialCommunityIcons name="check-circle" size={16} color={colors.inversePrimary} />
          <Text style={[Typography.titleSmall, { color: colors.inverseOnSurface }]}>{toastMessage}</Text>
        </View>
      )}

      <AddToPlanSheet
        visible={!!addSheetRecipe}
        recipeName={addSheetRecipe?.title ?? ''}
        onClose={() => setAddSheetRecipe(null)}
        onAdd={handleAddToPlan}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    height: 52,
    borderRadius: Radius.xl,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  allergenWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  allergenChip: {
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 7,
    borderRadius: Radius.full,
  },

  pillRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  moodPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },

  ingredientSection: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  ingredientCircleWrap: {
    alignItems: 'center',
    gap: 6,
    width: 64,
  },
  ingredientCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  ingredientImg: {
    width: '100%',
    height: '100%',
  },

  recipeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  recipeCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  recipeImageWrap: {
    position: 'relative',
  },
  recipeImage: {
    width: '100%',
    height: 160,
  },
  overlayStack: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    gap: 6,
    alignItems: 'center',
  },
  overlayBtn: {
    width: OVERLAY_BUTTON.size,
    height: OVERLAY_BUTTON.size,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeCardContent: {
    padding: Spacing.sm,
    gap: 4,
  },

  emptyState: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
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
