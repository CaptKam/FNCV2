import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Storage } from '@/utils/storage';
import { Recipe } from '@/data/recipes';
import { countries } from '@/data/countries';
import { DinnerPlan } from '@/types/kitchen';
import { DinnerParty, DinnerGuest, DietaryConflict, DinnerPartyMenu } from '@/types/dinnerParty';
import { buildDinnerTimeline } from '@/utils/timelineEngine';
import { todayLocal, dateToLocal, addDays as addDaysLocal, getDayLabelFull, parseDateLocal } from '@/utils/dates';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export interface PlannedMeal {
  recipeId: string;
  recipeName: string;
  recipeImage: string;
  countryFlag: string;
  cookTime: number;
  addedAt: string;
}

export interface ItineraryDay {
  date: string;
  dayLabel: string;
  courses: {
    appetizer?: PlannedMeal;
    main?: PlannedMeal;
    dessert?: PlannedMeal;
  };
  hasDinnerParty: boolean;
}

export interface GroceryItem {
  id: string;
  name: string;
  amount: string;
  unit: string;
  category: 'produce' | 'protein' | 'dairy' | 'pantry' | 'spice';
  recipeNames: string[];
  sourceAmounts: Record<string, string>;
  checked: boolean;
  excluded: boolean;
}

export interface CookSession {
  id: string;
  recipeId: string;
  recipeName: string;
  totalSteps: number;
  currentStepIndex: number;
  completedSteps: string[];
  servings: number;
  startedAt: string;
  activeTimerStart: string | null;
  activeTimerDuration: number | null;
  status: 'active' | 'paused';
}

type CourseType = 'appetizer' | 'main' | 'dessert';
type CookingLevel = 'beginner' | 'home_cook' | 'chef';
type CoursePreference = 'main' | 'full';
type GroceryPartner = 'instacart' | 'kroger' | 'walmart' | 'amazon_fresh';

// ═══════════════════════════════════════════
// CONTEXT VALUE
// ═══════════════════════════════════════════

interface AppContextValue {
  // Itinerary
  itinerary: ItineraryDay[];
  addCourseToDay: (date: string, courseType: CourseType, recipe: Recipe) => void;
  removeCourseFromDay: (date: string, courseType: CourseType) => void;
  removeRecipeFromPlanByName: (recipeName: string) => void;
  toggleDinnerParty: (date: string) => void;
  autoGenerateWeek: (selectedDates: string[], coursePreference: CoursePreference) => void;
  restoreItinerary: (snapshot: ItineraryDay[]) => void;
  restoreGrocery: (snapshot: GroceryItem[]) => void;
  clearDay: (date: string) => void;
  getWeek: (startDate: string) => ItineraryDay[];
  getTodaysMeals: () => PlannedMeal[];

  // Grocery
  groceryItems: GroceryItem[];
  addToGrocery: (recipe: Recipe) => void;
  addManualGroceryItem: (name: string, category?: GroceryItem['category']) => void;
  removeGroceryItemsByRecipe: (recipeName: string) => void;
  removeGroceryItem: (id: string) => void;
  toggleGroceryItem: (id: string) => void;
  clearCheckedItems: () => void;
  clearAllGroceryItems: () => void;
  getUncheckedCount: () => number;

  // Cook Session
  activeCookSession: CookSession | null;
  startCookSession: (recipe: Recipe, servings: number) => void;
  advanceStep: () => void;
  previousStep: () => void;
  startStepTimer: (durationSeconds: number) => void;
  clearStepTimer: () => void;
  completeCookSession: () => void;
  resumeCookSession: () => CookSession | null;

  // Preferences
  cookingLevel: CookingLevel;
  coursePreference: CoursePreference;
  groceryPartner: GroceryPartner;
  zipCode: string;
  useMetric: boolean;
  dietaryFlags: string[];
  allergens: string[];
  hasCompletedOnboarding: boolean;
  displayName: string;
  avatarId: string;
  setCookingLevel: (level: CookingLevel) => void;
  setCoursePreference: (pref: CoursePreference) => void;
  setGroceryPartner: (partner: GroceryPartner) => void;
  setZipCode: (zip: string) => void;
  setUseMetric: (metric: boolean) => void;
  setDietaryFlags: (flags: string[]) => void;
  setAllergens: (allergens: string[]) => void;
  setHasCompletedOnboarding: (v: boolean) => void;
  setDisplayName: (name: string) => void;
  setAvatarId: (id: string) => void;
  isHydrated: boolean;

  // History / XP
  totalRecipesCooked: number;
  xp: number;
  level: number;
  passportStamps: Record<string, number>;
  awardXP: (amount: number) => void;
  addPassportStamp: (countryId: string) => void;
  getCookingLevelName: () => string;

  // Dinner parties
  dinnerParties: DinnerParty[];
  activeDinnerParty: DinnerParty | null;
  createDinnerParty: (params: { date: string; title: string; targetServingTime: string; cuisineCountryId: string }) => DinnerParty;
  updateDinnerParty: (partyId: string, updates: Partial<DinnerParty>) => void;
  cancelDinnerParty: (partyId: string) => void;
  addGuest: (partyId: string, guest: Omit<DinnerGuest, 'id' | 'rsvpStatus'>) => void;
  removeGuest: (partyId: string, guestId: string) => void;
  updateGuestRsvp: (partyId: string, guestId: string, updates: { rsvpStatus: DinnerGuest['rsvpStatus']; dietaryRestrictions?: string[]; allergens?: string[]; notes?: string }) => void;
  getDinnerPartyForDate: (date: string) => DinnerParty | undefined;
  getActiveDinnerParty: () => DinnerParty | null;
  startDinnerPartyCooking: (partyId: string) => void;
  completeDinnerParty: (partyId: string) => void;
  checkDietaryConflicts: (partyId: string) => DietaryConflict[];
  getGuestCount: (partyId: string) => { total: number; accepted: number; maybe: number; declined: number; pending: number };

  // Kitchen check
  kitchenChecks: boolean[];
  setKitchenChecks: (checks: boolean[]) => void;

  // Dinner plan
  pendingDinnerPlan: DinnerPlan | null;
  activeDinnerPlan: DinnerPlan | null;
  currentDinnerEventIndex: number;
  createDinnerPlan: (recipes: Recipe[], targetTime: Date, servings: number) => void;
  startDinnerPlan: () => void;
  advanceDinnerStep: () => void;
  completeDinnerPlan: () => void;
  setPendingDinnerPlan: (plan: DinnerPlan | null) => void;
}

