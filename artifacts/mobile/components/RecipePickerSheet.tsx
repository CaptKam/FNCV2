import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  TextInput,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { PressableScale } from '@/components/PressableScale';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { recipes, Recipe } from '@/data/recipes';
import { countries } from '@/data/countries';
import { formatCookTime } from '@/data/helpers';
import { useApp } from '@/context/AppContext';
import { getDietaryConflicts, AllergenType } from '@/utils/allergens';
import { BottomSheet } from '@/components/BottomSheet';

type CourseType = 'appetizer' | 'main' | 'dessert';
type MCIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type TimeFilter = 'any' | 'under30' | 'under60';
type DifficultyFilter = 'any' | 'easy';

const COURSE_TITLES: Record<CourseType, string> = {
  appetizer: 'Pick an Appetizer',
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

  const [query, setQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('any');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('any');
  const [myDietActive, setMyDietActive] = useState(false);

  const hasUserDiet = app.allergens.length > 0 || app.dietaryFlags.length > 0;

  const sheetTitle = title ?? (courseType ? COURSE_TITLES[courseType] : 'Pick a Recipe');

  const filtered = useMemo(() => {
    let pool = filterIds
      ? recipes.filter((r) => filterIds.includes(r.id))
      : recipes;

    if (courseType) {
      pool = pool.filter((r) => r.category === courseType);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      pool = pool.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.ingredients.some((i) => i.name.toLowerCase().includes(q))
      );
    }

    if (timeFilter === 'under30') {
      pool = pool.filter((r) => r.prepTime + r.cookTime < 30);
    } else if (timeFilter === 'under60') {
      pool = pool.filter((r) => r.prepTime + r.cookTime < 60);
    }

    if (difficultyFilter === 'easy') {
      pool = pool.filter((r) => r.difficulty === 'Easy');
    }

    if (!myDietActive || !hasUserDiet) return pool;

    const compatible: Recipe[] = [];
    const conflicted: Recipe[] = [];

    for (const r of pool) {
      const allergenConflict = (r.allergens as AllergenType[]).some((a) =>
        app.allergens.includes(a)
      );
      const dietaryConflict =
        getDietaryConflicts(r.allergens as AllergenType[], app.dietaryFlags).length > 0;
      if (allergenConflict || dietaryConflict) {
        conflicted.push(r);
      } else {
        compatible.push(r);
      }
    }

    return [...compatible, ...conflicted];
  }, [query, timeFilter, difficultyFilter, myDietActive, courseType, filterIds, app.allergens, app.dietaryFlags, hasUserDiet]);

  const conflictSet = useMemo(() => {
    if (!myDietActive || !hasUserDiet) return new Set<string>();
    const set = new Set<string>();
    for (const r of filtered) {
      const allergenConflict = (r.allergens as AllergenType[]).some((a) =>
        app.allergens.includes(a)
      );
      const dietaryConflict =
        getDietaryConflicts(r.allergens as AllergenType[], app.dietaryFlags).length > 0;
      if (allergenConflict || dietaryConflict) set.add(r.id);
    }
    return set;
  }, [filtered, myDietActive, hasUserDiet, app.allergens, app.dietaryFlags]);

  const handleSelect = (recipe: Recipe) => {
    onSelect(recipe);
    setQuery('');
    setTimeFilter('any');
    setDifficultyFilter('any');
    setMyDietActive(false);
    onDismiss();
  };

  const handleDismiss = () => {
    setQuery('');
    setTimeFilter('any');
    setDifficultyFilter('any');
    setMyDietActive(false);
    onDismiss();
  };

  const renderPill = (
    label: string,
    active: boolean,
    onPress: () => void,
    icon?: MCIconName
  ) => (
    <Pressable
      key={label}
      onPress={onPress}
      style={[
        styles.filterPill,
        {
          backgroundColor: active ? colors.primary : colors.surfaceContainerLow,
          borderColor: active ? colors.primary : `${colors.outline}40`,
          borderWidth: 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      {icon && (
        <MaterialCommunityIcons
          name={icon}
          size={14}
          color={active ? colors.onPrimary : colors.outline}
        />
      )}
      <Text
        style={[
          Typography.caption,
          {
            color: active ? colors.onPrimary : colors.onSurface,
            fontWeight: '600',
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <BottomSheet
      visible={visible}
      onDismiss={handleDismiss}
      size="full"
      title={sheetTitle}
      showCloseButton
      disablePanDismiss
      dismissOnOverlay={false}
    >
      <View style={[styles.searchRow, { backgroundColor: colors.surfaceContainerHigh }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.outline} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search recipes..."
          placeholderTextColor={colors.outline}
          style={[Typography.body, { color: colors.onSurface, flex: 1, fontSize: 15 }]}
          accessibilityLabel="Search recipes"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <MaterialCommunityIcons name="close-circle" size={18} color={colors.outline} />
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {renderPill('Any Time', timeFilter === 'any', () => setTimeFilter('any'))}
        {renderPill('< 30 min', timeFilter === 'under30', () =>
          setTimeFilter(timeFilter === 'under30' ? 'any' : 'under30'),
          'clock-fast'
        )}
        {renderPill('< 60 min', timeFilter === 'under60', () =>
          setTimeFilter(timeFilter === 'under60' ? 'any' : 'under60'),
          'clock-outline'
        )}
        <View style={styles.filterDivider} />
        {renderPill('Any Difficulty', difficultyFilter === 'any', () => setDifficultyFilter('any'))}
        {renderPill('Beginner', difficultyFilter === 'easy', () => setDifficultyFilter('easy'), 'chart-bar')}
        {hasUserDiet && renderPill(
          'My Diet',
          myDietActive,
          () => setMyDietActive((v) => !v),
          'heart-outline'
        )}
      </ScrollView>

      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="chef-hat" size={40} color={colors.outline} />
          <Text style={[Typography.bodySmall, { color: colors.outline, textAlign: 'center', marginTop: Spacing.sm }]}>
            No recipes match these filters
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => {
            const country = countries.find((c) => c.id === item.countryId);
            const isConflicted = conflictSet.has(item.id);
            const diffColor = DIFFICULTY_COLORS[item.difficulty] ?? colors.outline;
            const totalTime = item.prepTime + item.cookTime;

            return (
              <PressableScale
                onPress={() => handleSelect(item)}
                style={[
                  styles.row,
                  {
                    backgroundColor: colors.surfaceContainerHigh,
                    opacity: isConflicted ? 0.7 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}, ${formatCookTime(totalTime)}`}
                scaleDown={0.98}
              >
                <View style={styles.thumbContainer}>
                  <Image
                    source={{ uri: item.image }}
                    style={styles.thumb}
                    contentFit="cover"
                    transition={200}
                  />
                </View>

                <View style={styles.rowText}>
                  <Text
                    style={[Typography.titleSmall, { color: colors.onSurface }]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>

                  {country && (
                    <Text style={[Typography.caption, { color: colors.outline, marginTop: 2 }]}>
                      {country.flag} {country.name}
                    </Text>
                  )}

                  <View style={styles.badgeRow}>
                    <View style={[styles.timeBadge, { backgroundColor: `${colors.primary}18` }]}>
                      <MaterialCommunityIcons name="clock-outline" size={12} color={colors.primary} />
                      <Text style={[Typography.caption, { color: colors.primary, fontSize: 11 }]}>
                        {formatCookTime(totalTime)}
                      </Text>
                    </View>

                    <View style={[styles.diffBadge, { backgroundColor: `${diffColor}18` }]}>
                      <Text style={[Typography.caption, { color: diffColor, fontSize: 11, fontWeight: '700' }]}>
                        {item.difficulty}
                      </Text>
                    </View>

                    {isConflicted && (
                      <View style={[styles.diffBadge, { backgroundColor: `${colors.error}18` }]}>
                        <MaterialCommunityIcons name="alert-circle-outline" size={12} color={colors.error} />
                        <Text style={[Typography.caption, { color: colors.error, fontSize: 10 }]}>
                          Contains allergen
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
              </PressableScale>
            );
          }}
        />
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayDismiss: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.page,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    marginBottom: Spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingBottom: Spacing.sm,
    paddingRight: Spacing.page,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  filterDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(0,0,0,0.12)',
    marginHorizontal: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  thumbContainer: {
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: Radius.md,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  diffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
});
