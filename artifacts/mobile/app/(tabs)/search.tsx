import React, { useState, useMemo, useCallback, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable,
  Modal,
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
import { AddToPlanSheet, AddToPlanButton } from '@/components/AddToPlanSheet';
import { OVERLAY_BUTTON } from '@/constants/icons';
import { recipes, Recipe } from '@/data/recipes';
import { countries } from '@/data/countries';
import { formatCookTime } from '@/data/helpers';
import { useApp } from '@/context/AppContext';
import { useBookmarks } from '@/context/BookmarksContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { todayLocal, getDayLabel } from '@/utils/dates';
import { useCuratedCollections } from '@/hooks/useCuratedCollections';

// ─── Types & Constants ────────────────────────────────────────────────────────

type DietaryFilter = 'vegan' | 'gluten-free' | 'keto' | 'low-carb' | 'dairy-free' | 'nut-free';

const DIETARY_FILTERS: { id: DietaryFilter; label: string }[] = [
  { id: 'vegan',       label: 'Vegan' },
  { id: 'gluten-free', label: 'Gluten-Free' },
  { id: 'keto',        label: 'Keto' },
  { id: 'low-carb',    label: 'Low-Carb' },
  { id: 'dairy-free',  label: 'Dairy-Free' },
  { id: 'nut-free',    label: 'Nut-Free' },
];

const INGREDIENT_CIRCLES = [
  { label: 'Chicken', query: 'chicken', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d11bbc?w=200&h=200&fit=crop' },
  { label: 'Egg',     query: 'egg',     image: 'https://images.unsplash.com/photo-1607690424560-35d967d6ad7f?w=200&h=200&fit=crop' },
  { label: 'Pasta',   query: 'pasta',   image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=200&h=200&fit=crop' },
  { label: 'Lemon',   query: 'lemon',   image: 'https://images.unsplash.com/photo-1571735360272-e0427f4dc97f?w=200&h=200&fit=crop' },
  { label: 'Rice',    query: 'rice',    image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=200&h=200&fit=crop' },
  { label: 'Tomato',  query: 'tomato',  image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200&h=200&fit=crop' },
];

interface MealCategory {
  label: string;
  image: string;
  filter: (r: Recipe) => boolean;
}

const MEAL_CATEGORIES: MealCategory[] = [
  {
    label: 'Breakfast',
    image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&fit=crop',
    filter: (r) => r.prepTime + r.cookTime <= 25 || r.category === 'appetizer',
  },
  {
    label: 'Brunch',
    image: 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=600&fit=crop',
    filter: (r) => r.category === 'appetizer' || (r.category === 'main' && r.prepTime + r.cookTime <= 40),
  },
  {
    label: 'Lunch',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&fit=crop',
    filter: (r) => r.category === 'main' && r.prepTime + r.cookTime <= 55,
  },
  {
    label: 'Dinner',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&fit=crop',
    filter: (r) => r.category === 'main',
  },
];

// ─── Dietary filter logic ─────────────────────────────────────────────────────

function applyDietaryFilters(r: Recipe, filters: DietaryFilter[]): boolean {
  for (const f of filters) {
    if (f === 'gluten-free' && r.allergens.includes('wheat')) return false;
    if (f === 'dairy-free'  && r.allergens.includes('milk'))  return false;
    if (f === 'nut-free' && (r.allergens.includes('peanuts') || r.allergens.includes('tree_nuts'))) return false;
    if (f === 'vegan') {
      if (r.allergens.includes('egg') || r.allergens.includes('milk')) return false;
      const meatWords = ['chicken', 'beef', 'pork', 'lamb', 'fish', 'shrimp', 'meat', 'bacon', 'turkey', 'prawn', 'anchovy'];
      if (r.ingredients.some(i => meatWords.some(m => i.name.toLowerCase().includes(m)))) return false;
    }
    if (f === 'keto' || f === 'low-carb') {
      if (r.allergens.includes('wheat')) return false;
    }
  }
  return true;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface RecipeCardProps {
  recipe: Recipe;
  cardWidth: number;
  onPress: () => void;
  isBookmarked: boolean;
  onBookmark: () => void;
  onAddToPlan: () => void;
  colors: ReturnType<typeof useThemeColors>;
}

function RecipeCard({ recipe, cardWidth, onPress, isBookmarked: bookmarked, onBookmark, onAddToPlan, colors }: RecipeCardProps) {
  const country = countries.find((c) => c.id === recipe.countryId);
  return (
    <PressableScale
      onPress={onPress}
      style={[cardStyles.card, { width: cardWidth, backgroundColor: colors.surfaceContainerLow }]}
      scaleDown={0.97}
      accessibilityRole="button"
      accessibilityLabel={recipe.title}
    >
      <View style={cardStyles.imageWrap}>
        <Image source={{ uri: recipe.image }} style={cardStyles.image} contentFit="cover" transition={300} accessible={false} />
        <View style={cardStyles.overlayStack}>
          <Pressable
            onPress={(e) => { e.stopPropagation(); onBookmark(); }}
            style={[cardStyles.overlayBtn, { backgroundColor: OVERLAY_BUTTON.background, borderWidth: OVERLAY_BUTTON.borderWidth, borderColor: OVERLAY_BUTTON.borderColor }]}
            hitSlop={8}
          >
            <AnimatedHeart filled={bookmarked} onToggle={onBookmark} size={OVERLAY_BUTTON.iconSize} filledColor={colors.primary} outlineColor={OVERLAY_BUTTON.iconColor} hitSlop={0} />
          </Pressable>
          <AddToPlanButton onPress={onAddToPlan} recipeName={recipe.title} variant="overlay" />
        </View>
      </View>
      <View style={cardStyles.content}>
        <Text style={[Typography.titleSmall, { color: colors.onSurface }]} numberOfLines={2}>{recipe.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 12 }}>{country?.flag}</Text>
          <Text style={[Typography.caption, { color: colors.outline }]}>
            {formatCookTime(recipe.prepTime + recipe.cookTime)} · {recipe.difficulty}
          </Text>
        </View>
      </View>
    </PressableScale>
  );
}

const cardStyles = StyleSheet.create({
  card: { borderRadius: Radius.xl, overflow: 'hidden' },
  imageWrap: { position: 'relative' },
  image: { width: '100%', height: 160 },
  overlayStack: { position: 'absolute', top: Spacing.sm, right: Spacing.sm, gap: 6, alignItems: 'center' },
  overlayBtn: { width: OVERLAY_BUTTON.size, height: OVERLAY_BUTTON.size, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.sm, gap: 4 },
});

// ─── Category Modal ───────────────────────────────────────────────────────────

interface CategoryModalProps {
  category: MealCategory;
  recipes: Recipe[];
  onClose: () => void;
  onRecipePress: (id: string) => void;
  onAddToPlan: (recipe: Recipe) => void;
  isBookmarked: (id: string) => boolean;
  onBookmark: (id: string) => void;
  colors: ReturnType<typeof useThemeColors>;
  insets: { bottom: number; top: number };
}

function CategoryModal({ category, recipes: categoryRecipes, onClose, onRecipePress, onAddToPlan, isBookmarked, onBookmark, colors, insets }: CategoryModalProps) {
  const { width } = useWindowDimensions();
  const CARD_W = (width - Spacing.page * 2 - 12) / 2;

  return (
    <Pressable style={modalStyles.backdrop} onPress={onClose}>
      <Pressable style={[modalStyles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + Spacing.lg }]} onPress={(e) => e.stopPropagation()}>
        {/* Handle */}
        <View style={[modalStyles.handle, { backgroundColor: colors.outlineVariant }]} />

        {/* Hero image */}
        <View style={modalStyles.heroWrap}>
          <Image source={{ uri: category.image }} style={modalStyles.heroImage} contentFit="cover" transition={300} accessible={false} />
          <View style={modalStyles.heroGradient} />
          <View style={modalStyles.heroContent}>
            <Text style={[Typography.display, { color: '#FFFFFF' }]}>{category.label}</Text>
            <Text style={[Typography.bodySmall, { color: 'rgba(255,255,255,0.8)' }]}>{categoryRecipes.length} recipes</Text>
          </View>
          <Pressable onPress={onClose} style={modalStyles.closeBtn} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
            <MaterialCommunityIcons name="close" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Recipe grid */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={modalStyles.gridContainer}>
          <View style={modalStyles.grid}>
            {categoryRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                cardWidth={CARD_W}
                onPress={() => onRecipePress(recipe.id)}
                isBookmarked={isBookmarked(recipe.id)}
                onBookmark={() => onBookmark(recipe.id)}
                onAddToPlan={() => onAddToPlan(recipe)}
                colors={colors}
              />
            ))}
          </View>
        </ScrollView>
      </Pressable>
    </Pressable>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    overflow: 'hidden',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  heroWrap: {
    height: 200,
    position: 'relative',
    marginBottom: Spacing.md,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)',
  },
  heroContent: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.page,
    gap: 2,
  },
  closeBtn: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridContainer: {
    paddingHorizontal: Spacing.page,
    paddingBottom: Spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

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
  const [activeDietaryFilters, setActiveDietaryFilters] = useState<DietaryFilter[]>([]);
  const [categoryModal, setCategoryModal] = useState<MealCategory | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [addSheetRecipe, setAddSheetRecipe] = useState<Recipe | null>(null);

  // Curated collections render as horizontal carousels above the
  // search results — but only when the query is empty. Once the
  // user starts typing or picks a filter, we hide the carousels
  // so the full Results grid can breathe.
  const curatedCollections = useCuratedCollections();
  const showCollections =
    !query.trim() && activeMood === 'All Moods' && curatedCollections.length > 0;

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

  const toggleDietaryFilter = useCallback((f: DietaryFilter) => {
    try { Haptics.selectionAsync(); } catch {}
    setActiveDietaryFilters((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  }, []);

  const handleIngredientPress = useCallback((ingredientQuery: string) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setQuery(ingredientQuery);
    inputRef.current?.focus();
  }, []);

  const curatedCollections = useCuratedCollections();
  const isSearchActive = query.trim().length > 0 || activeDietaryFilters.length > 0;

  const filteredRecipes = useMemo(() => {
    if (!isSearchActive) return [];
    let results = recipes;

    if (activeDietaryFilters.length > 0) {
      results = results.filter((r) => applyDietaryFilters(r, activeDietaryFilters));
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
  }, [query, activeDietaryFilters, isSearchActive]);

  const categoryRecipes = useMemo(() => {
    if (!categoryModal) return [];
    return recipes.filter(categoryModal.filter);
  }, [categoryModal]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <HeaderBar />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: Spacing.tabClearance, paddingTop: insets.top + 76 }}
      >
        {/* ── Search bar ── */}
        <View style={{ paddingHorizontal: Spacing.page, marginBottom: Spacing.xl }}>
          <View style={[styles.searchBar, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
            <MaterialCommunityIcons name="magnify" size={22} color={colors.onSurfaceVariant} />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Search cuisines, ingredients..."
              placeholderTextColor={colors.outline}
              style={[Typography.body, { color: colors.onSurface, flex: 1 }]}
              returnKeyType="search"
              accessibilityLabel="Search recipes"
            />
            {query.length > 0 ? (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <MaterialCommunityIcons name="close-circle" size={18} color={colors.outline} />
              </Pressable>
            ) : (
              <MaterialCommunityIcons name="tune-variant" size={20} color={colors.primary} />
            )}
          </View>
        </View>

        {/* ── Search by Ingredient ── */}
        <View style={{ marginBottom: Spacing.xl }}>
          <Text style={[Typography.headline, { color: colors.onSurface, paddingHorizontal: Spacing.page, marginBottom: Spacing.md }]}>
            Search by Ingredient
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: Spacing.page, gap: 20, paddingVertical: Spacing.xs }}
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
                <View style={[styles.ingredientCircle, { backgroundColor: colors.surfaceContainerHigh }]}>
                  <Image
                    source={{ uri: ing.image }}
                    style={styles.ingredientImg}
                    contentFit="cover"
                    transition={200}
                    accessible={false}
                  />
                </View>
                <Text style={[Typography.caption, { color: colors.onSurface, fontWeight: '500', textAlign: 'center' }]}>
                  {ing.label}
                </Text>
              </PressableScale>
            ))}
          </ScrollView>
        </View>

        {/* ── Dietary Filters ── */}
        <View style={{ paddingHorizontal: Spacing.page, marginBottom: Spacing.xl }}>
          <Text style={[Typography.labelSmall, { color: colors.primary, fontWeight: '700', letterSpacing: 0.5, marginBottom: Spacing.md }]}>
            Dietary Filters
          </Text>
          <View style={styles.dietaryWrap}>
            {DIETARY_FILTERS.map((f) => {
              const isActive = activeDietaryFilters.includes(f.id);
              return (
                <Pressable
                  key={f.id}
                  onPress={() => toggleDietaryFilter(f.id)}
                  style={[
                    styles.dietaryPill,
                    {
                      borderColor: isActive ? colors.primary : colors.outlineVariant,
                      backgroundColor: isActive ? colors.primary : 'transparent',
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text style={[Typography.bodySmall, {
                    color: isActive ? colors.onPrimary : colors.onSurfaceVariant,
                    fontWeight: '500',
                  }]}>
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Explore by Meal  OR  Search Results ── */}
        {isSearchActive ? (
          <View style={{ paddingHorizontal: Spacing.page }}>
            <View style={styles.sectionHeader}>
              <Text style={[Typography.headline, { color: colors.onSurface }]}>Results</Text>
              {filteredRecipes.length > 0 && (
                <Text style={[Typography.caption, { color: colors.outline }]}>{filteredRecipes.length} recipes</Text>
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
                {filteredRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    cardWidth={CARD_WIDTH}
                    onPress={() => router.push(`/recipe/${recipe.id}`)}
                    isBookmarked={isBookmarked(recipe.id)}
                    onBookmark={() => toggleBookmark(recipe.id)}
                    onAddToPlan={() => setAddSheetRecipe(recipe)}
                    colors={colors}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={{ paddingHorizontal: Spacing.page }}>
            <Text style={[Typography.headline, { color: colors.onSurface, marginBottom: Spacing.md }]}>
              Explore by Meal
            </Text>
            <View style={styles.mealGrid}>
              {MEAL_CATEGORIES.map((cat) => (
                <PressableScale
                  key={cat.label}
                  haptic="light"
                  onPress={() => {
                    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                    setCategoryModal(cat);
                  }}
                  style={styles.mealCard}
                  accessibilityRole="button"
                  accessibilityLabel={`Explore ${cat.label} recipes`}
                >
                  <Image
                    source={{ uri: cat.image }}
                    style={StyleSheet.absoluteFillObject}
                    contentFit="cover"
                    transition={300}
                    accessible={false}
                  />
                  <View style={styles.mealCardGradient} />
                  <Text style={[Typography.titleSmall, styles.mealCardLabel]}>{cat.label}</Text>
                </PressableScale>
              ))}
            </View>

            {/* ── Curated Collections (admin-editorial carousels) ── */}
            {curatedCollections.map((collection) => {
              const collectionRecipes = collection.recipeIds
                .map((id) => recipes.find((r) => r.id === id))
                .filter((r): r is Recipe => r !== undefined);
              if (collectionRecipes.length === 0) return null;
              return (
                <View key={collection.slug} style={{ marginTop: Spacing.xl }}>
                  <View style={styles.sectionHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[Typography.headline, { color: colors.onSurface }]} numberOfLines={1}>
                        {collection.title}
                      </Text>
                      {collection.subtitle && (
                        <Text style={[Typography.caption, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                          {collection.subtitle}
                        </Text>
                      )}
                    </View>
                    <Text style={[Typography.caption, { color: colors.outline }]}>
                      {collectionRecipes.length}
                    </Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 12, paddingTop: Spacing.sm }}
                  >
                    {collectionRecipes.map((recipe) => {
                      const country = countries.find((c) => c.id === recipe.countryId);
                      return (
                        <PressableScale
                          key={`${collection.slug}-${recipe.id}`}
                          onPress={() => router.push(`/recipe/${recipe.id}`)}
                          style={[styles.collectionCard, { backgroundColor: colors.surfaceContainerLow }]}
                          accessibilityRole="button"
                          accessibilityLabel={recipe.title}
                        >
                          <Image source={{ uri: recipe.image }} style={styles.collectionCardImage} contentFit="cover" transition={200} accessible={false} />
                          <View style={{ padding: 10 }}>
                            <Text numberOfLines={2} style={[Typography.titleSmall, { color: colors.onSurface }]}>{recipe.title}</Text>
                            <Text style={[Typography.caption, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
                              {country?.flag ?? '🌍'} {formatCookTime(recipe.prepTime + recipe.cookTime)}
                            </Text>
                          </View>
                        </PressableScale>
                      );
                    })}
                  </ScrollView>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ── Category Modal ── */}
      <Modal
        visible={!!categoryModal}
        animationType="slide"
        transparent
        onRequestClose={() => setCategoryModal(null)}
      >
        {categoryModal && (
          <CategoryModal
            category={categoryModal}
            recipes={categoryRecipes}
            onClose={() => setCategoryModal(null)}
            onRecipePress={(id) => { setCategoryModal(null); router.push(`/recipe/${id}`); }}
            onAddToPlan={(recipe) => { setAddSheetRecipe(recipe); }}
            isBookmarked={isBookmarked}
            onBookmark={toggleBookmark}
            colors={colors}
            insets={insets}
          />
        )}
      </Modal>

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
    height: 54,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  ingredientCircleWrap: {
    alignItems: 'center',
    gap: 6,
    width: 72,
  },
  ingredientCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
  },
  ingredientImg: {
    width: '100%',
    height: '100%',
  },

  dietaryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  dietaryPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
  },

  mealGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  collectionCard: {
    width: 180,
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  collectionCardImage: {
    width: '100%',
    height: 120,
  },
  mealCard: {
    width: '47.5%',
    height: 160,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  mealCardGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  mealCardLabel: {
    color: '#FFFFFF',
    margin: Spacing.md,
    fontWeight: '700',
    fontSize: 17,
  },

  recipeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
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
