import { Router, type IRouter, type Request, type Response } from "express";
import { recipes as mobileRecipes } from "../../../mobile/data/recipes";
import { countries as mobileCountries } from "../../../mobile/data/countries";
import { requireAdminAuth, signAdminToken, verifyAdminCredentials } from "../middlewares/auth";
import { db, ingredientsTable, featuredOverridesTable } from "@workspace/db";
import { asc, desc, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

// ═══════════════════════════════════════════════════════════════════
// Ingredient taxonomy schemas (Phase 3)
// ═══════════════════════════════════════════════════════════════════

const ingredientAisleSchema = z.enum([
  "produce",
  "protein",
  "dairy",
  "pantry",
  "spice",
]);

const createIngredientSchema = z
  .object({
    /** Slug ID — lowercase letters, digits, underscores only. */
    id: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[a-z0-9_]+$/, {
        message: "id must be lowercase letters, digits, or underscores",
      }),
    canonicalName: z.string().min(1).max(200),
    aisle: ingredientAisleSchema,
    synonyms: z.array(z.string().min(1).max(200)).max(50).default([]),
  })
  .strict();

const updateIngredientSchema = z
  .object({
    canonicalName: z.string().min(1).max(200).optional(),
    aisle: ingredientAisleSchema.optional(),
    synonyms: z.array(z.string().min(1).max(200)).max(50).optional(),
  })
  .strict();

// ═══════════════════════════════════════════════════════════════════
// Featured country override schemas (Phase 4)
// ═══════════════════════════════════════════════════════════════════

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: "Expected YYYY-MM-DD",
});

const upsertFeaturedOverrideSchema = z
  .object({
    date: dateStringSchema,
    countryId: z.string().min(1).max(100),
    reason: z.string().max(500).optional().nullable(),
  })
  .strict();

interface AdminRecipeRecord {
  id: string;
  title: string;
  description: string;
  countryId: string;
  countryName: string;
  region: string;
  category: string;
  difficulty: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  culturalNote: string;
  image: string;
  status: "live" | "hidden" | "draft";
  featured: boolean;
  featuredOrder: number;
  cookCount: number;
  tips: string[];
  ingredients: { name: string; amount: string; category?: string }[];
  steps: {
    id: string;
    title: string;
    instruction: string;
    instructionFirstSteps?: string;
    instructionChefsTable?: string;
    materials: string[];
    duration?: number;
  }[];
  createdAt: string;
}

const countryMap = new Map(mobileCountries.map((c) => [c.id, c]));

const adminRecipes: AdminRecipeRecord[] = mobileRecipes.map((r, idx) => {
  const country = countryMap.get(r.countryId);
  return {
    id: r.id,
    title: r.title,
    description: r.culturalNote.substring(0, 120),
    countryId: r.countryId,
    countryName: country?.name ?? r.countryId,
    region: country?.region ?? "",
    category: r.category,
    difficulty: r.difficulty,
    prepTime: `${r.prepTime} min`,
    cookTime: `${r.cookTime} min`,
    servings: r.servings,
    culturalNote: r.culturalNote,
    image: r.image,
    status: "live" as const,
    featured: idx < 5,
    featuredOrder: idx < 5 ? idx : 0,
    cookCount: Math.floor(Math.random() * 500) + 10,
    tips: [],
    ingredients: r.ingredients.map((ing) => ({
      name: ing.name,
      amount: ing.amount,
      category: ing.category,
    })),
    steps: r.steps.map((s, si) => ({
      id: `${r.id}-step-${si + 1}`,
      title: `Step ${si + 1}`,
      instruction: s.instruction,
      instructionFirstSteps: s.instructionFirstSteps,
      instructionChefsTable: s.instructionChefsTable,
      materials: [],
      duration: s.duration,
    })),
    createdAt: new Date(
      Date.now() - (mobileRecipes.length - idx) * 86400000
    ).toISOString(),
  };
});

