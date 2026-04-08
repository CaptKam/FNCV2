import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Storage } from '@/utils/storage';
import { Recipe } from '@/data/recipes';
import { countries } from '@/data/countries';
import { DinnerPlan } from '@/types/kitchen';
import { buildDinnerTimeline } from '@/utils/timelineEngine';

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
type GroceryPartner = 'instacart' | 'kroger' | 'walmart';

// ═══════════════════════════════════════════
// CONTEXT VALUE
// ═══════════════════════════════════════════

interface AppContextValue {
  // Itinerary
  itinerary: ItineraryDay[];
  addCourseToDay: (date: string, courseType: CourseType, recipe: Recipe) => void;
  removeCourseFromDay: (date: string, courseType: CourseType) => void;
  toggleDinnerParty: (date: string) => void;
  autoGenerateWeek: (selectedDates: string[], coursePreference: CoursePreference) => void;
  clearDay: (date: string) => void;
  getWeek: (startDate: string) => ItineraryDay[];
  getTodaysMeals: () => PlannedMeal[];

  // Grocery
  groceryItems: GroceryItem[];
  addToGrocery: (recipe: Recipe) => void;
  removeGroceryItemsByRecipe: (recipeName: string) => void;
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
  useMetric: boolean;
  dietaryFlags: string[];
  allergens: string[];
  setCookingLevel: (level: CookingLevel) => void;
  setCoursePreference: (pref: CoursePreference) => void;
  setGroceryPartner: (partner: GroceryPartner) => void;
  setUseMetric: (metric: boolean) => void;
  setDietaryFlags: (flags: string[]) => void;
  setAllergens: (allergens: string[]) => void;

  // History / XP
  totalRecipesCooked: number;
  xp: number;
  level: number;
  passportStamps: Record<string, number>;
  awardXP: (amount: number) => void;
  addPassportStamp: (countryId: string) => void;
  getCookingLevelName: () => string;

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
};

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function getDayLabel(dateStr: string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date(dateStr).getDay()];
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
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
    dayLabel: getDayLabel(date),
    courses: {},
    hasDinnerParty: false,
  };
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// ═══════════════════════════════════════════
// DEFAULT VALUES
// ═══════════════════════════════════════════

