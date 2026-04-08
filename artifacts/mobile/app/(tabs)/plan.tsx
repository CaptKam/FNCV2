import React, { useState, useMemo, useCallback, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { View, Text, ScrollView, StyleSheet, Pressable, Modal, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { Shadows } from '@/constants/shadows';
import { OVERLAY_BUTTON } from '@/constants/icons';
import { GlassView } from '@/components/GlassView';
import { HeaderBar } from '@/components/HeaderBar';
import { RecipePickerSheet } from '@/components/RecipePickerSheet';
import { SmartCookBar } from '@/components/SmartCookBar';
import { useApp, ItineraryDay, PlannedMeal } from '@/context/AppContext';
import { Recipe, recipes as allRecipes } from '@/data/recipes';
import { formatCookTime } from '@/data/helpers';
import { NutritionInfo } from '@/data/nutrition';
import { calculateCookReadiness } from '@/utils/cookReadiness';

// ─── Helpers ───

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function toISO(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function getTodayISO(): string {
  return toISO(new Date());
}

type CourseSlot = { label: string; icon: string; placeholder: string; courseType: 'appetizer' | 'dessert' };
const COURSE_SLOTS: CourseSlot[] = [
  { label: 'Appetizer', icon: 'food-variant', placeholder: 'Add an Appetizer...', courseType: 'appetizer' },
  { label: 'Dessert', icon: 'ice-cream', placeholder: 'Sweet finish...', courseType: 'dessert' },
];

function getDayNutrition(day: ItineraryDay): NutritionInfo | null {
  const meals = [day.courses.appetizer, day.courses.main, day.courses.dessert].filter(Boolean) as PlannedMeal[];
  if (meals.length === 0) return null;
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  for (const meal of meals) {
    const recipe = allRecipes.find((r) => r.id === meal.recipeId);
    if (recipe?.nutrition) {
      totals.calories += recipe.nutrition.calories;
      totals.protein += recipe.nutrition.protein;
      totals.carbs += recipe.nutrition.carbs;
      totals.fat += recipe.nutrition.fat;
    }
  }
  return totals;
}

type WeekOption = 'this-week' | 'next-week' | 'past';

// ─── Meal card for filled slots (shared between views) ───

function MealCard({
  meal,
  imageStyle,
  badgeLabel,
  headlineFontSize,
  onPress,
  onSwap,
  onRemove,
  colors,
}: {
  meal: PlannedMeal;
  imageStyle: object;
  badgeLabel: string;
  headlineFontSize?: number;
  onPress: () => void;
  onSwap?: () => void;
  onRemove?: () => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${meal.recipeName}, ${meal.cookTime} minutes`}
    >
      <GlassView style={styles.mealCard}>
        <View>
          <Image
            source={{ uri: meal.recipeImage }}
            style={imageStyle}
            contentFit="cover"
            transition={300}
            accessible={false}
          />
          {onSwap && (
            <View style={styles.imageActionLeft}>
              <Pressable
                onPress={(e) => { e.stopPropagation(); onSwap(); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Swap recipe"
              >
                <View style={styles.imageActionBtn}>
                  <MaterialCommunityIcons name="swap-horizontal" size={16} color={OVERLAY_BUTTON.iconColor} />
                  <Text style={{ fontSize: 10, color: OVERLAY_BUTTON.iconColor, fontWeight: '700', letterSpacing: 0.3 }}>Swap</Text>
                </View>
              </Pressable>
            </View>
          )}
          {onRemove && (
            <View style={styles.imageActionRight}>
              <Pressable
                onPress={(e) => { e.stopPropagation(); onRemove(); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Remove recipe"
              >
                <View style={styles.imageActionBtn}>
                  <MaterialCommunityIcons name="close" size={16} color={OVERLAY_BUTTON.iconColor} />
                  <Text style={{ fontSize: 10, color: OVERLAY_BUTTON.iconColor, fontWeight: '700', letterSpacing: 0.3 }}>Remove</Text>
                </View>
              </Pressable>
            </View>
          )}
          <View style={styles.recipeBadge}>
            <View style={[styles.recipeBadgePill, { backgroundColor: 'rgba(30, 25, 20, 0.85)' }]}>
              <Text style={[Typography.labelSmall, { color: '#FFFFFF', fontWeight: '700', letterSpacing: 0.5 }]}>{badgeLabel}</Text>
            </View>
          </View>
        </View>
        <View style={styles.mealContent}>
          <Text style={[Typography.headline, { color: colors.onSurface }]} numberOfLines={1}>
            {meal.recipeName}
          </Text>
          <View style={styles.mealMeta}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={colors.outline} />
            <Text style={[Typography.caption, { color: colors.outline }]}>
              {formatCookTime(meal.cookTime)}
            </Text>
          </View>
        </View>
      </GlassView>
    </Pressable>
  );
}

export default function PlanScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const app = useApp();

  const todayISO = getTodayISO();
  const [weekStartDate, setWeekStartDate] = useState(() => toISO(getMonday(new Date())));
  const [showDropdown, setShowDropdown] = useState(false);
  const [showQuickGen, setShowQuickGen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<WeekOption>('this-week');
  const [isDailyView, setIsDailyView] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const dayOfWeek = new Date().getDay();
    return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  });
  const [multipleMeals, setMultipleMeals] = useState(false);

  // Recipe picker state
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<{ date: string; courseType: 'appetizer' | 'main' | 'dessert' } | null>(null);

  // First-time auto-generate explanation
  const [hasSeenAutoGen, setHasSeenAutoGen] = useState(true); // default true to avoid flash
  const [showPlanHint, setShowPlanHint] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem('@fork_compass_autogen_seen').then((val) => {
      if (val !== 'true') setHasSeenAutoGen(false);
    });
    AsyncStorage.getItem('@fork_compass_hint_plan_seen').then((val) => {
      if (val !== 'true') setShowPlanHint(true);
    });
  }, []);

  const dismissPlanHint = useCallback(() => {
    setShowPlanHint(false);
    AsyncStorage.setItem('@fork_compass_hint_plan_seen', 'true');
  }, []);

  // ─── Week data from AppContext ───
  const weekDays: ItineraryDay[] = app.getWeek(weekStartDate);
  const todaysMeals = app.getTodaysMeals();
  const uncheckedGroceryCount = app.getUncheckedCount();

  const selectedDay = weekDays[selectedDayIndex];
  const selectedDate = selectedDay?.date ?? '';

  const plannedCount = useMemo(
    () => weekDays.filter((d) => d.courses.appetizer || d.courses.main || d.courses.dessert).length,
    [weekDays]
  );

  // Auto-dismiss plan hint when first meal is added
  useEffect(() => {
    if (showPlanHint && plannedCount > 0) {
      setShowPlanHint(false);
      AsyncStorage.setItem('@fork_compass_hint_plan_seen', 'true');
    }
  }, [plannedCount, showPlanHint]);

  // ─── Week navigation ───
  const shiftWeek = useCallback((delta: number) => {
    setWeekStartDate((prev) => addDays(prev, delta * 7));
    if (delta > 0) setSelectedWeek('next-week');
    else if (delta < 0) setSelectedWeek('past');
    else setSelectedWeek('this-week');
  }, []);

  // ─── Recipe picker ───
  const openPicker = useCallback((date: string, courseType: 'appetizer' | 'main' | 'dessert') => {
    setPickerTarget({ date, courseType });
    setPickerVisible(true);
  }, []);

  const handlePickRecipe = useCallback((recipe: Recipe) => {
    if (pickerTarget) {
      app.addCourseToDay(pickerTarget.date, pickerTarget.courseType, recipe);
    }
  }, [pickerTarget, app]);

  // ─── Remove course (long press) ───
  const handleRemoveCourse = useCallback((date: string, courseType: 'appetizer' | 'main' | 'dessert') => {
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch {}
    app.removeCourseFromDay(date, courseType);
  }, [app]);

  // ─── Week label ───
  const weekLabel = useMemo(() => {
    const start = formatDateLabel(weekStartDate);
    const end = formatDateLabel(addDays(weekStartDate, 6));
    return `${start} – ${end}`;
  }, [weekStartDate]);

  const weekLabels: Record<WeekOption, string> = {
    'this-week': 'This Week',
    'next-week': 'Next Week',
    'past': 'Past Weeks',
  };

  // ─── Daily view data ───
  const dailyMeals = useMemo(() => {
    if (!selectedDay) return [];
    const slots: { time: string; label: string; courseType: 'appetizer' | 'main' | 'dessert'; meal?: PlannedMeal }[] = [
      { time: '12:00 PM', label: 'Appetizer', courseType: 'appetizer', meal: selectedDay.courses.appetizer },
      { time: '07:30 PM', label: 'Dinner', courseType: 'main', meal: selectedDay.courses.main },
      { time: '09:00 PM', label: 'Dessert', courseType: 'dessert', meal: selectedDay.courses.dessert },
    ];
    return slots;
  }, [selectedDay]);

  const primaryMeal = selectedDay?.courses.main;
  // ─── Grocery banner ───
  const renderGroceryBanner = () => (
    <View style={{ paddingHorizontal: Spacing.page, marginBottom: Spacing.lg }}>
      <View style={[styles.groceryBanner, { backgroundColor: colors.primaryTint }]}>
        <MaterialCommunityIcons name="basket" size={22} color={colors.primary} />
        <View style={styles.groceryTextWrap}>
          <Text style={[Typography.titleSmall, { color: colors.onSurface }]}>
            Grocery List Update
          </Text>
          <Text style={[Typography.caption, { color: colors.outline }]}>
            {uncheckedGroceryCount} items missing for your planned meals
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/grocery')}
          style={[styles.reviewBtn, { backgroundColor: colors.glassOverlay }]}
          accessibilityRole="button"
          accessibilityLabel="Review grocery list"
        >
          <Text style={[Typography.labelSmall, { color: colors.primary, fontWeight: '700' }]}>
            Review
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <HeaderBar />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160, paddingTop: insets.top + 76 }}
      >

        {/* Week pill with chevron navigation */}
        <View style={{ paddingHorizontal: Spacing.page, marginBottom: Spacing.sm }}>
          <GlassView style={[styles.weekPill, { ...Shadows.subtle }]}>
            <Pressable
              style={styles.weekArrow}
              onPress={() => {
                if (isDailyView) {
                  if (selectedDayIndex > 0) {
                    setSelectedDayIndex(selectedDayIndex - 1);
                  } else {
                    shiftWeek(-1);
                    setSelectedDayIndex(6);
                  }
                } else {
                  shiftWeek(-1);
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={isDailyView ? "Previous day" : "Previous week"}
            >
              <MaterialCommunityIcons name="chevron-left" size={24} color={colors.primary} />
            </Pressable>
            <Pressable onPress={() => setShowDropdown(true)} style={styles.weekCenter} accessibilityRole="button" accessibilityLabel="Change planning view">
              <Text style={[Typography.labelLarge, { color: colors.outline, marginBottom: Spacing.xs }]}>
                YOUR MEAL PLAN
              </Text>
              <View style={styles.weekTitleRow}>
                <Text style={[Typography.title, { color: colors.onSurface }]}>
                  {isDailyView ? (selectedDay?.dayLabel ?? '') : weekLabels[selectedWeek]}
                </Text>
                {isDailyView && selectedDate === todayISO && (
                  <Text style={[Typography.title, { color: colors.primary }]}> · Today</Text>
                )}
                <MaterialCommunityIcons name="chevron-down" size={18} color={colors.primary} />
              </View>
              {isDailyView ? (
                <Text style={[Typography.caption, { color: colors.primary, marginTop: Spacing.xs }]}>
                  {formatDateLabel(selectedDate)} · {weekLabels[selectedWeek]}
                </Text>
              ) : (
                <Text style={[Typography.caption, { color: colors.outline, marginTop: Spacing.xs }]}>
                  {weekLabel}
                </Text>
              )}
            </Pressable>
            <Pressable
              style={styles.weekArrow}
              onPress={() => {
                if (isDailyView) {
                  if (selectedDayIndex < 6) {
                    setSelectedDayIndex(selectedDayIndex + 1);
                  } else {
                    shiftWeek(1);
                    setSelectedDayIndex(0);
                  }
                } else {
                  shiftWeek(1);
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={isDailyView ? "Next day" : "Next week"}
            >
              <MaterialCommunityIcons name="chevron-right" size={24} color={colors.primary} />
            </Pressable>
          </GlassView>
        </View>

        {/* Day selector strip (daily view) */}
        {isDailyView && (
          <View style={{ paddingHorizontal: Spacing.page, marginBottom: Spacing.md }}>
            <GlassView style={[styles.daySelectorPill, { ...Shadows.subtle }]}>
              {DAY_LETTERS.map((letter, i) => {
                const isActive = i === selectedDayIndex;
                const day = weekDays[i];
                const hasRecipe = !!(day?.courses.appetizer || day?.courses.main || day?.courses.dessert);
                const isToday = day?.date === todayISO;
                return (
                  <Pressable
                    key={i}
                    onPress={() => {
                      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                      setSelectedDayIndex(i);
                    }}
                    style={[
                      styles.dayCircle,
                      isActive && { backgroundColor: colors.primary },
                      !isActive && hasRecipe && { backgroundColor: colors.primaryMuted },
                      !isActive && isToday && { borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.primaryTint },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${day?.dayLabel ?? ''}${isToday ? ', today' : ''}`}
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text style={[
                      Typography.caption,
                      { fontWeight: '600' },
                      isActive ? { color: colors.onPrimary } : isToday ? { color: colors.primary, fontWeight: '700' } : { color: colors.outline },
                    ]}>
                      {letter}
                    </Text>
                  </Pressable>
                );
              })}
            </GlassView>
          </View>
        )}

        {/* Multiple meals toggle */}
        {isDailyView && (
          <View style={[styles.multipleMealsRow, { marginHorizontal: Spacing.page }]}>
            <Text style={[Typography.labelLarge, { color: colors.outline, letterSpacing: 1 }]}>
              MULTIPLE MEALS
            </Text>
            <Pressable onPress={() => setMultipleMeals(!multipleMeals)} accessibilityRole="switch" accessibilityLabel="Multiple meals" accessibilityState={{ checked: multipleMeals }}>
              <MaterialCommunityIcons
                name={multipleMeals ? 'toggle-switch' : 'toggle-switch-off-outline'}
                size={36}
                color={multipleMeals ? colors.primary : colors.outlineVariant}
              />
            </Pressable>
          </View>
        )}

        {/* First-time plan hint */}
        {showPlanHint && plannedCount === 0 && (
          <View style={{ paddingHorizontal: Spacing.page, marginBottom: Spacing.md }}>
            <View style={[styles.onboardingHint, { backgroundColor: colors.surfaceContainerLow }]}>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.body, { color: colors.onSurface }]}>
                  Plan your week here. Tap any day to add a recipe, or use Auto-Plan to fill your week in one tap.
                </Text>
              </View>
              <Pressable onPress={dismissPlanHint} hitSlop={8} accessibilityRole="button" accessibilityLabel="Dismiss hint">
                <MaterialCommunityIcons name="close" size={18} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>
          </View>
        )}

        {!isDailyView && <View style={{ height: Spacing.sm }} />}

        {!isDailyView && renderGroceryBanner()}

        {/* ═══ DAILY VIEW ═══ */}
        {isDailyView ? (
          multipleMeals ? (
            /* ── Daily: multiple meals timeline ── */
            <>
              <View style={styles.timeline}>
                <View style={[styles.timelineLine, { backgroundColor: colors.primarySoft }]} />
                {dailyMeals.map((slot, idx) => {
                  const meal = slot.meal;
                  return (
                    <View key={`${selectedDate}-${idx}`} style={styles.dayRow}>
                      <View style={styles.dayLeft}>
                        <View
                          style={[
                            styles.timelineNode,
                            {
                              backgroundColor: meal ? colors.primary : colors.surfaceContainerHigh,
                            },
                          ]}
                        />
                      </View>
                      <View style={styles.dayRight}>
                        <Text style={[Typography.labelLarge, { color: colors.primary, marginBottom: Spacing.sm, letterSpacing: 1.5 }]}>
                          {slot.time} {'\u2022'} {slot.label}
                        </Text>
                        {meal ? (
                          <MealCard
                            meal={meal}
                            imageStyle={styles.mealImage}
                            badgeLabel={slot.label.toUpperCase()}
                            headlineFontSize={22}
                            onPress={() => router.push(`/recipe/${meal.recipeId}`)}
                            onSwap={() => openPicker(selectedDate, slot.courseType)}
                            onRemove={() => handleRemoveCourse(selectedDate, slot.courseType)}
                            colors={colors}
                          />
                        ) : (
                          <View style={[styles.emptyCard, { borderColor: colors.outlineVariant }]}>
                            <View style={styles.emptyCardRow}>
                              <MaterialCommunityIcons
                                name={slot.label === 'Appetizer' ? 'food-variant' : 'silverware-variant'}
                                size={20}
                                color={colors.outline}
                              />
                              <Text style={[Typography.bodySmall, { color: colors.outline, fontStyle: 'italic' }]}>
                                {slot.label} unassigned...
                              </Text>
                            </View>
                            <Pressable
                              onPress={() => openPicker(selectedDate, slot.courseType)}
                              style={styles.addMealBtn}
                              accessibilityRole="button"
                              accessibilityLabel={`Add ${slot.label}`}
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
              {renderGroceryBanner()}
            </>
          ) : (
            /* ── Daily: single meal (primary dinner) + course slots ── */
            <>
              <View style={styles.timeline}>
                <View style={[styles.timelineLine, { backgroundColor: colors.primarySoft }]} />

                <View style={styles.dayRow}>
                  <View style={styles.dayLeft}>
                    <View style={[styles.timelineNode, { backgroundColor: colors.primary }]} />
                  </View>
                  <View style={styles.dayRight}>
                    <View style={styles.primaryMealHeader}>
                      <Text style={[Typography.labelLarge, { color: colors.primary, letterSpacing: 1.5 }]}>
                        07:30 PM {'\u2022'} Primary Meal (Dinner)
                      </Text>
                      <Pressable
                        onPress={() => app.toggleDinnerParty(selectedDate)}
                        style={[
                          styles.dinnerPartyBadge,
                          { backgroundColor: selectedDay?.hasDinnerParty ? colors.primarySoft : colors.primaryMuted },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={selectedDay?.hasDinnerParty ? 'Disable dinner party' : 'Enable dinner party'}
                      >
                        <MaterialCommunityIcons name="account-group" size={14} color={colors.primary} />
                        <Text style={[Typography.labelSmall, { color: colors.primary, fontWeight: '700', letterSpacing: 0.3 }]}>
                          Dinner Party
                        </Text>
                      </Pressable>
                    </View>
                    {primaryMeal ? (
                      <MealCard
                        meal={primaryMeal}
                        imageStyle={styles.mealImageTall}
                        badgeLabel="DINNER"
                        headlineFontSize={24}
                        onPress={() => router.push(`/recipe/${primaryMeal.recipeId}`)}
                        onSwap={() => openPicker(selectedDate, 'main')}
                        onRemove={() => handleRemoveCourse(selectedDate, 'main')}
                        colors={colors}
                      />
                    ) : (
                      <View style={[styles.emptyCard, { borderColor: colors.outlineVariant }]}>
                        <View style={[styles.emptyIconCircle, { backgroundColor: colors.primarySubtle }]}>
                          <MaterialCommunityIcons name="silverware-variant" size={28} color={colors.primary} />
                        </View>
                        <Text style={[Typography.bodySmall, { color: colors.outline }]}>
                          No meal planned yet — let's find something delicious
                        </Text>
                        <Pressable
                          onPress={() => openPicker(selectedDate, 'main')}
                          style={[styles.browseBtn, { backgroundColor: colors.primary }]}
                          accessibilityRole="button"
                          accessibilityLabel="Browse recipes"
                        >
                          <Text style={[Typography.titleSmall, { color: colors.onPrimary }]}>
                            Browse Recipes
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                </View>

                {/* Appetizer / Dessert course slots */}
                {COURSE_SLOTS.map((course) => {
                  const courseMeal = selectedDay?.courses[course.courseType];
                  return (
                    <View key={course.label} style={styles.dayRow}>
                      <View style={styles.dayLeft}>
                        <View style={[styles.timelineNodeSmall, { backgroundColor: colors.primarySoft }]} />
                      </View>
                      <View style={styles.dayRight}>
                        <Text style={[Typography.labelLarge, { color: colors.outline, marginBottom: Spacing.sm, letterSpacing: 1 }]}>
                          {course.label.toUpperCase()}
                        </Text>
                        {courseMeal ? (
                          <MealCard
                            meal={courseMeal}
                            imageStyle={styles.mealImage}
                            badgeLabel={course.label.toUpperCase()}
                            headlineFontSize={20}
                            onPress={() => router.push(`/recipe/${courseMeal.recipeId}`)}
                            onSwap={() => openPicker(selectedDate, course.courseType)}
                            onRemove={() => handleRemoveCourse(selectedDate, course.courseType)}
                            colors={colors}
                          />
                        ) : (
                          <View style={[styles.courseCard, {
                            borderColor: colors.outlineVariant,
                            backgroundColor: colors.warmFill,
                          }]}>
                            <View style={styles.courseCardInner}>
                              <View style={styles.emptyCardRow}>
                                <MaterialCommunityIcons
                                  name={course.icon as any}
                                  size={20}
                                  color={colors.outlineMuted}
                                />
                                <Text style={[Typography.bodySmall, { color: colors.outlineMuted, fontStyle: 'italic' }]}>
                                  {course.placeholder}
                                </Text>
                              </View>
                              <Pressable
                                onPress={() => openPicker(selectedDate, course.courseType)}
                                style={[styles.addCircle, {
                                  backgroundColor: colors.glassOverlay,
                                }]}
                                accessibilityRole="button"
                                accessibilityLabel={`Add ${course.label}`}
                              >
                                <MaterialCommunityIcons name="plus" size={18} color={colors.primary} />
                              </Pressable>
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
              {renderGroceryBanner()}
            </>
          )
        ) : (
          /* ═══ WEEKLY VIEW ═══ */
          <View style={styles.timeline}>
            <View style={[styles.timelineLine, { backgroundColor: colors.primarySoft }]} />
            {weekDays.map((day) => {
              const mainMeal = day.courses.main;
              const isToday = day.date === todayISO;

              return (
                <View key={day.date} style={styles.dayRow}>
                  <View style={styles.dayLeft}>
                    <View
                      style={[
                        styles.timelineNode,
                        {
                          backgroundColor: mainMeal ? colors.primary : colors.surfaceContainerHigh,
                        },
                        isToday && !mainMeal && { borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.primaryMuted, width: 14, height: 14 },
                        isToday && mainMeal && { width: 14, height: 14 },
                      ]}
                    />
                  </View>
                  <View style={styles.dayRight}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.xs }}>
                      <Text style={[Typography.titleSmall, { color: isToday ? colors.primary : colors.outline, fontWeight: isToday ? '700' : '600' }]}>
                        {day.dayLabel}, {formatDateLabel(day.date)}
                      </Text>
                      {isToday && (
                        <View style={[styles.todayBadge, { backgroundColor: colors.primary }]}>
                          <Text style={[Typography.labelSmall, { color: colors.onPrimary, fontWeight: '700' }]}>
                            TODAY
                          </Text>
                        </View>
                      )}
                    </View>
                    {/* Dinner party indicator */}
                    {(() => {
                      const dayParty = app.getDinnerPartyForDate(day.date);
                      if (dayParty) {
                        const guestCount = app.getGuestCount(dayParty.id);
                        const conflicts = app.checkDietaryConflicts(dayParty.id);
                        return (
                          <Pressable
                            onPress={() => router.push(`/dinner-setup?date=${day.date}`)}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm }}
                            accessibilityRole="button"
                            accessibilityLabel={`Dinner party with ${guestCount.total} guests`}
                          >
                            <View style={[styles.partyPill, { backgroundColor: `${colors.primary}15` }]}>
                              <Text style={{ fontSize: 14 }}>🍽️</Text>
                              <Text style={[Typography.caption, { color: colors.primary, fontWeight: '700' }]}>{guestCount.total} guests</Text>
                            </View>
                            {conflicts.length > 0 && (
                              <View style={[styles.partyPill, { backgroundColor: `${colors.warning}15` }]}>
                                <Text style={[Typography.caption, { color: colors.warning, fontWeight: '700' }]}>⚠️ Dietary conflicts</Text>
                              </View>
                            )}
                          </Pressable>
                        );
                      }
                      if (mainMeal) {
                        return (
                          <View style={[styles.dinnerPartyPromo, { backgroundColor: colors.surfaceContainerLow }]}>
                            <View style={styles.dinnerPartyPromoContent}>
                              <Text style={{ fontSize: 20, marginRight: Spacing.sm }}>🎉</Text>
                              <View style={{ flex: 1 }}>
                                <Text style={[Typography.titleSmall, { color: colors.onSurface, marginBottom: 2 }]}>Hosting tonight?</Text>
                                <Text style={[Typography.caption, { color: colors.onSurfaceVariant }]}>
                                  Invite friends and we'll handle the timing and dietary needs.
                                </Text>
                              </View>
                            </View>
                            <Pressable
                              onPress={() => router.push(`/dinner-setup?date=${day.date}`)}
                              style={[styles.dinnerPartyPromoCTA, { backgroundColor: colors.primary }]}
                              accessibilityRole="button"
                              accessibilityLabel="Plan a dinner party"
                            >
                              <Text style={[Typography.titleSmall, { color: colors.onPrimary }]}>Plan a Dinner Party</Text>
                            </Pressable>
                          </View>
                        );
                      }
                      return null;
                    })()}

                    {mainMeal ? (
                      <MealCard
                        meal={mainMeal}
                        imageStyle={styles.mealImage}
                        badgeLabel="DINNER"
                        headlineFontSize={22}
                        onPress={() => router.push(`/recipe/${mainMeal.recipeId}`)}
                        onSwap={() => openPicker(day.date, 'main')}
                        onRemove={() => handleRemoveCourse(day.date, 'main')}
                        colors={colors}
                      />
                    ) : (
                      <View
                        style={[styles.emptyCard, { borderColor: colors.outlineVariant }]}
                      >
                        <View style={[styles.emptyIconCircle, { backgroundColor: colors.primarySubtle }]}>
                          <MaterialCommunityIcons name="silverware-variant" size={28} color={colors.primary} />
                        </View>
                        <Text style={[Typography.bodySmall, { color: colors.outline }]}>
                          This day is wide open — discover something new
                        </Text>
                        <Pressable
                          onPress={() => openPicker(day.date, 'main')}
                          style={[styles.browseBtn, { backgroundColor: colors.primary }]}
                          accessibilityRole="button"
                          accessibilityLabel="Browse recipes"
                        >
                          <Text style={[Typography.titleSmall, { color: colors.onPrimary }]}>
                            Browse Recipes
                          </Text>
                        </Pressable>
                      </View>
                    )}
                    {(() => {
                      const dayNutrition = getDayNutrition(day);
                      if (!dayNutrition) return null;
                      return (
                        <View style={[styles.dayNutritionRow, { backgroundColor: colors.surfaceContainerLow }]}>
                          <View style={styles.dayNutritionItem}>
                            <Text style={[Typography.caption, { color: colors.primary, fontWeight: '700' }]}>{dayNutrition.calories}</Text>
                            <Text style={[Typography.caption, { color: colors.outline, fontSize: 10 }]}>kcal</Text>
                          </View>
                          <View style={[styles.dayNutritionDot, { backgroundColor: colors.outlineVariant }]} />
                          <View style={styles.dayNutritionItem}>
                            <Text style={[Typography.caption, { color: colors.onSurfaceVariant }]}>{dayNutrition.protein}g</Text>
                            <Text style={[Typography.caption, { color: colors.outline, fontSize: 10 }]}>P</Text>
                          </View>
                          <View style={[styles.dayNutritionDot, { backgroundColor: colors.outlineVariant }]} />
                          <View style={styles.dayNutritionItem}>
                            <Text style={[Typography.caption, { color: colors.onSurfaceVariant }]}>{dayNutrition.carbs}g</Text>
                            <Text style={[Typography.caption, { color: colors.outline, fontSize: 10 }]}>C</Text>
                          </View>
                          <View style={[styles.dayNutritionDot, { backgroundColor: colors.outlineVariant }]} />
                          <View style={styles.dayNutritionItem}>
                            <Text style={[Typography.caption, { color: colors.onSurfaceVariant }]}>{dayNutrition.fat}g</Text>
                            <Text style={[Typography.caption, { color: colors.outline, fontSize: 10 }]}>F</Text>
                          </View>
                        </View>
                      );
                    })()}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Smart Cook Bar — adapts to grocery readiness, timing, and dinner party */}
      <View style={[styles.readyCTA, { bottom: 100, left: 0, right: 0 }]}>
        <SmartCookBar variant="floating" />
      </View>

      {/* Auto-generate FAB — only visible when there are empty days to fill */}
      {(() => {
        const emptyDayCount = weekDays.filter((d) => !d.courses.main).length;
        if (emptyDayCount === 0) return null;

        const cookBarVisible = todaysMeals.length > 0;

        const handleQuickGen = (dayCount: number) => {
          const emptyDates = weekDays
            .filter((d) => !d.courses.main)
            .map((d) => d.date)
            .slice(0, dayCount);
          if (emptyDates.length === 0) return;
          setShowQuickGen(false);

          const doGenerate = () => {
            app.autoGenerateWeek(emptyDates, app.coursePreference);
            try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
          };

          if (!hasSeenAutoGen) {
            Alert.alert(
              'Auto-Plan Your Week',
              `We'll fill your empty days with a variety of recipes from different countries. You can swap any meal afterward.`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Fill Empty Days',
                  onPress: () => {
                    AsyncStorage.setItem('@fork_compass_autogen_seen', 'true');
                    setHasSeenAutoGen(true);
                    doGenerate();
                  },
                },
              ]
            );
          } else {
            Alert.alert(
              'Auto-Plan Meals',
              `Fill ${emptyDates.length} empty day${emptyDates.length > 1 ? 's' : ''} with recipes?${app.dietaryFlags.length > 0 ? '\n\nYour dietary preferences will be respected.' : ''}`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Generate', onPress: doGenerate },
              ]
            );
          }
        };

        return (
          <>
            <View style={[styles.fabContainer, { bottom: cookBarVisible ? 160 : 100, right: Spacing.page }]}>
              <Pressable
                onPress={() => handleQuickGen(emptyDayCount)}
                onLongPress={() => {
                  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
                  setShowQuickGen(true);
                }}
                delayLongPress={400}
                style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.shadow }]}
                accessibilityRole="button"
                accessibilityLabel={`Auto-plan meals for empty days`}
              >
                <MaterialCommunityIcons name="auto-fix" size={22} color={colors.onPrimary} />
                <Text style={[Typography.labelSmall, { color: colors.onPrimary, fontSize: 9, fontWeight: '700', marginTop: 1 }]}>Auto</Text>
              </Pressable>
            </View>

            {/* Quick-gen popup on long press */}
            <Modal visible={showQuickGen} transparent animationType="fade" onRequestClose={() => setShowQuickGen(false)}>
              <Pressable style={styles.quickGenOverlay} onPress={() => setShowQuickGen(false)}>
                <View style={[styles.quickGenSheet, {
                  backgroundColor: colors.isDark ? 'rgba(30,28,25,0.95)' : 'rgba(255,255,255,0.92)',
                  shadowColor: colors.shadow,
                  bottom: cookBarVisible ? 220 : 160,
                  right: Spacing.page,
                }]}>
                  <Text style={[Typography.labelLarge, { color: colors.outline, marginBottom: Spacing.sm }]}>
                    AUTO-PLAN MEALS
                  </Text>
                  {[3, 5, 7].map((n) => {
                    const available = Math.min(n, emptyDayCount);
                    if (available === 0) return null;
                    return (
                      <Pressable
                        key={n}
                        onPress={() => handleQuickGen(available)}
                        style={[styles.quickGenOption, { backgroundColor: colors.surfaceContainerLow }]}
                        accessibilityRole="button"
                        accessibilityLabel={`Generate ${available} days`}
                      >
                        <Text style={[Typography.titleMedium, { color: colors.primary }]}>{available}</Text>
                        <Text style={[Typography.bodySmall, { color: colors.onSurface }]}>
                          {available === emptyDayCount ? 'All empty days' : `${available} days`}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Pressable>
            </Modal>
          </>
        );
      })()}

      {/* View dropdown modal */}
      <Modal
        visible={showDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <Pressable style={[styles.dropdownOverlay, { backgroundColor: colors.overlayBackdrop }]} onPress={() => setShowDropdown(false)} accessibilityRole="button" accessibilityLabel="Close menu">
          <View style={{ paddingTop: insets.top + 100, paddingHorizontal: Spacing.page, alignItems: 'center' }}>
            <Pressable
              style={[styles.dropdownSheet, {
                backgroundColor: colors.dropdownBg,
                ...Shadows.ambient,
              }]}
              onPress={(e) => e.stopPropagation()}
            >
              {(['past', 'this-week', 'next-week'] as WeekOption[]).map((option) => {
                const isActive = selectedWeek === option && !isDailyView;
                return (
                  <Pressable
                    key={option}
                    onPress={() => {
                      if (option === 'this-week') setWeekStartDate(toISO(getMonday(new Date())));
                      else if (option === 'next-week') setWeekStartDate(addDays(toISO(getMonday(new Date())), 7));
                      else setWeekStartDate(addDays(toISO(getMonday(new Date())), -7));
                      setSelectedWeek(option);
                      setIsDailyView(false);
                      setShowDropdown(false);
                    }}
                    style={[
                      styles.dropdownItem,
                      isActive && { backgroundColor: colors.primaryMuted },
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

              <View style={[styles.dropdownDivider, { backgroundColor: colors.primaryTint }]} />

              <Pressable
                style={[
                  styles.dropdownItem,
                  !isDailyView && { backgroundColor: colors.primaryTint },
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
                  isDailyView && { backgroundColor: colors.primaryTint },
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

      {/* Recipe picker bottom sheet */}
      <RecipePickerSheet
        visible={pickerVisible}
        onDismiss={() => setPickerVisible(false)}
        onSelect={handlePickRecipe}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  weekPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
  },
  weekCenter: {
    alignItems: 'center',
  },
  weekTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  daySelectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.xs,
    borderRadius: Radius.full,
    marginTop: Spacing.sm,
  },
  weekArrow: {
    padding: Spacing.xs,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  partyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  multipleMealsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  groceryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.sm,
  },
  groceryTextWrap: {
    flex: 1,
    gap: Spacing.xs,
  },
  reviewBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  timeline: {
    paddingHorizontal: Spacing.page,
    position: 'relative',
    marginBottom: Spacing.lg,
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
    width: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  timelineNode: {
    width: 12,
    height: 12,
    borderRadius: Radius.full,
  },
  timelineNodeSmall: {
    width: 9,
    height: 9,
    borderRadius: Radius.full,
    marginLeft: 1.5,
    opacity: 0.6,
  },
  dayRight: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  primaryMealHeader: {
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  dinnerPartyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  mealCard: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  mealImage: {
    width: '100%',
    height: 160,
  },
  mealImageTall: {
    width: '100%',
    height: 176,
  },
  imageActionLeft: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    zIndex: 10,
  },
  imageActionRight: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    zIndex: 10,
  },
  imageActionBtn: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: OVERLAY_BUTTON.background,
    borderWidth: OVERLAY_BUTTON.borderWidth,
    borderColor: OVERLAY_BUTTON.borderColor,
  },
  recipeBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: '50%',
    transform: [{ translateX: '-50%' }],
  },
  recipeBadgePill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  mealContent: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  mealMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  emptyCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  emptyCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  addMealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  courseCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  courseCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  browseBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
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
    paddingVertical: Spacing.md,
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
  fabContainer: {
    position: 'absolute',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  quickGenOverlay: {
    flex: 1,
  },
  quickGenSheet: {
    position: 'absolute',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    minWidth: 160,
  },
  quickGenOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
  },
  dropdownOverlay: {
    flex: 1,
  },
  dropdownSheet: {
    width: 240,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  dropdownDivider: {
    height: 1,
    marginVertical: Spacing.xs,
    marginHorizontal: Spacing.sm,
  },
  dayNutritionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
  },
  dayNutritionItem: {
    alignItems: 'center',
    gap: 1,
  },
  dayNutritionDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
  },
  onboardingHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
  },
  dinnerPartyPromo: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  dinnerPartyPromoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dinnerPartyPromoCTA: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
});