const featuredMap = new Map<string, string[]>();
for (const country of mobileCountries) {
  const countryRecipes = adminRecipes.filter(
    (r) => r.countryId === country.id
  );
  featuredMap.set(
    country.id,
    countryRecipes.slice(0, Math.min(3, countryRecipes.length)).map((r) => r.id)
  );
}

interface MockUser {
  id: string;
  email: string;
  name: string;
  cookingLevel: string;
  subscriptionPlan: string;
  recipesCooked: number;
  cuisinesExplored: number;
  measurementSystem: string;
  temperatureUnit: string;
  groceryPartner: string;
  joinedAt: string;
  lastActiveAt: string;
  history: {
    recipeId: string;
    recipeTitle: string;
    completedAt: string;
    rating: number;
    cookTimeMinutes: number;
  }[];
  feedback: {
    recipeId: string;
    recipeTitle: string;
    comment: string;
    rating: number;
    createdAt: string;
  }[];
}

const firstNames = [
  "Emma", "Liam", "Sophia", "Noah", "Olivia", "James", "Ava", "William",
  "Isabella", "Benjamin", "Mia", "Lucas", "Charlotte", "Henry", "Amelia",
  "Alexander", "Harper", "Daniel", "Evelyn", "Matthew", "Luna", "Sebastian",
  "Aria", "Jack", "Scarlett",
];

const lastNames = [
  "Chen", "Rodriguez", "Kim", "Patel", "O'Brien", "Mueller", "Tanaka",
  "Santos", "Larsson", "Dubois", "Rossi", "Nakamura", "Garcia", "Weber",
  "Singh", "Park", "Jensen", "Costa", "Yamamoto", "Fischer",
];

const levels = ["First Steps", "Home Cook", "Confident Cook", "Chef's Table"];
const plans = ["free", "pro", "premium"];
const comments = [
  "Loved this recipe! The flavors were incredible.",
  "A bit challenging but the result was worth it.",
  "My family really enjoyed this one.",
  "Great weeknight dinner option.",
  "The cultural notes were fascinating.",
  "Perfect for a special occasion.",
  "Will definitely make this again.",
  "Needed a bit more seasoning for my taste.",
  "The step-by-step instructions were very helpful.",
  "A new favorite in our household!",
];

const mockUsers: MockUser[] = Array.from({ length: 48 }, (_, i) => {
  const firstName = firstNames[i % firstNames.length]!;
  const lastName = lastNames[i % lastNames.length]!;
  const historyCount = Math.floor(Math.random() * 8) + 1;
  const sampledRecipes = adminRecipes
    .sort(() => Math.random() - 0.5)
    .slice(0, historyCount);
  const feedbackCount = Math.min(
    Math.floor(Math.random() * 4),
    sampledRecipes.length
  );

  return {
    id: `user-${String(i + 1).padStart(3, "0")}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace("'", "")}@example.com`,
    name: `${firstName} ${lastName}`,
    cookingLevel: levels[Math.floor(Math.random() * levels.length)]!,
    subscriptionPlan: plans[Math.floor(Math.random() * plans.length)]!,
    recipesCooked: Math.floor(Math.random() * 60) + 1,
    cuisinesExplored: Math.floor(Math.random() * 7) + 1,
    measurementSystem: Math.random() > 0.4 ? "metric" : "imperial",
    temperatureUnit: Math.random() > 0.4 ? "celsius" : "fahrenheit",
    groceryPartner: ["none", "instacart", "amazon_fresh"][
      Math.floor(Math.random() * 3)
    ]!,
    joinedAt: new Date(
      Date.now() - Math.floor(Math.random() * 365) * 86400000
    ).toISOString(),
    lastActiveAt: new Date(
      Date.now() - Math.floor(Math.random() * 30) * 86400000
    ).toISOString(),
    history: sampledRecipes.slice(0, historyCount).map((r) => ({
      recipeId: r.id,
      recipeTitle: r.title,
      completedAt: new Date(
        Date.now() - Math.floor(Math.random() * 90) * 86400000
      ).toISOString(),
      rating: Math.floor(Math.random() * 3) + 3,
      cookTimeMinutes:
        parseInt(r.cookTime) + Math.floor(Math.random() * 20) - 5,
    })),
    feedback: sampledRecipes.slice(0, feedbackCount).map((r) => ({
      recipeId: r.id,
      recipeTitle: r.title,
      comment: comments[Math.floor(Math.random() * comments.length)]!,
      rating: Math.floor(Math.random() * 3) + 3,
      createdAt: new Date(
        Date.now() - Math.floor(Math.random() * 60) * 86400000
      ).toISOString(),
    })),
  };
});

