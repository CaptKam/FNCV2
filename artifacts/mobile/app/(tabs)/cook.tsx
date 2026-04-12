import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { GlassView } from '@/components/GlassView';
import { HeaderBar } from '@/components/HeaderBar';
import { PressableScale } from '@/components/PressableScale';
import { recipes } from '@/data/recipes';
import { countries } from '@/data/countries';
import { formatCookTime } from '@/data/helpers';
import { useApp } from '@/context/AppContext';
import { AnimatedListItem } from '@/components/AnimatedListItem';
import { CheckRow } from '@/components/CheckRow';
import { todayLocal, addDays, getDayLabelFull } from '@/utils/dates';
import { RecipePickerSheet } from '@/components/RecipePickerSheet';
import { Recipe } from '@/data/recipes';
import { SmartCookBar } from '@/components/SmartCookBar';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { AnimatedProgressBar } from '@/components/AnimatedProgressBar';
import { useFeatureFlag, useAppSetting } from '@/hooks/useRemoteConfig';

import { TECHNIQUES } from '@/data/techniques';

const KITCHEN_CHECKS = [
  { label: 'Ingredients Prepped', icon: 'basket-outline' as const },
  { label: 'Equipment Ready', icon: 'pot-steam' as const },
  { label: 'Workspace Clean', icon: 'broom' as const },
];

