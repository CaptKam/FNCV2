import React, { useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  FlatList,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { Shadows } from '@/constants/shadows';
import { GlassView } from '@/components/GlassView';
import { HeaderBar } from '@/components/HeaderBar';
import { SectionHeader } from '@/components/SectionHeader';
import { RecipeCard } from '@/components/RecipeCard';
import { DestinationCard } from '@/components/DestinationCard';
import { countries } from '@/data/countries';
import { recipes, Recipe } from '@/data/recipes';
import { useApp } from '@/context/AppContext';

const HERO_HEIGHT = 480;

// ─── Helpers ───

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const m = new Date(d);
  m.setDate(diff);
  m.setHours(0, 0, 0, 0);
  return m;
}

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

export default function DiscoverScreen() {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const colors = useThemeColors();
  const router = useRouter();
  const app = useApp();
  const [activeHero, setActiveHero] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Day picker state
  const [dayPickerVisible, setDayPickerVisible] = useState(false);
  const [dayPickerRecipe, setDayPickerRecipe] = useState<Recipe | null>(null);

  const heroCountries = countries.slice(0, 5);
  const curatedCountries = countries.slice(0, 4);
  const trendingRecipes = recipes.slice(0, 6);

  // Tonight's plan from AppContext
  const todaysMeals = app.getTodaysMeals();
  const todayDate = toISO(new Date());
  const tonightMeal = todaysMeals.length > 0 ? todaysMeals[0] : null;
  const tonightRecipe = tonightMeal ? recipes.find((r) => r.id === tonightMeal.recipeId) : null;

  // Day list for picker (next 14 days)
  const planDays = useMemo(() => {
    const start = toISO(getMonday(new Date()));
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
    showToast(`Added to tonight's plan.`);
  }, [app, todayDate, showToast]);

  const handleOpenDayPicker = useCallback((recipe: Recipe) => {
    setDayPickerRecipe(recipe);
    setDayPickerVisible(true);
  }, []);

  const handlePickDay = useCallback((date: string) => {
    if (dayPickerRecipe) {
      app.addCourseToDay(date, 'main', dayPickerRecipe);
      showToast(`Added to ${getDayLabel(date)}'s plan.`);
    }
    setDayPickerVisible(false);
    setDayPickerRecipe(null);
  }, [dayPickerRecipe, app, showToast]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveHero(idx);
  };

  const handleCookTonight = useCallback(() => {
    if (!tonightRecipe) return;
    if (!app.activeCookSession || app.activeCookSession.recipeId !== tonightRecipe.id) {
      app.startCookSession(tonightRecipe, tonightRecipe.servings);
    }
    router.push(`/cook-mode/${tonightRecipe.id}`);
  }, [tonightRecipe, app, router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <HeaderBar transparent />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >

        {/* Hero Carousel */}
        <View style={styles.heroContainer}>
          <FlatList
            ref={flatListRef}
            data={heroCountries}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            keyExtractor={(item) => item.id}
            accessibilityRole="adjustable"
            accessibilityLabel={`Country carousel, showing ${heroCountries[activeHero]?.name ?? ''}`}
            renderItem={({ item }) => (
              <View style={{ width: SCREEN_WIDTH, height: HERO_HEIGHT }}>
                <Image
                  source={{ uri: item.heroImage }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={300}
                  accessible={false}
                />
                <LinearGradient
                  colors={['rgba(0,0,0,0.2)', 'transparent', 'rgba(0,0,0,0.6)']}
                  locations={[0, 0.4, 1]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.heroContent}>
                  <GlassView style={styles.flagBadge}>
                    <Text style={{ fontSize: 14 }}>{item.flag}</Text>
                    <Text style={[Typography.caption, { color: colors.textOnImage }]}>{item.region}</Text>
                  </GlassView>
                  <Text style={[Typography.displayMedium, styles.heroTitle, { color: colors.textOnImage }]}>
                    {item.name}
                  </Text>
                  <Pressable
                    onPress={() => router.push(`/country/${item.id}`)}
                    style={[styles.exploreCTA, { backgroundColor: colors.primary }]}
                    accessibilityRole="button"
                    accessibilityLabel={`Explore ${item.name}`}
                  >
                    <Text style={[Typography.titleMedium, { color: colors.onPrimary }]}>
                      Explore {item.name}
                    </Text>
                    <Feather name="arrow-right" size={18} color={colors.onPrimary} />
                  </Pressable>
                </View>
              </View>
            )}
          />
          {/* Vertical Pagination Dots */}
          <View style={styles.paginationDots}>
            {heroCountries.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === activeHero ? [styles.dotActive, { backgroundColor: colors.textOnImage }] : styles.dotInactive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Tonight's Plan Strip — reads from AppContext */}
        {tonightRecipe && tonightMeal ? (
          <View style={{ paddingHorizontal: Spacing.page, marginTop: -Spacing.xxl }}>
            <GlassView style={[styles.tonightCard, { ...Shadows.ambient }]}>
              <Image
                source={{ uri: tonightMeal.recipeImage }}
                style={styles.tonightImage}
                contentFit="cover"
                transition={300}
                accessible={false}
              />
              <View style={styles.tonightContent}>
                <Text style={[Typography.labelLarge, { color: colors.primary }]}>
                  TONIGHT'S PLAN
                </Text>
                <Text style={[Typography.headline, { color: colors.onSurface, fontSize: 18 }]} numberOfLines={1}>
                  {tonightMeal.recipeName}
                </Text>
                <Pressable onPress={handleCookTonight} accessibilityRole="button" accessibilityLabel={`Cook ${tonightMeal.recipeName} tonight`}>
                  <Text style={[Typography.titleSmall, { color: colors.primary }]}>
                    Cook Tonight
                  </Text>
                </Pressable>
              </View>
            </GlassView>
          </View>
        ) : (
          <View style={{ height: Spacing.lg }} />
        )}

        {/* Curated Regions */}
        <View style={{ marginTop: Spacing.xxl }}>
          <SectionHeader label="CURATED REGIONS" title="Curated Regions" actionText="View All" onAction={() => {}} />
          <View style={styles.grid}>
            {curatedCountries.map((country) => (
              <DestinationCard key={country.id} country={country} />
            ))}
          </View>
        </View>

        {/* Trending Bites — with Tonight/Week quick-add buttons */}
        <View style={{ marginTop: Spacing.xl }}>
          <SectionHeader label="TRENDING BITES" title="Trending Bites" actionText="View All" onAction={() => {}} />
          <View style={styles.grid}>
            {trendingRecipes.map((recipe) => (
              <View key={recipe.id}>
                <RecipeCard recipe={recipe} />
                <View style={styles.quickActions}>
                  <Pressable
                    onPress={() => handleAddTonight(recipe)}
                    style={[styles.quickBtn, { backgroundColor: `${colors.primary}12` }]}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${recipe.title} to tonight`}
                  >
                    <MaterialCommunityIcons name="weather-night" size={14} color={colors.primary} />
                    <Text style={[Typography.labelSmall, { color: colors.primary }]}>Tonight</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleOpenDayPicker(recipe)}
                    style={[styles.quickBtn, { backgroundColor: `${colors.primary}12` }]}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${recipe.title} to weekly plan`}
                  >
                    <MaterialCommunityIcons name="calendar-plus" size={14} color={colors.primary} />
                    <Text style={[Typography.labelSmall, { color: colors.primary }]}>Week</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
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
            <Text style={[Typography.headline, { color: colors.onSurface, marginBottom: Spacing.sm }]}>
              Pick a Day
            </Text>
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
  container: {
    flex: 1,
  },
  heroContainer: {
    height: HERO_HEIGHT,
    position: 'relative',
  },
  heroContent: {
    position: 'absolute',
    bottom: 60,
    left: Spacing.page,
    right: Spacing.page,
    gap: Spacing.md,
  },
  heroTitle: {
  },
  flagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  exploreCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderRadius: Radius.full,
  },
  paginationDots: {
    position: 'absolute',
    right: Spacing.md,
    top: '50%',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    borderRadius: Radius.full,
  },
  dotActive: {
    width: 4,
    height: 16,
    borderRadius: Radius.full,
  },
  dotInactive: {
    width: 4,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: Radius.full,
  },
  tonightCard: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  tonightImage: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
  },
  tonightContent: {
    flex: 1,
    gap: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.page,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
    paddingHorizontal: 2,
  },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
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
    alignSelf: 'center',
  },
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
