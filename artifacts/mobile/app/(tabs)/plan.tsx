import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Modal } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MOCK_DATES: Record<string, string> = {
  Monday: 'Oct 12',
  Tuesday: 'Oct 13',
  Wednesday: 'Oct 14',
  Thursday: 'Oct 15',
  Friday: 'Oct 16',
  Saturday: 'Oct 17',
  Sunday: 'Oct 18',
};
const PLANNED_DAYS: Record<string, string> = {
  Monday: 'it-1',
  Wednesday: 'fr-1',
  Friday: 'mx-2',
  Saturday: 'jp-1',
};

const DAILY_MEALS: Record<string, { time: string; label: string; recipeId?: string }[]> = {
  Monday: [
    { time: '08:00 AM', label: 'Breakfast' },
    { time: '12:30 PM', label: 'Lunch', recipeId: 'it-2' },
    { time: '07:30 PM', label: 'Dinner', recipeId: 'it-1' },
  ],
  Tuesday: [
    { time: '08:00 AM', label: 'Breakfast' },
    { time: '12:30 PM', label: 'Lunch' },
    { time: '07:30 PM', label: 'Dinner' },
  ],
  Wednesday: [
    { time: '08:00 AM', label: 'Breakfast' },
    { time: '12:30 PM', label: 'Lunch' },
    { time: '07:30 PM', label: 'Dinner', recipeId: 'fr-1' },
  ],
  Thursday: [
    { time: '08:00 AM', label: 'Breakfast' },
    { time: '12:30 PM', label: 'Lunch' },
    { time: '07:30 PM', label: 'Dinner' },
  ],
  Friday: [
    { time: '08:00 AM', label: 'Breakfast' },
    { time: '12:30 PM', label: 'Lunch' },
    { time: '07:30 PM', label: 'Dinner', recipeId: 'mx-2' },
  ],
  Saturday: [
    { time: '08:00 AM', label: 'Breakfast' },
    { time: '12:30 PM', label: 'Lunch', recipeId: 'jp-2' },
    { time: '07:30 PM', label: 'Dinner', recipeId: 'jp-1' },
  ],
  Sunday: [
    { time: '08:00 AM', label: 'Breakfast' },
    { time: '12:30 PM', label: 'Lunch' },
    { time: '07:30 PM', label: 'Dinner' },
  ],
};

type WeekOption = 'this-week' | 'next-week' | 'past';

