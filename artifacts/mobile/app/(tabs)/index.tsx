import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  FlatList,
  Modal,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { OVERLAY_BUTTON } from '@/constants/icons';
import { HeaderBar } from '@/components/HeaderBar';
import { AnimatedHeart } from '@/components/AnimatedHeart';
import { AnimatedListItem } from '@/components/AnimatedListItem';
import { countries } from '@/data/countries';
import { recipes, Recipe } from '@/data/recipes';
import { formatCookTime } from '@/data/helpers';
import { useApp } from '@/context/AppContext';
import { useBookmarks } from '@/context/BookmarksContext';

// ─── Helpers ───

function toISO(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

function getDayLabel(dateStr: string): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date(dateStr).getDay()];
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Late night cravings?';
}

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86400000);
}

// ─── Constants ───

const GRID_PAD = Spacing.md; // 16px
const GRID_GAP = Spacing.sm + 4; // 12px

export default function DiscoverScreen() {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const router = useRouter();
  const app = useApp();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const reduceMotion = useReducedMotion();

  const CELL_WIDTH = (SCREEN_WIDTH - GRID_PAD * 2 - GRID_GAP) / 2;
  const HERO_HEIGHT = SCREEN_WIDTH < 375 ? 200 : SCREEN_WIDTH > 414 ? 280 : 240;
  const CARD_IMG_HEIGHT = SCREEN_WIDTH < 375 ? 140 : 160;

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Day picker state
  const [dayPickerVisible, setDayPickerVisible] = useState(false);
  const [dayPickerRecipe, setDayPickerRecipe] = useState<Recipe | null>(null);

  // Country filter
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Recipe pagination
  const [visibleCount, setVisibleCount] = useState(8);

  // Tonight's plan
  const todaysMeals = app.getTodaysMeals();
  const todayDate = toISO(new Date());
  const tonightMeal = todaysMeals.length > 0 ? todaysMeals[0] : null;
  const tonightRecipe = tonightMeal ? recipes.find((r) => r.id === tonightMeal.recipeId) : null;

  // Tonight strip: only show after noon + dismissible per day
  const isAfterNoon = new Date().getHours() >= 12;
  const [tonightDismissed, setTonightDismissed] = useState(true);
  useEffect(() => {
    AsyncStorage.getItem(`@fork_compass_tonight_dismissed_${todayDate}`).then((val) => {
      setTonightDismissed(val === 'true');
    });
  }, [todayDate]);
  const showTonightStrip = tonightRecipe != null && isAfterNoon && !tonightDismissed;
  const dismissTonightStrip = useCallback(() => {
    setTonightDismissed(true);
    AsyncStorage.setItem(`@fork_compass_tonight_dismissed_${todayDate}`, 'true');
  }, [todayDate]);

  // Featured country rotates daily
  const featuredCountry = countries[getDayOfYear() % countries.length];
  const featuredRecipeCount = recipes.filter((r) => r.countryId === featuredCountry.id).length;

  // Filtered recipe grid
  const gridRecipes = useMemo(() => {
    const pool = selectedCountry
      ? recipes.filter((r) => r.countryId === selectedCountry)
      : [...recipes].sort(() => Math.random() - 0.5);
    return pool;
  }, [selectedCountry]);

  // XP/Level data
  const { xp, level, totalRecipesCooked, passportStamps } = app;
  const levelName = app.getCookingLevelName();
  const progress = (xp % 300) / 300;
  const xpToNext = 300 - (xp % 300);
  const exploredCountries = Object.keys(passportStamps).length;
  const stampFlags = Object.keys(passportStamps)
    .slice(0, 3)
    .map((cid) => countries.find((c) => c.id === cid)?.flag ?? '🌍');

  // Day picker days
  const planDays = useMemo(() => {
    const start = toISO(new Date());
    return Array.from({ length: 14 }, (_, i) => {
      const date = addDays(start, i);
      return { date, label: getDayLabel(date), short: formatDateShort(date) };
    });
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToastMessage(null), 2500);
  }, []);

  const handleAddTonight = useCallback((recipe: Recipe) => {
    app.addCourseToDay(todayDate, 'main', recipe);
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    showToast(`Added to tonight's plan.`);
  }, [app, todayDate, showToast]);

  const handlePickDay = useCallback((date: string) => {
    if (dayPickerRecipe) {
      app.addCourseToDay(date, 'main', dayPickerRecipe);
      showToast(`Added to ${getDayLabel(date)}'s plan.`);
    }
    setDayPickerVisible(false);
    setDayPickerRecipe(null);
  }, [dayPickerRecipe, app, showToast]);

  const handleCookTonight = useCallback(() => {
    if (!tonightRecipe) return;
    if (!app.activeCookSession || app.activeCookSession.recipeId !== tonightRecipe.id) {
      app.startCookSession(tonightRecipe, tonightRecipe.servings);
    }
    router.push(`/cook-mode/${tonightRecipe.id}`);
  }, [tonightRecipe, app, router]);

  const handleScroll = useCallback((e: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    if (contentOffset.y + layoutMeasurement.height > contentSize.height - 300) {
      setVisibleCount((prev) => Math.min(prev + 8, gridRecipes.length));
    }
  }, [gridRecipes.length]);

  const enterDelay = (ms: number) => reduceMotion ? undefined : FadeInDown.delay(ms).duration(300).springify();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <HeaderBar />
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={200}
        contentContainerStyle={{ paddingTop: insets.top + 76, paddingBottom: 120 }}
      >
        {/* ═══ ROW 1: GREETING + PROFILE ═══ */}
        <View style={[styles.greetingRow, { paddingHorizontal: GRID_PAD }]}>
          <Text style={[Typography.title, { color: colors.onSurfaceVariant, fontStyle: 'italic' }]}>
            {getGreeting()}
          </Text>
          <Pressable
            onPress={() => router.push('/profile')}
            style={[styles.profileBtn, { backgroundColor: colors.surfaceContainerHigh }]}
            accessibilityRole="button"
            accessibilityLabel="Profile"
          >
            <MaterialCommunityIcons name="account-outline" size={20} color={colors.onSurfaceVariant} />
            {app.getUncheckedCount() > 0 && (
              <View style={[styles.notifDot, { backgroundColor: colors.primary }]} />
            )}
          </Pressable>
        </View>

        {/* ═══ ROW 2: TONIGHT'S PLAN (conditional) ═══ */}
        {showTonightStrip && tonightMeal && tonightRecipe && (
          <Animated.View entering={enterDelay(0)} style={{ paddingHorizontal: GRID_PAD, marginBottom: GRID_GAP }}>
            <Pressable
              onPress={() => router.push(`/recipe/${tonightRecipe.id}`)}
              style={[styles.tonightCard, { backgroundColor: colors.surfaceContainerLow }]}
              accessibilityRole="button"
              accessibilityLabel={`Tonight: ${tonightMeal.recipeName}`}
            >
              <Image
                source={{ uri: tonightMeal.recipeImage }}
                style={[styles.tonightImage, { borderTopLeftRadius: Radius.xl, borderBottomLeftRadius: Radius.xl }]}
                contentFit="cover"
                transition={300}
                accessible={false}
              />
              <LinearGradient
                colors={['transparent', colors.surfaceContainerLow]}
                start={{ x: 0.4, y: 0 }}
                end={{ x: 0.7, y: 0 }}
                style={styles.tonightGradient}
              />
              <View style={styles.tonightContent}>
                <Text style={[Typography.labelSmall, { color: colors.onSurfaceVariant }]}>TONIGHT</Text>
                <Text style={[Typography.titleMedium, { color: colors.onSurface, fontFamily: 'NotoSerif_600SemiBold' }]} numberOfLines={2}>
                  {tonightMeal.recipeName}
                </Text>
                <Text style={[Typography.caption, { color: colors.onSurfaceVariant }]}>
                  {formatCookTime(tonightRecipe.prepTime + tonightRecipe.cookTime)} · {tonightRecipe.difficulty}
                </Text>
                <Pressable
                  onPress={handleCookTonight}
                  style={[styles.tonightCTA, { backgroundColor: colors.primary }]}
                  accessibilityRole="button"
                  accessibilityLabel="Cook tonight"
                >
                  <Text style={[Typography.labelSmall, { color: colors.onPrimary }]}>Cook</Text>
                </Pressable>
              </View>
              <Pressable
                onPress={dismissTonightStrip}
                style={styles.tonightDismiss}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Dismiss"
              >
                <MaterialCommunityIcons name="close" size={16} color={colors.onSurfaceVariant} />
              </Pressable>
            </Pressable>
          </Animated.View>
        )}

        {/* ═══ ROW 3: HERO DESTINATION + XP/STATS ═══ */}
        <View style={[styles.bentoRow, { paddingHorizontal: GRID_PAD, gap: GRID_GAP }]}>
          {/* LEFT: Featured Country */}
          <Animated.View entering={enterDelay(60)}>
            <Pressable
              onPress={() => router.push(`/country/${featuredCountry.id}`)}
              style={[styles.heroCountry, { width: CELL_WIDTH, height: HERO_HEIGHT }]}
              accessibilityRole="button"
              accessibilityLabel={`Explore ${featuredCountry.name}`}
            >
              <Image
                source={{ uri: featuredCountry.heroImage }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={300}
                accessible={false}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.heroCountryContent}>
                <Text style={{ fontSize: 24 }}>{featuredCountry.flag}</Text>
                <Text style={[Typography.headline, { color: '#FFFFFF' }]}>{featuredCountry.name}</Text>
                <Text style={[Typography.caption, { color: 'rgba(255,255,255,0.7)' }]}>{featuredRecipeCount} recipes</Text>
              </View>
            </Pressable>
          </Animated.View>

          {/* RIGHT: Stacked XP + Stats */}
          <View style={{ width: CELL_WIDTH, gap: GRID_GAP }}>
            {/* XP Card */}
            <Animated.View entering={enterDelay(120)}>
              <Pressable
                onPress={() => router.push('/profile')}
                style={[styles.xpCard, { backgroundColor: colors.surfaceContainerLow, height: (HERO_HEIGHT - GRID_GAP) / 2 }]}
                accessibilityRole="button"
                accessibilityLabel={`Level ${level}, ${xp} XP`}
              >
                <Text style={[Typography.labelSmall, { color: colors.warning, letterSpacing: 1 }]}>LEVEL {level}</Text>
                <Text style={[Typography.titleSmall, { color: colors.onSurface, fontFamily: 'NotoSerif_600SemiBold' }]}>{levelName}</Text>
                <View style={styles.xpBarContainer}>
                  <View style={[styles.xpBarTrack, { backgroundColor: colors.surfaceContainerHigh }]}>
                    <View style={[styles.xpBarFill, { backgroundColor: colors.warning, width: `${progress * 100}%` }]} />
                  </View>
                </View>
                <Text style={[Typography.caption, { color: colors.onSurfaceVariant }]}>{xp % 300} / 300</Text>
              </Pressable>
            </Animated.View>

            {/* Stats Card */}
            <Animated.View entering={enterDelay(180)}>
              <Pressable
                onPress={() => router.push('/profile')}
                style={[styles.statsCard, { backgroundColor: colors.surfaceContainerLow, height: (HERO_HEIGHT - GRID_GAP) / 2 }]}
                accessibilityRole="button"
                accessibilityLabel={`${totalRecipesCooked} recipes cooked`}
              >
                <Text style={[Typography.titleSmall, { color: colors.onSurface }]}>{totalRecipesCooked} recipes cooked</Text>
                <Text style={[Typography.caption, { color: colors.onSurfaceVariant }]}>{exploredCountries} countries explored</Text>
                {stampFlags.length > 0 && (
                  <View style={styles.stampRow}>
                    {stampFlags.map((flag, i) => (
                      <Text key={i} style={{ fontSize: 16 }}>{flag}</Text>
                    ))}
                  </View>
                )}
              </Pressable>
            </Animated.View>
          </View>
        </View>

        {/* ═══ ROW 4: CUISINE FILTER CHIPS ═══ */}
        <Animated.View entering={enterDelay(200)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.chipRow, { paddingHorizontal: GRID_PAD }]}
          >
            <Pressable
              onPress={() => setSelectedCountry(null)}
              style={[
                styles.chip,
                { backgroundColor: selectedCountry === null ? colors.primary : colors.surfaceContainerHigh },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedCountry === null }}
            >
              <Text style={[Typography.labelSmall, { color: selectedCountry === null ? colors.onPrimary : colors.onSurfaceVariant, letterSpacing: 0 }]}>All</Text>
            </Pressable>
            {countries.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => setSelectedCountry(c.id)}
                style={[
                  styles.chip,
                  { backgroundColor: selectedCountry === c.id ? colors.primary : colors.surfaceContainerHigh },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${c.name}`}
                accessibilityState={{ selected: selectedCountry === c.id }}
              >
                <Text style={{ fontSize: 14 }}>{c.flag}</Text>
                <Text style={[Typography.labelSmall, { color: selectedCountry === c.id ? colors.onPrimary : colors.onSurfaceVariant, letterSpacing: 0 }]}>{c.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* ═══ ROW 5+: RECIPE GRID ═══ */}
        <View style={[styles.recipeGrid, { paddingHorizontal: GRID_PAD, gap: GRID_GAP }]}>
          {gridRecipes.slice(0, visibleCount).map((recipe, index) => (
            <AnimatedListItem key={recipe.id} index={index}>
              <Pressable
                onPress={() => router.push(`/recipe/${recipe.id}`)}
                style={[styles.recipeCard, { width: CELL_WIDTH, backgroundColor: colors.surfaceContainerLow }]}
                accessibilityRole="button"
                accessibilityLabel={`${recipe.title}, ${formatCookTime(recipe.prepTime + recipe.cookTime)}`}
              >
                <View style={styles.recipeImageWrap}>
                  <Image
                    source={{ uri: recipe.image }}
                    style={[styles.recipeImage, { height: CARD_IMG_HEIGHT }]}
                    contentFit="cover"
                    transition={300}
                    accessible={false}
                  />
                  {/* Heart overlay */}
                  <Pressable
                    onPress={(e) => { e.stopPropagation(); toggleBookmark(recipe.id); }}
                    style={[styles.heartBtn, {
                      backgroundColor: OVERLAY_BUTTON.background,
                      borderWidth: OVERLAY_BUTTON.borderWidth,
                      borderColor: OVERLAY_BUTTON.borderColor,
                    }]}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={isBookmarked(recipe.id) ? `Remove ${recipe.title} from saved` : `Save ${recipe.title}`}
                  >
                    <AnimatedHeart
                      filled={isBookmarked(recipe.id)}
                      onToggle={() => toggleBookmark(recipe.id)}
                      size={OVERLAY_BUTTON.iconSize}
                      filledColor={colors.primary}
                      outlineColor={OVERLAY_BUTTON.iconColor}
                      hitSlop={0}
                    />
                  </Pressable>
                  {/* Tonight quick-add */}
                  <Pressable
                    onPress={(e) => { e.stopPropagation(); handleAddTonight(recipe); }}
                    style={[styles.tonightQuickAdd, { backgroundColor: colors.surfaceContainerHigh }]}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${recipe.title} to tonight`}
                  >
                    <MaterialCommunityIcons name="weather-night" size={16} color={colors.primary} />
                  </Pressable>
                </View>
                <View style={styles.recipeContent}>
                  <Text style={[Typography.titleSmall, { color: colors.onSurface, fontFamily: 'NotoSerif_600SemiBold' }]} numberOfLines={2}>
                    {recipe.title}
                  </Text>
                  <View style={styles.recipeMeta}>
                    <Text style={{ fontSize: 12 }}>{countries.find((c) => c.id === recipe.countryId)?.flag}</Text>
                    <Text style={[Typography.caption, { color: colors.onSurfaceVariant }]}>
                      {formatCookTime(recipe.prepTime + recipe.cookTime)} · {recipe.difficulty}
                    </Text>
                  </View>
                </View>
              </Pressable>
            </AnimatedListItem>
          ))}
        </View>
      </ScrollView>

      {/* Toast notification */}
      {toastMessage && (
        <View style={[styles.toast, { backgroundColor: colors.inverseSurface }]}>
          <MaterialCommunityIcons name="check-circle" size={16} color={colors.inversePrimary} />
          <Text style={[Typography.titleSmall, { color: colors.inverseOnSurface }]}>{toastMessage}</Text>
        </View>
      )}

      {/* Day picker bottom sheet */}
      <Modal
        visible={dayPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDayPickerVisible(false)}
      >
        <Pressable style={styles.sheetOverlay} onPress={() => setDayPickerVisible(false)}>
          <Pressable
            style={[styles.sheetContainer, { backgroundColor: colors.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.handleBar }]} />
            <Text style={[Typography.headline, { color: colors.onSurface, marginBottom: Spacing.sm }]}>Pick a Day</Text>
            {dayPickerRecipe && (
              <Text style={[Typography.bodySmall, { color: colors.outline, marginBottom: Spacing.md }]}>
                Adding {dayPickerRecipe.title}
              </Text>
            )}
            <FlatList
              data={planDays}
              keyExtractor={(item) => item.date}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 360 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handlePickDay(item.date)}
                  style={[styles.dayPickerRow, { backgroundColor: colors.surfaceContainerLow }]}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.label}, ${item.short}`}
                >
                  <View>
                    <Text style={[Typography.titleSmall, { color: colors.onSurface }]}>{item.label}</Text>
                    <Text style={[Typography.caption, { color: colors.outline }]}>{item.short}</Text>
                  </View>
                  <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Row 1: Greeting
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Row 2: Tonight
  tonightCard: {
    flexDirection: 'row',
    borderRadius: Radius.xl,
    overflow: 'hidden',
    height: 120,
  },
  tonightImage: {
    width: '60%',
    height: '100%',
  },
  tonightGradient: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '35%',
    width: '30%',
  },
  tonightContent: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
    gap: 4,
  },
  tonightCTA: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    marginTop: 4,
  },
  tonightDismiss: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Row 3: Bento
  bentoRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  heroCountry: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  heroCountryContent: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    gap: 2,
  },
  xpCard: {
    borderRadius: Radius.xl,
    padding: Spacing.md,
    justifyContent: 'center',
    gap: 4,
  },
  xpBarContainer: {
    marginTop: 4,
  },
  xpBarTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  statsCard: {
    borderRadius: Radius.xl,
    padding: Spacing.md,
    justifyContent: 'center',
    gap: 4,
  },
  stampRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },

  // Row 4: Chips
  chipRow: {
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
  },

  // Row 5: Recipe Grid
  recipeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  recipeCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  recipeImageWrap: {
    position: 'relative',
  },
  recipeImage: {
    width: '100%',
  },
  heartBtn: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: OVERLAY_BUTTON.size,
    height: OVERLAY_BUTTON.size,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tonightQuickAdd: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeContent: {
    padding: Spacing.md,
    gap: 4,
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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

  // Day picker sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.page,
    paddingBottom: 40,
    paddingTop: Spacing.sm,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  dayPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },
});
