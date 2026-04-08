export interface CookingTechnique {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  image: string;
  steps: string[];
  relatedRecipes: string[];
  category: 'knife' | 'heat' | 'prep' | 'finishing';
}

export const TECHNIQUES: CookingTechnique[] = [
  {
    id: 'perfect-sear',
    title: 'The Perfect Sear',
    subtitle: 'Master the Maillard reaction',
    description: 'A great sear is the foundation of flavor in countless dishes. The Maillard reaction — the chemical process that occurs when proteins and sugars are exposed to high heat — creates hundreds of new flavor compounds and that irresistible golden-brown crust.\n\nThe key is patience and heat management. Most home cooks move their food too early and use pans that aren\'t hot enough. A proper sear requires a screaming-hot pan, dry protein, and the discipline to leave it alone.',
    difficulty: 'intermediate',
    duration: '5 min read',
    image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&h=400&fit=crop',
    steps: [
      'Pat the protein completely dry with paper towels — moisture is the enemy of browning',
      'Heat your pan until it just starts to smoke (cast iron or stainless steel)',
      'Add oil with a high smoke point: avocado, grapeseed, or refined sunflower',
      'Place the protein away from you to avoid splatter',
      'Do not move it — let the crust form undisturbed for 3-4 minutes',
      'Flip once when it releases naturally from the pan',
      'Rest for half the cooking time before cutting to redistribute juices',
    ],
    relatedRecipes: ['it-2', 'ma-1', 'fr-1'],
    category: 'heat',
  },
  {
    id: 'knife-discipline',
    title: 'Knife Discipline',
    subtitle: 'Cuts that change everything',
    description: 'Consistent knife cuts aren\'t just about presentation — they\'re about even cooking. A dice that ranges from 5mm to 15mm means some pieces overcook while others stay raw. Professional kitchens obsess over uniformity for this reason.\n\nThe claw grip is your safety foundation. Once it becomes muscle memory, your speed will naturally increase. Never rush with a knife — precision comes from control, not velocity.',
    difficulty: 'beginner',
    duration: '7 min read',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop',
    steps: [
      'Curl your fingers into a claw — fingertips tucked behind knuckles',
      'The flat side of the blade rests against your knuckles as a guide',
      'Rock the knife from tip to heel in a smooth arc, not straight down',
      'Brunoise: 2mm cubes. Julienne: 3mm matchsticks. Chiffonade: thin ribbons',
      'Keep the tip on the board — the handle does the lifting',
      'Sharpen your knife before every session — a dull knife requires more force and causes injuries',
    ],
    relatedRecipes: ['jp-1', 'th-1', 'mx-1'],
    category: 'knife',
  },
  {
    id: 'emulsion',
    title: 'Emulsion & Reduction',
    subtitle: 'Sauces that define a dish',
    description: 'An emulsion combines two liquids that normally don\'t mix — like oil and vinegar, or butter and egg yolk. The trick is adding the fat slowly while whisking vigorously, creating tiny droplets suspended in the base liquid.\n\nReductions concentrate flavor by evaporating water. A stock reduced by half becomes a demi-glace. A balsamic reduction becomes a syrup. Time and low heat are your tools — patience transforms simple liquids into complex, coating sauces.',
    difficulty: 'advanced',
    duration: '6 min read',
    image: 'https://images.unsplash.com/photo-1607116667981-27db83911e34?w=600&h=400&fit=crop',
    steps: [
      'Start with your base liquid at the right temperature (warm for hollandaise, room temp for vinaigrette)',
      'Add fat in a slow, thin stream while whisking constantly',
      'For vinaigrettes: 3 parts oil to 1 part acid is the classic ratio',
      'For hollandaise: drizzle clarified butter into egg yolks over gentle heat',
      'If it breaks (separates), start with a fresh yolk and slowly whisk the broken sauce in',
      'To reduce: simmer uncovered, stirring occasionally. Done when it coats the back of a spoon',
    ],
    relatedRecipes: ['fr-2', 'it-3', 'es-1'],
    category: 'finishing',
  },
  {
    id: 'spice-blooming',
    title: 'Blooming Spices',
    subtitle: 'Unlock hidden flavor compounds',
    description: 'Dry spices contain volatile oils locked inside their cellular structure. Toasting them in a hot, dry pan — or blooming them briefly in hot oil — ruptures those cells and releases aromatic compounds that would otherwise stay trapped.\n\nThis single step, which takes less than two minutes, is the difference between a dish that tastes "fine" and one that fills the kitchen with fragrance before it even hits the plate.',
    difficulty: 'beginner',
    duration: '4 min read',
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&h=400&fit=crop',
    steps: [
      'Heat a dry pan over medium heat — no oil for dry toasting',
      'Add whole spices: cumin seeds, coriander, mustard seeds, peppercorns',
      'Toast for 60-90 seconds, shaking the pan, until fragrant — watch carefully, they burn fast',
      'For ground spices: add to hot oil for 30 seconds before adding other ingredients',
      'Listen for the "pop" of mustard seeds — that\'s the oils releasing',
      'This step transforms flat, dusty flavor into warm, complex depth',
    ],
    relatedRecipes: ['in-1', 'ma-2', 'th-2'],
    category: 'prep',
  },
  {
    id: 'braising',
    title: 'The Art of Braising',
    subtitle: 'Low and slow transforms tough into tender',
    description: 'Braising is a two-step method: high-heat sear, then low-and-slow cooking in liquid. The magic happens when collagen — the tough connective tissue in inexpensive cuts — slowly converts to gelatin over hours of gentle heat. The result is fall-apart tender meat in a naturally thickened, deeply flavored sauce.\n\nThis technique is the backbone of comfort food worldwide: French coq au vin, Moroccan tagines, Mexican birria, and Italian osso buco all rely on braising.',
    difficulty: 'intermediate',
    duration: '6 min read',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop',
    steps: [
      'Choose a tough, collagen-rich cut: chuck, shoulder, short ribs, or shanks',
      'Season generously and sear all sides in a hot Dutch oven until deeply browned',
      'Remove meat. Build aromatics in the same pot: onion, garlic, celery, carrots',
      'Deglaze with wine or stock, scraping up every bit of fond from the bottom',
      'Return meat and add liquid to come halfway up the sides — not submerged',
      'Cover tightly. Cook at 325°F / 160°C for 2-4 hours until fork-tender',
      'The collagen converts to gelatin, creating a silky, naturally thickened sauce',
    ],
    relatedRecipes: ['it-2', 'ma-1', 'fr-3'],
    category: 'heat',
  },
];