router.post("/admin/login", (req: Request, res: Response) => {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };
  const subject = verifyAdminCredentials(email ?? "", password ?? "");
  if (!subject) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  res.json({
    token: signAdminToken(subject),
    user: { email: subject, role: "admin" },
  });
});

router.get("/admin/stats", requireAdminAuth, (_req: Request, res: Response) => {
  const regions = new Set(mobileCountries.map((c) => c.region));
  res.json({
    totalRecipes: adminRecipes.length,
    totalUsers: mockUsers.length,
    totalCountries: mobileCountries.length,
    totalRegions: regions.size,
    recentRecipes: adminRecipes.slice(-5).reverse().map((r) => ({
      id: r.id,
      title: r.title,
      createdAt: r.createdAt,
    })),
  });
});

router.get("/countries", (_req: Request, res: Response) => {
  res.json(
    mobileCountries.map((c) => ({
      id: c.id,
      name: c.name,
      flag: c.flag,
      region: c.region,
    }))
  );
});

// ═══════════════════════════════════════════════════════════════════
// Ingredient taxonomy (Phase 3)
// ═══════════════════════════════════════════════════════════════════

/**
 * Public endpoint: returns the full ingredient taxonomy for mobile
 * clients to normalize grocery items. Same privacy model as
 * /countries — the taxonomy is editorial content, not user data.
 *
 * Sorted by aisle then canonical name so the mobile client can
 * render the grocery list with predictable section ordering.
 */
router.get("/ingredients", async (_req: Request, res: Response) => {
  try {
    const rows = await db
      .select()
      .from(ingredientsTable)
      .orderBy(asc(ingredientsTable.aisle), asc(ingredientsTable.canonicalName));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch ingredients", details: String(err) });
  }
});

/**
 * Admin: list all ingredients with optional substring search.
 *
 *   GET /api/admin/ingredients
 *   GET /api/admin/ingredients?search=onion
 *
 * Search matches against canonical_name (case-insensitive) or against
 * any entry in the synonyms array.
 */
router.get("/admin/ingredients", requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim().toLowerCase() : "";
    const rows = await db
      .select()
      .from(ingredientsTable)
      .orderBy(asc(ingredientsTable.aisle), asc(ingredientsTable.canonicalName));

    if (!search) {
      res.json(rows);
      return;
    }
    const filtered = rows.filter((r) => {
      if (r.canonicalName.toLowerCase().includes(search)) return true;
      if (r.id.toLowerCase().includes(search)) return true;
      return r.synonyms.some((s) => s.toLowerCase().includes(search));
    });
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch ingredients", details: String(err) });
  }
});

router.post("/admin/ingredients", requireAdminAuth, async (req: Request, res: Response) => {
  const parsed = createIngredientSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }
  try {
    const [row] = await db
      .insert(ingredientsTable)
      .values(parsed.data)
      .returning();
    res.json(row);
  } catch (err) {
    // Postgres unique_violation → 409. drizzle-orm (0.45+) wraps pg errors
    // in DrizzleQueryError and stores the original on `.cause`. The pg
    // DatabaseError has `code: '23505'` for unique_violation, so look
    // inside `.cause` first and fall back to the top-level for safety.
    const errObj = err as { code?: string; cause?: { code?: string } } | null;
    const pgCode = errObj?.cause?.code ?? errObj?.code;
    if (pgCode === "23505") {
      res.status(409).json({ error: "Ingredient id already exists" });
      return;
    }
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to create ingredient", details: message });
  }
});