export default function CookScreen() {
  const colors = useThemeColors();
  const isDark = colors.isDark;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const app = useApp();

  const { activeCookSession, xp, level } = app;
  const levelName = app.getCookingLevelName();
  const todaysMeals = app.getTodaysMeals();

  // Feature flags — guard UI sections we can remotely disable.
  const showXp = useFeatureFlag('xp_system');
  const showPassport = useFeatureFlag('passport_stamps');
  const showSmartCookBar = useFeatureFlag('smart_cook_bar');
  const showTechniqueLibrary = useFeatureFlag('technique_library');

  // Level progress is computed from the configured level_thresholds
  // array so the progress bar fills toward the NEXT level, not the
  // old hardcoded 300-XP divisor.
  const thresholds = useAppSetting<number[]>(
    'level_thresholds',
    [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000],
  );
  const currentThreshold = thresholds[Math.max(0, level - 1)] ?? 0;
  const nextThreshold = thresholds[level] ?? currentThreshold + 500;
  const progress =
    nextThreshold > currentThreshold
      ? Math.max(0, Math.min(1, (xp - currentThreshold) / (nextThreshold - currentThreshold)))
      : 1;

  const sessionRecipe = activeCookSession
    ? recipes.find((r) => r.id === activeCookSession.recipeId)
    : null;

  const todayMainMeal = todaysMeals.find(() => true);
  const todayRecipe = todayMainMeal
    ? recipes.find((r) => r.id === todayMainMeal.recipeId)
    : null;

  const hasActiveSession = activeCookSession != null && sessionRecipe != null;
  const hasTodayPlan = !hasActiveSession && todayRecipe != null;

  // Dinner party awareness
  const todayDate = todayLocal();
  const todayParty = app.getDinnerPartyForDate(todayDate);
  const hasDinnerParty = todayParty != null && todayParty.status !== 'completed';
  const partyGuestCount = todayParty ? app.getGuestCount(todayParty.id) : null;

  const heroRecipe = hasActiveSession ? sessionRecipe : hasTodayPlan ? todayRecipe : null;
  const heroCountry = heroRecipe ? countries.find((c) => c.id === heroRecipe.countryId) : null;

  const checks = app.kitchenChecks;
  const setChecks = (next: boolean[]) => app.setKitchenChecks(next);

  // Tomorrow nudge after cook completion
  const [showTomorrowNudge, setShowTomorrowNudge] = useState(false);
  const [tomorrowDismissed, setTomorrowDismissed] = useState(false);
  const lastCookCount = useRef(app.totalRecipesCooked);
  const [tomorrowPickerVisible, setTomorrowPickerVisible] = useState(false);

  // Pull-to-refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setTimeout(() => setIsRefreshing(false), 600);
  }, []);

  // First-time cook hint
  const [showCookHint, setShowCookHint] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem('@fork_compass_hint_cook_seen').then((val) => {
      if (val !== 'true') setShowCookHint(true);
    });
  }, []);

  // Auto-dismiss after first cook session starts
  useEffect(() => {
    if (showCookHint && hasActiveSession) {
      setShowCookHint(false);
      AsyncStorage.setItem('@fork_compass_hint_cook_seen', 'true');
    }
  }, [hasActiveSession, showCookHint]);

  // Detect cook completion (totalRecipesCooked increases)
  useEffect(() => {
    if (app.totalRecipesCooked > lastCookCount.current && !hasActiveSession) {
      lastCookCount.current = app.totalRecipesCooked;
      setTomorrowDismissed(false);
      setShowTomorrowNudge(true);
    }
  }, [app.totalRecipesCooked, hasActiveSession]);

  // Tomorrow data
  const tomorrowDate = addDays(todayLocal(), 1);
  const tomorrowLabel = getDayLabelFull(tomorrowDate);
  const tomorrowDay = app.itinerary.find(d => d.date === tomorrowDate);
  const tomorrowMeal = tomorrowDay?.courses?.main;
  const tomorrowRecipeName = tomorrowMeal?.recipeName;

  const handleTomorrowPick = useCallback((recipe: Recipe) => {
    app.addCourseToDay(tomorrowDate, 'main', recipe);
    setTomorrowPickerVisible(false);
    setShowTomorrowNudge(false);
  }, [app, tomorrowDate]);

  const dismissCookHint = useCallback(() => {
    setShowCookHint(false);
    AsyncStorage.setItem('@fork_compass_hint_cook_seen', 'true');
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <HeaderBar />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Spacing.tabClearance, paddingTop: insets.top + 76 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >

        {heroRecipe ? (
          <View style={styles.heroSection}>
            <View style={styles.heroImageWrap}>
              <Image
                source={{ uri: heroRecipe.image }}
                style={styles.heroImage}
                contentFit="cover"
                transition={300}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.55)']}
                style={StyleSheet.absoluteFill}
              />
            </View>

            <View style={styles.heroCard}>
              <GlassView style={styles.heroCardInner}>
                <Text style={[Typography.labelLarge, { color: colors.primary, fontStyle: 'italic' }]}>
                  {hasActiveSession ? 'Now Cooking' : hasDinnerParty ? 'Dinner Party' : 'Tonight\'s Dinner'}
                </Text>
                {hasDinnerParty && partyGuestCount && !hasActiveSession && (
                  <Text style={[Typography.caption, { color: colors.outline, marginTop: 2 }]}>
                    {partyGuestCount.total} guest{partyGuestCount.total !== 1 ? 's' : ''} · {partyGuestCount.accepted} accepted
                  </Text>
                )}
                <Text style={[Typography.display, { color: colors.onSurface, marginBottom: Spacing.sm }]}>
                  {heroRecipe.title}
                </Text>

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons name="clock-outline" size={20} color={colors.primary} />
                    <Text style={[Typography.caption, { color: colors.onSurfaceVariant }]}>
                      {formatCookTime(heroRecipe.prepTime + heroRecipe.cookTime)}
                    </Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons name="account-group-outline" size={20} color={colors.primary} />
                    <Text style={[Typography.caption, { color: colors.onSurfaceVariant }]}>
                      {heroRecipe.servings} Servings
                    </Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons name="star-outline" size={20} color={colors.primary} />
                    <Text style={[Typography.caption, { color: colors.onSurfaceVariant }]}>
                      {heroRecipe.difficulty}
                    </Text>
                  </View>
                </View>
              </GlassView>
            </View>
          </View>
        ) : (
          <View style={[styles.emptyHero, { marginHorizontal: Spacing.page }]}>
            <View style={[styles.emptyHeroInner, { borderColor: colors.outlineVariant }]}>
              <View style={[styles.emptyIconCircle, { backgroundColor: colors.primarySubtle }]}>
                <MaterialCommunityIcons name="weather-sunset" size={28} color={colors.outlineVariant} />
              </View>
              <Text style={[Typography.headline, { color: colors.onSurface, textAlign: 'center' }]}>
                Ready when you are
              </Text>
              <Text style={[Typography.bodySmall, { color: colors.outline, textAlign: 'center', lineHeight: 22 }]}>
                Pick a recipe and we'll guide you through every step.
              </Text>
            </View>
          </View>
        )}

        {/* First-time cook hint */}
        {showCookHint && hasTodayPlan && !hasActiveSession && (
          <View style={{ paddingHorizontal: Spacing.page, marginBottom: Spacing.md }}>
            <View style={[styles.onboardingHint, { backgroundColor: colors.surfaceContainerLow }]}>
              <Text style={[Typography.body, { color: colors.onSurface, flex: 1 }]}>
                When you're ready, tap Start Cooking and we'll guide you through every step.
              </Text>
              <Pressable onPress={dismissCookHint} hitSlop={8} accessibilityRole="button" accessibilityLabel="Dismiss hint">
                <MaterialCommunityIcons name="close" size={20} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.bentoRow}>
          {heroRecipe && heroCountry && (
            <View style={[styles.dinnerPartyCard, { backgroundColor: colors.surfaceContainerLow }]}>
              <View style={styles.dinnerPartyHeader}>
                <View>
                  <Text style={[Typography.headline, { color: colors.onSurface, marginBottom: 2 }]}>Dinner Party</Text>
                  <Text style={[Typography.titleSmall, { color: colors.primary, letterSpacing: 0.3 }]}>
                    A {heroCountry.name} Night
                  </Text>
                </View>
                <View style={[styles.cardIconBg, { backgroundColor: colors.primaryMuted }]}>
                  <MaterialCommunityIcons name="party-popper" size={20} color={colors.primary} />
                </View>
              </View>
              <View style={[styles.guestRow, { backgroundColor: colors.surface, borderTopColor: colors.glassOverlay }]}>
                <View style={styles.guestAvatars}>
                  {(todayParty?.guests ?? []).slice(0, 3).map((g, i) => (
                    <View
                      key={g.id}
                      style={[styles.guestDot, { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.surface, marginLeft: i === 0 ? 0 : -Spacing.sm }]}
                    />
                  ))}
                  {(todayParty?.guests.length ?? 0) > 3 && (
                    <View style={[styles.guestDot, styles.guestPending, { backgroundColor: colors.surfaceContainerHighest, borderColor: colors.surface, marginLeft: -Spacing.sm }]}>
                      <Text style={[Typography.labelSmall, { color: colors.onSurfaceVariant, letterSpacing: 0 }]}>+{(todayParty?.guests.length ?? 0) - 3}</Text>
                    </View>
                  )}
                </View>
                <Text style={[Typography.bodySmall, { color: colors.onSurfaceVariant }]}>
                  {partyGuestCount ? `${partyGuestCount.total} Guest${partyGuestCount.total !== 1 ? 's' : ''}` : 'Dinner Party Planned'}
                  {partyGuestCount && partyGuestCount.accepted > 0 ? (
                    <Text style={{ opacity: 0.6 }}> ({partyGuestCount.accepted} Confirmed)</Text>
                  ) : null}
                </Text>
              </View>
            </View>
          )}

          <View style={[styles.kitchenCheckCard, { backgroundColor: colors.surfaceContainerHighest }]}>
            <View style={styles.checkHeader}>
              <MaterialCommunityIcons name="clipboard-check-outline" size={20} color={colors.primary} />
              <Text style={[Typography.title, { color: colors.onSurface }]}>Your Progress</Text>
            </View>
            {KITCHEN_CHECKS.map((item, idx) => (
              <AnimatedListItem key={item.label} index={idx}>
                <CheckRow
                  checked={checks[idx]}
                  onToggle={() => {
                    const next = [...checks];
                    next[idx] = !next[idx];
                    setChecks(next);
                  }}
                  label={item.label}
                />
              </AnimatedListItem>
            ))}
          </View>
        </View>

        {/* SmartCookBar — state-aware cook readiness */}
        {showSmartCookBar && <SmartCookBar variant="inline" />}

        {heroRecipe && (
          <View style={styles.ctaSection}>
            <PressableScale
              onPress={() => {
                if (hasActiveSession) {
                  router.push(`/cook-mode/${activeCookSession!.recipeId}`);
                } else if (hasDinnerParty && todayParty && todayRecipe) {
                  app.startDinnerPartyCooking(todayParty.id);
                  app.startCookSession(todayRecipe, todayRecipe.servings);
                  router.push(`/cook-mode/${todayRecipe.id}`);
                } else if (hasTodayPlan && todayRecipe) {
                  app.startCookSession(todayRecipe, todayRecipe.servings);
                  router.push(`/cook-mode/${todayRecipe.id}`);
                }
              }}
              style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
              accessibilityRole="button"
              accessibilityLabel={hasActiveSession ? 'Continue cooking' : 'Start cooking'}
              scaleDown={0.98}
              haptic="medium"
            >
              <Text style={[Typography.titleMedium, { color: colors.onPrimary, letterSpacing: -0.3 }]}>
                {hasActiveSession ? 'Continue Cooking' : 'Start Cooking'}
              </Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color={colors.onPrimary} />
            </PressableScale>
            {hasDinnerParty && !hasActiveSession && todayParty && (
              <Pressable
                onPress={() => router.push(`/dinner-setup?date=${todayDate}`)}
                style={[styles.reviewPartyBtn, { borderColor: colors.primary }]}
                accessibilityRole="button"
                accessibilityLabel="Review dinner party"
              >
                <Text style={[Typography.titleSmall, { color: colors.primary }]}>Review Party Details</Text>
              </Pressable>
            )}
            <Text style={[Typography.labelSmall, { color: colors.onSurfaceVariant, opacity: 0.6 }]}>
              {hasActiveSession
                ? `Step ${activeCookSession!.currentStepIndex + 1} of ${activeCookSession!.totalSteps}`
                : hasDinnerParty ? `${partyGuestCount?.accepted ?? 0} guests confirmed` : 'Pick a recipe to get started'}
            </Text>
          </View>
        )}

        {!heroRecipe && (
          <View style={[styles.ctaSection, { marginTop: Spacing.md }]}>
            <Pressable
              onPress={() => router.push('/(tabs)/plan')}
              style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
              accessibilityRole="button"
              accessibilityLabel="Plan a meal"
            >
              <Text style={[Typography.titleMedium, { color: colors.onPrimary }]}>Plan a Meal</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color={colors.onPrimary} />
            </Pressable>
          </View>
        )}

        {showTomorrowNudge && !tomorrowDismissed && !hasActiveSession && (
          <View style={[styles.tomorrowCard, { backgroundColor: colors.surfaceContainerLow, marginHorizontal: Spacing.page, marginBottom: Spacing.lg }]}>
            <Pressable
              onPress={() => setTomorrowDismissed(true)}
              style={styles.tomorrowDismiss}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Dismiss"
            >
              <MaterialCommunityIcons name="close" size={16} color={colors.onSurfaceVariant} />
            </Pressable>
            {tomorrowRecipeName ? (
              <View style={{ gap: Spacing.xs }}>
                <Text style={[Typography.caption, { color: colors.onSurfaceVariant }]}>Tomorrow is {tomorrowLabel}</Text>
                <Text style={[Typography.titleSmall, { color: colors.onSurface }]}>{tomorrowRecipeName}</Text>
              </View>
            ) : (
              <>
                <View style={{ gap: Spacing.xs }}>
                  <Text style={[Typography.titleSmall, { color: colors.onSurface }]}>Tomorrow is {tomorrowLabel}</Text>
                  <Text style={[Typography.caption, { color: colors.onSurfaceVariant }]}>No dinner planned yet.</Text>
                </View>
                <View style={styles.tomorrowActions}>
                  <Pressable
                    onPress={() => setTomorrowPickerVisible(true)}
                    style={[styles.tomorrowBtn, { backgroundColor: colors.surfaceContainerHigh }]}
                    accessibilityRole="button"
                    accessibilityLabel="Plan tomorrow"
                  >
                    <Text style={[Typography.labelSmall, { color: colors.primary }]}>Plan Tomorrow</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => router.push('/(tabs)')}
                    accessibilityRole="button"
                    accessibilityLabel="Browse recipes"
                  >
                    <Text style={[Typography.labelSmall, { color: colors.onSurfaceVariant }]}>Browse Recipes</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        )}

        {showXp && (
          <View style={styles.levelSection}>
            <View style={styles.levelHeader}>
              <Text style={[Typography.labelLarge, { color: colors.outline }]}>Your Progress</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <AnimatedCounter
                  value={xp}
                  style={[Typography.caption, { color: colors.primary, fontWeight: '700' }]}
                />
                <Text style={[Typography.caption, { color: colors.primary, fontWeight: '700' }]}> points</Text>
              </View>
            </View>
            <Text style={[Typography.headline, { color: colors.onSurface }]}>{levelName}</Text>
            <View style={styles.levelBarRow}>
              <Text style={[Typography.caption, { color: colors.onSurfaceVariant }]}>Level {level}</Text>
              <AnimatedProgressBar
                progress={progress}
                trackColor={colors.surfaceContainerHigh}
                fillColor={colors.primary}
                height={6}
                style={{ flex: 1 }}
              />
            </View>
            <Text style={[Typography.caption, { color: colors.onSurfaceVariant, marginTop: Spacing.xs }]}>
              Cook recipes to earn points and level up
            </Text>
          </View>
        )}

        {showTechniqueLibrary && (
        <View style={styles.techSection}>
          <View style={{ paddingHorizontal: Spacing.page, marginBottom: Spacing.md }}>
            <Text style={[Typography.labelLarge, { color: colors.outline }]}>COOKING TIPS</Text>
            <Text style={[Typography.headline, { color: colors.onSurface }]}>Improve Your Skills</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: Spacing.page, gap: Spacing.md }}
          >
            {TECHNIQUES.map((tech) => (
              <PressableScale key={tech.id} onPress={() => router.push(`/technique/${tech.id}`)} style={styles.techCard} accessibilityRole="button" accessibilityLabel={`${tech.title}, ${tech.duration}`} scaleDown={0.96}>
                <Image
                  source={{ uri: tech.image }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={300}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.75)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.techBadge}>
                  <GlassView style={styles.techBadgeInner}>
                    <MaterialCommunityIcons name="clock-outline" size={16} color={colors.textOnImage} />
                    <Text style={[Typography.labelSmall, { color: colors.textOnImage }]}>{tech.duration}</Text>
                  </GlassView>
                </View>
                <View style={styles.techContent}>
                  <Text style={[Typography.titleSmall, { color: colors.textOnImage }]}>
                    {tech.title}
                  </Text>
                  <Text style={[Typography.caption, { color: colors.textOnImage, opacity: 0.7 }]}>
                    {tech.subtitle}
                  </Text>
                </View>
              </PressableScale>
            ))}
          </ScrollView>
        </View>
        )}

        <View style={{ paddingHorizontal: Spacing.page, marginTop: Spacing.xxl }}>
          <View style={[styles.statsCard, { backgroundColor: colors.surfaceContainerLow }]}>
            <View style={{ flex: 1 }}>
              <AnimatedCounter
                value={app.totalRecipesCooked}
                style={[Typography.headlineLarge, { color: colors.onSurface }]}
              />
              <Text style={[Typography.bodySmall, { color: colors.onSurfaceVariant }]}>
                Recipes cooked
              </Text>
            </View>
            <View style={{ gap: Spacing.sm, alignItems: 'flex-end' }}>
            {showPassport && (
              <Pressable
                onPress={() => router.push('/passport')}
                accessibilityRole="button"
                accessibilityLabel="View passport"
              >
                <Text style={[Typography.titleSmall, { color: colors.primary }]}>View Passport</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => router.push('/bookmarks')}
              accessibilityRole="button"
              accessibilityLabel="View saved recipes"
            >
              <Text style={[Typography.titleSmall, { color: colors.primary }]}>View Saved</Text>
            </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
      <RecipePickerSheet
        visible={tomorrowPickerVisible}
        onDismiss={() => setTomorrowPickerVisible(false)}
        onSelect={handleTomorrowPick}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroSection: {
    marginHorizontal: Spacing.page,
    marginBottom: Spacing.xl,
  },
  heroImageWrap: {
    height: 240,
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroCard: {
    marginTop: -40,
    marginHorizontal: Spacing.md,
  },
  heroCardInner: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    gap: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statDivider: {
    width: 1,
    height: Spacing.xl,
    opacity: 0.3,
  },
  emptyHero: {
    marginBottom: Spacing.xl,
  },
  emptyHeroInner: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.xl,
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
  },
  bentoRow: {
    paddingHorizontal: Spacing.page,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  dinnerPartyCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  dinnerPartyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardIconBg: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderTopWidth: 1,
  },
  guestAvatars: {
    flexDirection: 'row',
  },
  guestDot: {
    width: Spacing.xl,
    height: Spacing.xl,
    borderRadius: Radius.full,
    borderWidth: 2,
  },
  guestPending: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  kitchenCheckCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  checkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  ctaSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.page,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl + Spacing.xs,
    paddingVertical: Spacing.md + 2,
    borderRadius: Radius.full,
  },
  reviewPartyBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  levelSection: {
    paddingHorizontal: Spacing.page,
    marginBottom: Spacing.xxl,
    gap: Spacing.xs,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  techSection: {
    marginBottom: Spacing.xl,
  },
  techCard: {
    width: 200,
    height: 280,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  techBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  techBadgeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  techContent: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    gap: Spacing.xs,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.lg,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onboardingHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
  },
  tomorrowCard: {
    padding: Spacing.md,
    borderRadius: Radius.xl,
    gap: Spacing.md,
  },
  tomorrowDismiss: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    zIndex: 1,
  },
  tomorrowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  tomorrowBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
});
