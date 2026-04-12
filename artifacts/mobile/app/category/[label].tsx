import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  ScrollView,
  FlatList,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { PressableScale } from '@/components/PressableScale';
import { AnimatedHeart } from '@/components/AnimatedHeart';
import { AddToPlanSheet, AddToPlanButton } from '@/components/AddToPlanSheet';
import { OVERLAY_BUTTON } from '@/constants/icons';
import { recipes, Recipe } from '@/data/recipes';
import { countries } from '@/data/countries';
import { formatCookTime } from '@/data/helpers';
import { MEAL_CATEGORIES } from '@/data/categories';
import { useBookmarks } from '@/context/BookmarksContext';
import { useApp } from '@/context/AppContext';
import { todayLocal, getDayLabel } from '@/utils/dates';
import * as Haptics from 'expo-haptics';

type TimeFilter = 'any' | 'under30' | 'under60';
type SortMode = 'default' | 'quickest' | 'az';

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: '#3DAF6F',
  Medium: '#E08C00',
  Hard: '#C0392B',
};

function RecipeCard({
  recipe,
  cardWidth,
  onPress,
  isBookmarked,
  onBookmark,
  onAddToPlan,
  colors,
}: {
  recipe: Recipe;
  cardWidth: number;
  onPress: () => void;
  isBookmarked: boolean;
  onBookmark: () => void;
  onAddToPlan: () => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
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
        <Image
          source={{ uri: recipe.image }}
          style={cardStyles.image}
          contentFit="cover"
          transition={300}
          accessible={false}
        />
        <View style={cardStyles.overlayStack}>
          <Pressable
            onPress={(e) => { e.stopPropagation(); onBookmark(); }}
            style={[
              cardStyles.overlayBtn,
              {
                backgroundColor: OVERLAY_BUTTON.background,
                borderWidth: OVERLAY_BUTTON.borderWidth,
                borderColor: OVERLAY_BUTTON.borderColor,
              },
            ]}
            hitSlop={8}
          >
            <AnimatedHeart
              filled={isBookmarked}
              onToggle={onBookmark}
              size={OVERLAY_BUTTON.iconSize}
              filledColor={colors.primary}
              outlineColor={OVERLAY_BUTTON.iconColor}
              hitSlop={0}
            />
          </Pressable>
          <AddToPlanButton onPress={onAddToPlan} recipeName={recipe.title} variant="overlay" />
        </View>
      </View>
      <View style={cardStyles.content}>
        <Text style={[Typography.titleSmall, { color: colors.onSurface }]} numberOfLines={2}>
          {recipe.title}
        </Text>
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
  content: { padding: Spacing.sm, gap: 4 },
});