// ═══════════════════════════════════════════
// STORAGE KEYS
// ═══════════════════════════════════════════

const KEYS = {
  itinerary: '@fork_compass_itinerary',
  grocery: '@fork_compass_grocery',
  cookSession: '@fork_compass_cook_session',
  preferences: '@fork_compass_preferences',
  history: '@fork_compass_history',
  dinnerPlan: '@fork_compass_dinner_plan',
  dinnerParties: '@fork_compass_dinner_parties',
  kitchenCheck: '@fork_compass_kitchen_check',
};

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function categorizeIngredient(name: string): GroceryItem['category'] {
  const n = name.toLowerCase();
  if (/chicken|beef|lamb|fish|shrimp|pork|salmon|tofu/.test(n)) return 'protein';
  if (/tomato|onion|garlic|pepper|lettuce|basil|lemon|carrot|potato|mushroom|avocado|cilantro|ginger/.test(n)) return 'produce';
  if (/milk|cheese|butter|cream|yogurt|egg/.test(n)) return 'dairy';
  if (/cumin|paprika|cinnamon|saffron|turmeric|oregano|thyme|salt|pepper|chili/.test(n)) return 'spice';
  return 'pantry';
}

function ingredientStableId(name: string): string {
  return 'ingredient-' + name.toLowerCase().trim();
}

function parseAmountParts(amount: string): { qty: number; unit: string } | null {
  const match = amount.trim().match(/^([\d./]+)\s*(.*)/);
  if (!match) return null;
  const fracMatch = match[1].match(/^(\d+)\/(\d+)$/);
  const qty = fracMatch
    ? parseInt(fracMatch[1], 10) / parseInt(fracMatch[2], 10)
    : parseFloat(match[1]);
  if (isNaN(qty)) return null;
  return { qty, unit: match[2].trim().toLowerCase() };
}

function normalizeUnit(u: string): string {
  const map: Record<string, string> = {
    g: 'g', gram: 'g', grams: 'g',
    kg: 'kg', kilogram: 'kg', kilograms: 'kg',
    ml: 'ml', milliliter: 'ml', milliliters: 'ml',
    l: 'l', liter: 'l', liters: 'l',
    cup: 'cup', cups: 'cup',
    tbsp: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp',
    tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp',
    oz: 'oz', ounce: 'oz', ounces: 'oz',
    lb: 'lb', lbs: 'lb', pound: 'lb', pounds: 'lb',
    piece: 'piece', pieces: 'piece',
    clove: 'clove', cloves: 'clove',
    bunch: 'bunch', bunches: 'bunch',
    sprig: 'sprig', sprigs: 'sprig',
    slice: 'slice', slices: 'slice',
    can: 'can', cans: 'can',
  };
  return map[u] ?? u;
}

function formatQty(n: number): string {
  const r = Math.round(n * 10) / 10;
  return r === Math.floor(r) ? String(Math.floor(r)) : r.toFixed(1);
}

function aggregateAmounts(existingAmount: string, newAmount: string): string {
  const a = parseAmountParts(existingAmount);
  const b = parseAmountParts(newAmount);
  if (!a || !b) return existingAmount + ', ' + newAmount;
  const uA = normalizeUnit(a.unit);
  const uB = normalizeUnit(b.unit);
  if (uA === uB) {
    const displayUnit = a.unit || b.unit;
    return `${formatQty(a.qty + b.qty)}${displayUnit ? (displayUnit.match(/^[a-zA-Z]/) ? ' ' : '') + displayUnit : ''}`;
  }
  if ((uA === 'g' && uB === 'kg') || (uA === 'kg' && uB === 'g')) {
    const totalG = (uA === 'kg' ? a.qty * 1000 : a.qty) + (uB === 'kg' ? b.qty * 1000 : b.qty);
    return totalG >= 1000 ? `${formatQty(totalG / 1000)}kg` : `${formatQty(totalG)}g`;
  }
  if ((uA === 'ml' && uB === 'l') || (uA === 'l' && uB === 'ml')) {
    const totalMl = (uA === 'l' ? a.qty * 1000 : a.qty) + (uB === 'l' ? b.qty * 1000 : b.qty);
    return totalMl >= 1000 ? `${formatQty(totalMl / 1000)}l` : `${formatQty(totalMl)}ml`;
  }
  return existingAmount + ', ' + newAmount;
}

function recipeToPlannedMeal(recipe: Recipe): PlannedMeal {
  const country = countries.find((c) => c.id === recipe.countryId);
  return {
    recipeId: recipe.id,
    recipeName: recipe.title,
    recipeImage: recipe.image,
    countryFlag: country?.flag ?? '',
    cookTime: recipe.cookTime,
    addedAt: new Date().toISOString(),
  };
}

function makeEmptyDay(date: string): ItineraryDay {
  return {
    date,
    dayLabel: getDayLabelFull(date),
    courses: {},
    hasDinnerParty: false,
  };
}

// ═══════════════════════════════════════════
// DEFAULT VALUES
// ═══════════════════════════════════════════

const defaultPreferences = {
  cookingLevel: 'home_cook' as CookingLevel,
  coursePreference: 'main' as CoursePreference,
  groceryPartner: 'instacart' as GroceryPartner,
  zipCode: '',
  useMetric: true,
  dietaryFlags: [] as string[],
  allergens: [] as string[],
  hasCompletedOnboarding: false,
  displayName: '',
  avatarId: 'chef',
};

const defaultHistory = {
  totalRecipesCooked: 0,
  xp: 0,
  level: 1,
  passportStamps: {} as Record<string, number>,
};

// ═══════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════

const AppContext = createContext<AppContextValue | null>(null);

// ═══════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════

