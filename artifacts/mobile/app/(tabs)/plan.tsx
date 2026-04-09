import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { View, Text, StyleSheet, Pressable, Modal, Alert, Animated as RNAnimated, Platform } from 'react-native';
import Animated, { FadeInDown, FadeOutDown, useReducedMotion, useSharedValue, useAnimatedStyle, useAnimatedScrollHandler, useAnimatedRef, withSpring, interpolate, Extrapolation } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Swipeable } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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
import { PressableScale } from '@/components/PressableScale';
import { RecipePickerSheet } from '@/components/RecipePickerSheet';

import { useApp, ItineraryDay, PlannedMeal } from '@/context/AppContext';
import { Recipe, recipes as allRecipes } from '@/data/recipes';
import { formatCookTime } from '@/data/helpers';
import { NutritionInfo } from '@/data/nutrition';
import { todayLocal, dateToLocal, addDays, getMonday, formatDateShort as formatDateLabel } from '@/utils/dates';

// ─── Helpers ───

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type MCIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type CourseSlot = { label: string; icon: MCIconName; placeholder: string; courseType: 'appetizer' | 'dessert' };
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
  const card = (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${meal.recipeName}, ${meal.cookTime} minutes`}
      scaleDown={0.97}
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
                  <MaterialCommunityIcons name="swap-horizontal" size={20} color={OVERLAY_BUTTON.iconColor} />
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
                  <MaterialCommunityIcons name="close" size={20} color={OVERLAY_BUTTON.iconColor} />
                  <Text style={{ fontSize: 10, color: OVERLAY_BUTTON.iconColor, fontWeight: '700', letterSpacing: 0.3 }}>Remove</Text>
                </View>
              </Pressable>
            </View>
          )}
          <View style={styles.recipeBadge}>
            <View style={[styles.recipeBadgePill, { backgroundColor: OVERLAY_BUTTON.background }]}>
              <Text style={[Typography.labelSmall, { color: OVERLAY_BUTTON.iconColor, fontWeight: '700', letterSpacing: 0.5 }]}>{badgeLabel}</Text>
            </View>
          </View>
        </View>
        <View style={styles.mealContent}>
          <Text style={[Typography.headline, { color: colors.onSurface }]} numberOfLines={1}>
            {meal.recipeName}
          </Text>
          <View style={styles.mealMeta}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={colors.outline} />
            <Text style={[Typography.caption, { color: colors.outline }]}>
              {formatCookTime(meal.cookTime)}
            </Text>
          </View>
        </View>
      </GlassView>
    </PressableScale>
  );

  if (!onRemove) return card;

  return (
    <Swipeable
      renderRightActions={(progress: RNAnimated.AnimatedInterpolation<number>) => (
        <RNAnimated.View style={[styles.swipeRemove, { backgroundColor: colors.error, opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) }]}>
          <MaterialCommunityIcons name="close" size={20} color="#FFFFFF" />
          <Text style={[Typography.labelSmall, { color: '#FFFFFF', marginTop: 4 }]}>Remove</Text>
        </RNAnimated.View>
      )}
      onSwipeableOpen={() => {
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch {}
        onRemove();
      }}
      overshootRight={false}
    >
      {card}
    </Swipeable>
  );
}

export default function PlanScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const app = useApp();

  const todayISO = todayLocal();
  const [weekStartDate, setWeekStartDate] = useState(() => dateToLocal(getMonday(new Date())));
  const [showQuickGen, setShowQuickGen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<WeekOption>('this-week');
  const [isDailyView, setIsDailyView] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const dayOfWeek = new Date().getDay();
    return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  });
  const [multipleMeals, setMultipleMeals] = useState(false);
  const [showGroceryHandoff, setShowGroceryHandoff] = useState(false);
  const lastHandoffTime = useRef(0);
  const reduceMotion = useReducedMotion();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();

  const lastScrollY = useSharedValue(0);
  const accumulatedDelta = useSharedValue(0);
  const navBarTranslateY = useSharedValue(0);
  const [measuredNavHeight, setMeasuredNavHeight] = useState(isDailyView ? 100 : 56);
  const navHeight = useSharedValue(isDailyView ? 100 : 56);
  const HIDE_TRIGGER = 30;
  const SHOW_TRIGGER = 5;
  const springConfig = { damping: 20, stiffness: 200, mass: 0.8 };

  useEffect(() => {
    navHeight.value = measuredNavHeight;
  }, [measuredNavHeight]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const currentY = event.contentOffset.y;
      const diff = currentY - lastScrollY.value;

      if (currentY <= 0) {
        accumulatedDelta.value = 0;
        navBarTranslateY.value = withSpring(0, springConfig);
      } else {
        if ((diff > 0 && accumulatedDelta.value < 0) || (diff < 0 && accumulatedDelta.value > 0)) {
          accumulatedDelta.value = 0;
        }
        accumulatedDelta.value += diff;

        if (accumulatedDelta.value > HIDE_TRIGGER) {
          navBarTranslateY.value = reduceMotion
            ? -navHeight.value
            : withSpring(-navHeight.value, springConfig);
        } else if (accumulatedDelta.value < -SHOW_TRIGGER) {
          navBarTranslateY.value = reduceMotion
            ? 0
            : withSpring(0, springConfig);
        }
      }

      lastScrollY.value = currentY;
    },
  });

  const navBarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: navBarTranslateY.value }],
    opacity: interpolate(
      navBarTranslateY.value,
      [-navHeight.value, -navHeight.value * 0.5, 0],
      [0, 0.5, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const contentSpacerStyle = useAnimatedStyle(() => ({
    height: interpolate(
      navBarTranslateY.value,
      [-navHeight.value, 0],
      [0, navHeight.value],
      Extrapolation.CLAMP,
    ),
  }));

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

  // ─── Toast + Undo state ───
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const undoSnapshot = useRef<{ itinerary: any; grocery: any } | null>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string, withUndo = false) => {
    setToastMessage(msg);
    setShowUndo(withUndo);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => {
      setToastMessage(null);
      setShowUndo(false);
      undoSnapshot.current = null;
    }, withUndo ? 5000 : 3000);
  }, []);

  const handleUndo = useCallback(() => {
    if (undoSnapshot.current) {
      app.restoreItinerary(undoSnapshot.current.itinerary);
      app.restoreGrocery(undoSnapshot.current.grocery);
      undoSnapshot.current = null;
      setShowUndo(false);
      setToastMessage(null);
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
      showToast('Meal plan undone');
    }
  }, [app, showToast]);

  // ─── Week data from AppContext ───
  const weekDays: ItineraryDay[] = app.getWeek(weekStartDate);
  const todaysMeals = app.getTodaysMeals();
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
  const currentMonday = useMemo(() => dateToLocal(getMonday(new Date())), []);
  const shiftWeek = useCallback((delta: number) => {
    setWeekStartDate((prev) => {
      const next = addDays(prev, delta * 7);
      if (next === currentMonday) setSelectedWeek('this-week');
      else if (next > currentMonday) setSelectedWeek('next-week');
      else setSelectedWeek('past');
      return next;
    });
  }, [currentMonday]);

  // ─── Recipe picker ───
  const openPicker = useCallback((date: string, courseType: 'appetizer' | 'main' | 'dessert') => {
    setPickerTarget({ date, courseType });
    setPickerVisible(true);
  }, []);

  const handlePickRecipe = useCallback((recipe: Recipe) => {
    if (pickerTarget) {
      app.addCourseToDay(pickerTarget.date, pickerTarget.courseType, recipe);
      // Check grocery handoff conditions
      setTimeout(() => {
        const mealsPlanned = weekDays.filter(d => d.courses.main).length;
        if (mealsPlanned >= 3 && app.getUncheckedCount() > 0 && Date.now() - lastHandoffTime.current > 600000) {
          lastHandoffTime.current = Date.now();
          try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
          setShowGroceryHandoff(true);
          setTimeout(() => setShowGroceryHandoff(false), 8000);
        }
      }, 500);
    }
  }, [pickerTarget, app, weekDays]);

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

  const weekContainerY = useRef(0);
  const scrollToTodayCard = useCallback((cardY: number) => {
    if (selectedWeek === 'this-week' && !isDailyView) {
      const absoluteY = weekContainerY.current + cardY;
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: Math.max(0, absoluteY - 8), animated: false });
      }, 100);
    }
  }, [selectedWeek, isDailyView]);

  const HEADER_BOTTOM = insets.top + 76;

  const navBarContent = (
    <View style={styles.navBarInner}>
      <View style={styles.navTopRow}>
        <Pressable
          style={styles.navArrow}
          hitSlop={8}
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

        <View style={styles.navCenter}>
          <View style={styles.navTitleLine}>
            <Text style={[Typography.headline, { color: colors.onSurface, fontSize: 18, lineHeight: 24 }]}>
              {isDailyView
                ? `${selectedDay?.dayLabel ?? ''}, ${formatDateLabel(selectedDate)}`
                : weekLabels[selectedWeek]}
            </Text>
            {isDailyView && selectedDate === todayISO && (
              <View style={[styles.todayTag, { backgroundColor: colors.primaryMuted }]}>
                <Text style={[Typography.caption, { color: colors.primary, fontWeight: '700', fontSize: 10, lineHeight: 14 }]}>
                  TODAY
                </Text>
              </View>
            )}
          </View>
          {!isDailyView && (
            <Text style={[Typography.caption, { color: colors.outline, lineHeight: 16, marginTop: 1 }]}>
              {weekLabel}
            </Text>
          )}
        </View>

        <View style={styles.navRight}>
          <View style={[styles.segmentedControl, { backgroundColor: colors.primaryMuted }]}>
            <Pressable
              onPress={() => {
                try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                setIsDailyView(true);
              }}
              style={[
                styles.segmentBtn,
                isDailyView && { backgroundColor: colors.primary },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Switch to daily view"
              accessibilityState={{ selected: isDailyView }}
            >
              <Text style={[
                Typography.caption,
                { fontWeight: '700', fontSize: 12, letterSpacing: 0.3 },
                isDailyView ? { color: colors.onPrimary } : { color: colors.outline },
              ]}>
                Day
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                setIsDailyView(false);
              }}
              style={[
                styles.segmentBtn,
                !isDailyView && { backgroundColor: colors.primary },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Switch to weekly view"
              accessibilityState={{ selected: !isDailyView }}
            >
              <Text style={[
                Typography.caption,
                { fontWeight: '700', fontSize: 12, letterSpacing: 0.3 },
                !isDailyView ? { color: colors.onPrimary } : { color: colors.outline },
              ]}>
                Week
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.navArrow}
            hitSlop={8}
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
        </View>
      </View>

      {isDailyView && (
        <View style={[styles.navDayRow, { borderTopWidth: 1, borderTopColor: colors.outlineVariant + '30' }]}>
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
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <HeaderBar />

      <Animated.View
        style={[
          styles.navBarContainer,
          { top: HEADER_BOTTOM },
          navBarAnimatedStyle,
        ]}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 0 && Math.abs(h - measuredNavHeight) > 2) {
            setMeasuredNavHeight(h);
          }
        }}
      >
        {Platform.OS === 'web' ? (
          <View style={[styles.navBarGlass, {
            backgroundColor: `${colors.surface}B3`,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: 'rgba(255,255,255,0.35)',
          }]}>
            {navBarContent}
          </View>
        ) : (
          <BlurView
            intensity={60}
            tint={colors.isDark ? 'dark' : 'light'}
            style={styles.navBarGlass}
          >
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: `${colors.surface}B3`,
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: 'rgba(255,255,255,0.35)',
                },
              ]}
            />
            {navBarContent}
          </BlurView>
        )}
        <LinearGradient
          colors={[colors.surface + '40', colors.surface + '00']}
          style={{ height: 8 }}
          pointerEvents="none"
        />
      </Animated.View>

      <Animated.ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={scrollHandler}
        contentContainerStyle={{ paddingBottom: Spacing.tabClearance, paddingTop: HEADER_BOTTOM }}
      >
        <Animated.View style={contentSpacerStyle} />

        {/* Multiple meals toggle */}
        {isDailyView && (
          <View style={[styles.multipleMealsRow, { marginHorizontal: Spacing.page }]}>
            <Text style={[Typography.labelLarge, { color: colors.outline, letterSpacing: 1 }]}>
              MULTIPLE MEALS
            </Text>
            <Pressable onPress={() => setMultipleMeals(!multipleMeals)} accessibilityRole="switch" accessibilityLabel="Multiple meals" accessibilityState={{ checked: multipleMeals }}>
              <MaterialCommunityIcons
                name={multipleMeals ? 'toggle-switch' : 'toggle-switch-off-outline'}
                size={40}
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
                <MaterialCommunityIcons name="close" size={20} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>
          </View>
        )}

        {!isDailyView && <View style={{ height: Spacing.sm }} />}

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
                              <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
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
                        <MaterialCommunityIcons name="account-group" size={16} color={colors.primary} />
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
                                  name={course.icon}
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
                                <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
                              </Pressable>
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )
        ) : (
          /* ═══ WEEKLY VIEW ═══ */
          selectedWeek === 'past' ? (
            /* ── Past Week: glass card layout ── */
            <View style={{ paddingHorizontal: Spacing.page, gap: 8 }}>
              {weekDays.map((day) => {
                const { appetizer, main: mainMeal, dessert } = day.courses;
                const allMeals = [appetizer, mainMeal, dessert].filter(Boolean) as PlannedMeal[];
                const hasMeals = allMeals.length > 0;
                const totalTime = allMeals.reduce((sum, m) => sum + (m.cookTime || 0), 0);

                if (!hasMeals) {
                  return (
                    <Pressable
                      key={day.date}
                      onPress={() => openPicker(day.date, 'main')}
                      style={[
                        styles.weekEmptyCard,
                        { backgroundColor: colors.glassOverlay, borderColor: `${colors.outlineVariant}40`, borderWidth: 1, opacity: 0.6 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Add meal for ${day.dayLabel}`}
                    >
                      <View>
                        <Text style={[Typography.headline, { color: colors.onSurface, opacity: 0.35, fontSize: 20 }]}>
                          {day.dayLabel}, {formatDateLabel(day.date)}
                        </Text>
                        <Text style={[Typography.caption, { color: colors.outline, opacity: 0.4, marginTop: 2 }]}>
                          No meals logged
                        </Text>
                      </View>
                      <View style={[styles.weekAddCircle, { backgroundColor: colors.glassOverlay, borderColor: `${colors.outlineVariant}40` }]}>
                        <MaterialCommunityIcons name="plus" size={24} color={`${colors.primary}44`} />
                      </View>
                    </Pressable>
                  );
                }

                return (
                  <GlassView
                    key={day.date}
                    style={styles.pastDayCard}
                    intensity={30}
                  >
                    <View style={styles.pastDayHeader}>
                      <Text style={[Typography.headline, { color: colors.onSurface, fontSize: 20, opacity: 0.45 }]}>
                        {day.dayLabel}, {formatDateLabel(day.date)}
                      </Text>
                      {totalTime > 0 && (
                        <View style={[styles.pastTimePill, { backgroundColor: `${colors.surface}99`, borderColor: `${colors.outlineVariant}30`, opacity: 0.5 }]}>
                          <MaterialCommunityIcons name="clock-outline" size={14} color={colors.outline} />
                          <Text style={[Typography.caption, { color: colors.outline, fontWeight: '500', fontSize: 13 }]}>
                            {formatCookTime(totalTime)}
                          </Text>
                        </View>
                      )}
                    </View>

                    {allMeals.length === 1 && (
                      <Pressable
                        onPress={() => router.push(`/recipe/${allMeals[0].recipeId}`)}
                        style={styles.pastSingleImage}
                        accessibilityRole="button"
                        accessibilityLabel={allMeals[0].recipeName}
                      >
                        <Image source={{ uri: allMeals[0].recipeImage }} style={[styles.pastImageFill, { opacity: 0.5 }]} />
                        <View style={styles.pastDesatOverlay} pointerEvents="none" />
                      </Pressable>
                    )}

                    {allMeals.length === 2 && (
                      <View style={styles.pastTwoGrid}>
                        {allMeals.map((meal) => (
                          <Pressable
                            key={meal.recipeId}
                            onPress={() => router.push(`/recipe/${meal.recipeId}`)}
                            style={styles.pastTwoGridItem}
                            accessibilityRole="button"
                            accessibilityLabel={meal.recipeName}
                          >
                            <Image source={{ uri: meal.recipeImage }} style={[styles.pastImageFill, { opacity: 0.5 }]} />
                            <View style={styles.pastDesatOverlay} pointerEvents="none" />
                          </Pressable>
                        ))}
                      </View>
                    )}

                    {allMeals.length === 3 && (
                      <View style={styles.pastThreeGrid}>
                        {allMeals.map((meal) => (
                          <Pressable
                            key={meal.recipeId}
                            onPress={() => router.push(`/recipe/${meal.recipeId}`)}
                            style={styles.pastThreeGridItem}
                            accessibilityRole="button"
                            accessibilityLabel={meal.recipeName}
                          >
                            <Image source={{ uri: meal.recipeImage }} style={[styles.pastImageFill, { opacity: 0.5 }]} />
                            <View style={styles.pastDesatOverlay} pointerEvents="none" />
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </GlassView>
                );
              })}
            </View>
          ) : (
          /* ── Current/Future Week: card layout ── */
          <View
            style={{ paddingHorizontal: Spacing.page, gap: 8 }}
            onLayout={(e) => { weekContainerY.current = e.nativeEvent.layout.y; }}
          >
            {weekDays.map((day, dayIdx) => {
              const { appetizer, main: mainMeal, dessert } = day.courses;
              const allMeals = [appetizer, mainMeal, dessert].filter(Boolean) as PlannedMeal[];
              const hasMeals = allMeals.length > 0;
              const isToday = day.date === todayISO;
              const isPastDay = day.date < todayISO;
              const totalTime = allMeals.reduce((sum, m) => sum + (m.cookTime || 0), 0);
              const dayParty = app.getDinnerPartyForDate(day.date);
              const goToDayView = () => { setSelectedDayIndex(dayIdx); setIsDailyView(true); };

              if (!hasMeals) {
                return (
                  <Pressable
                    key={day.date}
                    onPress={() => openPicker(day.date, 'main')}
                    onLayout={isToday ? (e) => scrollToTodayCard(e.nativeEvent.layout.y) : undefined}
                    style={[
                      styles.weekEmptyCard,
                      {
                        backgroundColor: colors.glassOverlay,
                        borderColor: isToday ? colors.primary : `${colors.outlineVariant}40`,
                        borderWidth: isToday ? 2 : 1,
                        opacity: isPastDay ? 0.55 : 1,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Add meal for ${day.dayLabel}`}
                  >
                    <View>
                      {isToday && (
                        <Text style={[Typography.labelSmall, { color: colors.primary, fontWeight: '700', fontSize: 10, letterSpacing: 1.5, marginBottom: 2 }]}>
                          TODAY
                        </Text>
                      )}
                      <Text style={[Typography.headline, { color: colors.onSurface, opacity: isPastDay ? 0.4 : 1, fontSize: 20 }]}>
                        {day.dayLabel}, {formatDateLabel(day.date)}
                      </Text>
                      <Text style={[Typography.caption, { color: colors.outline, opacity: isPastDay ? 0.4 : 0.6, marginTop: 2 }]}>
                        {isPastDay ? 'No meals logged' : 'Plan your menu'}
                      </Text>
                    </View>
                    <View style={[styles.weekAddCircle, { backgroundColor: colors.glassOverlay, borderColor: `${colors.outlineVariant}40` }]}>
                      <MaterialCommunityIcons name="plus" size={24} color={isToday ? colors.primary : isPastDay ? `${colors.primary}44` : `${colors.primary}99`} />
                    </View>
                  </Pressable>
                );
              }

              const courseSlots: { label: string; courseType: 'appetizer' | 'main' | 'dessert'; meal?: PlannedMeal }[] = [
                { label: 'Appetizer', courseType: 'appetizer', meal: appetizer },
                { label: 'Main', courseType: 'main', meal: mainMeal },
                { label: 'Dessert', courseType: 'dessert', meal: dessert },
              ];
              const filledSlots = courseSlots.filter((s) => s.meal);

              return (
                <Pressable key={day.date} onPress={goToDayView} onLayout={isToday ? (e) => scrollToTodayCard(e.nativeEvent.layout.y) : undefined} accessibilityRole="button" accessibilityLabel={`View ${day.dayLabel}`}>
                <GlassView
                  style={[
                    styles.weekDayCard,
                    isToday && { borderWidth: 2, borderColor: `${colors.primary}66` },
                  ]}
                  intensity={30}
                >
                  <View style={styles.weekDayHeader}>
                    <View>
                      {isToday && (
                        <Text style={[Typography.labelSmall, { color: colors.primary, fontWeight: '700', fontSize: 10, letterSpacing: 1.5, marginBottom: 2 }]}>
                          TODAY
                        </Text>
                      )}
                      <Text style={[Typography.headline, { color: colors.onSurface, fontSize: 20, opacity: isPastDay ? 0.45 : 1 }]}>
                        {day.dayLabel}, {formatDateLabel(day.date)}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs }}>
                        {totalTime > 0 && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <MaterialCommunityIcons name="clock-outline" size={14} color={colors.outline} />
                            <Text style={[Typography.caption, { color: colors.outline, fontSize: 12 }]}>
                              {formatCookTime(totalTime)}
                            </Text>
                          </View>
                        )}
                        {dayParty && (
                          <View
                            style={[styles.weekPartyPill, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}25` }]}
                          >
                            <MaterialCommunityIcons name="account-group" size={14} color={colors.primary} />
                            <Text style={[Typography.labelSmall, { color: colors.primary, fontWeight: '700', fontSize: 11 }]}>
                              Dinner Party
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  <View style={{ gap: 8 }}>
                    {filledSlots.map((slot) => (
                      <Pressable
                        key={slot.courseType}
                        onPress={(e) => { e.stopPropagation(); router.push(`/recipe/${slot.meal!.recipeId}`); }}
                        style={styles.weekMealSlot}
                        accessibilityRole="button"
                        accessibilityLabel={`${slot.label}: ${slot.meal!.recipeName}`}
                      >
                        <Image
                          source={{ uri: slot.meal!.recipeImage }}
                          style={[styles.weekMealImage, isPastDay && { opacity: 0.5 }]}
                        />
                        {isPastDay && <View style={styles.pastDesatOverlay} pointerEvents="none" />}
                        <LinearGradient
                          colors={['transparent', isPastDay ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.50)']}
                          locations={[0.35, 1]}
                          style={StyleSheet.absoluteFill}
                          pointerEvents="none"
                        />
                        <Pressable
                          onPress={(e) => { e.stopPropagation(); openPicker(day.date, slot.courseType); }}
                          style={[styles.weekMealAction, { left: Spacing.sm, top: Spacing.sm }]}
                          accessibilityRole="button"
                          accessibilityLabel={`Swap ${slot.label}`}
                          hitSlop={6}
                        >
                          <MaterialCommunityIcons name="refresh" size={20} color={colors.primary} />
                        </Pressable>
                        <Pressable
                          onPress={(e) => { e.stopPropagation(); handleRemoveCourse(day.date, slot.courseType); }}
                          style={[styles.weekMealAction, { right: Spacing.sm, top: Spacing.sm }]}
                          accessibilityRole="button"
                          accessibilityLabel={`Remove ${slot.label}`}
                          hitSlop={6}
                        >
                          <MaterialCommunityIcons name="close" size={20} color={colors.error} />
                        </Pressable>
                        <View style={styles.weekMealLabel} pointerEvents="none">
                          <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.8 }}>
                            {slot.label}
                          </Text>
                          <Text style={[Typography.titleSmall, { color: '#fff', fontWeight: '700', fontSize: 16 }]} numberOfLines={1}>
                            {slot.meal!.recipeName}
                          </Text>
                        </View>
                      </Pressable>
                    ))}

                    {(() => {
                      const missingSlots = courseSlots.filter((s) => !s.meal);
                      if (missingSlots.length === 0) return null;
                      return (
                        <View style={styles.weekAddCoursePills}>
                          {missingSlots.map((slot) => (
                            <Pressable
                              key={slot.courseType}
                              onPress={(e) => { e.stopPropagation(); openPicker(day.date, slot.courseType); }}
                              style={[styles.weekAddCoursePill, { borderColor: `${colors.outline}30`, backgroundColor: `${colors.secondary}08` }]}
                              accessibilityRole="button"
                              accessibilityLabel={`Add ${slot.label}`}
                            >
                              <MaterialCommunityIcons name="plus" size={14} color={colors.secondary} />
                              <Text style={[Typography.labelSmall, { color: colors.secondary, fontWeight: '700', fontSize: 11 }]}>
                                {slot.label}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      );
                    })()}
                  </View>
                </GlassView>
                </Pressable>
              );
            })}
          </View>
          )
        )}
      </Animated.ScrollView>


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
            // Snapshot for undo
            undoSnapshot.current = {
              itinerary: JSON.parse(JSON.stringify(app.itinerary)),
              grocery: JSON.parse(JSON.stringify(app.groceryItems)),
            };
            app.autoGenerateWeek(emptyDates, app.coursePreference);
            try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
            const weekLabel = selectedWeek === 'next-week' ? 'next week' : 'this week';
            showToast(`Planned ${emptyDates.length} meals for ${weekLabel}`, true);
            // Check grocery handoff conditions
            setTimeout(() => {
              const mealsPlanned = weekDays.filter(d => d.courses.main).length;
              if (mealsPlanned >= 3 && app.getUncheckedCount() > 0 && Date.now() - lastHandoffTime.current > 600000) {
                lastHandoffTime.current = Date.now();
                try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                setShowGroceryHandoff(true);
                setTimeout(() => setShowGroceryHandoff(false), 8000);
              }
            }, 500);
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
                <MaterialCommunityIcons name="auto-fix" size={20} color={colors.onPrimary} />
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


      {/* Recipe picker bottom sheet */}
      <RecipePickerSheet
        visible={pickerVisible}
        onDismiss={() => setPickerVisible(false)}
        onSelect={handlePickRecipe}
      />

      {/* Grocery handoff card */}
      {showGroceryHandoff && (
        <Animated.View
          entering={reduceMotion ? undefined : FadeInDown.springify().damping(20)}
          exiting={reduceMotion ? undefined : FadeOutDown.duration(200)}
          style={[styles.handoffCard, { backgroundColor: colors.surfaceContainerLow, ...Shadows.ambient }]}
        >
          <MaterialCommunityIcons name="cart-outline" size={24} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[Typography.titleSmall, { color: colors.onSurface }]}>Your grocery list is ready</Text>
            <Text style={[Typography.caption, { color: colors.onSurfaceVariant }]}>
              {app.getUncheckedCount()} ingredients across your planned meals
            </Text>
          </View>
          <Pressable
            onPress={() => { setShowGroceryHandoff(false); router.push('/(tabs)/grocery'); }}
            style={[styles.handoffBtn, { backgroundColor: colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel="Go shopping"
          >
            <Text style={[Typography.labelSmall, { color: colors.onPrimary }]}>Go Shopping</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Toast with optional undo */}
      {toastMessage && (
        <View style={[styles.toast, { backgroundColor: colors.inverseSurface }]}>
          <MaterialCommunityIcons name="check-circle" size={16} color={colors.inversePrimary} />
          <Text style={[Typography.titleSmall, { color: colors.inverseOnSurface, flex: 1 }]}>{toastMessage}</Text>
          {showUndo && (
            <Pressable onPress={handleUndo} hitSlop={8} accessibilityRole="button" accessibilityLabel="Undo meal plan">
              <Text style={[Typography.titleSmall, { color: colors.inversePrimary, fontWeight: '700' }]}>Undo</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 60,
    overflow: 'hidden',
  },
  navBarGlass: {
    overflow: 'hidden',
  },
  navBarInner: {
    paddingHorizontal: Spacing.page,
    paddingBottom: Spacing.xs,
  },
  navTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xs,
  },
  navArrow: {
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navCenter: {
    flex: 1,
    alignItems: 'center',
  },
  navTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  todayTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  navDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: Radius.full,
    padding: 2,
  },
  segmentBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.full,
  },
  multipleMealsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    marginBottom: 12,
  },
  timeline: {
    paddingHorizontal: Spacing.page,
    position: 'relative',
    marginBottom: Spacing.md,
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
    marginBottom: Spacing.md,
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
    marginLeft: 12,
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
    height: 120,
  },
  mealImageTall: {
    width: '100%',
    height: 140,
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
    gap: Spacing.sm,
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
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
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
    marginTop: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  courseCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  courseCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  browseBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    marginTop: Spacing.sm,
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
  onboardingHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
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
  handoffCard: {
    position: 'absolute',
    bottom: 90,
    left: Spacing.page,
    right: Spacing.page,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.xl,
  },
  handoffBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  swipeRemove: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.lg,
    marginBottom: 12,
  },
  weekDayCard: {
    borderRadius: Radius.xl,
    padding: Spacing.md,
    overflow: 'hidden',
  },
  weekDayHeader: {
    marginBottom: Spacing.sm,
  },
  weekEmptyCard: {
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 64,
  },
  weekAddCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekPartyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  weekMealSlot: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    aspectRatio: 2.2,
  },
  weekMealImage: {
    width: '100%',
    height: '100%',
  },
  weekMealAction: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weekMealLabel: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
  },
  weekAddCoursePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: 8,
  },
  weekAddCoursePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  pastDayCard: {
    borderRadius: Radius.xl,
    padding: Spacing.md,
    overflow: 'hidden',
  },
  pastDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  pastTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  pastSingleImage: {
    width: '100%',
    height: 160,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  pastTwoGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  pastTwoGridItem: {
    flex: 1,
    height: 160,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  pastThreeGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  pastThreeGridItem: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  pastImageFill: {
    width: '100%',
    height: '100%',
  },
  pastDesatOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(200,190,180,0.25)',
  },
});
