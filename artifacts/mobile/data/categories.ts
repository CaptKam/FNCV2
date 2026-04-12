import { Recipe } from '@/data/recipes';

export interface MealCategory {
  label: string;
  image: string;
  filter: (r: Recipe) => boolean;
}

export const MEAL_CATEGORIES: MealCategory[] = [
  {
    label: 'Starters',
    image: 'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=600&h=600&fit=crop',
    filter: (r) => r.category === 'appetizer',
  },
  {
    label: 'Mains',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=600&fit=crop',
    filter: (r) => r.category === 'main',
  },
  {
    label: 'Desserts',
    image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600&h=600&fit=crop',
    filter: (r) => r.category === 'dessert',
  },
  {
    label: 'Quick',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=600&fit=crop',
    filter: (r) => r.prepTime + r.cookTime <= 30,
  },
  {
    label: 'Slow Cook',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&h=600&fit=crop',
    filter: (r) => r.prepTime + r.cookTime >= 90,
  },
  {
    label: 'Vegetarian',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=600&fit=crop',
    filter: (r) =>
      !r.ingredients.some((i) =>
        ['chicken', 'beef', 'pork', 'lamb', 'fish', 'shrimp', 'prawn', 'anchovy', 'bacon', 'turkey'].some((m) =>
          i.name.toLowerCase().includes(m),
        ),
      ),
  },
  {
    label: 'Seafood',
    image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&h=600&fit=crop',
    filter: (r) =>
      r.ingredients.some((i) =>
        ['fish', 'shrimp', 'salmon', 'prawn', 'tuna', 'cod', 'anchovy', 'squid', 'clam', 'mussel', 'seafood'].some((s) =>
          i.name.toLowerCase().includes(s),
        ),
      ),
  },
  {
    label: 'Street Food',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=600&fit=crop',
    filter: (r) => r.category === 'appetizer' && r.prepTime + r.cookTime <= 45,
  },
  {
    label: 'Soups',
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&h=600&fit=crop',
    filter: (r) =>
      r.title.toLowerCase().includes('soup') ||
      r.title.toLowerCase().includes('broth') ||
      r.title.toLowerCase().includes('stew') ||
      r.title.toLowerCase().includes('braise'),
  },
];
