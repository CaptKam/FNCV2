/**
 * RecipePickerSheet
 *
 * Full-screen slide-up picker that lets the user search, filter, and select
 * a recipe for a plan slot. Visually mirrors the Category page:
 *   - Blurred branded header with close button + italic title + count pill
 *   - Search bar with clear button
 *   - Horizontal filter chips: time + difficulty + (optionally) My Diet
 *   - Sort toggle: Default / Quickest / A–Z
 *   - 2-column recipe card grid with hero images, bookmark-style add button
 */
import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  TextInput,
  StyleSheet,
  ScrollView,
  Modal,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { PressableScale } from '@/components/PressableScale';
import { recipes, Recipe } from '@/data/recipes';
import { countries } from '@/data/countries';
import { formatCookTime } from '@/data/helpers';
import { useApp } from '@/context/AppContext';
import { getDietaryConflicts, AllergenType } from '@/utils/allergens';

type CourseType = 'appetizer' | 'main' | 'dessert';
type MCIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type TimeFilter = 'any' | 'under30' | 'under60';
type DifficultyFilter = 'any' | 'Easy' | 'Medium' | 'Hard';
type SortMode = 'default' | 'quickest' | 'az';

const COURSE_TITLES: Record<CourseType, string> = {
  appetizer: 'Pick a Starter',
  main: 'Pick a Main',
  dessert: 'Pick a Dessert',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: '#3DAF6F',
  Medium: '#E08C00',
  Hard: '#C0392B',
};

interface RecipePickerSheetProps {
  visible: boolean;
  onDismiss: () => void;
  onSelect: (recipe: Recipe) => void;
  courseType?: CourseType;
  filterIds?: string[];
  title?: string;
}

