import { PlannedMeal, GroceryItem } from '@/context/AppContext';
import { CookSession } from '@/context/AppContext';

// ═══════════════════════════════════════════
// State machine types
// ═══════════════════════════════════════════

export type CookBarState =
  | 'hidden'
  | 'now_cooking'
  | 'groceries_needed'
  | 'almost_ready'
  | 'planned_early'
  | 'good_timing'
  | 'time_to_start'
  | 'running_late'
  | 'dinner_passed';

export type Urgency = 'none' | 'low' | 'medium' | 'high';

export interface CookReadiness {
  state: CookBarState;
  urgency: Urgency;
  headline: string;
  headlineParty: string;
  cta: string;
  ctaStyle: 'primary' | 'secondary' | 'tertiary';
  secondaryCta?: string;
  startTimeLabel?: string;
  servingTimeLabel?: string;
  groceryProgress?: { checked: number; total: number };
  minutesUntilStart?: number;
}

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════

function formatTime(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function hoursUntil(target: Date): number {
  return (target.getTime() - Date.now()) / (1000 * 60 * 60);
}

// ═══════════════════════════════════════════
// Main calculator
// ═══════════════════════════════════════════

export function calculateCookReadiness(params: {
  todaysMeals: PlannedMeal[];
  activeCookSession: CookSession | null;
  groceryItems: GroceryItem[];
  totalCookMinutes: number;
  servingHour?: number;
  servingMinute?: number;
  guestCount?: number;
  hasDinnerParty?: boolean;
}): CookReadiness {
  const {
    todaysMeals,
    activeCookSession,
    groceryItems,
    totalCookMinutes,
    servingHour = 19,
    servingMinute = 0,
    guestCount = 0,
    hasDinnerParty = false,
  } = params;

  // Priority 1: No meals planned
  if (todaysMeals.length === 0) {
    return { state: 'hidden', urgency: 'none', headline: '', headlineParty: '', cta: '', ctaStyle: 'primary' };
  }

  // Priority 2: Active cook session
  if (activeCookSession) {
    const recipeName = activeCookSession.recipeName;
    return {
      state: 'now_cooking',
      urgency: 'none',
      headline: recipeName,
      headlineParty: recipeName,
      cta: 'Resume Cooking',
      ctaStyle: 'primary',
    };
  }

  // Calculate serving time and start time
  const servingTime = new Date();
  servingTime.setHours(servingHour, servingMinute, 0, 0);
  const startTime = new Date(servingTime.getTime() - totalCookMinutes * 60 * 1000);
  const startLabel = formatTime(startTime);
  const serveLabel = formatTime(servingTime);
  const hoursToStart = hoursUntil(startTime);
  const hoursToServe = hoursUntil(servingTime);

  // Grocery progress
  const todayRecipeNames = todaysMeals.map((m) => m.recipeName);
  const relevantItems = groceryItems.filter((item) =>
    item.recipeNames.some((n) => todayRecipeNames.includes(n))
  );
  const totalItems = relevantItems.length;
  const checkedItems = relevantItems.filter((i) => i.checked).length;
  const groceryPercent = totalItems > 0 ? checkedItems / totalItems : 1;
  const groceryProgress = { checked: checkedItems, total: totalItems };

  // Priority 3: No groceries checked
  if (totalItems > 0 && groceryPercent === 0) {
    return {
      state: 'groceries_needed',
      urgency: hasDinnerParty ? 'high' : 'low',
      headline: 'You still need ingredients for tonight',
      headlineParty: "Your guests are coming — get ingredients first",
      cta: 'Review Grocery List',
      ctaStyle: 'secondary',
      groceryProgress,
    };
  }

  // Priority 4: Partial groceries
  if (totalItems > 0 && groceryPercent > 0 && groceryPercent < 1) {
    return {
      state: 'almost_ready',
      urgency: 'low',
      headline: `${checkedItems} of ${totalItems} ingredients ready`,
      headlineParty: `${checkedItems} of ${totalItems} ingredients ready · ${guestCount} guests tonight`,
      cta: 'Review List',
      ctaStyle: 'secondary',
      secondaryCta: 'Cook Anyway',
      groceryProgress,
    };
  }

  // Groceries done — time-based states

  // Priority 9: Past serving time
  if (hoursToServe < 0) {
    return {
      state: 'dinner_passed',
      urgency: 'none',
      headline: "Tonight's dinner time has passed",
      headlineParty: `Dinner was planned for ${serveLabel} with ${guestCount} guests`,
      cta: 'Cook Anyway',
      ctaStyle: 'tertiary',
      servingTimeLabel: serveLabel,
    };
  }

  // Priority 8: Past start time but before serving
  if (hoursToStart < 0) {
    return {
      state: 'running_late',
      urgency: 'high',
      headline: `You're running behind — dinner planned for ${serveLabel}`,
      headlineParty: `Your guests expect dinner at ${serveLabel}`,
      cta: 'Start Cooking',
      ctaStyle: 'primary',
      startTimeLabel: startLabel,
      servingTimeLabel: serveLabel,
      minutesUntilStart: 0,
    };
  }

  // Priority 7: Under 1 hour before start
  if (hoursToStart < 1) {
    return {
      state: 'time_to_start',
      urgency: 'medium',
      headline: `Dinner at ${serveLabel} — start cooking now`,
      headlineParty: 'Guests arriving soon — time to cook!',
      cta: 'Cook Now',
      ctaStyle: 'primary',
      startTimeLabel: startLabel,
      servingTimeLabel: serveLabel,
      minutesUntilStart: Math.round(hoursToStart * 60),
    };
  }

  // Priority 6: 1-4 hours before start
  if (hoursToStart < 4) {
    const hoursLeft = Math.round(hoursToStart);
    return {
      state: 'good_timing',
      urgency: 'low',
      headline: `Start cooking by ${startLabel} · ${hoursLeft}h until dinner`,
      headlineParty: `${guestCount} guests arriving at ${serveLabel} · Start by ${startLabel}`,
      cta: 'Start Cooking',
      ctaStyle: 'primary',
      startTimeLabel: startLabel,
      servingTimeLabel: serveLabel,
      minutesUntilStart: Math.round(hoursToStart * 60),
    };
  }

  // Priority 5: 4+ hours before start
  return {
    state: 'planned_early',
    urgency: 'none',
    headline: `Dinner at ${serveLabel} · Start around ${startLabel}`,
    headlineParty: `Dinner party at ${serveLabel} · ${guestCount} guests`,
    cta: 'View Plan',
    ctaStyle: 'secondary',
    startTimeLabel: startLabel,
    servingTimeLabel: serveLabel,
    minutesUntilStart: Math.round(hoursToStart * 60),
  };
}
