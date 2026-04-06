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
    flag: '🇪🇸',
    tagline: 'Life around the table',
    heroImage: 'https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=800&h=600&fit=crop',
    cuisineLabel: 'Spanish Cuisine',
    region: 'Southern Europe',
    description: 'Spanish cuisine is built on the joy of sharing. From tapas bars to paella pans, eating in Spain is a social ritual that celebrates fresh seafood, cured meats, and the finest olive oil in the world.',
  },
];
