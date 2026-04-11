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

export function formatCookTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

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
  if (level === 'beginner' && step.instructionFirstSteps) {
    return step.instructionFirstSteps;
  }
  if (level === 'chef' && step.instructionChefsTable) {
    return step.instructionChefsTable;
  }
  return step.instruction;
}

// ═══════════════════════════════════════════
// Unit conversion
// ═══════════════════════════════════════════

interface ConversionRule {
  regex: RegExp;
  toImperial: (val: number) => { amount: number; unit: string };
  toMetric: (val: number) => { amount: number; unit: string };
}

const CONVERSIONS: ConversionRule[] = [
  {
    regex: /^([\d./]+)\s*g\b/i,
    toImperial: (g) => ({ amount: Math.round(g * 0.03527 * 10) / 10, unit: 'oz' }),
    toMetric: (g) => ({ amount: g, unit: 'g' }),
  },
  {
    regex: /^([\d./]+)\s*kg\b/i,
    toImperial: (kg) => ({ amount: Math.round(kg * 2.205 * 10) / 10, unit: 'lb' }),
    toMetric: (kg) => ({ amount: kg, unit: 'kg' }),
  },
  {
    regex: /^([\d./]+)\s*ml\b/i,
    toImperial: (ml) => ({ amount: Math.round(ml * 0.03381 * 10) / 10, unit: 'fl oz' }),
    toMetric: (ml) => ({ amount: ml, unit: 'ml' }),
  },
  {
    regex: /^([\d./]+)\s*l\b/i,
    toImperial: (l) => ({ amount: Math.round(l * 4.227 * 10) / 10, unit: 'cups' }),
    toMetric: (l) => ({ amount: l, unit: 'L' }),
  },
  {
    regex: /^([\d./]+)\s*cups?\b/i,
    toImperial: (c) => ({ amount: c, unit: c === 1 ? 'cup' : 'cups' }),
    toMetric: (c) => ({ amount: Math.round(c * 236.6), unit: 'ml' }),
  },
  {
    regex: /^([\d./]+)\s*oz\b/i,
    toImperial: (oz) => ({ amount: oz, unit: 'oz' }),
    toMetric: (oz) => ({ amount: Math.round(oz * 28.35), unit: 'g' }),
  },
  {
    regex: /^([\d./]+)\s*lbs?\b/i,
    toImperial: (lb) => ({ amount: lb, unit: lb === 1 ? 'lb' : 'lbs' }),
    toMetric: (lb) => ({ amount: Math.round(lb * 453.6), unit: 'g' }),
  },
];

function parseFraction(s: string): number {
  if (s.includes('/')) {
    const parts = s.split('/');
    return parseInt(parts[0], 10) / parseInt(parts[1], 10);
  }
  return parseFloat(s);
}

/**
 * Convert an ingredient amount string between metric and imperial.
 * Returns the original string if no conversion rule matches.
 */
export function convertAmount(amount: string, toMetric: boolean): string {
  for (const rule of CONVERSIONS) {
    const match = amount.match(rule.regex);
    if (match) {
      const val = parseFraction(match[1]);
      if (isNaN(val)) continue;
      const suffix = amount.slice(match[0].length);
      if (toMetric) {
        const { amount: converted, unit } = rule.toMetric(val);
        return `${converted}${unit}${suffix}`;
      } else {
        const { amount: converted, unit } = rule.toImperial(val);
        return `${converted} ${unit}${suffix}`;
      }
    }
  }
  // No convertible unit found — return as-is (e.g. "2 tbsp", "1 large")
  return amount;
}
