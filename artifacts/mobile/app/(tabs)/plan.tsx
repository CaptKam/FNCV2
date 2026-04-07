import React, { useState, useMemo, useCallback } from 'react';
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
import { HeaderBar } from '@/components/HeaderBar';
import { RecipePickerSheet } from '@/components/RecipePickerSheet';
import { useApp, ItineraryDay, PlannedMeal } from '@/context/AppContext';
import { Recipe } from '@/data/recipes';

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

type WeekOption = 'this-week' | 'next-week' | 'past';

// ─── Meal card for filled slots (shared between views) ───

function MealCard({
  meal,
  imageStyle,
  badgeLabel,
  headlineFontSize,
  onPress,
  onLongPress,
  colors,
}: {
  meal: PlannedMeal;
  imageStyle: object;
  badgeLabel: string;
  headlineFontSize: number;
  onPress: () => void;
  onLongPress?: () => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={`${meal.recipeName}, ${meal.cookTime} minutes`}
    >
      <GlassView style={styles.mealCard}>
        <Image
          source={{ uri: meal.recipeImage }}
          style={imageStyle}
          contentFit="cover"
          transition={300}
          accessible={false}
        />
        <View style={styles.recipeBadge}>
          <GlassView style={styles.recipeBadgeGlass}>
            <Text style={[Typography.labelSmall, { color: colors.textOnImage, fontWeight: '700' }]}>{badgeLabel}</Text>
          </GlassView>
        </View>
        <View style={styles.mealContent}>
          <Text style={[Typography.headline, { color: colors.onSurface, fontSize: headlineFontSize }]} numberOfLines={1}>
            {meal.recipeName}
          </Text>
          <View style={styles.mealMeta}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={colors.outline} />
            <Text style={[Typography.caption, { color: colors.outline }]}>
              {meal.cookTime}m
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
    'past': 'Past Journeys',
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
      <View style={[styles.groceryBanner, { backgroundColor: `${colors.primary}10` }]}>
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
          style={[styles.reviewBtn, { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.5)' }]}
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
              <Text style={[Typography.labelLarge, { color: colors.outline, marginBottom: 2 }]}>
                CURRENT PLANNING
              </Text>
              <View style={styles.weekTitleRow}>
                <Text style={[Typography.headline, { color: colors.onSurface, fontSize: 20 }]}>
                  {isDailyView ? (selectedDay?.dayLabel ?? '') : weekLabels[selectedWeek]}
                </Text>
                {isDailyView && selectedDate === todayISO && (
                  <Text style={[Typography.headline, { color: colors.primary, fontSize: 20 }]}> · Today</Text>
                )}
                <MaterialCommunityIcons name="chevron-down" size={18} color={colors.primary} />
              </View>
              {isDailyView ? (
                <Text style={[Typography.caption, { color: colors.primary, marginTop: 2 }]}>
                  {formatDateLabel(selectedDate)} · {weekLabels[selectedWeek]}
                </Text>
              ) : (
                <Text style={[Typography.caption, { color: colors.outline, marginTop: 2 }]}>
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
                    onPress={() => setSelectedDayIndex(i)}
                    style={[
                      styles.dayCircle,
                      isActive && { backgroundColor: colors.primary },
                      !isActive && hasRecipe && { backgroundColor: `${colors.primary}15` },
                      !isActive && isToday && { borderWidth: 2, borderColor: colors.primary, backgroundColor: `${colors.primary}10` },
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

        {!isDailyView && <View style={{ height: Spacing.sm }} />}

        {!isDailyView && renderGroceryBanner()}

        {/* ═══ DAILY VIEW ═══ */}
        {isDailyView ? (
          multipleMeals ? (
            /* ── Daily: multiple meals timeline ── */
            <>
              <View style={styles.timeline}>
                <View style={[styles.timelineLine, { backgroundColor: `${colors.primary}33` }]} />
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
                            badgeLabel="RECIPE"
                            headlineFontSize={22}
                            onPress={() => router.push(`/recipe/${meal.recipeId}`)}
                            onLongPress={() => handleRemoveCourse(selectedDate, slot.courseType)}
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
                <View style={[styles.timelineLine, { backgroundColor: `${colors.primary}33` }]} />

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
                          { backgroundColor: selectedDay?.hasDinnerParty ? `${colors.primary}30` : `${colors.primary}15` },
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
                        badgeLabel="RECIPE"
                        headlineFontSize={24}
                        onPress={() => router.push(`/recipe/${primaryMeal.recipeId}`)}
                        onLongPress={() => handleRemoveCourse(selectedDate, 'main')}
                        colors={colors}
                      />
                    ) : (
                      <View style={[styles.emptyCard, { borderColor: colors.outlineVariant }]}>
                        <MaterialCommunityIcons name="silverware-variant" size={32} color={colors.outlineVariant} />
                        <Text style={[Typography.bodySmall, { color: colors.outline }]}>
                          No meal planned yet
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
                        <View style={[styles.timelineNodeSmall, { backgroundColor: `${colors.primary}40` }]} />
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
                            onLongPress={() => handleRemoveCourse(selectedDate, course.courseType)}
                            colors={colors}
                          />
                        ) : (
                          <View style={[styles.courseCard, {
                            borderColor: colors.outlineVariant,
                            backgroundColor: colors.isDark ? 'rgba(242,237,231,0.05)' : 'rgba(242,237,231,0.3)',
                          }]}>
                            <View style={styles.courseCardInner}>
                              <View style={styles.emptyCardRow}>
                                <MaterialCommunityIcons
                                  name={course.icon as any}
                                  size={20}
                                  color={`${colors.outline}99`}
                                />
                                <Text style={[Typography.bodySmall, { color: `${colors.outline}99`, fontStyle: 'italic' }]}>
                                  {course.placeholder}
                                </Text>
                              </View>
                              <Pressable
                                onPress={() => openPicker(selectedDate, course.courseType)}
                                style={[styles.addCircle, {
                                  backgroundColor: colors.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.5)',
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
            <View style={[styles.timelineLine, { backgroundColor: `${colors.primary}33` }]} />
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
                        isToday && !mainMeal && { borderWidth: 2, borderColor: colors.primary, backgroundColor: `${colors.primary}15`, width: 14, height: 14 },
                        isToday && mainMeal && { width: 14, height: 14 },
                      ]}
                    />
                  </View>
                  <View style={styles.dayRight}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: 6 }}>
                      <Text style={[Typography.titleSmall, { color: isToday ? colors.primary : colors.outline, fontWeight: isToday ? '700' : '600' }]}>
                        {day.dayLabel}, {formatDateLabel(day.date)}
                      </Text>
                      {isToday && (
                        <View style={[styles.todayBadge, { backgroundColor: colors.primary }]}>
                          <Text style={[Typography.caption, { color: colors.onPrimary, fontSize: 10, fontWeight: '700' }]}>
                            TODAY
                          </Text>
                        </View>
                      )}
                    </View>
                    {mainMeal ? (
                      <Pressable
                        onPress={() => router.push(`/recipe/${mainMeal.recipeId}`)}
                        onLongPress={() => handleRemoveCourse(day.date, 'main')}
                        style={[styles.mealCard, { backgroundColor: colors.surfaceContainerLow }]}
                        accessibilityRole="button"
                        accessibilityLabel={`${mainMeal.recipeName}, ${mainMeal.cookTime} minutes`}
                      >
                        <Image
                          source={{ uri: mainMeal.recipeImage }}
                          style={styles.mealImage}
                          contentFit="cover"
                          transition={300}
                          accessible={false}
                        />
                        <View style={styles.recipeBadge}>
                          <GlassView style={styles.recipeBadgeGlass}>
                            <Text style={[Typography.labelSmall, { color: colors.textOnImage }]}>DINNER</Text>
                          </GlassView>
                        </View>
                        <View style={styles.mealContent}>
                          <Text style={[Typography.headline, { color: colors.onSurface, fontSize: 22 }]} numberOfLines={1}>
                            {mainMeal.recipeName}
                          </Text>
                          <View style={styles.mealMeta}>
                            <MaterialCommunityIcons name="clock-outline" size={14} color={colors.outline} />
                            <Text style={[Typography.caption, { color: colors.outline }]}>
                              {mainMeal.cookTime}m
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
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Ready to Cook bar — only visible when today has meals */}
      {todaysMeals.length > 0 && (
        <View style={[styles.readyCTA, { bottom: 100, left: Spacing.page, right: Spacing.page }]}>
          <Pressable onPress={() => {
            const mainToday = todaysMeals.find((m) => weekDays.find((d) =>
              d.date === new Date().toISOString().split('T')[0] && d.courses.main?.recipeId === m.recipeId
            ));
            const targetId = mainToday?.recipeId ?? todaysMeals[0]?.recipeId;
            if (targetId) {
              router.push(`/cook-mode/${targetId}`);
            } else {
              router.push('/(tabs)/cook');
            }
          }} accessibilityRole="button" accessibilityLabel="Ready to cook">
            <GlassView style={[styles.readyCTAInner, { ...Shadows.ambient }]}>
              <View style={[styles.playCircle, { backgroundColor: colors.primary }]}>
                <MaterialCommunityIcons name="play" size={16} color={colors.onPrimary} />
              </View>
              <Text style={[Typography.titleSmall, { color: colors.primary, fontWeight: '700' }]}>
                Ready to Cook
              </Text>
              <View style={{ flex: 1 }} />
              <Text style={[Typography.labelSmall, { color: colors.outline }]}>
                {isDailyView ? `${selectedDay?.dayLabel}'s Prep` : "Today's Prep"}
              </Text>
            </GlassView>
          </Pressable>
        </View>
      )}

      {/* Auto-generate FAB */}
      <View style={[styles.fabContainer, { bottom: todaysMeals.length > 0 ? 160 : 100, right: Spacing.page }]}>
        <Pressable
          onPress={() => {
            const emptyDates = weekDays
              .filter((d) => !d.courses.main)
              .map((d) => d.date);
            if (emptyDates.length > 0) {
              app.autoGenerateWeek(emptyDates, app.coursePreference);
            }
          }}
          style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.shadow }]}
          accessibilityRole="button"
          accessibilityLabel="Auto-generate meal plan"
        >
          <MaterialCommunityIcons name="auto-fix" size={22} color={colors.onPrimary} />
        </Pressable>
      </View>

      {/* View dropdown modal */}
      <Modal
        visible={showDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <Pressable style={styles.dropdownOverlay} onPress={() => setShowDropdown(false)} accessibilityRole="button" accessibilityLabel="Close menu">
          <View style={{ paddingTop: insets.top + 100, paddingHorizontal: Spacing.page, alignItems: 'center' }}>
            <Pressable
              style={[styles.dropdownSheet, {
                backgroundColor: colors.isDark ? 'rgba(30,28,25,0.92)' : 'rgba(255,255,255,0.85)',
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 16 },
                shadowOpacity: 0.15,
                shadowRadius: 32,
                elevation: 20,
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
  weekArrow: {
    padding: 4,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
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
    width: 12,
    paddingTop: 4,
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
    gap: 8,
  },
  dinnerPartyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
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
  recipeBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
  },
  recipeBadgeGlass: {
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
  courseCard: {
    borderWidth: 1.5,
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
  fabContainer: {
    position: 'absolute',
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
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