router.patch("/admin/ingredients/:id", requireAdminAuth, async (req: Request, res: Response) => {
  const id = req.params.id;
  if (typeof id !== "string" || id.length === 0 || id.length > 100) {
    res.status(400).json({ error: "Invalid id parameter" });
    return;
  }
  const parsed = updateIngredientSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }
  if (Object.keys(parsed.data).length === 0) {
    res.status(400).json({ error: "At least one field must be provided" });
    return;
  }

  try {
    const [row] = await db
      .update(ingredientsTable)
      .set({ ...parsed.data, updatedAt: sql`now()` })
      .where(eq(ingredientsTable.id, id))
      .returning();

    if (!row) {
      res.status(404).json({ error: "Ingredient not found" });
      return;
    }
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: "Failed to update ingredient", details: String(err) });
  }
});

router.delete("/admin/ingredients/:id", requireAdminAuth, async (req: Request, res: Response) => {
  const id = req.params.id;
  if (typeof id !== "string" || id.length === 0 || id.length > 100) {
    res.status(400).json({ error: "Invalid id parameter" });
    return;
  }
  try {
    const result = await db
      .delete(ingredientsTable)
      .where(eq(ingredientsTable.id, id))
      .returning({ id: ingredientsTable.id });

    if (result.length === 0) {
      res.status(404).json({ error: "Ingredient not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete ingredient", details: String(err) });
  }
});

// ═══════════════════════════════════════════════════════════════════
// Featured country overrides (Phase 4)
// ═══════════════════════════════════════════════════════════════════

/**
 * Public: returns today's override row if one exists, else 404.
 * Mobile clients call this on app launch to decide whether to use
 * the admin-pinned country or fall back to the day-of-year algorithm.
 */
router.get("/featured/today", async (_req: Request, res: Response) => {
  try {
    // Use the server's local date (UTC). The mobile app sends its
    // own local date in the future if we need per-timezone accuracy;
    // for now a single global "today" is fine — admins curating
    // "Valentine's Day Italy" don't care about UTC rollover edge cases.
    const today = new Date().toISOString().slice(0, 10);
    const rows = await db
      .select()
      .from(featuredOverridesTable)
      .where(eq(featuredOverridesTable.date, today))
      .limit(1);
    if (rows.length === 0) {
      res.status(404).json({ error: "No override for today" });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch today's override", details: String(err) });
  }
});

/**
 * Admin: list all overrides. Returns upcoming and today first,
 * past overrides sorted oldest-to-newest after — most useful
 * ordering for the admin UI which focuses on future scheduling.
 */
router.get("/admin/featured-overrides", requireAdminAuth, async (_req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = await db
      .select()
      .from(featuredOverridesTable)
      .where(gte(featuredOverridesTable.date, today))
      .orderBy(asc(featuredOverridesTable.date));
    const past = await db
      .select()
      .from(featuredOverridesTable)
      .where(sql`${featuredOverridesTable.date} < ${today}`)
      .orderBy(desc(featuredOverridesTable.date));
    res.json({ upcoming, past });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch overrides", details: String(err) });
  }
});

/**
 * Admin: upsert an override for a date. Unique constraint on date
 * means either a new insert or an update of the existing row.
 */
router.post(
  "/admin/featured-overrides",
  requireAdminAuth,
  async (req: Request, res: Response) => {
    const parsed = upsertFeaturedOverrideSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
      return;
    }
    try {
      const authedReq = req as Request & { adminSub?: string };
      const { date, countryId, reason } = parsed.data;
      const [row] = await db
        .insert(featuredOverridesTable)
        .values({
          date,
          countryId,
          reason: reason ?? null,
          createdBy: authedReq.adminSub ?? null,
        })
        .onConflictDoUpdate({
          target: featuredOverridesTable.date,
          set: {
            countryId,
            reason: reason ?? null,
            createdBy: authedReq.adminSub ?? null,
          },
        })
        .returning();
      res.json(row);
    } catch (err) {
      res.status(500).json({ error: "Failed to save override", details: String(err) });
    }
  },
);

