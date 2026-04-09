import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { Shadows } from '@/constants/shadows';
import { GlassView } from '@/components/GlassView';
import { useApp } from '@/context/AppContext';
import { recipes as allRecipes } from '@/data/recipes';
import { calculateCookReadiness, CookReadiness } from '@/utils/cookReadiness';
import { todayLocal } from '@/utils/dates';

interface SmartCookBarProps {
  variant?: 'floating' | 'inline';
}

export function SmartCookBar({ variant = 'floating' }: SmartCookBarProps) {
  const colors = useThemeColors();
  const router = useRouter();
  const app = useApp();

  const [tick, setTick] = useState(0);

  // Recalculate every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  const todaysMeals = app.getTodaysMeals();
  const todayDate = todayLocal();
  const todayParty = app.getDinnerPartyForDate(todayDate);
  const hasDinnerParty = todayParty != null && todayParty.status !== 'completed';
  const guestCount = todayParty ? app.getGuestCount(todayParty.id).accepted : 0;

  // Calculate total cook time for today's recipes
  const totalCookMinutes = useMemo(() => {
    let total = 0;
    for (const meal of todaysMeals) {
      const recipe = allRecipes.find((r) => r.id === meal.recipeId);
      if (recipe) total += recipe.prepTime + recipe.cookTime;
    }
    return total;
  }, [todaysMeals]);

  const readiness: CookReadiness = useMemo(() => {
    return calculateCookReadiness({
      todaysMeals,
      activeCookSession: app.activeCookSession,
      groceryItems: app.groceryItems,
      totalCookMinutes,
      guestCount,
      hasDinnerParty,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todaysMeals, app.activeCookSession, app.groceryItems, totalCookMinutes, guestCount, hasDinnerParty, tick]);

  // Medium haptic on time_to_start mount
  const hasFiredHaptic = React.useRef(false);
  useEffect(() => {
    if (readiness.state === 'time_to_start' && !hasFiredHaptic.current) {
      hasFiredHaptic.current = true;
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    }
  }, [readiness.state]);

  if (readiness.state === 'hidden') return null;

  const isParty = hasDinnerParty;
  const headline = isParty ? readiness.headlineParty : readiness.headline;

  // Urgency-based styling
  const urgencyStyles = {
    none: { bg: colors.surfaceContainerHigh, strip: 'transparent' },
    low: { bg: colors.surfaceContainer, strip: colors.primary },
    medium: { bg: `${colors.warning}18`, strip: colors.warning },
    high: { bg: `${colors.error}12`, strip: colors.error },
  };
  const style = urgencyStyles[readiness.urgency];

  const handleCTA = () => {
    switch (readiness.state) {
      case 'now_cooking':
        if (app.activeCookSession) router.push(`/cook-mode/${app.activeCookSession.recipeId}`);
        break;
      case 'groceries_needed':
      case 'almost_ready':
        router.push('/(tabs)/grocery');
        break;
      case 'planned_early':
        router.push('/(tabs)/plan');
        break;
      case 'good_timing':
      case 'time_to_start':
      case 'running_late':
      case 'dinner_passed': {
        const firstMeal = todaysMeals[0];
        if (firstMeal) {
          const recipe = allRecipes.find((r) => r.id === firstMeal.recipeId);
          if (recipe) {
            if (hasDinnerParty && todayParty) {
              app.startDinnerPartyCooking(todayParty.id);
            }
            app.startCookSession(recipe, recipe.servings);
            router.push(`/cook-mode/${recipe.id}`);
          }
        }
        break;
      }
    }
  };

  const content = (
    <View style={[
      styles.bar,
      { backgroundColor: style.bg },
      style.strip !== 'transparent' && { borderLeftWidth: 3, borderLeftColor: style.strip },
    ]}>
      <View style={styles.textArea}>
        <Text style={[Typography.titleSmall, { color: colors.onSurface }]} numberOfLines={2}>
          {headline}
        </Text>
      </View>
      <Pressable
        onPress={handleCTA}
        style={[
          styles.ctaBtn,
          readiness.ctaStyle === 'primary' && { backgroundColor: colors.primary },
          readiness.ctaStyle === 'secondary' && { backgroundColor: colors.surfaceContainerHigh },
          readiness.ctaStyle === 'tertiary' && { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.outlineVariant },
        ]}
        accessibilityRole="button"
        accessibilityLabel={readiness.cta}
      >
        <Text style={[Typography.labelSmall, {
          color: readiness.ctaStyle === 'primary' ? colors.onPrimary : colors.primary,
        }]}>
          {readiness.cta}
        </Text>
      </Pressable>
    </View>
  );

  if (variant === 'inline') return content;

  return (
    <View style={styles.floatingContainer}>
      <GlassView style={[styles.floatingInner, { ...Shadows.subtle }]}>
        {content}
      </GlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    paddingHorizontal: Spacing.page,
    marginBottom: Spacing.md,
  },
  floatingInner: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
    borderRadius: Radius.lg,
  },
  textArea: {
    flex: 1,
  },
  ctaBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
});