const defaultPreferences = {
  cookingLevel: 'home_cook' as CookingLevel,
  coursePreference: 'main' as CoursePreference,
  groceryPartner: 'instacart' as GroceryPartner,
  useMetric: true,
  dietaryFlags: [] as string[],
  allergens: [] as string[],
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
  const [useMetric, setUseMetricState] = useState(defaultPreferences.useMetric);
  const [dietaryFlags, setDietaryFlagsState] = useState<string[]>(defaultPreferences.dietaryFlags);
  const [allergens, setAllergensState] = useState<string[]>(defaultPreferences.allergens);
  const [totalRecipesCooked, setTotalRecipesCooked] = useState(defaultHistory.totalRecipesCooked);
  const [xp, setXp] = useState(defaultHistory.xp);
  const [level, setLevel] = useState(defaultHistory.level);
  const [passportStamps, setPassportStamps] = useState<Record<string, number>>(defaultHistory.passportStamps);
  const [pendingDinnerPlan, setPendingDinnerPlan] = useState<DinnerPlan | null>(null);
  const [activeDinnerPlan, setActiveDinnerPlan] = useState<DinnerPlan | null>(null);
  const [currentDinnerEventIndex, setCurrentDinnerEventIndex] = useState(0);

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
      setItinerary(it);
      setGroceryItems(gr);
      setActiveCookSession(cs);
      if (dp.plan) {
        setActiveDinnerPlan(dp.plan);
        setCurrentDinnerEventIndex(dp.eventIndex);
      }
      if (pr.cookingLevel) setCookingLevelState(pr.cookingLevel);
      if (pr.coursePreference) setCoursePreferenceState(pr.coursePreference);
      if (pr.groceryPartner) setGroceryPartnerState(pr.groceryPartner);
      if (pr.useMetric != null) setUseMetricState(pr.useMetric);
      if (pr.dietaryFlags) setDietaryFlagsState(pr.dietaryFlags);
      if (pr.allergens) setAllergensState(pr.allergens);
      if (hi.totalRecipesCooked != null) setTotalRecipesCooked(hi.totalRecipesCooked);
      if (hi.xp != null) setXp(hi.xp);
      if (hi.level != null) setLevel(hi.level);
      if (hi.passportStamps) setPassportStamps(hi.passportStamps);
      hydrated.current = true;
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
      Storage.set(KEYS.preferences, { cookingLevel, coursePreference, groceryPartner, useMetric, dietaryFlags, allergens });
  }, [cookingLevel, coursePreference, groceryPartner, useMetric, dietaryFlags, allergens]);

  useEffect(() => {
    if (hydrated.current)
      Storage.set(KEYS.history, { totalRecipesCooked, xp, level, passportStamps });
  }, [totalRecipesCooked, xp, level, passportStamps]);

  useEffect(() => {
    if (hydrated.current)
      Storage.set(KEYS.dinnerPlan, { plan: activeDinnerPlan, eventIndex: currentDinnerEventIndex });
  }, [activeDinnerPlan, currentDinnerEventIndex]);

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
          existing.amount = existing.amount + ', ' + ing.amount;
        } else {
          next.push({
            id: sid,
            name: ing.name,
            amount: ing.amount,
            unit: '',
            category: categorizeIngredient(ing.name),
            recipeNames: [recipe.title],
            checked: false,
            excluded: false,
          });
        }
      }
      return next;
    });
  }, []);

  const removeGroceryItemsByRecipe = useCallback((recipeName: string) => {
    setGroceryItems((prev) =>
      prev
        .map((item) => ({
          ...item,
          recipeNames: item.recipeNames.filter((n) => n !== recipeName),
        }))
        .filter((item) => item.recipeNames.length > 0)
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

  const toggleDinnerParty = useCallback((date: string) => {
    setItinerary((prev) =>
      prev.map((d) =>
        d.date === date ? { ...d, hasDinnerParty: !d.hasDinnerParty } : d
      )
    );
  }, []);

  const autoGenerateWeek = useCallback(
    (selectedDates: string[], pref: CoursePreference) => {
      // Lazy import to avoid circular deps at module scope
      const allRecipes: Recipe[] = require('@/data/recipes').recipes;
      const shuffled = [...allRecipes].sort(() => Math.random() - 0.5);
      const usedIds = new Set<string>();
      const usedCountries = new Set<string>();

      const pickRecipe = (cat?: 'appetizer' | 'main' | 'dessert'): Recipe | undefined => {
        for (const r of shuffled) {
          if (usedIds.has(r.id)) continue;
          if (cat && r.category !== cat) continue;
          // Prefer unused country for variety
          if (!usedCountries.has(r.countryId) || usedIds.size > shuffled.length / 2) {
            usedIds.add(r.id);
            usedCountries.add(r.countryId);
            return r;
          }
        }
        // Fallback: just pick any unused
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
        for (const date of selectedDates) {
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
    [findOrCreateDay, addToGrocery]
  );

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
        const date = addDays(startDate, i);
        const existing = itinerary.find((d) => d.date === date);
        week.push(existing ?? makeEmptyDay(date));
      }
      return week;
    },
    [itinerary]
  );

  const getTodaysMeals = useCallback((): PlannedMeal[] => {
    const today = todayISO();
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
  const setUseMetric = useCallback((m: boolean) => setUseMetricState(m), []);
  const setDietaryFlags = useCallback((f: string[]) => setDietaryFlagsState(f), []);
  const setAllergens = useCallback((a: string[]) => setAllergensState(a), []);

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
  // VALUE
  // ═══════════════════════════════════════════

  const value: AppContextValue = {
    itinerary,
    addCourseToDay,
    removeCourseFromDay,
    toggleDinnerParty,
    autoGenerateWeek,
    clearDay,
    getWeek,
    getTodaysMeals,

    groceryItems,
    addToGrocery,
    removeGroceryItemsByRecipe,
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
    setCookingLevel,
    setCoursePreference,
    setGroceryPartner,
    setUseMetric,
    setDietaryFlags,
    setAllergens,

    totalRecipesCooked,
    xp,
    level,
    passportStamps,
    awardXP,
    addPassportStamp,
    getCookingLevelName,

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
