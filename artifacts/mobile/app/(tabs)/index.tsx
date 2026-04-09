import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
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
import { PressableScale } from '@/components/PressableScale';
import { AddToPlanSheet, AddToPlanButton } from '@/components/AddToPlanSheet';
import { countries } from '@/data/countries';
import { recipes, Recipe } from '@/data/recipes';
import { formatCookTime } from '@/data/helpers';
import { useApp } from '@/context/AppContext';
import { useBookmarks } from '@/context/BookmarksContext';
import { todayLocal, addDays, getDayLabel, formatDateShort } from '@/utils/dates';

// ─── Helpers ───

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
const GRID_GAP = 12;

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
  const CARD_IMG_HEIGHT = 160;

  // Hero carousel ref
  const heroListRef = useRef<FlatList>(null);
  const HERO_CARD_WIDTH = SCREEN_WIDTH - GRID_PAD * 2;

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Add to plan sheet state
  const [addSheetRecipe, setAddSheetRecipe] = useState<Recipe | null>(null);

  // Country filter
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Recipe pagination
  const [visibleCount, setVisibleCount] = useState(8);

  // Pull-to-refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setHeroIndex((prev) => (prev + 1) % countries.length);
    setShuffleSeed((s) => s + 1);
    setVisibleCount(8);
    setTimeout(() => setIsRefreshing(false), 800);
  }, []);

  // Tonight's plan
  const todaysMeals = app.getTodaysMeals();
  const todayDate = todayLocal();
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

  // Featured country — swipeable, tappable dots, starts with daily rotation
  const [heroIndex, setHeroIndex] = useState(() => getDayOfYear() % countries.length);
  const featuredCountry = countries[heroIndex];
  const featuredRecipeCount = recipes.filter((r) => r.countryId === featuredCountry.id).length;

  const handleHeroScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - GRID_PAD * 2));
    if (idx >= 0 && idx < countries.length) setHeroIndex(idx);
  }, [SCREEN_WIDTH]);

  const scrollToHero = useCallback((idx: number) => {
    setHeroIndex(idx);
    heroListRef.current?.scrollToIndex({ index: idx, animated: true });
  }, []);

  // Filtered recipe grid
  const gridRecipes = useMemo(() => {
    const pool = selectedCountry
      ? recipes.filter((r) => r.countryId === selectedCountry)
      : [...recipes].sort(() => Math.random() - 0.5);
    return pool;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry, shuffleSeed]);

  // XP/Level data
  const { xp, level, totalRecipesCooked, passportStamps } = app;
  const levelName = app.getCookingLevelName();
  const progress = (xp % 300) / 300;
  const xpToNext = 300 - (xp % 300);
  const exploredCountries = Object.keys(passportStamps).length;
  const stampFlags = Object.keys(passportStamps)
    .slice(0, 3)
    .map((cid) => countries.find((c) => c.id === cid)?.flag ?? '🌍');

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToastMessage(null), 2500);
  }, []);

  const handleAddToPlan = useCallback((date: string) => {
    if (!addSheetRecipe) return;
    app.addCourseToDay(date, 'main', addSheetRecipe);
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    const label = date === todayDate ? "tonight's" : getDayLabel(date) + "'s";
    showToast(`Added to ${label} plan.`);
    setAddSheetRecipe(null);
  }, [addSheetRecipe, app, todayDate, showToast]);

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
        contentContainerStyle={{ paddingTop: insets.top + 76, paddingBottom: Spacing.tabClearance }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {/* ═══ ROW 1: GREETING ═══ */}
        <View style={{ paddingHorizontal: GRID_PAD, marginBottom: Spacing.md }}>
          <Text style={[Typography.title, { color: colors.onSurfaceVariant, fontStyle: 'italic' }]}>
            {getGreeting()}
          </Text>
        </View>

        {/* ═══ ROW 2: TONIGHT'S PLAN (conditional) ═══ */}
        {showTonightStrip && tonightMeal && tonightRecipe && (
          <Animated.View entering={enterDelay(0)} style={{ paddingHorizontal: GRID_PAD, marginBottom: GRID_GAP }}>
            <PressableScale
              onPress={() => router.push(`/recipe/${tonightRecipe.id}`)}
              style={[styles.tonightCard, { backgroundColor: colors.surfaceContainerLow }]}
              accessibilityRole="button"
              accessibilityLabel={`Tonight: ${tonightMeal.recipeName}`}
              scaleDown={0.97}
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
            </PressableScale>
          </Animated.View>
        )}

        {/* ═══ ROW 3: HERO DESTINATION (swipeable) ═══ */}
        <Animated.View entering={enterDelay(60)} style={{ marginBottom: GRID_GAP }}>
          <View style={[styles.heroCarousel, { marginHorizontal: GRID_PAD, height: 300 }]}>
            <FlatList
              ref={heroListRef}
              data={countries}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleHeroScroll}
              scrollEventThrottle={16}
              initialScrollIndex={heroIndex}
              getItemLayout={(_, index) => ({ length: HERO_CARD_WIDTH, offset: HERO_CARD_WIDTH * index, index })}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => router.push(`/country/${item.id}`)}
                  style={{ width: HERO_CARD_WIDTH, height: 300 }}
                  accessibilityRole="button"
                  accessibilityLabel={`Explore ${item.name}`}
                >
                  <Image
                    source={{ uri: item.heroImage }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    transition={300}
                    accessible={false}
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.75)']}
                    locations={[0, 0.4, 1]}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.heroCountryContent}>
                    <View style={styles.heroBadgeRow}>
                      <Text style={{ fontSize: 20 }}>{item.flag}</Text>
                      <View style={[styles.heroBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                        <Text style={[Typography.labelSmall, { color: '#FFFFFF', letterSpacing: 1.5 }]}>FEATURED DESTINATION</Text>
                      </View>
                    </View>
                    <Text style={[Typography.displayMedium, { color: '#FFFFFF', letterSpacing: -0.5 }]}>{item.name}</Text>
                    <View style={styles.heroBottomRow}>
                      <Pressable
                        onPress={() => router.push(`/country/${item.id}`)}
                        style={[styles.heroExploreBtn, { backgroundColor: colors.primary }]}
                        accessibilityRole="button"
                        accessibilityLabel={`Explore ${item.name}`}
                      >
                        <Text style={[Typography.labelSmall, { color: colors.onPrimary, fontWeight: '700' }]}>Let's Go</Text>
                      </Pressable>
                      <View style={styles.heroDots}>
                        {countries.map((c, di) => (
                          <Pressable
                            key={c.id}
                            onPress={(e) => { e.stopPropagation(); scrollToHero(di); }}
                            hitSlop={6}
                            accessibilityRole="button"
                            accessibilityLabel={c.name}
                          >
                            <View style={[styles.heroDot, { backgroundColor: di === heroIndex ? '#FFFFFF' : 'rgba(255,255,255,0.3)' }]} />
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </View>
                </Pressable>
              )}
            />
          </View>
        </Animated.View>

        {/* ═══ ROW 3B: XP + STATS (2-column row) ═══ */}
        <View style={[styles.bentoRow, { paddingHorizontal: GRID_PAD, gap: GRID_GAP, marginBottom: GRID_GAP }]}>
          {/* XP Card */}
          <Animated.View entering={enterDelay(120)} style={{ flex: 1 }}>
            <PressableScale
              onPress={() => router.push('/profile')}
              style={[styles.xpCard, { backgroundColor: colors.surfaceContainerLow }]}
              accessibilityRole="button"
              accessibilityLabel={`Level ${level}, ${xp} XP`}
              scaleDown={0.97}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: Spacing.xs }}>
                <Text style={[Typography.labelSmall, { color: colors.warning, letterSpacing: 1 }]}>LEVEL {level}</Text>
                <Text style={[Typography.caption, { color: colors.onSurfaceVariant }]}>{xp % 300} XP</Text>
              </View>
              <View style={[styles.xpBarTrack, { backgroundColor: colors.surfaceContainerHigh }]}>
                <View style={[styles.xpBarFill, { backgroundColor: colors.warning, width: `${progress * 100}%` }]} />
              </View>
            </PressableScale>
          </Animated.View>

          {/* Stats/Streak Card */}
          <Animated.View entering={enterDelay(180)} style={{ flex: 1 }}>
            <PressableScale
              onPress={() => router.push('/profile')}
              style={[styles.streakCard, { backgroundColor: colors.primary }]}
              accessibilityRole="button"
              accessibilityLabel={`${totalRecipesCooked} recipes cooked`}
              scaleDown={0.97}
            >
              <MaterialCommunityIcons name="fire" size={24} color="#FFFFFF" />
              <Text style={[Typography.headline, { color: '#FFFFFF', fontSize: 20 }]}>{totalRecipesCooked} cooked</Text>
              <Text style={[Typography.caption, { color: 'rgba(255,255,255,0.7)', letterSpacing: 1 }]}>{exploredCountries} COUNTRIES</Text>
            </PressableScale>
          </Animated.View>
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
              <PressableScale
                onPress={() => router.push(`/recipe/${recipe.id}`)}
                style={[styles.recipeCard, { width: CELL_WIDTH, backgroundColor: colors.surfaceContainerLow }]}
                accessibilityRole="button"
                accessibilityLabel={`${recipe.title}, ${formatCookTime(recipe.prepTime + recipe.cookTime)}`}
                scaleDown={0.97}
              >
                <View style={styles.recipeImageWrap}>
                  <Image
                    source={{ uri: recipe.image }}
                    style={[styles.recipeImage, { height: CARD_IMG_HEIGHT }]}
                    contentFit="cover"
                    transition={300}
                    accessible={false}
                  />
                  {/* Overlay buttons — stacked top-right */}
                  <View style={styles.overlayStack}>
                    <Pressable
                      onPress={(e) => { e.stopPropagation(); toggleBookmark(recipe.id); }}
                      style={[styles.overlayBtn, {
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
                    <AddToPlanButton
                      onPress={() => setAddSheetRecipe(recipe)}
                      recipeName={recipe.title}
                      variant="overlay"
                    />
                  </View>
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
              </PressableScale>
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

  // Row 3: Hero + XP
  bentoRow: {
    flexDirection: 'row',
  },
  heroCarousel: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  heroCountry: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  heroCountryContent: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
    gap: Spacing.sm,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  heroBadge: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  heroBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  heroExploreBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.full,
  },
  heroDots: {
    flexDirection: 'row',
    gap: 6,
  },
  heroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  xpCard: {
    borderRadius: Radius.xl,
    padding: Spacing.md,
    justifyContent: 'center',
    height: 100,
  },
  xpBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  streakCard: {
    borderRadius: Radius.xl,
    padding: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    height: 100,
    gap: 2,
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
  recipeContent: {
    padding: 12,
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

});