export function RecipePickerSheet({
  visible,
  onDismiss,
  onSelect,
  courseType,
  filterIds,
  title,
}: RecipePickerSheetProps) {
  const colors = useThemeColors();
  const app = useApp();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [query, setQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('any');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('any');
  const [myDietActive, setMyDietActive] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const inputRef = useRef<TextInput | null>(null);

  const hasUserDiet = app.allergens.length > 0 || app.dietaryFlags.length > 0;
  const sheetTitle = title ?? (courseType ? COURSE_TITLES[courseType] : 'Pick a Recipe');

  const CARD_WIDTH = (width - Spacing.page * 2 - 12) / 2;
  const HEADER_H = insets.top + 56;

  const basePool = useMemo(() => {
    let pool = filterIds ? recipes.filter((r) => filterIds.includes(r.id)) : recipes;
    if (courseType) pool = pool.filter((r) => r.category === courseType);
    return pool;
  }, [filterIds, courseType]);

  const filtered = useMemo(() => {
    let pool = basePool;

    if (query.trim()) {
      const q = query.toLowerCase();
      pool = pool.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.ingredients.some((i) => i.name.toLowerCase().includes(q)),
      );
    }

    if (timeFilter === 'under30') pool = pool.filter((r) => r.prepTime + r.cookTime < 30);
    else if (timeFilter === 'under60') pool = pool.filter((r) => r.prepTime + r.cookTime < 60);

    if (difficultyFilter !== 'any') pool = pool.filter((r) => r.difficulty === difficultyFilter);

    if (myDietActive && hasUserDiet) {
      const compatible: Recipe[] = [];
      const conflicted: Recipe[] = [];
      for (const r of pool) {
        const allergenConflict = (r.allergens as AllergenType[]).some((a) => app.allergens.includes(a));
        const dietaryConflict = getDietaryConflicts(r.allergens as AllergenType[], app.dietaryFlags).length > 0;
        if (allergenConflict || dietaryConflict) conflicted.push(r);
        else compatible.push(r);
      }
      pool = [...compatible, ...conflicted];
    }

    if (sortMode === 'quickest') pool = [...pool].sort((a, b) => (a.prepTime + a.cookTime) - (b.prepTime + b.cookTime));
    else if (sortMode === 'az') pool = [...pool].sort((a, b) => a.title.localeCompare(b.title));

    return pool;
  }, [basePool, query, timeFilter, difficultyFilter, myDietActive, sortMode, hasUserDiet, app.allergens, app.dietaryFlags]);

  const conflictSet = useMemo(() => {
    if (!myDietActive || !hasUserDiet) return new Set<string>();
    const set = new Set<string>();
    for (const r of filtered) {
      const allergenConflict = (r.allergens as AllergenType[]).some((a) => app.allergens.includes(a));
      const dietaryConflict = getDietaryConflicts(r.allergens as AllergenType[], app.dietaryFlags).length > 0;
      if (allergenConflict || dietaryConflict) set.add(r.id);
    }
    return set;
  }, [filtered, myDietActive, hasUserDiet, app.allergens, app.dietaryFlags]);

  const resetFilters = () => {
    setQuery('');
    setTimeFilter('any');
    setDifficultyFilter('any');
    setMyDietActive(false);
    setSortMode('default');
  };

  const handleSelect = (recipe: Recipe) => {
    onSelect(recipe);
    resetFilters();
    onDismiss();
  };

  const handleDismiss = () => {
    resetFilters();
    onDismiss();
  };

  const nextSort = (): SortMode => {
    if (sortMode === 'default') return 'quickest';
    if (sortMode === 'quickest') return 'az';
    return 'default';
  };
  const sortLabel = sortMode === 'default' ? 'Default' : sortMode === 'quickest' ? 'Quickest' : 'A–Z';

  const renderPill = (
    label: string,
    active: boolean,
    onPress: () => void,
    icon?: MCIconName,
    activeColor?: string,
  ) => (
    <Pressable
      key={label}
      onPress={() => {
        try { Haptics.selectionAsync(); } catch {}
        onPress();
      }}
      style={[
        styles.filterPill,
        {
          backgroundColor: active ? (activeColor ?? colors.primary) : colors.surfaceContainerHigh,
          borderWidth: 1,
          borderColor: active ? (activeColor ?? colors.primary) : 'transparent',
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
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
        {label}
      </Text>
    </Pressable>
  );

  const headerInner = (
    <View style={[styles.headerInner, { paddingTop: insets.top + 8 }]}>
      <Pressable
        onPress={handleDismiss}
        style={[styles.closeBtn, { backgroundColor: 'rgba(154,65,0,0.10)' }]}
        accessibilityRole="button"
        accessibilityLabel="Close"
        hitSlop={8}
      >
        <MaterialCommunityIcons name="close" size={20} color="#9A4100" />
      </Pressable>

      <Text style={[styles.headerTitle, { color: colors.onSurface }]} numberOfLines={1}>
        {sheetTitle}
      </Text>

      <View style={[styles.countPill, { backgroundColor: 'rgba(154,65,0,0.10)' }]}>
        <Text style={[Typography.caption, { color: '#9A4100', fontWeight: '700' }]}>
          {filtered.length}
        </Text>
      </View>
    </View>
  );

  const ListHeader = (
    <View style={{ paddingHorizontal: Spacing.page, paddingBottom: Spacing.md }}>
      {/* Search bar */}
      <View style={[styles.searchWrap, { backgroundColor: colors.surfaceContainerLow }]}>
        <MaterialCommunityIcons name="magnify" size={19} color={colors.primary} />
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          placeholder="Search recipes…"
          placeholderTextColor={colors.outline}
          style={[Typography.bodySmall, { color: colors.onSurface, flex: 1 }]}
          returnKeyType="search"
          accessibilityLabel="Search recipes"
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

        <View style={[styles.filterDivider, { backgroundColor: colors.outlineVariant }]} />

        {renderPill('Any Level', difficultyFilter === 'any', () => setDifficultyFilter('any'), 'chef-hat')}
        {(['Easy', 'Medium', 'Hard'] as DifficultyFilter[]).map((d) =>
          renderPill(
            d,
            difficultyFilter === d,
            () => setDifficultyFilter(difficultyFilter === d ? 'any' : d),
            d === 'Easy' ? 'emoticon-happy-outline' : d === 'Medium' ? 'emoticon-neutral-outline' : 'emoticon-angry-outline',
            DIFFICULTY_COLORS[d],
          ),
        )}

        {hasUserDiet && (
          <>
            <View style={[styles.filterDivider, { backgroundColor: colors.outlineVariant }]} />
            {renderPill('My Diet', myDietActive, () => setMyDietActive((v) => !v), 'heart-outline')}
          </>
        )}
      </ScrollView>

      {/* Count + sort */}
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
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        {/* ── Branded blurred header ── */}
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

        {/* ── 2-column card grid ── */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: Spacing.page }}
          contentContainerStyle={{
            paddingTop: HEADER_H + 8,
            paddingBottom: insets.bottom + 24,
          }}
          ListHeaderComponent={ListHeader}
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
          renderItem={({ item }) => {
            const country = countries.find((c) => c.id === item.countryId);
            const isConflicted = conflictSet.has(item.id);
            const totalTime = item.prepTime + item.cookTime;
            const diffColor = DIFFICULTY_COLORS[item.difficulty] ?? colors.outline;

            return (
              <PressableScale
                onPress={() => {
                  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                  handleSelect(item);
                }}
                style={[
                  styles.card,
                  {
                    width: CARD_WIDTH,
                    backgroundColor: colors.surfaceContainerLow,
                    opacity: isConflicted ? 0.7 : 1,
                  },
                ]}
                scaleDown={0.97}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}, ${formatCookTime(totalTime)}`}
              >
                {/* Hero image with overlays */}
                <View style={styles.imageWrap}>
                  <Image
                    source={{ uri: item.image }}
                    style={styles.cardImage}
                    contentFit="cover"
                    transition={300}
                    accessible={false}
                  />

                  {/* Add button — top-right of image */}
                  <View style={[styles.addBtn, { backgroundColor: colors.primary }]}>
                    <MaterialCommunityIcons name="plus" size={16} color={colors.onPrimary} />
                  </View>

                  {/* Conflict badge — top-left of image */}
                  {isConflicted && (
                    <View style={[styles.conflictBadge, { backgroundColor: `${colors.error}DD` }]}>
                      <MaterialCommunityIcons name="alert-circle-outline" size={11} color="#fff" />
                      <Text style={styles.conflictText}>Allergen</Text>
                    </View>
                  )}
                </View>

                {/* Card body */}
                <View style={styles.cardContent}>
                  <Text
                    style={[Typography.titleSmall, { color: colors.onSurface }]}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Text style={{ fontSize: 12 }}>{country?.flag}</Text>
                    <Text style={[Typography.caption, { color: colors.outline }]}>
                      {formatCookTime(totalTime)}
                    </Text>
                    <View style={[styles.diffDot, { backgroundColor: diffColor }]} />
                    <Text style={[Typography.caption, { color: diffColor, fontWeight: '700' }]}>
                      {item.difficulty}
                    </Text>
                  </View>
                </View>
              </PressableScale>
            );
          }}
        />
      </View>
    </Modal>
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
  closeBtn: {
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
  filterDivider: {
    width: 1,
    height: 22,
    borderRadius: 1,
    alignSelf: 'center',
    marginHorizontal: 4,
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

  card: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    marginBottom: 12,
  },
  imageWrap: {
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 160,
  },
  cardContent: {
    padding: Spacing.sm,
  },
  diffDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  addBtn: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conflictBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  conflictText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },

  emptyState: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
    paddingHorizontal: Spacing.page,
  },
});
