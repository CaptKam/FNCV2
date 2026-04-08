import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
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
import { GlassView } from '@/components/GlassView';
import { HeaderBar } from '@/components/HeaderBar';
import { recipes } from '@/data/recipes';
import { countries } from '@/data/countries';
import { formatCookTime } from '@/data/helpers';
import { useApp } from '@/context/AppContext';
import { Checkbox } from '@/components/Checkbox';

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
  const progress = (xp % 300) / 300;

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
  const todayDate = new Date().toISOString().split('T')[0];
  const todayParty = app.getDinnerPartyForDate(todayDate);
  const hasDinnerParty = todayParty != null && todayParty.status !== 'completed';
  const partyGuestCount = todayParty ? app.getGuestCount(todayParty.id) : null;

  const heroRecipe = hasActiveSession ? sessionRecipe : hasTodayPlan ? todayRecipe : null;
  const heroCountry = heroRecipe ? countries.find((c) => c.id === heroRecipe.countryId) : null;

  const checks = app.kitchenChecks;
  const setChecks = (next: boolean[]) => app.setKitchenChecks(next);

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

  const dismissCookHint = useCallback(() => {
    setShowCookHint(false);
    AsyncStorage.setItem('@fork_compass_hint_cook_seen', 'true');
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <HeaderBar />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140, paddingTop: insets.top + 76 }}
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
                    <MaterialCommunityIcons name="clock-outline" size={18} color={colors.primary} />
                    <Text style={[Typography.caption, { color: colors.onSurfaceVariant }]}>
                      {formatCookTime(heroRecipe.prepTime + heroRecipe.cookTime)}
                    </Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons name="account-group-outline" size={18} color={colors.primary} />
                    <Text style={[Typography.caption, { color: colors.onSurfaceVariant }]}>
                      {heroRecipe.servings} Servings
                    </Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons name="star-outline" size={18} color={colors.primary} />
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
                <MaterialCommunityIcons name="weather-sunset" size={44} color={colors.primary} />
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
                <MaterialCommunityIcons name="close" size={18} color={colors.onSurfaceVariant} />
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
                  <MaterialCommunityIcons name="party-popper" size={22} color={colors.primary} />
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
              <Pressable
                key={item.label}
                onPress={() => {
                  const next = [...checks];
                  next[idx] = !next[idx];
                  setChecks(next);
                }}
                style={styles.checkItem}
                accessibilityLabel={item.label}
              >
                <Checkbox
                  checked={checks[idx]}
                  onToggle={() => {
                    const next = [...checks];
                    next[idx] = !next[idx];
                    setChecks(next);
                  }}
                />
                <Text
                  style={[
                    Typography.bodySmall,
                    { color: checks[idx] ? colors.onSurface : colors.onSurfaceVariant },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {heroRecipe && (
          <View style={styles.ctaSection}>
            <Pressable
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
            >
              <Text style={[Typography.titleMedium, { color: colors.onPrimary, letterSpacing: -0.3 }]}>
                {hasActiveSession ? 'Continue Cooking' : 'Start Cooking'}
              </Text>
              <MaterialCommunityIcons name="arrow-right" size={22} color={colors.onPrimary} />
            </Pressable>
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
              <MaterialCommunityIcons name="arrow-right" size={22} color={colors.onPrimary} />
            </Pressable>
          </View>
        )}

        <View style={styles.levelSection}>
          <View style={styles.levelHeader}>
            <Text style={[Typography.labelLarge, { color: colors.outline }]}>Your Progress</Text>
            <Text style={[Typography.caption, { color: colors.primary, fontWeight: '700' }]}>{xp} points</Text>
          </View>
          <Text style={[Typography.headline, { color: colors.onSurface }]}>{levelName}</Text>
          <View style={styles.levelBarRow}>
            <Text style={[Typography.caption, { color: colors.onSurfaceVariant }]}>Level {level}</Text>
            <View style={[styles.progressBar, { backgroundColor: colors.surfaceContainerHigh }]}>
              <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress * 100}%` }]} />
            </View>
          </View>
          <Text style={[Typography.caption, { color: colors.onSurfaceVariant, marginTop: Spacing.xs }]}>
            Cook recipes to earn points and level up
          </Text>
        </View>

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
              <Pressable key={tech.id} onPress={() => router.push(`/technique/${tech.id}`)} style={styles.techCard} accessibilityRole="button" accessibilityLabel={`${tech.title}, ${tech.duration}`}>
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
                    <MaterialCommunityIcons name="clock-outline" size={10} color={colors.textOnImage} />
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
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={{ paddingHorizontal: Spacing.page, marginTop: Spacing.xxl }}>
          <View style={[styles.statsCard, { backgroundColor: colors.surfaceContainerLow }]}>
            <View style={{ flex: 1 }}>
              <Text style={[Typography.headlineLarge, { color: colors.onSurface }]}>
                {app.totalRecipesCooked}
              </Text>
              <Text style={[Typography.bodySmall, { color: colors.onSurfaceVariant }]}>
                Recipes cooked
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/bookmarks')}
              accessibilityRole="button"
              accessibilityLabel="View saved recipes"
            >
              <Text style={[Typography.titleSmall, { color: colors.primary }]}>View Saved</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
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
    height: 220,
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
    paddingVertical: Spacing.xxxl + Spacing.sm,
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
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
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
    height: 260,
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
});
