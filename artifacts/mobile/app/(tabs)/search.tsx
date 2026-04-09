import React, { useState, useMemo, useCallback } from 'react';
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
import { DestinationCard } from '@/components/DestinationCard';
import { recipes } from '@/data/recipes';
import { countries } from '@/data/countries';
import { formatCookTime } from '@/data/helpers';
import { ALLERGEN_INFO, AllergenType } from '@/utils/allergens';
import { useApp } from '@/context/AppContext';
import { useBookmarks } from '@/context/BookmarksContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AnimatedListItem } from '@/components/AnimatedListItem';
import { AnimatedHeart } from '@/components/AnimatedHeart';
import { AddToPlanSheet, AddToPlanButton } from '@/components/AddToPlanSheet';
import { OVERLAY_BUTTON } from '@/constants/icons';
import { todayLocal, getDayLabel } from '@/utils/dates';

const MOODS = ['All Moods', 'Quick & Easy', 'Comfort Food', 'Date Night', 'Adventurous', 'Healthy', 'Sweet'];
const ALLERGEN_FILTERS: AllergenType[] = ['milk', 'egg', 'wheat', 'peanuts', 'tree_nuts', 'fish', 'shellfish', 'soy', 'sesame'];

export default function SearchScreen() {
  const { width } = useWindowDimensions();
  const CARD_WIDTH = (width - Spacing.page * 2 - Spacing.md) / 2;
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const app = useApp();
  const { allergens: userAllergens } = app;
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [query, setQuery] = useState('');
  const [activeMood, setActiveMood] = useState('All Moods');
  const [excludedAllergens, setExcludedAllergens] = useState<AllergenType[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [addSheetRecipe, setAddSheetRecipe] = useState<typeof recipes[0] | null>(null);

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
    setExcludedAllergens((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  }, []);

  const filteredRecipes = useMemo(() => {
    let results = recipes;

    if (activeMood !== 'All Moods') {
      const moodMap: Record<string, (r: typeof recipes[0]) => boolean> = {
        'Quick & Easy': (r) => r.prepTime + r.cookTime <= 30 && r.difficulty === 'Easy',
        'Comfort Food': (r) => r.category === 'main' && r.cookTime >= 30,
        'Date Night': (r) => r.difficulty === 'Hard' || r.cookTime >= 60,
        'Adventurous': (r) => ['japan', 'thailand', 'morocco', 'india', 'mexico'].includes(r.countryId),
        'Healthy': (r) => r.ingredients.some((i) => i.category === 'Produce'),
        'Sweet': (r) => r.category === 'dessert',
      };
      const filter = moodMap[activeMood];
      if (filter) results = results.filter(filter);
    }

    if (excludedAllergens.length > 0) {
      results = results.filter((r) => {
        return !excludedAllergens.some((a) => r.allergens.includes(a));
      });
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
        contentContainerStyle={{ paddingBottom: Spacing.tabClearance, paddingTop: insets.top + 76 }}
      >
        <View style={{ paddingHorizontal: Spacing.page }}>
          <Text style={[Typography.displayMedium, { color: colors.onSurface }]}>
            Search
          </Text>
        </View>

        <View style={[styles.searchContainer, { paddingHorizontal: Spacing.page }]}>
          <View style={[styles.searchInput, { backgroundColor: colors.surfaceContainerLow }]}>
            <MaterialCommunityIcons name="magnify" size={20} color={colors.outline} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Ingredients, dishes, or moods..."
              placeholderTextColor={colors.outline}
              style={[Typography.body, { color: colors.onSurface, flex: 1 }]}
              accessibilityLabel="Search recipes or countries"
            />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipContainer}
        >
          {MOODS.map((mood) => (
            <Pressable
              key={mood}
              onPress={() => setActiveMood(mood)}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    activeMood === mood ? colors.primary : colors.surfaceContainerHigh,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${mood}`}
              accessibilityState={{ selected: activeMood === mood }}
            >
              <Text
                style={[
                  Typography.titleSmall,
                  {
                    color: activeMood === mood ? colors.onPrimary : colors.onSurface,
                  },
                ]}
              >
                {mood}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={{ paddingHorizontal: Spacing.page, marginBottom: Spacing.md }}>
            <Text style={[Typography.labelLarge, { color: colors.outline, letterSpacing: 1, marginBottom: Spacing.sm }]}>
              EXCLUDE ALLERGENS
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
              {ALLERGEN_FILTERS.map((a) => {
                const info = ALLERGEN_INFO[a];
                const isActive = excludedAllergens.includes(a);
                const isUserAllergen = userAllergens.includes(a);
                return (
                  <Pressable
                    key={a}
                    onPress={() => toggleAllergenFilter(a)}
                    style={[
                      styles.allergenChip,
                      {
                        backgroundColor: isActive ? `${colors.error}20` : colors.surfaceContainerHigh,
                        borderWidth: isActive ? 1 : isUserAllergen ? 1 : 0,
                        borderColor: isActive ? colors.error : isUserAllergen ? colors.primary : 'transparent',
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${isActive ? 'Include' : 'Exclude'} ${info.label}`}
                    accessibilityState={{ selected: isActive }}
                  >
                    <MaterialCommunityIcons
                      name={isActive ? 'close-circle' : info.icon}
                      size={16}
                      color={isActive ? colors.error : colors.onSurfaceVariant}
                    />
                    <Text style={[Typography.caption, { color: isActive ? colors.error : colors.onSurfaceVariant }]}>
                      {info.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

        {/* Result count */}
        {query.trim().length > 0 && filteredRecipes.length > 0 && (
          <View style={{ paddingHorizontal: Spacing.page, marginBottom: Spacing.md }}>
            <Text style={[Typography.caption, { color: colors.onSurfaceVariant }]}>
              {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''} found
            </Text>
          </View>
        )}

        {/* Empty state when searching with no results */}
        {query.trim().length > 0 && filteredRecipes.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceContainerHigh }]}>
              <MaterialCommunityIcons name="magnify" size={28} color={colors.outlineVariant} />
            </View>
            <Text style={[Typography.headline, { color: colors.onSurface, textAlign: 'center' }]}>
              No matches found
            </Text>
            <Text style={[Typography.bodySmall, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
              Try different keywords or browse by mood
            </Text>
            <Text style={[Typography.labelLarge, { color: colors.outline, marginTop: Spacing.xl }]}>
              OR EXPLORE THESE COUNTRIES
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.md, paddingHorizontal: Spacing.page, paddingTop: Spacing.md }}>
              {countries.slice(0, 4).map((country) => (
                <DestinationCard key={country.id} country={country} />
              ))}
            </ScrollView>
          </View>
        ) : (
        <View style={styles.grid}>
          {filteredRecipes.map((recipe, index) => (
            <AnimatedListItem key={recipe.id} index={index}>
              <PressableScale
                onPress={() => router.push(`/recipe/${recipe.id}`)}
                style={[styles.card, { width: CARD_WIDTH }]}
                accessibilityRole="button"
                accessibilityLabel={`${recipe.title}, ${recipe.prepTime + recipe.cookTime} minutes, ${recipe.difficulty}`}
                scaleDown={0.97}
              >
                <View style={styles.imageWrapper}>
                  <Image
                    source={{ uri: recipe.image }}
                    style={styles.cardImage}
                    contentFit="cover"
                    transition={300}
                    accessibilityLabel={recipe.title}
                  />
                  <View style={styles.overlayStack}>
                    <Pressable
                      onPress={(e) => { e.stopPropagation(); toggleBookmark(recipe.id); }}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={isBookmarked(recipe.id) ? `Remove ${recipe.title} from bookmarks` : `Save ${recipe.title} to bookmarks`}
                    >
                      <View style={styles.heartGlass}>
                        <AnimatedHeart
                          filled={isBookmarked(recipe.id)}
                          onToggle={() => toggleBookmark(recipe.id)}
                          size={20}
                          filledColor={colors.primary}
                          outlineColor={OVERLAY_BUTTON.iconColor}
                          hitSlop={0}
                        />
                      </View>
                    </Pressable>
                    <AddToPlanButton onPress={() => setAddSheetRecipe(recipe)} recipeName={recipe.title} variant="overlay" />
                  </View>
                </View>
                <View style={styles.cardContent}>
                  <Text style={[Typography.title, { color: colors.onSurface }]} numberOfLines={2}>
                    {recipe.title}
                  </Text>
                  <Text style={[Typography.labelSmall, { color: colors.outline }]}>
                    {recipe.difficulty} {'\u00B7'} {formatCookTime(recipe.prepTime + recipe.cookTime)}
                  </Text>
                </View>
              </PressableScale>
            </AnimatedListItem>
          ))}
        </View>
        )}
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: { marginTop: Spacing.md, marginBottom: Spacing.md },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
  },
  chipContainer: {
    paddingHorizontal: Spacing.page,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    marginRight: Spacing.sm,
  },
  allergenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.page,
  },
  card: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 220,
  },
  cardContent: {
    padding: Spacing.md,
    gap: 6,
  },
  imageWrapper: {
    position: 'relative',
  },
  overlayStack: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    gap: 6,
    alignItems: 'center',
  },
  heartGlass: {
    width: OVERLAY_BUTTON.size,
    height: OVERLAY_BUTTON.size,
    borderRadius: Radius.full,
    backgroundColor: OVERLAY_BUTTON.background,
    borderWidth: OVERLAY_BUTTON.borderWidth,
    borderColor: OVERLAY_BUTTON.borderColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    paddingHorizontal: Spacing.page,
    gap: Spacing.md,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
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
