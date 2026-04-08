import { Recipe } from '@/data/recipes';
import { TimelineEvent, DinnerPlan, CookConfig, EventType } from '@/types/kitchen';

// ═══════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════

const PASSIVE_KEYWORDS = [
  'simmer', 'roast', 'bake', 'marinate', 'rest', 'chill', 'refrigerate',
  'steep', 'reduce', 'cool', 'freeze', 'soak', 'ferment', 'proof',
  'oven', 'boil',
];

const PASSIVE_REGEX = new RegExp(`\\b(${PASSIVE_KEYWORDS.join('|')})`, 'i');

const BUFFER_MINUTES = 5;

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

function diffMinutes(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 60_000);
}

function isPassiveStep(instruction: string): boolean {
  return PASSIVE_REGEX.test(instruction);
}

// ═══════════════════════════════════════════
// Step duration estimation
// ═══════════════════════════════════════════

interface StepTiming {
  recipeId: string;
  recipeName: string;
  stepIndex: number;
  instruction: string;
  materials: string[];
  totalMinutes: number;
  activeMinutes: number;
  passiveMinutes: number;
  isPassive: boolean;
  startTime: Date;
  endTime: Date;
}

function estimateStepDurations(recipe: Recipe): StepTiming[] {
  const totalMinutes = recipe.prepTime + recipe.cookTime;
  const stepsCount = recipe.steps.length;

  return recipe.steps.map((step, idx) => {
    // Use step.duration if available, otherwise distribute evenly
    const stepMinutes = step.duration ?? totalMinutes / stepsCount;
    const passive = isPassiveStep(step.instruction);

    // Extract ingredient names mentioned in this step as materials
    const materials = recipe.ingredients
      .filter((ing) => step.instruction.toLowerCase().includes(ing.name.toLowerCase()))
      .map((ing) => `${ing.amount} ${ing.name}`);

    return {
      recipeId: recipe.id,
      recipeName: recipe.title,
      stepIndex: idx,
      instruction: step.instruction,
      materials,
      totalMinutes: stepMinutes,
      activeMinutes: passive ? stepMinutes * 0.15 : stepMinutes * 0.90,
      passiveMinutes: passive ? stepMinutes * 0.85 : stepMinutes * 0.10,
      isPassive: passive,
      startTime: new Date(0), // Placeholder — filled in backward scheduling
      endTime: new Date(0),
    };
  });
}

// ═══════════════════════════════════════════
// Backward scheduling
// ═══════════════════════════════════════════

interface ScheduledRecipe {
  recipe: Recipe;
  steps: StepTiming[];
  totalDuration: number;
  startTime: Date;
  endTime: Date;
}

function scheduleRecipes(recipes: Recipe[], servingTime: Date): ScheduledRecipe[] {
  // Estimate durations for each recipe
  const recipeTimings = recipes.map((recipe) => {
    const steps = estimateStepDurations(recipe);
    const totalDuration = steps.reduce((sum, s) => sum + s.totalMinutes, 0);
    return { recipe, steps, totalDuration, startTime: new Date(0), endTime: servingTime };
  });

  // Sort by total duration descending (critical path first)
  recipeTimings.sort((a, b) => b.totalDuration - a.totalDuration);

  // Backward schedule each recipe
  for (const rt of recipeTimings) {
    let cursor = servingTime;

    // Work backward from last step to first
    for (let i = rt.steps.length - 1; i >= 0; i--) {
      const step = rt.steps[i];
      step.endTime = cursor;
      step.startTime = addMinutes(cursor, -step.totalMinutes);
      cursor = step.startTime;
    }

    rt.startTime = rt.steps[0]?.startTime ?? servingTime;
    rt.endTime = servingTime;
  }

  return recipeTimings;
}

// ═══════════════════════════════════════════
// Event generation
// ═══════════════════════════════════════════

function generateEvents(scheduledRecipes: ScheduledRecipe[], servingTime: Date): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const sr of scheduledRecipes) {
    for (const step of sr.steps) {
      const type: EventType = step.isPassive ? 'passive' : 'active';
      events.push({
        id: `${step.recipeId}-step-${step.stepIndex}`,
        type,
        startTime: step.startTime,
        endTime: step.endTime,
        recipeId: step.recipeId,
        recipeName: step.recipeName,
        stepIndex: step.stepIndex,
        cookAssignment: 'lead',
        title: `Step ${step.stepIndex + 1}`,
        instruction: step.instruction,
        materials: step.materials,
        durationMinutes: step.totalMinutes,
      });
    }
  }

  // Add transition events for gaps between recipes
  if (scheduledRecipes.length > 1) {
    for (let i = 0; i < scheduledRecipes.length - 1; i++) {
      const current = scheduledRecipes[i];
      const next = scheduledRecipes[i + 1];
      const gap = diffMinutes(next.startTime, current.endTime);
      if (gap > 0) {
        events.push({
          id: `transition-${current.recipe.id}-${next.recipe.id}`,
          type: 'transition',
          startTime: current.endTime,
          endTime: next.startTime,
          recipeId: '',
          recipeName: '',
          stepIndex: -1,
          cookAssignment: 'lead',
          title: 'Transition',
          instruction: `Switch from ${current.recipe.title} to ${next.recipe.title}`,
          materials: [],
          durationMinutes: gap,
        });
      }
    }
  }

  // Add finish event at serving time
  events.push({
    id: 'finish',
    type: 'finish',
    startTime: servingTime,
    endTime: servingTime,
    recipeId: '',
    recipeName: '',
    stepIndex: -1,
    cookAssignment: 'lead',
    title: 'Dinner is served!',
    instruction: 'All dishes are ready. Time to plate and enjoy.',
    materials: [],
    durationMinutes: 0,
  });

  // Sort chronologically
  events.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  return events;
}

// ═══════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════

/**
 * Build a backward-planned dinner timeline.
 *
 * Takes one or more recipes and a target serving time, then generates
 * a chronological sequence of cooking events working backward from
 * when dinner should be on the table.
 *
 * @param recipes - Array of Recipe objects to cook
 * @param targetServingTime - When dinner should be served
 * @param config - Cook configuration (solo mode, servings)
 * @returns A complete DinnerPlan with sorted timeline events
 */
export function buildDinnerTimeline(
  recipes: Recipe[],
  targetServingTime: Date,
  config: CookConfig
): DinnerPlan {
  if (recipes.length === 0) {
    return {
      id: generateId(),
      recipes: [],
      events: [],
      targetTime: targetServingTime,
      startTime: targetServingTime,
      totalDurationMinutes: 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
  }

  // Apply buffer before serving time
  const servingTime = addMinutes(targetServingTime, -BUFFER_MINUTES);

  // Schedule all recipes backward from serving time
  const scheduledRecipes = scheduleRecipes(recipes, servingTime);

  // Generate chronological events
  const events = generateEvents(scheduledRecipes, targetServingTime);

  // Find the earliest start time across all recipes
  const overallStartTime = scheduledRecipes.reduce(
    (earliest, sr) => (sr.startTime < earliest ? sr.startTime : earliest),
    servingTime
  );

  const totalDurationMinutes = diffMinutes(targetServingTime, overallStartTime);

  return {
    id: generateId(),
    recipes: recipes.map((r) => ({ id: r.id, name: r.title, countryId: r.countryId })),
    events,
    targetTime: targetServingTime,
    startTime: overallStartTime,
    totalDurationMinutes,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
}