export function AppProvider({ children }: { children: React.ReactNode }) {
  // State
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [activeCookSession, setActiveCookSession] = useState<CookSession | null>(null);
  const [cookingLevel, setCookingLevelState] = useState<CookingLevel>(defaultPreferences.cookingLevel);
  const [coursePreference, setCoursePreferenceState] = useState<CoursePreference>(defaultPreferences.coursePreference);
  const [groceryPartner, setGroceryPartnerState] = useState<GroceryPartner>(defaultPreferences.groceryPartner);
  const [zipCode, setZipCodeState] = useState(defaultPreferences.zipCode);
  const [useMetric, setUseMetricState] = useState(defaultPreferences.useMetric);
  const [dietaryFlags, setDietaryFlagsState] = useState<string[]>(defaultPreferences.dietaryFlags);
  const [allergens, setAllergensState] = useState<string[]>(defaultPreferences.allergens);
  const [hasCompletedOnboarding, setHasCompletedOnboardingState] = useState(defaultPreferences.hasCompletedOnboarding);
  const [displayName, setDisplayNameState] = useState(defaultPreferences.displayName);
  const [avatarId, setAvatarIdState] = useState(defaultPreferences.avatarId);
  const [totalRecipesCooked, setTotalRecipesCooked] = useState(defaultHistory.totalRecipesCooked);
  const [xp, setXp] = useState(defaultHistory.xp);
  const [level, setLevel] = useState(defaultHistory.level);
  const [passportStamps, setPassportStamps] = useState<Record<string, number>>(defaultHistory.passportStamps);
  const [kitchenChecks, setKitchenChecksState] = useState<boolean[]>([false, false, false]);
  const [pendingDinnerPlan, setPendingDinnerPlan] = useState<DinnerPlan | null>(null);
  const [dinnerParties, setDinnerParties] = useState<DinnerParty[]>([]);
  const [activeDinnerParty, setActiveDinnerParty] = useState<DinnerParty | null>(null);
  const [activeDinnerPlan, setActiveDinnerPlan] = useState<DinnerPlan | null>(null);
  const [currentDinnerEventIndex, setCurrentDinnerEventIndex] = useState(0);

  const [isHydrated, setIsHydrated] = useState(false);
  const hydrated = useRef(false);

  // ─── Hydrate on mount ───

  useEffect(() => {
    (async () => {
      const [it, gr, cs, pr, hi, dp] = await Promise.all([
        Storage.get<ItineraryDay[]>(KEYS.itinerary, []),
        Storage.get<GroceryItem[]>(KEYS.grocery, []),
        Storage.get<CookSession | null>(KEYS.cookSession, null),
        Storage.get(KEYS.preferences, defaultPreferences),
        Storage.get(KEYS.history, defaultHistory),
        Storage.get<{ plan: DinnerPlan | null; eventIndex: number }>(KEYS.dinnerPlan, { plan: null, eventIndex: 0 }),
      ]);
      // Clean up itinerary entries older than 28 days
      const cutoff = addDaysLocal(todayLocal(), -28);
      const cleanedItinerary = it.filter((d: ItineraryDay) => d.date >= cutoff);
      setItinerary(cleanedItinerary);
      setGroceryItems(gr);
      setActiveCookSession(cs);
      if (dp.plan) {
        setActiveDinnerPlan(dp.plan);
        setCurrentDinnerEventIndex(dp.eventIndex);
      }
      const parties = await Storage.get<DinnerParty[]>(KEYS.dinnerParties, []);
      setDinnerParties(parties);
      const kc = await Storage.get<boolean[]>(KEYS.kitchenCheck, [false, false, false]);
      setKitchenChecksState(kc);
      const activeParty = parties.find((p) => p.status === 'cooking') ?? null;
      setActiveDinnerParty(activeParty);
      if (pr.cookingLevel) setCookingLevelState(pr.cookingLevel);
      if (pr.coursePreference) setCoursePreferenceState(pr.coursePreference);
      if (pr.groceryPartner) setGroceryPartnerState(pr.groceryPartner);
      if (pr.zipCode != null) setZipCodeState(pr.zipCode);
      if (pr.useMetric != null) setUseMetricState(pr.useMetric);
      if (pr.dietaryFlags) setDietaryFlagsState(pr.dietaryFlags);
      if (pr.allergens) setAllergensState(pr.allergens);
      if (pr.hasCompletedOnboarding != null) setHasCompletedOnboardingState(pr.hasCompletedOnboarding);
      if (pr.displayName != null) setDisplayNameState(pr.displayName);
      if (pr.avatarId) setAvatarIdState(pr.avatarId);
      if (hi.totalRecipesCooked != null) setTotalRecipesCooked(hi.totalRecipesCooked);
      if (hi.xp != null) setXp(hi.xp);
      if (hi.level != null) setLevel(hi.level);
      if (hi.passportStamps) setPassportStamps(hi.passportStamps);
      hydrated.current = true;
      setIsHydrated(true);
    })();
  }, []);

  // ─── Persist on change (skip initial hydration) ───

  useEffect(() => {
    if (hydrated.current) Storage.set(KEYS.itinerary, itinerary);
  }, [itinerary]);

  useEffect(() => {
    if (hydrated.current) Storage.set(KEYS.grocery, groceryItems);
  }, [groceryItems]);

  useEffect(() => {
    if (hydrated.current) Storage.set(KEYS.cookSession, activeCookSession);
  }, [activeCookSession]);

  useEffect(() => {
    if (hydrated.current)
      Storage.set(KEYS.preferences, { cookingLevel, coursePreference, groceryPartner, zipCode, useMetric, dietaryFlags, allergens, hasCompletedOnboarding, displayName, avatarId });
  }, [cookingLevel, coursePreference, groceryPartner, zipCode, useMetric, dietaryFlags, allergens, hasCompletedOnboarding, displayName, avatarId]);

  useEffect(() => {
    if (hydrated.current)
      Storage.set(KEYS.history, { totalRecipesCooked, xp, level, passportStamps });
  }, [totalRecipesCooked, xp, level, passportStamps]);

  useEffect(() => {
    if (hydrated.current)
      Storage.set(KEYS.dinnerPlan, { plan: activeDinnerPlan, eventIndex: currentDinnerEventIndex });
  }, [activeDinnerPlan, currentDinnerEventIndex]);

  useEffect(() => {
    if (hydrated.current)
      Storage.set(KEYS.dinnerParties, dinnerParties);
  }, [dinnerParties]);

  useEffect(() => {
    if (hydrated.current)
      Storage.set(KEYS.kitchenCheck, kitchenChecks);
  }, [kitchenChecks]);

  // ═══════════════════════════════════════════
  // GROCERY ACTIONS (defined first, used by itinerary)
  // ═══════════════════════════════════════════

  const addToGrocery = useCallback((recipe: Recipe) => {
    setGroceryItems((prev) => {
      const next = [...prev];
      for (const ing of recipe.ingredients) {
        const sid = ingredientStableId(ing.name);
        const existing = next.find((g) => g.id === sid);
        if (existing) {
          if (!existing.recipeNames.includes(recipe.title)) {
            existing.recipeNames = [...existing.recipeNames, recipe.title];
          }
          const newSources = { ...existing.sourceAmounts, [recipe.title]: ing.amount };
          existing.sourceAmounts = newSources;
          const allAmounts = Object.values(newSources);
          existing.amount = allAmounts.length > 1
            ? allAmounts.reduce((a, b) => aggregateAmounts(a, b))
            : allAmounts[0];
        } else {
          next.push({
            id: sid,
            name: ing.name,
            amount: ing.amount,
            unit: '',
            category: categorizeIngredient(ing.name),
            recipeNames: [recipe.title],
            sourceAmounts: { [recipe.title]: ing.amount },
            checked: false,
            excluded: false,
          });
        }
      }
      return next;
    });
  }, []);

  const addManualGroceryItem = useCallback((name: string, category?: GroceryItem['category']) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setGroceryItems((prev) => {
      const sid = 'manual-' + trimmed.toLowerCase();
      if (prev.some((g) => g.id === sid)) return prev;
      return [
        ...prev,
        {
          id: sid,
          name: trimmed,
          amount: '',
          unit: '',
          category: category ?? categorizeIngredient(trimmed),
          recipeNames: [],
          sourceAmounts: {},
          checked: false,
          excluded: false,
        },
      ];
    });
  }, []);

  const removeGroceryItem = useCallback((id: string) => {
    setGroceryItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const removeGroceryItemsByRecipe = useCallback((recipeName: string) => {
    setGroceryItems((prev) =>
      prev
        .map((item) => {
          if (!item.recipeNames.includes(recipeName)) return item;
          const newRecipeNames = item.recipeNames.filter((n) => n !== recipeName);
          const newSources = { ...(item.sourceAmounts ?? {}) };
          delete newSources[recipeName];
          const allAmounts = Object.values(newSources);
          const newAmount = allAmounts.length > 1
            ? allAmounts.reduce((a, b) => aggregateAmounts(a, b))
            : allAmounts.length === 1
              ? allAmounts[0]
              : '';
          return { ...item, recipeNames: newRecipeNames, sourceAmounts: newSources, amount: newAmount };
        })
        .filter((item) => item.recipeNames.length > 0 || item.id.startsWith('manual-'))
    );
  }, []);

  const toggleGroceryItem = useCallback((id: string) => {
    setGroceryItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  }, []);

  const clearCheckedItems = useCallback(() => {
    setGroceryItems((prev) => prev.filter((item) => !item.checked));
  }, []);

  const clearAllGroceryItems = useCallback(() => {
    setGroceryItems([]);
  }, []);

  const getUncheckedCount = useCallback(
    () => groceryItems.filter((i) => !i.checked && !i.excluded).length,
    [groceryItems]
  );

  // ═══════════════════════════════════════════
  // ITINERARY ACTIONS
  // ═══════════════════════════════════════════

  const findOrCreateDay = useCallback(
    (days: ItineraryDay[], date: string): [ItineraryDay[], ItineraryDay] => {
      const existing = days.find((d) => d.date === date);
      if (existing) return [days, existing];
      const newDay = makeEmptyDay(date);
      return [[...days, newDay], newDay];
    },
    []
  );

  const addCourseToDay = useCallback(
    (date: string, courseType: CourseType, recipe: Recipe) => {
      const meal = recipeToPlannedMeal(recipe);
      setItinerary((prev) => {
        const [days, day] = findOrCreateDay(prev, date);
        const updated = days.map((d) =>
          d.date === day.date
            ? { ...d, courses: { ...d.courses, [courseType]: meal } }
            : d
        );
        return updated;
      });
      addToGrocery(recipe);
    },
    [findOrCreateDay, addToGrocery]
  );

  const removeCourseFromDay = useCallback(
    (date: string, courseType: CourseType) => {
      setItinerary((prev) => {
        const day = prev.find((d) => d.date === date);
        const meal = day?.courses[courseType];
        if (meal) removeGroceryItemsByRecipe(meal.recipeName);
        return prev.map((d) => {
          if (d.date !== date) return d;
          const courses = { ...d.courses };
          delete courses[courseType];
          return { ...d, courses };
        });
      });
    },
    [removeGroceryItemsByRecipe]
  );

  const removeRecipeFromPlanByName = useCallback(
    (recipeName: string) => {
      setItinerary((prev) =>
        prev.map((day) => {
          const courses = { ...day.courses };
          let changed = false;
          for (const key of Object.keys(courses) as CourseType[]) {
            if (courses[key]?.recipeName === recipeName) {
              delete courses[key];
              changed = true;
            }
          }
          return changed ? { ...day, courses } : day;
        })
      );
    },
    []
  );

  const toggleDinnerParty = useCallback((date: string) => {
    setItinerary((prev) =>
      prev.map((d) =>
        d.date === date ? { ...d, hasDinnerParty: !d.hasDinnerParty } : d
      )
    );
  }, []);

  const autoGenerateWeek = useCallback(
    (selectedDates: string[], pref: CoursePreference) => {
      const allRecipes: Recipe[] = require('@/data/recipes').recipes;

      // ── Dietary filtering ──
      const MEAT_TERMS = ['chicken', 'beef', 'pork', 'lamb', 'duck', 'veal', 'bacon', 'prosciutto', 'pancetta', 'sausage', 'steak', 'meatball', 'ground meat', 'chorizo', 'ham', 'turkey', 'oxtail', 'bone marrow', 'lard'];
      const FISH_TERMS = ['fish', 'salmon', 'tuna', 'shrimp', 'prawn', 'crab', 'lobster', 'squid', 'calamari', 'clam', 'mussel', 'oyster', 'anchovy', 'sardine', 'cod', 'sea bass', 'mahi', 'scallop', 'octopus', 'bonito', 'dashi'];
      const DAIRY_TERMS = ['cheese', 'cream', 'butter', 'milk', 'yogurt', 'ghee', 'paneer', 'mascarpone', 'ricotta', 'mozzarella', 'parmesan', 'pecorino', 'gruyère', 'crème'];
      const EGG_TERMS = ['egg'];
      const GLUTEN_TERMS = ['flour', 'pasta', 'bread', 'noodle', 'spaghetti', 'tonnarelli', 'udon', 'ramen', 'puff pastry', 'croissant', 'baguette', 'tortilla', 'pita', 'naan', 'crêpe', 'panko', 'breadcrumb', 'couscous', 'soy sauce'];
      const NUT_TERMS = ['peanut', 'almond', 'cashew', 'walnut', 'pistachio', 'hazelnut', 'pine nut', 'coconut'];
      const PORK_TERMS = ['pork', 'bacon', 'prosciutto', 'pancetta', 'ham', 'lard', 'chorizo', 'sausage'];

      const hasIngredient = (recipe: Recipe, terms: string[]): boolean =>
        recipe.ingredients.some((ing) => {
          const n = ing.name.toLowerCase();
          return terms.some((t) => n.includes(t));
        });

      const isCompatible = (recipe: Recipe): boolean => {
        for (const flag of dietaryFlags) {
          switch (flag) {
            case 'vegetarian':
              if (hasIngredient(recipe, [...MEAT_TERMS, ...FISH_TERMS])) return false;
              break;
            case 'vegan':
              if (hasIngredient(recipe, [...MEAT_TERMS, ...FISH_TERMS, ...DAIRY_TERMS, ...EGG_TERMS])) return false;
              break;
            case 'gluten-free':
              if (hasIngredient(recipe, GLUTEN_TERMS)) return false;
              break;
            case 'dairy-free':
              if (hasIngredient(recipe, DAIRY_TERMS)) return false;
              break;
            case 'nut-free':
              if (hasIngredient(recipe, NUT_TERMS)) return false;
              break;
            case 'halal':
              if (hasIngredient(recipe, PORK_TERMS)) return false;
              break;
          }
        }
        return true;
      };

      const dietaryFiltered = allRecipes.filter(isCompatible);

      // All difficulty levels available to all users
      const afterLevelFilter = dietaryFiltered;

      // ── Recency filtering (avoid recipes from current + previous 2 weeks) ──
      const recentRecipeIds = new Set<string>();
      itinerary.forEach((day) => {
        if (day.courses.main) recentRecipeIds.add(day.courses.main.recipeId);
        if (day.courses.appetizer) recentRecipeIds.add(day.courses.appetizer.recipeId);
        if (day.courses.dessert) recentRecipeIds.add(day.courses.dessert.recipeId);
      });
      const afterRecencyFilter = afterLevelFilter.filter((r) => !recentRecipeIds.has(r.id));
      // Fallback: if too few recipes, use pre-recency pool
      // Skip past dates — only generate for today and future
      const today = todayLocal();
      const futureDates = selectedDates.filter(d => d >= today);

      const eligible = afterRecencyFilter.length >= futureDates.length ? afterRecencyFilter : afterLevelFilter;

      const shuffled = [...eligible].sort(() => Math.random() - 0.5);
      const usedIds = new Set<string>();
      const usedCountries = new Set<string>();

      const pickRecipe = (cat?: 'appetizer' | 'main' | 'dessert'): Recipe | undefined => {
        for (const r of shuffled) {
          if (usedIds.has(r.id)) continue;
          if (cat && r.category !== cat) continue;
          if (!usedCountries.has(r.countryId) || usedIds.size > shuffled.length / 2) {
            usedIds.add(r.id);
            usedCountries.add(r.countryId);
            return r;
          }
        }
        for (const r of shuffled) {
          if (usedIds.has(r.id)) continue;
          if (cat && r.category !== cat) continue;
          usedIds.add(r.id);
          return r;
        }
        return undefined;
      };

      setItinerary((prev) => {
        let days = [...prev];
        for (const date of futureDates) {
          const [updated, day] = findOrCreateDay(days, date);
          days = updated;

          const mainRecipe = pickRecipe('main');
          if (mainRecipe) {
            const meal = recipeToPlannedMeal(mainRecipe);
            days = days.map((d) =>
              d.date === day.date
                ? { ...d, courses: { ...d.courses, main: meal } }
                : d
            );
            addToGrocery(mainRecipe);
          }

          if (pref === 'full') {
            const appRecipe = pickRecipe('appetizer');
            if (appRecipe) {
              const meal = recipeToPlannedMeal(appRecipe);
              days = days.map((d) =>
                d.date === day.date
                  ? { ...d, courses: { ...d.courses, appetizer: meal } }
                  : d
              );
              addToGrocery(appRecipe);
            }
            const dessRecipe = pickRecipe('dessert');
            if (dessRecipe) {
              const meal = recipeToPlannedMeal(dessRecipe);
              days = days.map((d) =>
                d.date === day.date
                  ? { ...d, courses: { ...d.courses, dessert: meal } }
                  : d
              );
              addToGrocery(dessRecipe);
            }
          }
        }
        return days;
      });
    },
    [findOrCreateDay, addToGrocery, dietaryFlags, itinerary]
  );

  const restoreItinerary = useCallback((snapshot: ItineraryDay[]) => {
    setItinerary(snapshot);
  }, []);

  const restoreGrocery = useCallback((snapshot: GroceryItem[]) => {
    setGroceryItems(snapshot);
  }, []);

  const clearDay = useCallback(
    (date: string) => {
      setItinerary((prev) => {
        const day = prev.find((d) => d.date === date);
        if (day) {
          for (const meal of Object.values(day.courses)) {
            if (meal) removeGroceryItemsByRecipe(meal.recipeName);
          }
        }
        return prev.map((d) =>
          d.date === date ? { ...d, courses: {}, hasDinnerParty: false } : d
        );
      });
    },
    [removeGroceryItemsByRecipe]
  );

  const getWeek = useCallback(
    (startDate: string): ItineraryDay[] => {
      const week: ItineraryDay[] = [];
      for (let i = 0; i < 7; i++) {
        const date = addDaysLocal(startDate, i);
        const existing = itinerary.find((d) => d.date === date);
        week.push(existing ?? makeEmptyDay(date));
      }
      return week;
    },
    [itinerary]
  );

  const getTodaysMeals = useCallback((): PlannedMeal[] => {
    const today = todayLocal();
    const day = itinerary.find((d) => d.date === today);
    if (!day) return [];
    return Object.values(day.courses).filter((m): m is PlannedMeal => m != null);
  }, [itinerary]);

  // ═══════════════════════════════════════════
  // COOK SESSION ACTIONS
  // ═══════════════════════════════════════════

  const completeCookSessionInternal = useCallback(() => {
    // Use functional setState to avoid stale closure over activeCookSession
    setActiveCookSession((prev) => {
      if (prev) {
        setTotalRecipesCooked((c) => c + 1);
        setXp((prevXp) => {
          const newXp = prevXp + 50;
          setLevel(Math.floor(newXp / 300) + 1);
          return newXp;
        });
        const allRecipes: Recipe[] = require('@/data/recipes').recipes;
        const recipe = allRecipes.find((r) => r.id === prev.recipeId);
        if (recipe) {
          setPassportStamps((s) => ({
            ...s,
            [recipe.countryId]: (s[recipe.countryId] ?? 0) + 1,
          }));
        }
      }
      return null;
    });
  }, []);

  const startCookSession = useCallback((recipe: Recipe, servings: number) => {
    // If a session exists, complete it first (awards XP) via functional check
    setActiveCookSession((prev) => {
      if (prev) {
        setTotalRecipesCooked((c) => c + 1);
        setXp((prevXp) => {
          const newXp = prevXp + 50;
          setLevel(Math.floor(newXp / 300) + 1);
          return newXp;
        });
        const allRecipes: Recipe[] = require('@/data/recipes').recipes;
        const oldRecipe = allRecipes.find((r) => r.id === prev.recipeId);
        if (oldRecipe) {
          setPassportStamps((s) => ({
            ...s,
            [oldRecipe.countryId]: (s[oldRecipe.countryId] ?? 0) + 1,
          }));
        }
      }
      // Return the new session
      return {
        id: generateId(),
        recipeId: recipe.id,
        recipeName: recipe.title,
        totalSteps: recipe.steps.length,
        currentStepIndex: 0,
        completedSteps: [],
        servings,
        startedAt: new Date().toISOString(),
        activeTimerStart: null,
        activeTimerDuration: null,
        status: 'active' as const,
      };
    });
  }, []);

  const advanceStepRef = useRef(false);

  const advanceStep = useCallback(() => {
    setActiveCookSession((prev) => {
      if (!prev) return null;
      const nextIndex = prev.currentStepIndex + 1;
      const completed = [...prev.completedSteps, String(prev.currentStepIndex)];
      if (nextIndex >= prev.totalSteps) {
        // Mark for completion — handled in useEffect below
        advanceStepRef.current = true;
        return { ...prev, completedSteps: completed, currentStepIndex: nextIndex };
      }
      return {
        ...prev,
        currentStepIndex: nextIndex,
        completedSteps: completed,
        activeTimerStart: null,
        activeTimerDuration: null,
      };
    });
  }, []);

  // Complete session when advanceStep sets the flag
  useEffect(() => {
    if (advanceStepRef.current && activeCookSession && activeCookSession.currentStepIndex >= activeCookSession.totalSteps) {
      advanceStepRef.current = false;
      completeCookSessionInternal();
    }
  }, [activeCookSession, completeCookSessionInternal]);

  const previousStep = useCallback(() => {
    setActiveCookSession((prev) => {
      if (!prev || prev.currentStepIndex <= 0) return prev;
      return {
        ...prev,
        currentStepIndex: prev.currentStepIndex - 1,
        activeTimerStart: null,
        activeTimerDuration: null,
      };
    });
  }, []);

  const startStepTimer = useCallback((durationSeconds: number) => {
    setActiveCookSession((prev) =>
      prev
        ? {
            ...prev,
            activeTimerStart: new Date().toISOString(),
            activeTimerDuration: durationSeconds,
          }
        : null
    );
  }, []);

  const clearStepTimer = useCallback(() => {
    setActiveCookSession((prev) =>
      prev
        ? { ...prev, activeTimerStart: null, activeTimerDuration: null }
        : null
    );
  }, []);

  const completeCookSession = completeCookSessionInternal;

  const resumeCookSession = useCallback((): CookSession | null => {
    return activeCookSession;
  }, [activeCookSession]);

  // ═══════════════════════════════════════════
  // PREFERENCE ACTIONS
  // ═══════════════════════════════════════════

  const setCookingLevel = useCallback((l: CookingLevel) => setCookingLevelState(l), []);
  const setCoursePreference = useCallback((p: CoursePreference) => setCoursePreferenceState(p), []);
  const setGroceryPartner = useCallback((p: GroceryPartner) => setGroceryPartnerState(p), []);
  const setZipCode = useCallback((z: string) => setZipCodeState(z), []);
  const setUseMetric = useCallback((m: boolean) => setUseMetricState(m), []);
  const setDietaryFlags = useCallback((f: string[]) => setDietaryFlagsState(f), []);
  const setAllergens = useCallback((a: string[]) => setAllergensState(a), []);
  const setHasCompletedOnboarding = useCallback((v: boolean) => setHasCompletedOnboardingState(v), []);
  const setDisplayName = useCallback((name: string) => setDisplayNameState(name), []);
  const setAvatarId = useCallback((id: string) => setAvatarIdState(id), []);
  const setKitchenChecks = useCallback((c: boolean[]) => setKitchenChecksState(c), []);

  // ═══════════════════════════════════════════
  // HISTORY / XP ACTIONS
  // ═══════════════════════════════════════════

  const awardXP = useCallback((amount: number) => {
    setXp((prev) => {
      const newXp = prev + amount;
      setLevel(Math.floor(newXp / 300) + 1);
      return newXp;
    });
  }, []);

  const addPassportStamp = useCallback((countryId: string) => {
    setPassportStamps((prev) => ({
      ...prev,
      [countryId]: (prev[countryId] ?? 0) + 1,
    }));
  }, []);

  const getCookingLevelName = useCallback((): string => {
    if (level <= 3) return 'First Steps';
    if (level <= 7) return 'Home Cook';
    return "Chef's Table";
  }, [level]);

  // ═══════════════════════════════════════════
  // DINNER PLAN ACTIONS
  // ═══════════════════════════════════════════

  const createDinnerPlan = useCallback((dinnerRecipes: Recipe[], targetTime: Date, servings: number) => {
    const plan = buildDinnerTimeline(dinnerRecipes, targetTime, { mode: 'solo', servings });
    setPendingDinnerPlan(plan);
  }, []);

  const startDinnerPlan = useCallback(() => {
    if (pendingDinnerPlan) {
      setActiveDinnerPlan({ ...pendingDinnerPlan, status: 'active' });
      setCurrentDinnerEventIndex(0);
      setPendingDinnerPlan(null);
    }
  }, [pendingDinnerPlan]);

  const advanceDinnerStep = useCallback(() => {
    if (!activeDinnerPlan) return;
    const nextIndex = currentDinnerEventIndex + 1;
    if (nextIndex >= activeDinnerPlan.events.length) {
      // Plan complete — will be handled by completeDinnerPlan
      setCurrentDinnerEventIndex(nextIndex);
    } else {
      setCurrentDinnerEventIndex(nextIndex);
    }
  }, [activeDinnerPlan, currentDinnerEventIndex]);

  const completeDinnerPlan = useCallback(() => {
    if (!activeDinnerPlan) return;
    // Award XP and stamps for each recipe in the plan
    const recipeCount = activeDinnerPlan.recipes.length;
    setTotalRecipesCooked((prev) => prev + recipeCount);
    setXp((prevXp) => {
      const newXp = prevXp + (50 * recipeCount);
      setLevel(Math.floor(newXp / 300) + 1);
      return newXp;
    });
    for (const r of activeDinnerPlan.recipes) {
      setPassportStamps((prev) => ({
        ...prev,
        [r.countryId]: (prev[r.countryId] ?? 0) + 1,
      }));
    }
    setActiveDinnerPlan(null);
    setCurrentDinnerEventIndex(0);
  }, [activeDinnerPlan]);

  // ═══════════════════════════════════════════
  // DINNER PARTY ACTIONS
  // ═══════════════════════════════════════════

  const RESTRICTION_CONFLICTS: Record<string, string[]> = {
    vegetarian: ['chicken', 'beef', 'lamb', 'pork', 'fish', 'shrimp', 'bacon', 'anchovy', 'gelatin', 'salmon'],
    vegan: ['chicken', 'beef', 'lamb', 'pork', 'fish', 'shrimp', 'bacon', 'anchovy', 'gelatin', 'salmon', 'dairy', 'egg', 'butter', 'cream', 'cheese', 'honey', 'milk', 'yogurt'],
    'gluten-free': ['flour', 'bread', 'pasta', 'soy sauce', 'breadcrumbs', 'couscous'],
    'nut-free': ['almond', 'walnut', 'pecan', 'cashew', 'pistachio', 'pine nut', 'hazelnut', 'macadamia', 'peanut'],
    'dairy-free': ['milk', 'butter', 'cream', 'cheese', 'yogurt', 'whey'],
  };

  const createDinnerPartyAction = useCallback((params: { date: string; title: string; targetServingTime: string; cuisineCountryId: string }): DinnerParty => {
    const dayItinerary = itinerary.find((d) => d.date === params.date);
    const menu: DinnerPartyMenu = {};
    if (dayItinerary?.courses.appetizer) {
      menu.appetizer = { recipeId: dayItinerary.courses.appetizer.recipeId, recipeName: dayItinerary.courses.appetizer.recipeName, recipeImage: dayItinerary.courses.appetizer.recipeImage };
    }
    if (dayItinerary?.courses.main) {
      menu.main = { recipeId: dayItinerary.courses.main.recipeId, recipeName: dayItinerary.courses.main.recipeName, recipeImage: dayItinerary.courses.main.recipeImage };
    }
    if (dayItinerary?.courses.dessert) {
      menu.dessert = { recipeId: dayItinerary.courses.dessert.recipeId, recipeName: dayItinerary.courses.dessert.recipeName, recipeImage: dayItinerary.courses.dessert.recipeImage };
    }
    const party: DinnerParty = {
      id: generateId(),
      ...params,
      hostName: '',
      status: 'planning',
      createdAt: new Date().toISOString(),
      menu,
      guests: [],
    };
    setDinnerParties((prev) => [...prev, party]);
    return party;
  }, [itinerary]);

  const updateDinnerPartyAction = useCallback((partyId: string, updates: Partial<DinnerParty>) => {
    setDinnerParties((prev) => prev.map((p) => p.id === partyId ? { ...p, ...updates } : p));
  }, []);

  const cancelDinnerPartyAction = useCallback((partyId: string) => {
    setDinnerParties((prev) => prev.map((p) => p.id === partyId ? { ...p, status: 'cancelled' as const } : p));
    setActiveDinnerParty((prev) => prev?.id === partyId ? null : prev);
  }, []);

  const addGuestAction = useCallback((partyId: string, guest: Omit<DinnerGuest, 'id' | 'rsvpStatus'>) => {
    const newGuest: DinnerGuest = { ...guest, id: generateId(), rsvpStatus: 'pending' };
    setDinnerParties((prev) => prev.map((p) => p.id === partyId ? { ...p, guests: [...p.guests, newGuest] } : p));
  }, []);

  const removeGuestAction = useCallback((partyId: string, guestId: string) => {
    setDinnerParties((prev) => prev.map((p) => p.id === partyId ? { ...p, guests: p.guests.filter((g) => g.id !== guestId) } : p));
  }, []);

  const updateGuestRsvpAction = useCallback((partyId: string, guestId: string, updates: { rsvpStatus: DinnerGuest['rsvpStatus']; dietaryRestrictions?: string[]; allergens?: string[]; notes?: string }) => {
    setDinnerParties((prev) => prev.map((p) => {
      if (p.id !== partyId) return p;
      return { ...p, guests: p.guests.map((g) => g.id === guestId ? { ...g, ...updates, rsvpRespondedAt: new Date().toISOString() } : g) };
    }));
  }, []);

  const getDinnerPartyForDateAction = useCallback((date: string): DinnerParty | undefined => {
    return dinnerParties.find((p) => p.date === date && p.status !== 'cancelled');
  }, [dinnerParties]);

  const getActiveDinnerPartyAction = useCallback((): DinnerParty | null => {
    return activeDinnerParty;
  }, [activeDinnerParty]);

  const startDinnerPartyCookingAction = useCallback((partyId: string) => {
    setDinnerParties((prev) => prev.map((p) => p.id === partyId ? { ...p, status: 'cooking' as const } : p));
    const party = dinnerParties.find((p) => p.id === partyId);
    if (party) setActiveDinnerParty({ ...party, status: 'cooking' });
  }, [dinnerParties]);

  const completeDinnerPartyAction = useCallback((partyId: string) => {
    setDinnerParties((prev) => prev.map((p) => p.id === partyId ? { ...p, status: 'completed' as const } : p));
    setActiveDinnerParty(null);
    // Award 100 XP for hosting
    setXp((prevXp) => {
      const newXp = prevXp + 100;
      setLevel(Math.floor(newXp / 300) + 1);
      return newXp;
    });
    const party = dinnerParties.find((p) => p.id === partyId);
    if (party) {
      setTotalRecipesCooked((prev) => prev + Object.values(party.menu).filter(Boolean).length);
      if (party.cuisineCountryId) {
        setPassportStamps((prev) => ({ ...prev, [party.cuisineCountryId]: (prev[party.cuisineCountryId] ?? 0) + 1 }));
      }
    }
  }, [dinnerParties]);

  const checkDietaryConflictsAction = useCallback((partyId: string): DietaryConflict[] => {
    const party = dinnerParties.find((p) => p.id === partyId);
    if (!party) return [];
    const conflicts: DietaryConflict[] = [];
    const allRecipeData = require('@/data/recipes').recipes as Recipe[];
    const menuRecipes = [party.menu.appetizer, party.menu.main, party.menu.dessert]
      .filter(Boolean)
      .map((m) => ({ meta: m!, recipe: allRecipeData.find((r) => r.id === m!.recipeId) }))
      .filter((r) => r.recipe);

    for (const guest of party.guests) {
      // Check dietary restrictions
      for (const restriction of guest.dietaryRestrictions) {
        const conflictIngredients = RESTRICTION_CONFLICTS[restriction.toLowerCase()] ?? [];
        for (const { meta, recipe } of menuRecipes) {
          if (!recipe) continue;
          for (const ing of recipe.ingredients) {
            const ingLower = ing.name.toLowerCase();
            if (conflictIngredients.some((c) => ingLower.includes(c))) {
              conflicts.push({
                guestName: guest.name,
                restriction,
                conflictingRecipe: meta.recipeName,
                conflictingIngredient: ing.name,
                severity: 'warning',
              });
            }
          }
        }
      }
      // Check allergens (critical)
      for (const allergen of guest.allergens) {
        const allergenLower = allergen.toLowerCase();
        for (const { meta, recipe } of menuRecipes) {
          if (!recipe) continue;
          for (const ing of recipe.ingredients) {
            if (ing.name.toLowerCase().includes(allergenLower)) {
              conflicts.push({
                guestName: guest.name,
                restriction: `allergy: ${allergen}`,
                conflictingRecipe: meta.recipeName,
                conflictingIngredient: ing.name,
                severity: 'critical',
              });
            }
          }
        }
      }
    }
    return conflicts;
  }, [dinnerParties]);

  const getGuestCountAction = useCallback((partyId: string) => {
    const party = dinnerParties.find((p) => p.id === partyId);
    if (!party) return { total: 0, accepted: 0, maybe: 0, declined: 0, pending: 0 };
    return {
      total: party.guests.length,
      accepted: party.guests.filter((g) => g.rsvpStatus === 'accepted').length,
      maybe: party.guests.filter((g) => g.rsvpStatus === 'maybe').length,
      declined: party.guests.filter((g) => g.rsvpStatus === 'declined').length,
      pending: party.guests.filter((g) => g.rsvpStatus === 'pending').length,
    };
  }, [dinnerParties]);

  // ═══════════════════════════════════════════
  // VALUE
  // ═══════════════════════════════════════════

  const value: AppContextValue = {
    itinerary,
    addCourseToDay,
    removeCourseFromDay,
    removeRecipeFromPlanByName,
    toggleDinnerParty,
    autoGenerateWeek,
    restoreItinerary,
    restoreGrocery,
    clearDay,
    getWeek,
    getTodaysMeals,

    groceryItems,
    addToGrocery,
    addManualGroceryItem,
    removeGroceryItemsByRecipe,
    removeGroceryItem,
    toggleGroceryItem,
    clearCheckedItems,
    clearAllGroceryItems,
    getUncheckedCount,

    activeCookSession,
    startCookSession,
    advanceStep,
    previousStep,
    startStepTimer,
    clearStepTimer,
    completeCookSession,
    resumeCookSession,

    cookingLevel,
    coursePreference,
    groceryPartner,
    useMetric,
    dietaryFlags,
    allergens,
    hasCompletedOnboarding,
    displayName,
    avatarId,
    setCookingLevel,
    setCoursePreference,
    setGroceryPartner,
    zipCode,
    setZipCode,
    setUseMetric,
    setDietaryFlags,
    setAllergens,
    setHasCompletedOnboarding,
    setDisplayName,
    setAvatarId,
    isHydrated,

    totalRecipesCooked,
    xp,
    level,
    passportStamps,
    awardXP,
    addPassportStamp,
    getCookingLevelName,

    kitchenChecks,
    setKitchenChecks,

    dinnerParties,
    activeDinnerParty,
    createDinnerParty: createDinnerPartyAction,
    updateDinnerParty: updateDinnerPartyAction,
    cancelDinnerParty: cancelDinnerPartyAction,
    addGuest: addGuestAction,
    removeGuest: removeGuestAction,
    updateGuestRsvp: updateGuestRsvpAction,
    getDinnerPartyForDate: getDinnerPartyForDateAction,
    getActiveDinnerParty: getActiveDinnerPartyAction,
    startDinnerPartyCooking: startDinnerPartyCookingAction,
    completeDinnerParty: completeDinnerPartyAction,
    checkDietaryConflicts: checkDietaryConflictsAction,
    getGuestCount: getGuestCountAction,

    pendingDinnerPlan,
    activeDinnerPlan,
    currentDinnerEventIndex,
    createDinnerPlan,
    startDinnerPlan,
    advanceDinnerStep,
    completeDinnerPlan,
    setPendingDinnerPlan,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}