export default function PlanScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<WeekOption>('this-week');
  const [isDailyView, setIsDailyView] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const getRecipe = (id: string) => recipes.find((r) => r.id === id);
  const plannedCount = Object.keys(PLANNED_DAYS).length;
  const firstPlannedDay = Object.keys(PLANNED_DAYS)[0];

  const weekLabels: Record<WeekOption, string> = {
    'this-week': 'This Week',
    'next-week': 'Next Week',
    'past': 'Past Journeys',
  };

  const selectedDay = DAYS[selectedDayIndex];
  const dailyMeals = DAILY_MEALS[selectedDay] || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160, paddingTop: insets.top + 16 }}
      >
        <View style={styles.header}>
          <Text style={[Typography.title, { color: colors.onSurface, fontStyle: 'italic' }]}>
            Fork & Compass
          </Text>
          <Pressable hitSlop={12} onPress={() => router.push('/(tabs)/grocery')}>
            <MaterialCommunityIcons name="cart-outline" size={22} color={colors.onSurface} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: Spacing.page, marginBottom: Spacing.sm }}>
          <GlassView style={[styles.weekPill, { ...Shadows.subtle }]}>
            <Pressable hitSlop={12}>
              <MaterialCommunityIcons name="chevron-left" size={24} color={colors.primary} />
            </Pressable>
            <Pressable onPress={() => setShowDropdown(true)} style={styles.weekCenter}>
              <Text style={[Typography.labelLarge, { color: colors.outline, marginBottom: 2 }]}>
                CURRENT PLANNING
              </Text>
              <View style={styles.weekTitleRow}>
                <Text style={[Typography.headline, { color: colors.onSurface, fontSize: 20 }]}>
                  {isDailyView ? 'Daily Plan' : weekLabels[selectedWeek]}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={18} color={colors.primary} />
              </View>
            </Pressable>
            <Pressable hitSlop={12}>
              <MaterialCommunityIcons name="chevron-right" size={24} color={colors.primary} />
            </Pressable>
          </GlassView>
        </View>

        {isDailyView && (
          <View style={{ paddingHorizontal: Spacing.page, marginBottom: Spacing.lg }}>
            <GlassView style={[styles.daySelectorPill, { ...Shadows.subtle }]}>
              {DAY_LETTERS.map((letter, i) => {
                const isActive = i === selectedDayIndex;
                const hasRecipe = !!PLANNED_DAYS[DAYS[i]];
                return (
                  <Pressable
                    key={i}
                    onPress={() => setSelectedDayIndex(i)}
                    style={[
                      styles.dayCircle,
                      isActive && { backgroundColor: colors.primary },
                      !isActive && hasRecipe && { backgroundColor: `${colors.primary}15` },
                    ]}
                  >
                    <Text style={[
                      Typography.caption,
                      { fontWeight: '600' },
                      isActive ? { color: colors.onPrimary } : { color: colors.outline },
                    ]}>
                      {letter}
                    </Text>
                  </Pressable>
                );
              })}
            </GlassView>
          </View>
        )}

        {!isDailyView && (
          <View style={{ height: Spacing.sm }} />
        )}

        <View style={{ paddingHorizontal: Spacing.page, marginBottom: Spacing.lg }}>
          <View style={[styles.groceryBanner, { backgroundColor: `${colors.primary}10` }]}>
            <MaterialCommunityIcons name="basket" size={22} color={colors.primary} />
            <View style={styles.groceryTextWrap}>
              <Text style={[Typography.titleSmall, { color: colors.onSurface }]}>
                Grocery List Update
              </Text>
              <Text style={[Typography.caption, { color: colors.outline }]}>
                {plannedCount * 3 + 2} items missing for your planned meals
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/(tabs)/grocery')}
              style={[styles.reviewBtn, { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.5)' }]}
            >
              <Text style={[Typography.labelSmall, { color: colors.primary, fontWeight: '700' }]}>
                Review
              </Text>
            </Pressable>
          </View>
        </View>

        {isDailyView ? (
          <View style={styles.timeline}>
            <View style={[styles.timelineLine, { backgroundColor: `${colors.primary}33` }]} />
            {dailyMeals.map((meal, idx) => {
              const recipe = meal.recipeId ? getRecipe(meal.recipeId) : null;
              return (
                <View key={`${selectedDay}-${idx}`} style={styles.dayRow}>
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
                  </View>
                  <View style={styles.dayRight}>
                    <Text style={[Typography.labelLarge, { color: colors.primary, marginBottom: Spacing.sm, letterSpacing: 1.5 }]}>
                      {meal.time} {'\u2022'} {meal.label}
                    </Text>
                    {recipe ? (
                      <Pressable
                        onPress={() => router.push(`/recipe/${recipe.id}`)}
                      >
                        <GlassView style={styles.mealCard}>
                          <Image
                            source={{ uri: recipe.image }}
                            style={styles.mealImage}
                            contentFit="cover"
                            transition={300}
                          />
                          <View style={styles.mealContent}>
                            <Text style={[Typography.headline, { color: colors.onSurface, fontSize: 22 }]} numberOfLines={1}>
                              {recipe.title}
                            </Text>
                            <View style={styles.mealMeta}>
                              <MaterialCommunityIcons name="clock-outline" size={14} color={colors.outline} />
                              <Text style={[Typography.caption, { color: colors.outline }]}>
                                {recipe.prepTime + recipe.cookTime}m
                              </Text>
                            </View>
                          </View>
                        </GlassView>
                      </Pressable>
                    ) : (
                      <View style={[styles.emptyCard, { borderColor: colors.outlineVariant }]}>
                        <View style={styles.emptyCardRow}>
                          <MaterialCommunityIcons
                            name={meal.label === 'Breakfast' ? 'white-balance-sunny' : 'silverware-variant'}
                            size={20}
                            color={colors.outline}
                          />
                          <Text style={[Typography.bodySmall, { color: colors.outline, fontStyle: 'italic' }]}>
                            {meal.label} unassigned...
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => router.push('/(tabs)/search')}
                          style={styles.addMealBtn}
                        >
                          <MaterialCommunityIcons name="plus-circle-outline" size={16} color={colors.primary} />
                          <Text style={[Typography.labelSmall, { color: colors.primary, fontWeight: '700', letterSpacing: 0.5 }]}>
                            Add Meal
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.timeline}>
            <View style={[styles.timelineLine, { backgroundColor: `${colors.primary}33` }]} />
            {DAYS.map((day) => {
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
                  </View>
                  <View style={styles.dayRight}>
                    <Text style={[Typography.titleSmall, { color: colors.outline, marginBottom: Spacing.sm }]}>
                      {day}, {MOCK_DATES[day]}
                    </Text>
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
                          <Text style={[Typography.headline, { color: colors.onSurface, fontSize: 22 }]} numberOfLines={1}>
                            {recipe.title}
                          </Text>
                          <View style={styles.mealMeta}>
                            <MaterialCommunityIcons name="clock-outline" size={14} color={colors.outline} />
                            <Text style={[Typography.caption, { color: colors.outline }]}>
                              {recipe.prepTime + recipe.cookTime}m
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                    ) : (
                      <View
                        style={[styles.emptyCard, { borderColor: colors.outlineVariant }]}
                      >
                        <MaterialCommunityIcons name="silverware-variant" size={32} color={colors.outlineVariant} />
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
        )}
      </ScrollView>

      <View style={[styles.readyCTA, { bottom: 100, left: Spacing.page, right: Spacing.page }]}>
        <Pressable onPress={() => {
          const firstRecipeId = PLANNED_DAYS[firstPlannedDay];
          if (firstRecipeId) {
            router.push(`/cook-mode/${firstRecipeId}`);
          } else {
            router.push('/(tabs)/cook');
          }
        }}>
          <GlassView style={[styles.readyCTAInner, { ...Shadows.ambient }]}>
            <View style={[styles.playCircle, { backgroundColor: colors.primary }]}>
              <MaterialCommunityIcons name="play" size={16} color={colors.onPrimary} />
            </View>
            <Text style={[Typography.titleSmall, { color: colors.primary, fontWeight: '700' }]}>
              Ready to Cook
            </Text>
            <View style={{ flex: 1 }} />
            <Text style={[Typography.labelSmall, { color: colors.outline }]}>
              {isDailyView ? `${selectedDay}'s Prep` : (firstPlannedDay ? `${firstPlannedDay}'s Prep` : "Today's Prep")}
            </Text>
          </GlassView>
        </Pressable>
      </View>

      <Modal
        visible={showDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <Pressable style={styles.dropdownOverlay} onPress={() => setShowDropdown(false)}>
          <View style={{ paddingTop: insets.top + 100, paddingHorizontal: Spacing.page, alignItems: 'center' }}>
            <Pressable
              style={[styles.dropdownSheet, {
                backgroundColor: colors.isDark ? 'rgba(30,28,25,0.92)' : 'rgba(255,255,255,0.85)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 16 },
                shadowOpacity: 0.15,
                shadowRadius: 32,
                elevation: 20,
              }]}
              onPress={(e) => e.stopPropagation()}
            >
              {(['this-week', 'next-week', 'past'] as WeekOption[]).map((option) => {
                const isActive = selectedWeek === option && !isDailyView;
                return (
                  <Pressable
                    key={option}
                    onPress={() => {
                      setSelectedWeek(option);
                      setIsDailyView(false);
                      setShowDropdown(false);
                    }}
                    style={[
                      styles.dropdownItem,
                      isActive && { backgroundColor: `${colors.primary}15` },
                    ]}
                  >
                    <Text style={[
                      Typography.titleSmall,
                      { color: isActive ? colors.primary : colors.onSurface },
                      isActive && { fontWeight: '700' },
                    ]}>
                      {weekLabels[option]}
                    </Text>
                    {isActive && (
                      <MaterialCommunityIcons name="check" size={18} color={colors.primary} />
                    )}
                  </Pressable>
                );
              })}

              <View style={[styles.dropdownDivider, { backgroundColor: `${colors.onSurface}08` }]} />

              <Pressable
                style={[
                  styles.dropdownItem,
                  !isDailyView && { backgroundColor: `${colors.primary}08` },
                ]}
                onPress={() => {
                  setIsDailyView(false);
                  setShowDropdown(false);
                }}
              >
                <Text style={[Typography.titleSmall, { color: !isDailyView ? colors.primary : colors.onSurface }]}>
                  Weekly Summary
                </Text>
                <MaterialCommunityIcons
                  name={!isDailyView ? 'toggle-switch' : 'toggle-switch-off-outline'}
                  size={32}
                  color={!isDailyView ? colors.primary : colors.outlineVariant}
                />
              </Pressable>

              <Pressable
                style={[
                  styles.dropdownItem,
                  isDailyView && { backgroundColor: `${colors.primary}08` },
                ]}
                onPress={() => {
                  setIsDailyView(true);
                  setShowDropdown(false);
                }}
              >
                <Text style={[Typography.titleSmall, { color: isDailyView ? colors.primary : colors.onSurface }]}>
                  Daily View
                </Text>
                <MaterialCommunityIcons
                  name={isDailyView ? 'toggle-switch' : 'toggle-switch-off-outline'}
                  size={32}
                  color={isDailyView ? colors.primary : colors.outlineVariant}
                />
              </Pressable>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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
  weekCenter: {
    alignItems: 'center',
  },
  weekTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  daySelectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 6,
    borderRadius: Radius.full,
    marginTop: Spacing.sm,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groceryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderRadius: Radius.md,
    gap: 12,
  },
  groceryTextWrap: {
    flex: 1,
    gap: 2,
  },
  reviewBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
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
    marginBottom: Spacing.xl,
    minHeight: 80,
  },
  dayLeft: {
    width: 12,
    paddingTop: 4,
  },
  timelineNode: {
    width: 12,
    height: 12,
    borderRadius: Radius.full,
  },
  dayRight: {
    flex: 1,
    marginLeft: Spacing.lg,
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
    top: Spacing.md,
    right: Spacing.md,
  },
  dinnerBadgeGlass: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  mealContent: {
    padding: Spacing.md,
    gap: 6,
  },
  mealMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emptyCard: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addMealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
  },
  browseBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.full,
    marginTop: Spacing.sm,
  },
  readyCTA: {
    position: 'absolute',
  },
  readyCTAInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
  },
  playCircle: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  dropdownSheet: {
    width: 240,
    borderRadius: 20,
    padding: Spacing.sm,
    gap: 2,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  dropdownDivider: {
    height: 1,
    marginVertical: 4,
    marginHorizontal: Spacing.sm,
  },
});
