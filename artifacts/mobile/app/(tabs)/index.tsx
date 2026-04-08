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
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
import { AnimatedListItem } from '@/components/AnimatedListItem';
import { AddToPlanSheet } from '@/components/AddToPlanSheet';
import { countries } from '@/data/countries';
import { recipes, Recipe } from '@/data/recipes';
import { useApp } from '@/context/AppContext';

const HERO_HEIGHT = 480;

type MCIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const AVATAR_ICON_MAP: Record<string, MCIconName> = {
  chef: 'chef-hat',
  globe: 'earth',
  fire: 'fire',
  heart: 'heart',
  star: 'star',
  compass: 'compass',
};

function getInitials(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

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

function getGreeting(name?: string): string {
  const hour = new Date().getHours();
  const suffix = name ? `, ${name}` : '';
  if (hour < 12) return `Good morning${suffix}`;
  if (hour < 17) return `Good afternoon${suffix}`;
  if (hour < 21) return `Good evening${suffix}`;
  return name ? `Late night cravings, ${name}?` : 'Late night cravings?';
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

  const [addSheetRecipe, setAddSheetRecipe] = useState<Recipe | null>(null);

  const heroCountries = countries.slice(0, 5);
  const curatedCountries = countries.slice(0, 4);
  const trendingRecipes = recipes.slice(0, 6);

  // Tonight's plan from AppContext
  const todaysMeals = app.getTodaysMeals();
  const todayDate = toISO(new Date());
  const tonightMeal = todaysMeals.length > 0 ? todaysMeals[0] : null;
  const tonightRecipe = tonightMeal ? recipes.find((r) => r.id === tonightMeal.recipeId) : null;

  // Tonight strip: only show after noon + dismissible per day
  const isAfterNoon = new Date().getHours() >= 12;
  const [tonightDismissed, setTonightDismissed] = useState(true); // default hidden to avoid flash
  useEffect(() => {
    const key = `@fork_compass_tonight_dismissed_${todayDate}`;
    AsyncStorage.getItem(key).then((val) => {
      setTonightDismissed(val === 'true');
    });
  }, [todayDate]);
  const showTonightStrip = tonightRecipe != null && isAfterNoon && !tonightDismissed;
  const dismissTonightStrip = useCallback(() => {
    setTonightDismissed(true);
    AsyncStorage.setItem(`@fork_compass_tonight_dismissed_${todayDate}`, 'true');
  }, [todayDate]);

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
        contentContainerStyle={{ paddingBottom: 140 }}
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
                  <View style={styles.greetingRow}>
                    {app.displayName ? (
                      <View style={styles.greetingAvatar}>
                        {AVATAR_ICON_MAP[app.avatarId] ? (
                          <MaterialCommunityIcons
                            name={AVATAR_ICON_MAP[app.avatarId]}
                            size={16}
                            color="#FFFFFF"
                          />
                        ) : (
                          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>
                            {getInitials(app.displayName)}
                          </Text>
                        )}
                      </View>
                    ) : null}
                    <Text style={[Typography.title, { color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', flex: 1 }]}>
                      {getGreeting(app.displayName || undefined)}
                    </Text>
                  </View>
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
                    <MaterialCommunityIcons name="arrow-right" size={20} color={colors.onPrimary} />
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

        {/* Tonight's Plan Strip — visible after noon, dismissible per day */}
        {showTonightStrip && tonightMeal ? (
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
                {(() => {
                  const todayParty = app.getDinnerPartyForDate(todayDate);
                  const isDinnerParty = todayParty && todayParty.status !== 'completed';
                  return (
                    <>
                      <Text style={[Typography.labelLarge, { color: colors.primary }]}>
                        {isDinnerParty ? "TONIGHT'S DINNER PARTY" : "TONIGHT'S PLAN"}
                      </Text>
                      <Text style={[Typography.headline, { color: colors.onSurface, fontSize: 18 }]} numberOfLines={1}>
                        {tonightMeal.recipeName}
                      </Text>
                      {isDinnerParty && (
                        <Text style={[Typography.caption, { color: colors.outline }]}>
                          {app.getGuestCount(todayParty!.id).total} guests
                        </Text>
                      )}
                      <Pressable onPress={handleCookTonight} accessibilityRole="button" accessibilityLabel={isDinnerParty ? 'Cook for your guests' : `Cook ${tonightMeal.recipeName} tonight`}>
                        <Text style={[Typography.titleSmall, { color: colors.primary }]}>
                          {isDinnerParty ? 'Cook for your guests' : 'Cook Tonight'}
                        </Text>
                      </Pressable>
                    </>
                  );
                })()}
              </View>
              <Pressable
                onPress={dismissTonightStrip}
                style={styles.tonightDismiss}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Dismiss tonight's plan"
              >
                <MaterialCommunityIcons name="close" size={16} color={colors.onSurfaceVariant} />
              </Pressable>
            </GlassView>
          </View>
        ) : !showTonightStrip && !tonightRecipe ? (
          <View style={{ paddingHorizontal: Spacing.page, marginTop: -Spacing.xxl }}>
            <GlassView style={[styles.tonightCard, { ...Shadows.ambient }]}>
              <View style={[styles.tonightImage, { backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }]}>
                <MaterialCommunityIcons name="calendar-blank" size={24} color={colors.outlineVariant} />
              </View>
              <View style={styles.tonightContent}>
                <Text style={[Typography.bodySmall, { color: colors.onSurfaceVariant }]}>
                  No dinner planned yet
                </Text>
                <Pressable onPress={() => router.push('/(tabs)/plan')} accessibilityRole="button" accessibilityLabel="Plan tonight's dinner">
                  <Text style={[Typography.titleSmall, { color: colors.primary }]}>Plan Tonight</Text>
                </Pressable>
              </View>
            </GlassView>
          </View>
        ) : null}

        {/* Explore Cuisines */}
        <View style={{ marginTop: Spacing.xxl }}>
          <SectionHeader label="EXPLORE CUISINES" title="Explore Cuisines" actionText="View All" onAction={() => router.push('/(tabs)/search')} />
          <View style={styles.grid}>
            {curatedCountries.map((country) => (
              <DestinationCard key={country.id} country={country} />
            ))}
          </View>
        </View>

        {/* Popular Recipes */}
        <View style={{ marginTop: Spacing.xl }}>
          <SectionHeader label="POPULAR RECIPES" title="Popular Recipes" actionText="View All" onAction={() => router.push('/(tabs)/search')} />
          <View style={styles.grid}>
            {trendingRecipes.map((recipe, index) => (
              <AnimatedListItem key={recipe.id} index={index}>
                <RecipeCard recipe={recipe} onAdd={() => setAddSheetRecipe(recipe)} />
              </AnimatedListItem>
            ))}
          </View>
        </View>
      </ScrollView>

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
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greetingAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
  tonightDismiss: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    padding: Spacing.xs,
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
});
