export interface Country {
  id: string;
  name: string;
  flag: string;
  tagline: string;
  heroImage: string;
  cuisineLabel: string;
  region: string;
  description: string;
}

export const countries: Country[] = [
  {
    id: 'italy',
    name: 'Italy',
    flag: '🇮🇹',
    tagline: 'Where every meal is a love letter',
    heroImage: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&h=600&fit=crop',
    cuisineLabel: 'Italian Cuisine',
    region: 'Southern Europe',
    description: 'Italian cuisine is a celebration of simplicity and quality ingredients. From the sun-drenched pasta dishes of the south to the rich risottos of the north, every region tells its own culinary story through generations of family recipes.',
  },
  {
    id: 'france',
    name: 'France',
    flag: '🇫🇷',
    tagline: 'The art of eating well',
    heroImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop',
    cuisineLabel: 'French Cuisine',
    region: 'Western Europe',
    description: 'French cuisine is the foundation of Western culinary tradition. Its emphasis on technique, seasonal ingredients, and the art of the table has influenced chefs worldwide for centuries.',
  },
  {
    id: 'japan',
    name: 'Japan',
    flag: '🇯🇵',
    tagline: 'Harmony in every bite',
    heroImage: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&h=600&fit=crop',
    cuisineLabel: 'Japanese Cuisine',
    region: 'East Asia',
    description: 'Japanese cuisine embodies the philosophy of harmony, seasonality, and respect for ingredients. From delicate sushi to warming ramen, each dish reflects centuries of culinary refinement.',
  },
  {
    id: 'mexico',
    name: 'Mexico',
    flag: '🇲🇽',
    tagline: 'Flavor without boundaries',
    heroImage: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&h=600&fit=crop',
    cuisineLabel: 'Mexican Cuisine',
    region: 'North America',
    description: 'Mexican cuisine is a vibrant tapestry of ancient Mesoamerican traditions and Spanish colonial influences. Its complex moles, fresh salsas, and corn-based staples form one of the world\'s most beloved food cultures.',
  },
  {
    id: 'thailand',
    name: 'Thailand',
    flag: '🇹🇭',
    tagline: 'The balance of five flavors',
    heroImage: 'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=800&h=600&fit=crop',
    cuisineLabel: 'Thai Cuisine',
    region: 'Southeast Asia',
    description: 'Thai cuisine is a masterful balancing act of sweet, sour, salty, bitter, and spicy. Street food culture meets royal court traditions in dishes that explode with aromatic herbs and bold flavors.',
  },
  {
    id: 'morocco',
    name: 'Morocco',
    flag: '🇲🇦',
    tagline: 'Spices that tell stories',
    heroImage: 'https://images.unsplash.com/photo-1541518763-a2d3e3f2f1f0?w=800&h=600&fit=crop',
    cuisineLabel: 'Moroccan Cuisine',
    region: 'North Africa',
    description: 'Moroccan cuisine is a sensory journey through ancient spice routes. Tagines slow-cooked to perfection, fluffy couscous, and preserved lemons create dishes that are both deeply aromatic and soul-satisfying.',
  },
  {
    id: 'india',
    name: 'India',
    flag: '🇮🇳',
    tagline: 'A subcontinent of flavors',
    heroImage: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop',
    cuisineLabel: 'Indian Cuisine',
    region: 'South Asia',
    description: 'Indian cuisine is a vast universe of regional traditions, each with its own spice palette and cooking techniques. From the tandoor ovens of the north to the coconut curries of the south, India offers an unmatched depth of culinary diversity.',
  },
  {
    id: 'spain',
    name: 'Spain',
    flag: '🇪🇸',
    tagline: 'Life around the table',
    heroImage: 'https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=800&h=600&fit=crop',
    cuisineLabel: 'Spanish Cuisine',
    region: 'Southern Europe',
    description: 'Spanish cuisine is built on the joy of sharing. From tapas bars to paella pans, eating in Spain is a social ritual that celebrates fresh seafood, cured meats, and the finest olive oil in the world.',
  },
];
