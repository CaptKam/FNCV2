import { Router, type IRouter, type Request, type Response } from "express";
import { recipes as mobileRecipes } from "../../../mobile/data/recipes";
import { countries as mobileCountries } from "../../../mobile/data/countries";

const router: IRouter = Router();

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
  if (email === "admin@forkandcompass.com" && password === "admin123") {
    res.json({
      token: "mock-jwt-token-" + Date.now(),
      user: { email, role: "admin" },
    });
    return;
  }
  res.status(401).json({ error: "Invalid credentials" });
});

router.get("/admin/stats", (_req: Request, res: Response) => {
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

router.get("/admin/recipes", (req: Request, res: Response) => {
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

router.get("/admin/recipes/:id", (req: Request, res: Response) => {
  const recipe = adminRecipes.find((r) => r.id === req.params.id);
  if (!recipe) {
    res.status(404).json({ error: "Recipe not found" });
    return;
  }
  res.json(recipe);
});

router.patch("/admin/recipes/:id", (req: Request, res: Response) => {
  const idx = adminRecipes.findIndex((r) => r.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "Recipe not found" });
    return;
  }
  const updates = req.body as Partial<AdminRecipeRecord>;
  Object.assign(adminRecipes[idx]!, updates);
  res.json(adminRecipes[idx]);
});

router.delete("/admin/recipes/:id", (req: Request, res: Response) => {
  const idx = adminRecipes.findIndex((r) => r.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "Recipe not found" });
    return;
  }
  adminRecipes.splice(idx, 1);
  res.json({ success: true });
});

router.post("/admin/recipes/:id/feature", (req: Request, res: Response) => {
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

router.patch("/admin/recipes/:id/status", (req: Request, res: Response) => {
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

router.post("/admin/recipes/:id/duplicate", (req: Request, res: Response) => {
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

router.patch("/admin/recipes/bulk", (req: Request, res: Response) => {
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

router.delete("/admin/recipes/bulk", (req: Request, res: Response) => {
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

router.get("/admin/users", (req: Request, res: Response) => {
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

router.get("/admin/users/:id", (req: Request, res: Response) => {
  const user = mockUsers.find((u) => u.id === req.params.id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
});

router.get("/admin/settings", (_req: Request, res: Response) => {
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

router.patch("/admin/settings", (req: Request, res: Response) => {
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
