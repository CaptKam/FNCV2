import React, { useState, useMemo, useCallback, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useApp } from '@/context/AppContext';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { PressableScale } from '@/components/PressableScale';
import { AnimatedHeart } from '@/components/AnimatedHeart';
import { AddToPlanSheet, AddToPlanButton } from '@/components/AddToPlanSheet';
import { BottomSheet } from '@/components/BottomSheet';
import { OVERLAY_BUTTON } from '@/constants/icons';
import { recipes, Recipe } from '@/data/recipes';
import { countries } from '@/data/countries';
import { formatCookTime } from '@/data/helpers';
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
  { label: 'Tomato',  query: 'tomato',  image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200&h=200&fit=crop' },
  { label: 'Garlic',  query: 'garlic',  image: 'https://images.unsplash.com/photo-1501200291289-c5a76c232e5f?w=200&h=200&fit=crop' },
  { label: 'Chicken', query: 'chicken', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d11bbc?w=200&h=200&fit=crop' },
  { label: 'Lemon',   query: 'lemon',   image: 'https://images.unsplash.com/photo-1571735360272-e0427f4dc97f?w=200&h=200&fit=crop' },
  { label: 'Egg',     query: 'egg',     image: 'https://images.unsplash.com/photo-1607690424560-35d967d6ad7f?w=200&h=200&fit=crop' },
  { label: 'Pasta',   query: 'pasta',   image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=200&h=200&fit=crop' },
  { label: 'Rice',    query: 'rice',    image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=200&h=200&fit=crop' },
];

interface MealCategory {
  label: string;
  image: string;
  filter: (r: Recipe) => boolean;
}

const MEAL_CATEGORIES: MealCategory[] = [
  {
    label: 'Starters',
    image: 'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=600&h=600&fit=crop',
    filter: (r) => r.category === 'appetizer',
  },
  {
    label: 'Mains',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=600&fit=crop',
    filter: (r) => r.category === 'main',
  },
  {
    label: 'Desserts',
    image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600&h=600&fit=crop',
    filter: (r) => r.category === 'dessert',
  },
  {
    label: 'Quick',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=600&fit=crop',
    filter: (r) => r.prepTime + r.cookTime <= 30,
  },
  {
    label: 'Slow Cook',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&h=600&fit=crop',
    filter: (r) => r.prepTime + r.cookTime >= 90,
  },
  {
    label: 'Vegetarian',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=600&fit=crop',
    filter: (r) => !r.ingredients.some(i =>
      ['chicken','beef','pork','lamb','fish','shrimp','prawn','anchovy','bacon','turkey'].some(m =>
        i.name.toLowerCase().includes(m)
      )
    ),
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

// ─── Recipe Card ──────────────────────────────────────────────────────────────

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

function CategoryModal({ category, recipes: categoryRecipes, onClose, onRecipePress, onAddToPlan, isBookmarked, onBookmark, colors }: CategoryModalProps) {
  const { width } = useWindowDimensions();
  const CARD_W = (width - Spacing.page * 2 - 12) / 2;
  return (
    <>
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
    </>
  );
}

const modalStyles = StyleSheet.create({
  heroWrap: { height: 200, position: 'relative', marginBottom: Spacing.md },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  heroContent: { position: 'absolute', bottom: Spacing.lg, left: Spacing.page, gap: 2 },
  closeBtn: {
    position: 'absolute', top: Spacing.md, right: Spacing.md,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center',
  },
  gridContainer: { paddingHorizontal: Spacing.page, paddingBottom: Spacing.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});

// ─── Search Header (replaces HeaderBar on this tab) ───────────────────────────

interface SearchHeaderProps {
  query: string;
  onChangeText: (t: string) => void;
  onClear: () => void;
  inputRef: React.RefObject<TextInput | null>;
  colors: ReturnType<typeof useThemeColors>;
  insets: { top: number };
  displayName: string;
  onProfilePress: () => void;
}

function SearchHeader({ query, onChangeText, onClear, inputRef, colors, insets, displayName, onProfilePress }: SearchHeaderProps) {
  const initial = displayName.trim().charAt(0).toUpperCase() || null;
  const HEADER_H = insets.top + 68;

  const inner = (
    <View style={[searchHeaderStyles.inner, { paddingTop: insets.top + 10 }]}>
      {/* User initial / profile */}
      <Pressable
        onPress={onProfilePress}
        style={[searchHeaderStyles.avatar, { backgroundColor: 'rgba(154,65,0,0.10)' }]}
        accessibilityRole="button"
        accessibilityLabel="Profile"
      >
        {initial ? (
          <Text style={[searchHeaderStyles.initial, { color: '#9A4100' }]}>{initial}</Text>
        ) : (
          <MaterialCommunityIcons name="account-outline" size={20} color={colors.primary} />
        )}
      </Pressable>

      {/* Search input */}
      <View style={[searchHeaderStyles.inputWrap, { backgroundColor: colors.surfaceContainerLow }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.primary} />
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={onChangeText}
          placeholder="Search cuisines, ingredients..."
          placeholderTextColor={colors.outline}
          style={[Typography.bodySmall, { color: colors.onSurface, flex: 1 }]}
          returnKeyType="search"
          accessibilityLabel="Search recipes"
        />
        {query.length > 0 && (
          <Pressable onPress={onClear} hitSlop={8}>
            <MaterialCommunityIcons name="close-circle" size={17} color={colors.outline} />
          </Pressable>
        )}
      </View>
    </View>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={[
        searchHeaderStyles.container,
        { height: HEADER_H, backgroundColor: `${colors.surface}E8`, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(154,65,0,0.10)' },
      ]}>
        {inner}
      </View>
    );
  }

  return (
    <BlurView
      intensity={60}
      tint={colors.isDark ? 'dark' : 'light'}
      style={[searchHeaderStyles.container, { height: HEADER_H }]}
    >
      <View style={[StyleSheet.absoluteFill, {
        backgroundColor: `${colors.surface}CC`,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(154,65,0,0.10)',
      }]} />
      {inner}
    </BlurView>
  );
}

const searchHeaderStyles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 70 },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.page,
    paddingBottom: 10,
    gap: 10,
  },
  avatar: {
    width: 38, height: 38, borderRadius: Radius.full,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  initial: { fontFamily: 'NotoSerif_700Bold', fontSize: 15 },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 23,
  },
});

// ─── Bento Card ───────────────────────────────────────────────────────────────

interface BentoCardProps {
  recipe: Recipe;
  size: 'large' | 'small';
  onPress: () => void;
}

function BentoCard({ recipe, size, onPress }: BentoCardProps) {
  const country = countries.find(c => c.id === recipe.countryId);
  return (
    <PressableScale
      onPress={onPress}
      style={[bentoStyles.card, size === 'large' ? bentoStyles.large : bentoStyles.small]}
      scaleDown={0.98}
      accessibilityRole="button"
      accessibilityLabel={recipe.title}
    >
      <Image
        source={{ uri: recipe.image }}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        transition={300}
        accessible={false}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.72)']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={bentoStyles.cardContent}>
        {size === 'large' && (
          <Text style={bentoStyles.tagline}>Featured Recipe</Text>
        )}
        <Text style={[bentoStyles.title, size === 'small' && bentoStyles.titleSmall]} numberOfLines={2}>
          {recipe.title}
        </Text>
        {size === 'large' && (
          <View style={bentoStyles.meta}>
            <MaterialCommunityIcons name="clock-outline" size={13} color="rgba(255,255,255,0.85)" />
            <Text style={bentoStyles.metaText}>{formatCookTime(recipe.prepTime + recipe.cookTime)}</Text>
            <Text style={bentoStyles.metaDot}>·</Text>
            <Text style={bentoStyles.metaText}>{country?.flag} {recipe.difficulty}</Text>
          </View>
        )}
      </View>
    </PressableScale>
  );
}

const bentoStyles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  large: { height: 260 },
  small: { height: 120, flex: 1 },
  cardContent: { padding: 16, gap: 4 },
  tagline: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  title: {
    fontFamily: 'NotoSerif_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
    lineHeight: 26,
  },
  titleSmall: { fontSize: 14, lineHeight: 18 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  metaText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  metaDot: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SearchScreen() {
  const { width } = useWindowDimensions();
  const CARD_WIDTH = (width - Spacing.page * 2 - 12) / 2;
  const CATEGORY_COL = (width - Spacing.page * 2 - 12) / 2;
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { displayName } = useApp();
  const app = useApp();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const inputRef = useRef<TextInput | null>(null);

  const [query, setQuery] = useState('');
  const [activeDietaryFilters, setActiveDietaryFilters] = useState<DietaryFilter[]>([]);
  const [categoryModal, setCategoryModal] = useState<MealCategory | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [addSheetRecipe, setAddSheetRecipe] = useState<Recipe | null>(null);

  const curatedCollections = useCuratedCollections();

  // Bento featured picks — pick a moroccan/italian/indian main as hero + 2 secondary
  const featuredRecipe = useMemo(() =>
    recipes.find(r => r.category === 'main' && r.countryId === 'morocco') ?? recipes[0],
    []
  );
  const secondaryRecipes = useMemo(() =>
    recipes.filter(r => r.id !== featuredRecipe.id && r.category === 'main').slice(2, 4),
    [featuredRecipe]
  );

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

  const HEADER_PUSH = insets.top + 78;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* ── Custom search header (no brand wordmark on search tab) ── */}
      <SearchHeader
        query={query}
        onChangeText={setQuery}
        onClear={() => setQuery('')}
        inputRef={inputRef}
        colors={colors}
        insets={insets}
        displayName={displayName}
        onProfilePress={() => router.push('/profile')}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: Spacing.tabClearance, paddingTop: HEADER_PUSH }}
      >
        {isSearchActive ? (
          /* ─── Active search: results only ─── */
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

            {/* Dietary filters always accessible during search */}
            <View style={{ marginTop: Spacing.xl }}>
              <Text style={[Typography.labelSmall, { color: colors.primary, fontWeight: '700', letterSpacing: 0.5, marginBottom: Spacing.md }]}>
                Dietary Preferences
              </Text>
              <View style={styles.dietaryWrap}>
                {DIETARY_FILTERS.map((f) => {
                  const isActive = activeDietaryFilters.includes(f.id);
                  return (
                    <Pressable
                      key={f.id}
                      onPress={() => toggleDietaryFilter(f.id)}
                      style={[styles.dietaryPill, {
                        borderColor: isActive ? colors.primary : colors.outlineVariant,
                        backgroundColor: isActive ? colors.primary : 'transparent',
                      }]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                    >
                      <Text style={[Typography.bodySmall, {
                        color: isActive ? colors.onPrimary : colors.onSurfaceVariant,
                        fontWeight: '500',
                      }]}>{f.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        ) : (
          <>
            {/* ─── Explore by Category ─── */}
            <View style={{ paddingHorizontal: Spacing.page, marginBottom: Spacing.xl }}>
              <View style={styles.sectionHeader}>
                <Text style={[Typography.headline, { color: colors.onSurface }]}>Explore by Category</Text>
                <Text style={[Typography.caption, { color: colors.primary, fontWeight: '700' }]}>View all</Text>
              </View>
              <View style={styles.categoryGrid}>
                {MEAL_CATEGORIES.map((cat) => {
                  const count = recipes.filter(cat.filter).length;
                  return (
                    <PressableScale
                      key={cat.label}
                      haptic="light"
                      onPress={() => setCategoryModal(cat)}
                      style={[styles.categoryItem, { width: CATEGORY_COL }]}
                      accessibilityRole="button"
                      accessibilityLabel={`Explore ${cat.label} recipes`}
                    >
                      <View style={[styles.categoryCircle, { backgroundColor: colors.surfaceContainerHigh }]}>
                        <Image
                          source={{ uri: cat.image }}
                          style={StyleSheet.absoluteFillObject}
                          contentFit="cover"
                          transition={300}
                          accessible={false}
                        />
                        {/* Subtle dark vignette */}
                        <View style={styles.categoryCircleOverlay} />
                      </View>
                      <Text style={[styles.categoryLabel, { color: colors.onSurface }]} numberOfLines={1}>
                        {cat.label}
                      </Text>
                      <Text style={[Typography.caption, { color: colors.outline }]}>
                        {count} recipes
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>
            </View>

            {/* ─── Trending Ingredients ─── */}
            <View style={{ marginBottom: Spacing.xl }}>
              <Text style={[Typography.headline, { color: colors.onSurface, paddingHorizontal: Spacing.page, marginBottom: Spacing.md }]}>
                Trending Ingredients
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: Spacing.page, gap: 20, paddingVertical: 4 }}
              >
                {INGREDIENT_CIRCLES.map((ing) => (
                  <PressableScale
                    key={ing.label}
                    haptic="light"
                    onPress={() => handleIngredientPress(ing.query)}
                    style={styles.ingredientWrap}
                    accessibilityRole="button"
                    accessibilityLabel={`Search by ${ing.label}`}
                  >
                    <View style={[styles.ingredientRing, { borderColor: colors.outlineVariant }]}>
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

            {/* ─── Dietary Preferences ─── */}
            <View style={{ paddingHorizontal: Spacing.page, marginBottom: Spacing.xl }}>
              <Text style={[Typography.headline, { color: colors.onSurface, marginBottom: Spacing.md }]}>
                Dietary Preferences
              </Text>
              <View style={styles.dietaryWrap}>
                {DIETARY_FILTERS.map((f) => {
                  const isActive = activeDietaryFilters.includes(f.id);
                  return (
                    <Pressable
                      key={f.id}
                      onPress={() => toggleDietaryFilter(f.id)}
                      style={[styles.dietaryPill, {
                        borderColor: isActive ? colors.primary : colors.outlineVariant,
                        backgroundColor: isActive ? colors.primary : 'transparent',
                      }]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                    >
                      <Text style={[Typography.bodySmall, {
                        color: isActive ? colors.onPrimary : colors.onSurfaceVariant,
                        fontWeight: '500',
                      }]}>{f.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* ─── Recommended for You (bento) ─── */}
            <View style={{ paddingHorizontal: Spacing.page, marginBottom: Spacing.xl }}>
              <Text style={[Typography.headline, { color: colors.onSurface, marginBottom: Spacing.md }]}>
                Recommended for You
              </Text>
              {/* Large featured card */}
              <BentoCard
                recipe={featuredRecipe}
                size="large"
                onPress={() => router.push(`/recipe/${featuredRecipe.id}`)}
              />
              {/* Two smaller cards side by side */}
              {secondaryRecipes.length >= 2 && (
                <View style={styles.bentoRow}>
                  {secondaryRecipes.map(r => (
                    <BentoCard
                      key={r.id}
                      recipe={r}
                      size="small"
                      onPress={() => router.push(`/recipe/${r.id}`)}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* ─── Curated Collections ─── */}
            {curatedCollections.map((collection) => {
              const collectionRecipes = collection.recipeIds
                .map((id) => recipes.find((r) => r.id === id))
                .filter((r): r is Recipe => r !== undefined);
              if (collectionRecipes.length === 0) return null;
              return (
                <View key={collection.slug} style={{ marginBottom: Spacing.xl }}>
                  <View style={[styles.sectionHeader, { paddingHorizontal: Spacing.page }]}>
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
                    contentContainerStyle={{ paddingHorizontal: Spacing.page, gap: 12, paddingTop: Spacing.sm }}
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
          </>
        )}
      </ScrollView>

      {/* ── Category modal ── */}
      <BottomSheet
        visible={!!categoryModal}
        onDismiss={() => setCategoryModal(null)}
        size="full"
        fullBleed
      >
        {categoryModal && (
          <CategoryModal
            category={categoryModal}
            recipes={categoryRecipes}
            onClose={() => setCategoryModal(null)}
            onRecipePress={(id) => { setCategoryModal(null); router.push(`/recipe/${id}`); }}
            onAddToPlan={(recipe) => setAddSheetRecipe(recipe)}
            isBookmarked={isBookmarked}
            onBookmark={toggleBookmark}
            colors={colors}
            insets={insets}
          />
        )}
      </BottomSheet>

      {/* ── Toast ── */}
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

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  // Category grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryItem: {
    alignItems: 'center',
    gap: 6,
  },
  categoryCircle: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    position: 'relative',
  },
  categoryCircleOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  categoryLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    marginTop: 2,
  },

  // Ingredients
  ingredientWrap: { alignItems: 'center', gap: 6, width: 76 },
  ingredientRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    overflow: 'hidden',
    borderWidth: 1,
  },
  ingredientImg: { width: '100%', height: '100%' },

  // Dietary pills
  dietaryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  dietaryPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
  },

  // Bento
  bentoRow: { flexDirection: 'row', gap: 12, marginTop: 12 },

  // Recipe grid
  recipeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

  // Collection carousel
  collectionCard: { width: 180, borderRadius: Radius.xl, overflow: 'hidden' },
  collectionCardImage: { width: '100%', height: 120 },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: Spacing.xxl, paddingBottom: Spacing.xxl, gap: Spacing.md },
  emptyIcon: {
    width: 72, height: 72, borderRadius: Radius.full,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },

  // Toast
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
