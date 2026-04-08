export type EventType = 'active' | 'passive' | 'transition' | 'finish';
export type CookAssignment = 'lead' | 'helper';

export interface TimelineEvent {
  id: string;
  type: EventType;
  startTime: Date;
  endTime: Date;
  recipeId: string;
  recipeName: string;
  stepIndex: number;
  cookAssignment: CookAssignment;
  title: string;
  instruction: string;
  materials: string[];
  durationMinutes: number;
}

export interface DinnerPlan {
  id: string;
  recipes: Array<{ id: string; name: string; countryId: string }>;
  events: TimelineEvent[];
  targetTime: Date;
  startTime: Date;
  totalDurationMinutes: number;
  status: 'pending' | 'active' | 'completed';
  createdAt: string;
}

export interface CookConfig {
  mode: 'solo'; // Two-cook deferred
  servings: number;
}
