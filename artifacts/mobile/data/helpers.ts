import { countries, Country } from './countries';
import { recipes, Recipe, Step } from './recipes';

// ═══════════════════════════════════════════
// Image resolution
// ═══════════════════════════════════════════

export function resolveImageUrl(url: string | undefined): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) {
    const base = process.env.EXPO_PUBLIC_DOMAIN ?? '';
    return `${base}${url}`;
  }
  return '';
}

export function resolveRecipeImage(recipe: Recipe): Recipe {
  return { ...recipe, image: resolveImageUrl(recipe.image) };
}

// ═══════════════════════════════════════════
// Country lookups
// ═══════════════════════════════════════════

export function getAllCountries(): Country[] {
  return countries;
}

export function getCountryById(id: string): Country | undefined {
  return countries.find((c) => c.id === id);
}

// ═══════════════════════════════════════════
// Recipe lookups
// ═══════════════════════════════════════════

export function getAllRecipes(): Recipe[] {
  return recipes.map(resolveRecipeImage);
}

export function getRecipeById(id: string): Recipe | undefined {
  const recipe = recipes.find((r) => r.id === id);
  return recipe ? resolveRecipeImage(recipe) : undefined;
}

export function getRecipesForCountry(countryId: string): Recipe[] {
  return recipes
    .filter((r) => r.countryId === countryId)
    .map(resolveRecipeImage);
}

// ═══════════════════════════════════════════
// Time parsing
// ═══════════════════════════════════════════

export function parseTimeToMinutes(time: string): number {
  if (!time) return 0;
  let total = 0;
  const hourMatch = time.match(/(\d+)\s*h/);
  const minMatch = time.match(/(\d+)\s*(?:min|m\b)/);
  if (hourMatch) total += parseInt(hourMatch[1], 10) * 60;
  if (minMatch) total += parseInt(minMatch[1], 10);
  // If no unit matched but there's a plain number, treat as minutes
  if (!hourMatch && !minMatch) {
    const plain = parseInt(time, 10);
    if (!isNaN(plain)) total = plain;
  }
  return total;
}

// ═══════════════════════════════════════════
// Category normalization
// ═══════════════════════════════════════════

export function toFilterCategory(category: string): string {
  const c = category.toLowerCase().trim();
  if (['main course', 'entrée', 'entree', 'main'].includes(c)) return 'Mains';
  if (['appetizer', 'soup', 'salad', 'starter'].includes(c)) return 'Appetizers';
  if (['side', 'side dish', 'bread'].includes(c)) return 'Sides';
  if (['dessert', 'sweet'].includes(c)) return 'Desserts';
  if (['drink', 'cocktail', 'beverage'].includes(c)) return 'Drinks';
  return 'Mains';
}

// ═══════════════════════════════════════════
// Instruction tiers
// ═══════════════════════════════════════════

export function getInstructionForLevel(
  step: Step,
  level: 'beginner' | 'home_cook' | 'chef'
): string {
  const s = step as Record<string, unknown>;
  if (level === 'beginner' && typeof s.instructionFirstSteps === 'string') {
    return s.instructionFirstSteps;
  }
  if (level === 'chef' && typeof s.instructionChefsTable === 'string') {
    return s.instructionChefsTable;
  }
  return step.instruction;
}
