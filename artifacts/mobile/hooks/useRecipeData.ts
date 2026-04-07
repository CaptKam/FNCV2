import { Recipe, Country } from '@/data/recipes';
import {
  getAllCountries,
  getCountryById,
  getAllRecipes,
  getRecipeById,
  getRecipesForCountry,
  parseTimeToMinutes,
  toFilterCategory,
  getInstructionForLevel,
} from '@/data/helpers';
import { FEATURED_RECIPES, RECIPE_REGION_MAP } from '@/data/maps';

export function useRecipeData() {
  return {
    // Country data
    countries: getAllCountries(),
    getCountry: getCountryById,

    // Recipe data
    getAllRecipes,
    getRecipe: getRecipeById,
    getRecipesForCountry,

    // Featured recipes per country
    getFeaturedRecipes: (countryId: string): Recipe[] => {
      const ids = FEATURED_RECIPES[countryId] ?? [];
      const allRecipes = getRecipesForCountry(countryId);
      return ids
        .map((id) => allRecipes.find((r) => r.id === id))
        .filter((r): r is Recipe => r != null);
    },

    // Recipes filtered by sub-region
    getRecipesForRegion: (countryId: string, regionName: string): Recipe[] => {
      const countryRecipes = getRecipesForCountry(countryId);
      return countryRecipes.filter((r) => {
        const mapped = RECIPE_REGION_MAP[r.id];
        return mapped === regionName;
      });
    },

    // Search
    searchRecipes: (query: string): Recipe[] => {
      if (!query.trim()) return [];
      const q = query.toLowerCase().trim();
      return getAllRecipes().filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.culturalNote?.toLowerCase().includes(q) ||
          r.category?.toLowerCase().includes(q) ||
          r.ingredients?.some((ing) => ing.name.toLowerCase().includes(q))
      );
    },

    searchCountries: (query: string): Country[] => {
      if (!query.trim()) return [];
      const q = query.toLowerCase().trim();
      return getAllCountries().filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.region?.toLowerCase().includes(q)
      );
    },

    // Utilities
    parseTimeToMinutes,
    toFilterCategory,
    getInstructionForLevel,
  };
}
