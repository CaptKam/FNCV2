export type AllergenType =
  | 'milk'
  | 'egg'
  | 'fish'
  | 'shellfish'
  | 'tree_nuts'
  | 'peanuts'
  | 'wheat'
  | 'soy'
  | 'sesame';

export const ALLERGEN_INFO: Record<AllergenType, { label: string; icon: string; color: string }> = {
  milk: { label: 'Milk', icon: 'cow', color: '#5B9BD5' },
  egg: { label: 'Egg', icon: 'egg', color: '#FFC000' },
  fish: { label: 'Fish', icon: 'fish', color: '#4472C4' },
  shellfish: { label: 'Shellfish', icon: 'food-drumstick', color: '#ED7D31' },
  tree_nuts: { label: 'Tree Nuts', icon: 'tree', color: '#70AD47' },
  peanuts: { label: 'Peanuts', icon: 'peanut', color: '#C55A11' },
  wheat: { label: 'Wheat', icon: 'grain', color: '#BF8F00' },
  soy: { label: 'Soy', icon: 'soy-sauce', color: '#548235' },
  sesame: { label: 'Sesame', icon: 'seed', color: '#D9A646' },
};

const ALLERGEN_KEYWORDS: Record<AllergenType, string[]> = {
  milk: [
    'cream', 'butter', 'cheese', 'yogurt', 'ghee', 'paneer',
    'mascarpone', 'ricotta', 'mozzarella', 'parmesan', 'pecorino',
    'gruyère', 'gruyere', 'crème fraîche', 'gelato', 'whey',
    'khoya', 'condensed milk', 'evaporated milk', 'cotija',
    'queso', 'crema', 'whole milk', 'heavy cream',
  ],
  egg: [
    'egg', 'eggs', 'meringue', 'mayonnaise', 'mayo',
    'ladyfinger', 'ladyfingers',
  ],
  fish: [
    'fish', 'salmon', 'tuna', 'cod', 'sea bass', 'anchovy',
    'anchovies', 'sardine', 'bonito', 'dashi', 'fish sauce',
    'mahi', 'mackerel', 'snapper',
  ],
  shellfish: [
    'shrimp', 'prawn', 'crab', 'lobster', 'squid', 'calamari',
    'clam', 'mussel', 'oyster', 'scallop', 'octopus', 'gambas',
  ],
  tree_nuts: [
    'almond', 'cashew', 'walnut', 'pistachio', 'hazelnut',
    'pine nut', 'pine nuts', 'pecan', 'macadamia', 'chestnut',
  ],
  peanuts: ['peanut', 'peanuts', 'groundnut'],
  wheat: [
    'flour', 'pasta', 'bread', 'noodle', 'noodles', 'spaghetti',
    'tonnarelli', 'udon', 'ramen', 'puff pastry', 'croissant',
    'baguette', 'tortilla', 'naan', 'crêpe', 'crepe', 'panko',
    'breadcrumb', 'breadcrumbs', 'couscous', 'pita', 'msemen',
    'flatbread', 'gyoza wrapper', 'wonton', 'dumpling wrapper',
    'bhatura', 'bhature', 'ladyfinger', 'ladyfingers',
    'all-purpose flour', 'semolina',
  ],
  soy: [
    'soy sauce', 'soy', 'tofu', 'miso', 'edamame', 'tempeh',
    'tare',
  ],
  sesame: [
    'sesame', 'tahini', 'sesame oil', 'sesame seeds',
  ],
};

const MILK_EXCLUSIONS = ['coconut milk', 'coconut cream', 'oat milk', 'almond milk', 'soy milk', 'rice milk'];

export function detectAllergens(ingredients: { name: string }[]): AllergenType[] {
  const found = new Set<AllergenType>();
  for (const ing of ingredients) {
    const n = ing.name.toLowerCase();
    for (const [allergen, keywords] of Object.entries(ALLERGEN_KEYWORDS) as [AllergenType, string[]][]) {
      if (allergen === 'milk' && MILK_EXCLUSIONS.some((ex) => n.includes(ex))) continue;
      if (keywords.some((kw) => n.includes(kw))) {
        found.add(allergen);
      }
    }
  }
  return Array.from(found).sort();
}

const _allergenCache = new Map<string, AllergenType[]>();

export function detectAllergensWithCache(ingredients: { name: string }[], cacheKey: string): AllergenType[] {
  const cached = _allergenCache.get(cacheKey);
  if (cached) return cached;
  const result = detectAllergens(ingredients);
  _allergenCache.set(cacheKey, result);
  return result;
}

const DIETARY_ALLERGEN_MAP: Record<string, AllergenType[]> = {
  'dairy-free': ['milk'],
  'gluten-free': ['wheat'],
  'nut-free': ['tree_nuts', 'peanuts'],
  'vegetarian': [],
  'vegan': ['milk', 'egg'],
  'halal': [],
};

export function getDietaryConflicts(
  recipeAllergens: AllergenType[],
  userDietaryFlags: string[]
): { flag: string; conflictingAllergens: AllergenType[] }[] {
  const conflicts: { flag: string; conflictingAllergens: AllergenType[] }[] = [];
  for (const flag of userDietaryFlags) {
    const flagAllergens = DIETARY_ALLERGEN_MAP[flag];
    if (!flagAllergens) continue;
    const matching = flagAllergens.filter((a) => recipeAllergens.includes(a));
    if (matching.length > 0) {
      conflicts.push({ flag, conflictingAllergens: matching });
    }
  }
  return conflicts;
}
