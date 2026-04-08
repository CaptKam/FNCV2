export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const nutritionData: Record<string, NutritionInfo> = {
  'it-1': { calories: 520, protein: 18, carbs: 62, fat: 22 },
  'it-2': { calories: 480, protein: 42, carbs: 12, fat: 28 },
  'it-3': { calories: 380, protein: 8, carbs: 42, fat: 20 },
  'it-4': { calories: 410, protein: 14, carbs: 58, fat: 14 },
  'it-5': { calories: 350, protein: 16, carbs: 32, fat: 18 },
  'it-6': { calories: 620, protein: 22, carbs: 72, fat: 26 },
  'it-7': { calories: 290, protein: 18, carbs: 6, fat: 22 },
  'it-8': { calories: 380, protein: 14, carbs: 48, fat: 16 },
  'it-9': { calories: 340, protein: 12, carbs: 38, fat: 16 },
  'it-10': { calories: 450, protein: 16, carbs: 54, fat: 18 },
  'it-11': { calories: 560, protein: 18, carbs: 68, fat: 24 },
  'it-12': { calories: 310, protein: 6, carbs: 28, fat: 20 },
  'it-13': { calories: 220, protein: 4, carbs: 24, fat: 12 },

  'fr-1': { calories: 520, protein: 38, carbs: 8, fat: 34 },
  'fr-2': { calories: 340, protein: 5, carbs: 28, fat: 24 },
  'fr-3': { calories: 380, protein: 16, carbs: 32, fat: 22 },
  'fr-4': { calories: 420, protein: 24, carbs: 16, fat: 30 },
  'fr-5': { calories: 460, protein: 6, carbs: 52, fat: 26 },
  'fr-6': { calories: 290, protein: 4, carbs: 38, fat: 14 },
  'fr-7': { calories: 580, protein: 32, carbs: 42, fat: 30 },
  'fr-8': { calories: 480, protein: 22, carbs: 18, fat: 36 },
  'fr-9': { calories: 360, protein: 8, carbs: 40, fat: 18 },
  'fr-10': { calories: 420, protein: 28, carbs: 14, fat: 28 },
  'fr-11': { calories: 340, protein: 6, carbs: 32, fat: 22 },
  'fr-12': { calories: 380, protein: 8, carbs: 44, fat: 18 },

  'jp-1': { calories: 680, protein: 38, carbs: 62, fat: 30 },
  'jp-2': { calories: 320, protein: 18, carbs: 34, fat: 12 },
  'jp-3': { calories: 480, protein: 32, carbs: 48, fat: 16 },
  'jp-4': { calories: 260, protein: 14, carbs: 36, fat: 6 },
  'jp-5': { calories: 420, protein: 22, carbs: 52, fat: 14 },
  'jp-6': { calories: 380, protein: 26, carbs: 38, fat: 14 },
  'jp-7': { calories: 540, protein: 28, carbs: 58, fat: 22 },
  'jp-8': { calories: 180, protein: 4, carbs: 38, fat: 1 },
  'jp-9': { calories: 210, protein: 4, carbs: 42, fat: 2 },
  'jp-10': { calories: 240, protein: 6, carbs: 44, fat: 4 },
  'jp-11': { calories: 620, protein: 24, carbs: 68, fat: 28 },
  'jp-12': { calories: 190, protein: 10, carbs: 26, fat: 4 },

  'mx-1': { calories: 380, protein: 22, carbs: 28, fat: 20 },
  'mx-2': { calories: 540, protein: 24, carbs: 48, fat: 28 },
  'mx-3': { calories: 320, protein: 18, carbs: 36, fat: 12 },
  'mx-4': { calories: 280, protein: 12, carbs: 24, fat: 16 },
  'mx-5': { calories: 420, protein: 26, carbs: 42, fat: 16 },
  'mx-6': { calories: 460, protein: 20, carbs: 52, fat: 20 },
  'mx-7': { calories: 350, protein: 6, carbs: 48, fat: 16 },
  'mx-8': { calories: 380, protein: 8, carbs: 44, fat: 20 },
  'mx-9': { calories: 340, protein: 4, carbs: 42, fat: 18 },
  'mx-10': { calories: 480, protein: 28, carbs: 38, fat: 24 },
  'mx-11': { calories: 280, protein: 4, carbs: 36, fat: 14 },
  'mx-12': { calories: 360, protein: 14, carbs: 42, fat: 16 },

  'th-1': { calories: 380, protein: 24, carbs: 18, fat: 24 },
  'th-2': { calories: 520, protein: 22, carbs: 52, fat: 24 },
  'th-3': { calories: 440, protein: 20, carbs: 48, fat: 18 },
  'th-4': { calories: 360, protein: 28, carbs: 14, fat: 22 },
  'th-5': { calories: 280, protein: 6, carbs: 38, fat: 12 },
  'th-6': { calories: 320, protein: 18, carbs: 28, fat: 16 },
  'th-7': { calories: 460, protein: 22, carbs: 54, fat: 18 },
  'th-8': { calories: 380, protein: 8, carbs: 52, fat: 16 },
  'th-9': { calories: 420, protein: 26, carbs: 42, fat: 18 },
  'th-10': { calories: 340, protein: 6, carbs: 48, fat: 14 },
  'th-11': { calories: 290, protein: 20, carbs: 12, fat: 18 },
  'th-12': { calories: 360, protein: 24, carbs: 16, fat: 22 },

  'ma-1': { calories: 520, protein: 32, carbs: 38, fat: 26 },
  'ma-2': { calories: 440, protein: 28, carbs: 42, fat: 18 },
  'ma-3': { calories: 480, protein: 18, carbs: 56, fat: 22 },
  'ma-4': { calories: 380, protein: 24, carbs: 32, fat: 18 },
  'ma-5': { calories: 260, protein: 8, carbs: 34, fat: 10 },
  'ma-6': { calories: 420, protein: 16, carbs: 48, fat: 20 },
  'ma-7': { calories: 360, protein: 22, carbs: 36, fat: 14 },
  'ma-8': { calories: 320, protein: 4, carbs: 52, fat: 12 },
  'ma-9': { calories: 280, protein: 6, carbs: 18, fat: 20 },
  'ma-10': { calories: 460, protein: 34, carbs: 44, fat: 16 },
  'ma-11': { calories: 310, protein: 4, carbs: 48, fat: 12 },
  'ma-12': { calories: 420, protein: 28, carbs: 14, fat: 28 },

  'in-1': { calories: 460, protein: 24, carbs: 32, fat: 26 },
  'in-2': { calories: 380, protein: 18, carbs: 42, fat: 16 },
  'in-3': { calories: 340, protein: 8, carbs: 58, fat: 8 },
  'in-4': { calories: 320, protein: 14, carbs: 22, fat: 20 },
  'in-5': { calories: 380, protein: 10, carbs: 44, fat: 18 },
  'in-6': { calories: 460, protein: 18, carbs: 52, fat: 20 },
  'in-7': { calories: 340, protein: 4, carbs: 58, fat: 10 },
  'in-8': { calories: 420, protein: 16, carbs: 38, fat: 24 },
  'in-9': { calories: 380, protein: 32, carbs: 8, fat: 24 },
  'in-10': { calories: 340, protein: 4, carbs: 58, fat: 10 },
  'in-11': { calories: 480, protein: 18, carbs: 56, fat: 20 },
  'in-12': { calories: 340, protein: 8, carbs: 58, fat: 8 },

  'es-1': { calories: 580, protein: 26, carbs: 64, fat: 24 },
  'es-2': { calories: 240, protein: 4, carbs: 16, fat: 18 },
  'es-3': { calories: 280, protein: 12, carbs: 8, fat: 22 },
  'es-4': { calories: 340, protein: 14, carbs: 28, fat: 20 },
  'es-5': { calories: 420, protein: 18, carbs: 24, fat: 28 },
  'es-6': { calories: 380, protein: 4, carbs: 48, fat: 20 },
  'es-7': { calories: 60, protein: 2, carbs: 4, fat: 4 },
  'es-8': { calories: 280, protein: 6, carbs: 36, fat: 12 },
  'es-9': { calories: 520, protein: 34, carbs: 42, fat: 24 },
  'es-10': { calories: 340, protein: 12, carbs: 28, fat: 20 },
  'es-11': { calories: 280, protein: 6, carbs: 36, fat: 12 },
  'es-12': { calories: 320, protein: 28, carbs: 16, fat: 16 },
};

export function getNutrition(recipeId: string, servings: number, baseServings: number): NutritionInfo | null {
  const base = nutritionData[recipeId];
  if (!base) return null;
  const ratio = servings / baseServings;
  return {
    calories: Math.round(base.calories * ratio),
    protein: Math.round(base.protein * ratio),
    carbs: Math.round(base.carbs * ratio),
    fat: Math.round(base.fat * ratio),
  };
}

export function getPerServingNutrition(recipeId: string): NutritionInfo | null {
  return nutritionData[recipeId] ?? null;
}