/** Admin: delete an override for a specific date. */
router.delete(
  "/admin/featured-overrides/:date",
  requireAdminAuth,
  async (req: Request, res: Response) => {
    const date = req.params.date;
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: "Invalid date parameter" });
      return;
    }
    try {
      const result = await db
        .delete(featuredOverridesTable)
        .where(eq(featuredOverridesTable.date, date))
        .returning({ id: featuredOverridesTable.id });
      if (result.length === 0) {
        res.status(404).json({ error: "Override not found" });
        return;
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete override", details: String(err) });
    }
  },
);

router.get("/admin/recipes", requireAdminAuth, (req: Request, res: Response) => {
  const {
    search,
    countryId,
    difficulty,
    status,
    page: pageStr,
    limit: limitStr,
  } = req.query as Record<string, string | undefined>;

  let filtered = [...adminRecipes];

  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.title.toLowerCase().includes(s) ||
        r.countryName.toLowerCase().includes(s) ||
        r.id.toLowerCase().includes(s)
    );
  }
  if (countryId) {
    filtered = filtered.filter((r) => r.countryId === countryId);
  }
  if (difficulty) {
    filtered = filtered.filter((r) => r.difficulty === difficulty);
  }
  if (status) {
    filtered = filtered.filter((r) => r.status === status);
  }

  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(limitStr ?? "20", 10) || 20));
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);

  res.json({
    items,
    total: filtered.length,
    page,
    limit,
  });
});

router.get("/admin/recipes/:id", requireAdminAuth, (req: Request, res: Response) => {
  const recipe = adminRecipes.find((r) => r.id === req.params.id);
  if (!recipe) {
    res.status(404).json({ error: "Recipe not found" });
    return;
  }
  res.json(recipe);
});

router.patch("/admin/recipes/:id", requireAdminAuth, (req: Request, res: Response) => {
  const idx = adminRecipes.findIndex((r) => r.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "Recipe not found" });
    return;
  }
  const updates = req.body as Partial<AdminRecipeRecord>;
  Object.assign(adminRecipes[idx]!, updates);
  res.json(adminRecipes[idx]);
});

router.delete("/admin/recipes/:id", requireAdminAuth, (req: Request, res: Response) => {
  const idx = adminRecipes.findIndex((r) => r.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "Recipe not found" });
    return;
  }
  adminRecipes.splice(idx, 1);
  res.json({ success: true });
});

router.post("/admin/recipes/:id/feature", requireAdminAuth, (req: Request, res: Response) => {
  const recipe = adminRecipes.find((r) => r.id === req.params.id);
  if (!recipe) {
    res.status(404).json({ error: "Recipe not found" });
    return;
  }
  recipe.featured = !recipe.featured;
  if (recipe.featured) {
    const existing = featuredMap.get(recipe.countryId) ?? [];
    if (!existing.includes(recipe.id)) {
      existing.push(recipe.id);
      featuredMap.set(recipe.countryId, existing);
    }
    recipe.featuredOrder = existing.indexOf(recipe.id);
  } else {
    const existing = featuredMap.get(recipe.countryId) ?? [];
    featuredMap.set(
      recipe.countryId,
      existing.filter((id) => id !== recipe.id)
    );
    recipe.featuredOrder = 0;
  }
  res.json(recipe);
});

router.patch("/admin/recipes/:id/status", requireAdminAuth, (req: Request, res: Response) => {
  const recipe = adminRecipes.find((r) => r.id === req.params.id);
  if (!recipe) {
    res.status(404).json({ error: "Recipe not found" });
    return;
  }
  const { status } = req.body as { status: "live" | "hidden" | "draft" };
  if (status) {
    recipe.status = status;
  }
  res.json(recipe);
});

router.post("/admin/recipes/:id/duplicate", requireAdminAuth, (req: Request, res: Response) => {
  const original = adminRecipes.find((r) => r.id === req.params.id);
  if (!original) {
    res.status(404).json({ error: "Recipe not found" });
    return;
  }
  const newId = `${original.id}-copy-${Date.now()}`;
  const duplicate: AdminRecipeRecord = {
    ...JSON.parse(JSON.stringify(original)),
    id: newId,
    title: `${original.title} (Copy)`,
    status: "draft" as const,
    featured: false,
    featuredOrder: 0,
    createdAt: new Date().toISOString(),
  };
  adminRecipes.push(duplicate);
  res.json(duplicate);
});