export default function CategoryPage() {
  const { label } = useLocalSearchParams<{ label: string }>();
  const decodedLabel = decodeURIComponent(label ?? '');
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const CARD_WIDTH = (width - Spacing.page * 2 - 12) / 2;
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const app = useApp();

  const [query, setQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('any');
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [addSheetRecipe, setAddSheetRecipe] = useState<Recipe | null>(null);
  const inputRef = useRef<TextInput | null>(null);

  const category = useMemo(
    () => MEAL_CATEGORIES.find((c) => c.label === decodedLabel),
    [decodedLabel],
  );

  const baseRecipes = useMemo(() => {
    if (!category) return [];
    return recipes.filter(category.filter);
  }, [category]);

  const filtered = useMemo(() => {
    let pool = baseRecipes;

    if (query.trim()) {
      const q = query.toLowerCase();
      pool = pool.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.ingredients.some((i) => i.name.toLowerCase().includes(q)),
      );
    }

    if (timeFilter === 'under30') {
      pool = pool.filter((r) => r.prepTime + r.cookTime < 30);
    } else if (timeFilter === 'under60') {
      pool = pool.filter((r) => r.prepTime + r.cookTime < 60);
    }

    if (sortMode === 'quickest') {
      pool = [...pool].sort((a, b) => (a.prepTime + a.cookTime) - (b.prepTime + b.cookTime));
    } else if (sortMode === 'az') {
      pool = [...pool].sort((a, b) => a.title.localeCompare(b.title));
    }

    return pool;
  }, [baseRecipes, query, timeFilter, sortMode]);

  const handleAddToPlan = (date: string) => {
    if (!addSheetRecipe) return;
    app.addCourseToDay(date, 'main', addSheetRecipe);
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    setAddSheetRecipe(null);
  };

  const HEADER_H = insets.top + 56;

  const renderPill = (
    pillLabel: string,
    active: boolean,
    onPress: () => void,
    icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'],
  ) => (
    <Pressable
      key={pillLabel}
      onPress={() => {
        try { Haptics.selectionAsync(); } catch {}
        onPress();
      }}
      style={[
        styles.filterPill,
        {
          backgroundColor: active ? colors.primary : colors.surfaceContainerHigh,
          borderColor: active ? colors.primary : 'transparent',
          borderWidth: 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      {icon && (
        <MaterialCommunityIcons
          name={icon}
          size={13}
          color={active ? colors.onPrimary : colors.outline}
        />
      )}
      <Text
        style={[
          Typography.caption,
          { color: active ? colors.onPrimary : colors.onSurface, fontWeight: '600' },
        ]}
      >
        {pillLabel}
      </Text>
    </Pressable>
  );

  const nextSort = (): SortMode => {
    if (sortMode === 'default') return 'quickest';
    if (sortMode === 'quickest') return 'az';
    return 'default';
  };

  const sortLabel = sortMode === 'default' ? 'Default' : sortMode === 'quickest' ? 'Quickest' : 'A–Z';

  const headerInner = (
    <View style={[styles.headerInner, { paddingTop: insets.top + 8 }]}>
      <Pressable
        onPress={() => router.back()}
        style={[styles.backBtn, { backgroundColor: 'rgba(154,65,0,0.10)' }]}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}
      >
        <MaterialCommunityIcons name="arrow-left" size={20} color="#9A4100" />
      </Pressable>

      <Text
        style={[styles.headerTitle, { color: colors.onSurface }]}
        numberOfLines={1}
      >
        {decodedLabel}
      </Text>

      <View style={[styles.countPill, { backgroundColor: 'rgba(154,65,0,0.10)' }]}>
        <Text style={[Typography.caption, { color: '#9A4100', fontWeight: '700' }]}>
          {baseRecipes.length}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* ── Branded header ── */}
      {Platform.OS === 'web' ? (
        <View
          style={[
            styles.header,
            {
              height: HEADER_H,
              backgroundColor: `${colors.surface}EC`,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: 'rgba(154,65,0,0.12)',
            },
          ]}
        >
          {headerInner}
        </View>
      ) : (
        <BlurView
          intensity={60}
          tint={colors.isDark ? 'dark' : 'light'}
          style={[styles.header, { height: HEADER_H }]}
        >
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: `${colors.surface}CC`,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: 'rgba(154,65,0,0.12)',
              },
            ]}
          />
          {headerInner}
        </BlurView>
      )}

      {/* ── Filter bar + results ── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: Spacing.page }}
        contentContainerStyle={{
          paddingTop: HEADER_H + 8,
          paddingBottom: Spacing.tabClearance,
        }}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: Spacing.page, paddingBottom: Spacing.md }}>
            {/* Search input */}
            <View
              style={[styles.searchWrap, { backgroundColor: colors.surfaceContainerLow }]}
            >
              <MaterialCommunityIcons name="magnify" size={19} color={colors.primary} />
              <TextInput
                ref={inputRef}
                value={query}
                onChangeText={setQuery}
                placeholder={`Search ${decodedLabel.toLowerCase()}...`}
                placeholderTextColor={colors.outline}
                style={[Typography.bodySmall, { color: colors.onSurface, flex: 1 }]}
                returnKeyType="search"
                accessibilityLabel="Search within category"
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <MaterialCommunityIcons name="close-circle" size={17} color={colors.outline} />
                </Pressable>
              )}
            </View>

            {/* Filter chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {renderPill('Any Time', timeFilter === 'any', () => setTimeFilter('any'))}
              {renderPill('< 30 min', timeFilter === 'under30', () =>
                setTimeFilter(timeFilter === 'under30' ? 'any' : 'under30'), 'clock-fast')}
              {renderPill('< 60 min', timeFilter === 'under60', () =>
                setTimeFilter(timeFilter === 'under60' ? 'any' : 'under60'), 'clock-outline')}
            </ScrollView>

            {/* Results count + sort */}
            <View style={styles.resultsRow}>
              <Text style={[Typography.caption, { color: colors.outline }]}>
                {filtered.length} {filtered.length === 1 ? 'recipe' : 'recipes'}
              </Text>
              <Pressable
                onPress={() => {
                  try { Haptics.selectionAsync(); } catch {}
                  setSortMode(nextSort());
                }}
                style={[styles.sortBtn, { backgroundColor: colors.surfaceContainerHigh }]}
                accessibilityRole="button"
                accessibilityLabel={`Sort: ${sortLabel}`}
              >
                <MaterialCommunityIcons name="sort-variant" size={14} color={colors.primary} />
                <Text style={[Typography.caption, { color: colors.primary, fontWeight: '700' }]}>
                  {sortLabel}
                </Text>
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="chef-hat" size={40} color={colors.outlineVariant} />
            <Text style={[Typography.headline, { color: colors.onSurface, textAlign: 'center' }]}>
              No matches
            </Text>
            <Text style={[Typography.bodySmall, { color: colors.outline, textAlign: 'center' }]}>
              Try different keywords or adjust filters
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            cardWidth={CARD_WIDTH}
            onPress={() => router.push(`/recipe/${item.id}`)}
            isBookmarked={isBookmarked(item.id)}
            onBookmark={() => toggleBookmark(item.id)}
            onAddToPlan={() => setAddSheetRecipe(item)}
            colors={colors}
          />
        )}
      />

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

  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 70,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.page,
    paddingBottom: 10,
    gap: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitle: {
    fontFamily: 'NotoSerif_700Bold',
    fontSize: 20,
    fontStyle: 'italic',
    flex: 1,
    textAlign: 'center',
  },
  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    flexShrink: 0,
  },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 23,
    marginBottom: Spacing.sm,
  },

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: Spacing.sm,
    paddingRight: Spacing.page,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
  },

  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },

  emptyState: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
    paddingHorizontal: Spacing.page,
  },
});
