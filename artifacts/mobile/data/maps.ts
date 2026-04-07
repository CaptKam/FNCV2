import { recipes } from './recipes';
import { countries } from './countries';

// ═══════════════════════════════════════════
// RECIPE_REGION_MAP
// Maps each recipe ID to its sub-region name.
// Derived from country data; uses sensible defaults per cuisine.
// ═══════════════════════════════════════════

const COUNTRY_REGIONS: Record<string, string[]> = {
  italy: ['Rome', 'Tuscany', 'Milan', 'Naples', 'Sicily', 'Bologna', 'Venice'],
  france: ['Paris', 'Provence', 'Lyon', 'Burgundy', 'Normandy', 'Bordeaux'],
  japan: ['Tokyo', 'Osaka', 'Kyoto', 'Hokkaido', 'Okinawa', 'Nagoya'],
  mexico: ['Oaxaca', 'Mexico City', 'Yucatan', 'Puebla', 'Jalisco', 'Baja'],
  thailand: ['Bangkok', 'Chiang Mai', 'Isaan', 'Southern Coast', 'Phuket', 'Chiang Rai'],
  morocco: ['Marrakech', 'Fez', 'Casablanca', 'Tangier', 'Essaouira', 'Rabat'],
  india: ['Delhi', 'Mumbai', 'Kerala', 'Punjab', 'Rajasthan', 'Goa', 'Hyderabad'],
  spain: ['Barcelona', 'Madrid', 'Andalusia', 'Basque Country', 'Valencia', 'Galicia'],
};

export const RECIPE_REGION_MAP: Record<string, string> = {};

recipes.forEach((recipe) => {
  const regions = COUNTRY_REGIONS[recipe.countryId] ?? ['Unknown'];
  // Distribute recipes across regions round-robin
  const countryRecipes = recipes.filter((r) => r.countryId === recipe.countryId);
  const idx = countryRecipes.indexOf(recipe);
  RECIPE_REGION_MAP[recipe.id] = regions[idx % regions.length];
});

// ═══════════════════════════════════════════
// FEATURED_RECIPES
// First 4-5 recipes per country, ordered.
// ═══════════════════════════════════════════

export const FEATURED_RECIPES: Record<string, string[]> = {};

countries.forEach((country) => {
  const countryRecipes = recipes.filter((r) => r.countryId === country.id);
  FEATURED_RECIPES[country.id] = countryRecipes.slice(0, 5).map((r) => r.id);
});

// ═══════════════════════════════════════════
// REGION_IMAGES
// Sub-regions per country with display info.
// ═══════════════════════════════════════════

const REGION_SUBTITLES: Record<string, Record<string, string>> = {
  italy: {
    Rome: 'The eternal kitchen',
    Tuscany: 'Rolling hills and slow cooking',
    Milan: 'Risotto and refinement',
    Naples: 'Birthplace of pizza',
    Sicily: 'Island of citrus and seafood',
    Bologna: 'The food capital of Italy',
    Venice: 'Lagoon flavors',
  },
  france: {
    Paris: 'Haute cuisine and bistro charm',
    Provence: 'Sun-drenched herbs and olive oil',
    Lyon: 'Capital of gastronomy',
    Burgundy: 'Wine country classics',
    Normandy: 'Butter, cream, and apples',
    Bordeaux: 'Wine-paired elegance',
  },
  japan: {
    Tokyo: 'Sushi and street food capital',
    Osaka: 'The nation\'s kitchen',
    Kyoto: 'Refined kaiseki traditions',
    Hokkaido: 'Dairy, seafood, and ramen',
    Okinawa: 'Tropical island cuisine',
    Nagoya: 'Bold miso flavors',
  },
  mexico: {
    Oaxaca: 'Land of seven moles',
    'Mexico City': 'Street food paradise',
    Yucatan: 'Mayan-influenced cuisine',
    Puebla: 'Birthplace of mole poblano',
    Jalisco: 'Tequila and birria country',
    Baja: 'Fish tacos and ocean breeze',
  },
  thailand: {
    Bangkok: 'Street food and royal cuisine',
    'Chiang Mai': 'Northern Thai hill flavors',
    Isaan: 'Fiery northeastern dishes',
    'Southern Coast': 'Coconut curries and seafood',
    Phuket: 'Island fusion flavors',
    'Chiang Rai': 'Mountain herb cooking',
  },
  morocco: {
    Marrakech: 'Spice market soul',
    Fez: 'Ancient culinary traditions',
    Casablanca: 'Modern Moroccan fusion',
    Tangier: 'Mediterranean crossroads',
    Essaouira: 'Fresh ocean catch',
    Rabat: 'Royal kitchen heritage',
  },
  india: {
    Delhi: 'Mughlai feasts and street chaat',
    Mumbai: 'Coastal and street food capital',
    Kerala: 'Coconut and spice garden',
    Punjab: 'Tandoor and butter country',
    Rajasthan: 'Desert-born royal cuisine',
    Goa: 'Portuguese-influenced seafood',
    Hyderabad: 'Biryani perfection',
  },
  spain: {
    Barcelona: 'Catalan creativity',
    Madrid: 'Hearty Castilian classics',
    Andalusia: 'Moorish-influenced tapas',
    'Basque Country': 'Pintxos and molecular gastronomy',
    Valencia: 'Paella homeland',
    Galicia: 'Atlantic seafood traditions',
  },
};

export const REGION_IMAGES: Record<string, Array<{ name: string; subtitle: string; image: string }>> = {};

countries.forEach((country) => {
  const regions = COUNTRY_REGIONS[country.id] ?? [];
  const subtitles = REGION_SUBTITLES[country.id] ?? {};
  REGION_IMAGES[country.id] = regions.map((name) => ({
    name,
    subtitle: subtitles[name] ?? '',
    image: '',
  }));
});