router.patch("/admin/recipes/bulk", requireAdminAuth, (req: Request, res: Response) => {
  const { ids, status } = req.body as {
    ids: string[];
    status: "live" | "hidden" | "draft";
  };
  let count = 0;
  for (const id of ids) {
    const recipe = adminRecipes.find((r) => r.id === id);
    if (recipe) {
      recipe.status = status;
      count++;
    }
  }
  res.json({ success: true, count });
});

router.delete("/admin/recipes/bulk", requireAdminAuth, (req: Request, res: Response) => {
  const { ids } = req.body as { ids: string[] };
  let count = 0;
  for (const id of ids) {
    const idx = adminRecipes.findIndex((r) => r.id === id);
    if (idx !== -1) {
      adminRecipes.splice(idx, 1);
      count++;
    }
  }
  res.json({ success: true, count });
});

router.get(
  "/admin/featured/:countryId",
  requireAdminAuth,
  (req: Request, res: Response) => {
    const { countryId } = req.params;
    const ids = featuredMap.get(countryId) ?? [];
    const result = ids
      .map((id, order) => {
        const recipe = adminRecipes.find((r) => r.id === id);
        return recipe ? { id: recipe.id, title: recipe.title, order } : null;
      })
      .filter(Boolean);
    res.json(result);
  }
);

router.put(
  "/admin/featured/:countryId",
  requireAdminAuth,
  (req: Request, res: Response) => {
    const { countryId } = req.params;
    const { recipeIds } = req.body as { recipeIds: string[] };
    featuredMap.set(countryId, recipeIds.slice(0, 5));
    const result = recipeIds.slice(0, 5).map((id, order) => {
      const recipe = adminRecipes.find((r) => r.id === id);
      return { id, title: recipe?.title ?? id, order };
    });
    res.json(result);
  }
);

router.get("/admin/users", requireAdminAuth, (req: Request, res: Response) => {
  const {
    search,
    level,
    plan,
    page: pageStr,
    limit: limitStr,
  } = req.query as Record<string, string | undefined>;

  let filtered = [...mockUsers];

  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(
      (u) =>
        u.name.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s) ||
        u.id.toLowerCase().includes(s)
    );
  }
  if (level) {
    filtered = filtered.filter((u) => u.cookingLevel === level);
  }
  if (plan) {
    filtered = filtered.filter((u) => u.subscriptionPlan === plan);
  }

  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(limitStr ?? "20", 10) || 20));
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);

  res.json({
    items,
    total: filtered.length,
    page,
    limit,
  });
});

router.get("/admin/users/:id", requireAdminAuth, (req: Request, res: Response) => {
  const user = mockUsers.find((u) => u.id === req.params.id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
});

router.get("/admin/settings", requireAdminAuth, (_req: Request, res: Response) => {
  res.json({
    admins: [
      { email: "admin@forkandcompass.com", role: "admin" },
      { email: "editor@forkandcompass.com", role: "editor" },
    ],
    defaultMeasurement: "metric",
    defaultCookingTier: "standard",
    totalRecipes: adminRecipes.length,
    totalUsers: mockUsers.length,
    totalCountries: mobileCountries.length,
  });
});

router.patch("/admin/settings", requireAdminAuth, (req: Request, res: Response) => {
  const updates = req.body as {
    defaultMeasurement?: string;
    defaultCookingTier?: string;
  };
  res.json({
    admins: [
      { email: "admin@forkandcompass.com", role: "admin" },
      { email: "editor@forkandcompass.com", role: "editor" },
    ],
    defaultMeasurement: updates.defaultMeasurement ?? "metric",
    defaultCookingTier: updates.defaultCookingTier ?? "standard",
    totalRecipes: adminRecipes.length,
    totalUsers: mockUsers.length,
    totalCountries: mobileCountries.length,
  });
});

export default router;
