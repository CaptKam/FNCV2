export interface DinnerParty {
  id: string;
  date: string;
  hostName: string;
  title: string;
  targetServingTime: string;
  cuisineCountryId: string;
  status: 'planning' | 'invites_sent' | 'cooking' | 'completed' | 'cancelled';
  createdAt: string;
  menu: DinnerPartyMenu;
  guests: DinnerGuest[];
  estimatedStartTime?: string;
  totalCookMinutes?: number;
}

export interface DinnerPartyMenu {
  appetizer?: {
    recipeId: string;
    recipeName: string;
    recipeImage: string;
  };
  main?: {
    recipeId: string;
    recipeName: string;
    recipeImage: string;
  };
  dessert?: {
    recipeId: string;
    recipeName: string;
    recipeImage: string;
  };
}

export interface DinnerGuest {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  rsvpStatus: 'pending' | 'accepted' | 'maybe' | 'declined';
  dietaryRestrictions: string[];
  allergens: string[];
  inviteSentAt?: string;
  rsvpRespondedAt?: string;
  notes?: string;
}

export interface DietaryConflict {
  guestName: string;
  restriction: string;
  conflictingRecipe: string;
  conflictingIngredient: string;
  severity: 'warning' | 'critical';
}
