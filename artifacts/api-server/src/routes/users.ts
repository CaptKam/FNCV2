/**
 * Mobile user sync endpoints.
 *
 * These power the mobile app's Option C hybrid data layer:
 *   - Recipes stay local in artifacts/mobile/data/recipes.ts
 *   - User-scoped data (itinerary, grocery, history, bookmarks,
 *     dinner parties) lives in Postgres and syncs over these routes
 *
 * Phase 1 is anonymous-only. A device calls POST /api/users/register
 * with a stable device ID, receives a session token, and attaches
 * `Authorization: Bearer <token>` on every subsequent request.
 *
 * Every endpoint except /register is gated by `requireMobileAuth`,
 * which validates the token against the `device_sessions` table and
 * attaches `req.mobileUser = { userId, sessionId }`.
 *
 * The mobile sync strategy (from the plan):
 *   - On app foreground: GET /api/users/me → reconcile local state
 *   - On state mutation: targeted PUT/POST/DELETE with debouncing
 *   - Offline: queue writes in AsyncStorage, retry on reconnect
 */
import { Router, type IRouter, type Response, type NextFunction } from "express";
import {
  db,
  usersTable,
  userHistoryTable,
  deviceSessionsTable,
  itineraryDaysTable,
  groceryItemsTable,
  bookmarksTable,
  dinnerPartiesTable,
  type PlannedMeal,
  type DinnerGuest,
  type DinnerPartyMenu,
} from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { requireMobileAuth, signMobileToken, type MobileAuthedRequest } from "../middlewares/mobileAuth";

const router: IRouter = Router();

// ═══════════════════════════════════════════════════════════════════
// Request schemas (zod) — validate wire format before touching the DB
// ═══════════════════════════════════════════════════════════════════

const registerSchema = z.object({
  deviceId: z.string().min(8).max(256),
  platform: z.enum(["ios", "android", "web"]).optional(),
});

const preferencesSchema = z
  .object({
    displayName: z.string().max(50).optional(),
    avatarId: z.string().max(50).optional(),
    cookingLevel: z.enum(["beginner", "home_cook", "chef"]).optional(),
    coursePreference: z.enum(["main", "full"]).optional(),
    groceryPartner: z.enum(["instacart", "kroger", "walmart", "amazon_fresh"]).optional(),
    zipCode: z.string().max(20).optional(),
    useMetric: z.boolean().optional(),
    defaultServings: z.number().int().min(1).max(24).optional(),
    dietaryFlags: z.array(z.string()).optional(),
    allergens: z.array(z.string()).optional(),
    hasCompletedOnboarding: z.boolean().optional(),
  })
  .strict();

const plannedMealSchema = z
  .object({
    recipeId: z.string(),
    recipeName: z.string(),
    recipeImage: z.string(),
    countryFlag: z.string(),
    cookTime: z.number().int().nonnegative(),
    addedAt: z.string(),
    servings: z.number().int().positive().optional(),
  })
  .strict();

const itineraryDayBodySchema = z
  .object({
    dayLabel: z.string().min(1).max(20),
    hasDinnerParty: z.boolean().optional(),
    courses: z
      .object({
        appetizer: plannedMealSchema.optional(),
        main: plannedMealSchema.optional(),
        dessert: plannedMealSchema.optional(),
      })
      .strict(),
  })
  .strict();

const groceryItemBodySchema = z
  .object({
    stableId: z.string().min(1).max(200),
    name: z.string().min(1).max(200),
    amount: z.string().max(100).default(""),
    unit: z.string().max(50).default(""),
    category: z.enum(["produce", "protein", "dairy", "pantry", "spice"]),
    recipeNames: z.array(z.string()).default([]),
    sourceAmounts: z.record(z.string(), z.string()).default({}),
    sourceDates: z.record(z.string(), z.string()).default({}),
    checked: z.boolean().default(false),
    excluded: z.boolean().default(false),
  })
  .strict();

const groceryBulkSchema = z.object({
  items: z.array(groceryItemBodySchema).max(500),
});

const cookCompletionSchema = z
  .object({
    recipeId: z.string(),
    countryId: z.string(),
    recipeName: z.string().optional(),
    xpAward: z.number().int().positive().max(1000).default(50),
  })
  .strict();

const dinnerGuestSchema: z.ZodType<DinnerGuest> = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  phone: z.string().max(30).optional(),
  email: z.string().max(200).optional(),
  rsvpStatus: z.enum(["pending", "accepted", "maybe", "declined"]),
  dietaryRestrictions: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
  notes: z.string().max(500).optional(),
  inviteSentAt: z.string().optional(),
  rsvpRespondedAt: z.string().optional(),
}) as z.ZodType<DinnerGuest>;

const dinnerPartyMenuSchema: z.ZodType<DinnerPartyMenu> = z
  .object({
    appetizer: z.object({ recipeId: z.string(), recipeName: z.string() }).optional(),
    main: z.object({ recipeId: z.string(), recipeName: z.string() }).optional(),
    dessert: z.object({ recipeId: z.string(), recipeName: z.string() }).optional(),
  })
  .strict() as z.ZodType<DinnerPartyMenu>;

const dinnerPartyCreateSchema = z
  .object({
    date: z.string(),
    title: z.string().min(1).max(200),
    targetServingTime: z.string(),
    cuisineCountryId: z.string(),
    menu: dinnerPartyMenuSchema.optional(),
    guests: z.array(dinnerGuestSchema).optional(),
    estimatedStartTime: z.string().optional(),
    totalCookMinutes: z.number().int().nonnegative().optional(),
  })
  .strict();

const dinnerPartyUpdateSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    targetServingTime: z.string().optional(),
    status: z
      .enum(["planning", "invites_sent", "cooking", "completed", "cancelled"])
      .optional(),
    menu: dinnerPartyMenuSchema.optional(),
    guests: z.array(dinnerGuestSchema).optional(),
    estimatedStartTime: z.string().nullable().optional(),
    totalCookMinutes: z.number().int().nonnegative().nullable().optional(),
  })
  .strict();

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

function getUserId(req: MobileAuthedRequest): string {
  if (!req.mobileUser) {
    // Should never happen — middleware rejects before this runs.
    throw new Error("mobileUser missing on authenticated request");
  }
  return req.mobileUser.userId;
}

/**
 * Wrap an async handler so unhandled promise rejections become
 * next(err) calls. Express 5 handles this natively, but being
 * explicit makes the intent obvious and keeps the type signature
 * clean.
 */
function asyncHandler(
  fn: (req: MobileAuthedRequest, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: MobileAuthedRequest, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// ═══════════════════════════════════════════════════════════════════
// POST /api/users/register — create or resume anonymous account
// ═══════════════════════════════════════════════════════════════════

/**
 * Idempotent: if a user with this deviceId already exists, we return
 * the same user row and mint a NEW session (so multiple installs on
 * the same device don't share tokens, and reinstalls get a clean
 * session).
 *
 * Wrapped in a transaction so the three inserts (user, history,
 * session) either all succeed or all roll back.
 */
router.post(
  "/users/register",
  asyncHandler(async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
      return;
    }
    const { deviceId, platform } = parsed.data;

    const result = await db.transaction(async (tx) => {
      // Find or create user
      const existing = await tx
        .select()
        .from(usersTable)
        .where(eq(usersTable.deviceId, deviceId))
        .limit(1);

      let user = existing[0];
      if (!user) {
        const [created] = await tx
          .insert(usersTable)
          .values({ deviceId })
          .returning();
        user = created;
        // Initialize the 1:1 history row alongside the user
        await tx.insert(userHistoryTable).values({ userId: user.id });
      }

      // Always mint a fresh session
      const [session] = await tx
        .insert(deviceSessionsTable)
        .values({ userId: user.id, deviceId, platform })
        .returning();

      return { user, session };
    });

    res.json({
      userId: result.user.id,
      token: signMobileToken(result.session.id),
      user: result.user,
    });
  }),
);

// All routes below require a valid mobile device token.
router.use("/users/me", requireMobileAuth);

// ═══════════════════════════════════════════════════════════════════
// GET /api/users/me — full user state for foreground reconcile
// ═══════════════════════════════════════════════════════════════════

router.get(
  "/users/me",
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);

    // Fan out in parallel — all six queries are independent.
    const [user, history, itinerary, grocery, bookmarks, dinnerParties] = await Promise.all([
      db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1),
      db.select().from(userHistoryTable).where(eq(userHistoryTable.userId, userId)).limit(1),
      db.select().from(itineraryDaysTable).where(eq(itineraryDaysTable.userId, userId)),
      db.select().from(groceryItemsTable).where(eq(groceryItemsTable.userId, userId)),
      db.select().from(bookmarksTable).where(eq(bookmarksTable.userId, userId)),
      db.select().from(dinnerPartiesTable).where(eq(dinnerPartiesTable.userId, userId)),
    ]);

    if (user.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      user: user[0],
      history: history[0] ?? null,
      itinerary,
      grocery,
      bookmarks,
      dinnerParties,
    });
  }),
);

// ═══════════════════════════════════════════════════════════════════
// PATCH /api/users/me/preferences — update user prefs
// ═══════════════════════════════════════════════════════════════════

router.patch(
  "/users/me/preferences",
  asyncHandler(async (req, res) => {
    const parsed = preferencesSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
      return;
    }
    const userId = getUserId(req);

    const [updated] = await db
      .update(usersTable)
      .set({ ...parsed.data, updatedAt: sql`now()` })
      .where(eq(usersTable.id, userId))
      .returning();

    res.json({ user: updated });
  }),
);

// ═══════════════════════════════════════════════════════════════════
// Itinerary
// ═══════════════════════════════════════════════════════════════════

const dateParamSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: "Expected YYYY-MM-DD",
});

router.put(
  "/users/me/itinerary/:date",
  asyncHandler(async (req, res) => {
    const dateParse = dateParamSchema.safeParse(req.params.date);
    if (!dateParse.success) {
      res.status(400).json({ error: "Invalid date parameter" });
      return;
    }
    const bodyParse = itineraryDayBodySchema.safeParse(req.body);
    if (!bodyParse.success) {
      res.status(400).json({ error: "Invalid request", details: bodyParse.error.issues });
      return;
    }
    const userId = getUserId(req);
    const date = dateParse.data;
    const body = bodyParse.data;

    const [row] = await db
      .insert(itineraryDaysTable)
      .values({
        userId,
        date,
        dayLabel: body.dayLabel,
        hasDinnerParty: body.hasDinnerParty ?? false,
        courses: body.courses as { appetizer?: PlannedMeal; main?: PlannedMeal; dessert?: PlannedMeal },
      })
      .onConflictDoUpdate({
        target: [itineraryDaysTable.userId, itineraryDaysTable.date],
        set: {
          dayLabel: body.dayLabel,
          hasDinnerParty: body.hasDinnerParty ?? false,
          courses: body.courses as { appetizer?: PlannedMeal; main?: PlannedMeal; dessert?: PlannedMeal },
          updatedAt: sql`now()`,
        },
      })
      .returning();

    res.json({ day: row });
  }),
);

router.delete(
  "/users/me/itinerary/:date",
  asyncHandler(async (req, res) => {
    const dateParse = dateParamSchema.safeParse(req.params.date);
    if (!dateParse.success) {
      res.status(400).json({ error: "Invalid date parameter" });
      return;
    }
    const userId = getUserId(req);
    await db
      .delete(itineraryDaysTable)
      .where(
        and(
          eq(itineraryDaysTable.userId, userId),
          eq(itineraryDaysTable.date, dateParse.data),
        ),
      );
    res.json({ success: true });
  }),
);

// ═══════════════════════════════════════════════════════════════════
// Grocery
// ═══════════════════════════════════════════════════════════════════

router.put(
  "/users/me/grocery",
  asyncHandler(async (req, res) => {
    const parsed = groceryItemBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
      return;
    }
    const userId = getUserId(req);
    const body = parsed.data;

    const [row] = await db
      .insert(groceryItemsTable)
      .values({ ...body, userId })
      .onConflictDoUpdate({
        target: [groceryItemsTable.userId, groceryItemsTable.stableId],
        set: {
          name: body.name,
          amount: body.amount,
          unit: body.unit,
          category: body.category,
          recipeNames: body.recipeNames,
          sourceAmounts: body.sourceAmounts,
          sourceDates: body.sourceDates,
          checked: body.checked,
          excluded: body.excluded,
          updatedAt: sql`now()`,
        },
      })
      .returning();

    res.json({ item: row });
  }),
);

router.post(
  "/users/me/grocery/bulk",
  asyncHandler(async (req, res) => {
    const parsed = groceryBulkSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
      return;
    }
    const userId = getUserId(req);
    if (parsed.data.items.length === 0) {
      res.json({ count: 0 });
      return;
    }

    const rows = parsed.data.items.map((item) => ({ ...item, userId }));
    await db
      .insert(groceryItemsTable)
      .values(rows)
      .onConflictDoUpdate({
        target: [groceryItemsTable.userId, groceryItemsTable.stableId],
        // Postgres `EXCLUDED.*` refers to the proposed row in the conflict.
        set: {
          name: sql`EXCLUDED.name`,
          amount: sql`EXCLUDED.amount`,
          unit: sql`EXCLUDED.unit`,
          category: sql`EXCLUDED.category`,
          recipeNames: sql`EXCLUDED.recipe_names`,
          sourceAmounts: sql`EXCLUDED.source_amounts`,
          sourceDates: sql`EXCLUDED.source_dates`,
          checked: sql`EXCLUDED.checked`,
          excluded: sql`EXCLUDED.excluded`,
          updatedAt: sql`now()`,
        },
      });

    res.json({ count: rows.length });
  }),
);

router.delete(
  "/users/me/grocery/:stableId",
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    const stableId = req.params.stableId;
    if (typeof stableId !== "string" || stableId.length === 0 || stableId.length > 200) {
      res.status(400).json({ error: "Invalid stableId" });
      return;
    }
    await db
      .delete(groceryItemsTable)
      .where(
        and(
          eq(groceryItemsTable.userId, userId),
          eq(groceryItemsTable.stableId, stableId),
        ),
      );
    res.json({ success: true });
  }),
);

// ═══════════════════════════════════════════════════════════════════
// POST /api/users/me/cook — record cook completion atomically
// ═══════════════════════════════════════════════════════════════════

router.post(
  "/users/me/cook",
  asyncHandler(async (req, res) => {
    const parsed = cookCompletionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
      return;
    }
    const userId = getUserId(req);
    const { countryId, xpAward } = parsed.data;

    // Single atomic update: bump cook count, XP, recompute level,
    // and increment the passport stamp for this country.
    //
    // level = floor(xp / 300) + 1 — matches the mobile app's formula
    // in AppContext.completeCookSessionInternal().
    //
    // We use jsonb_set + coalesce so the stamp increments cleanly
    // whether or not the country already has an entry in the JSON.
    const [row] = await db
      .update(userHistoryTable)
      .set({
        totalRecipesCooked: sql`${userHistoryTable.totalRecipesCooked} + 1`,
        xp: sql`${userHistoryTable.xp} + ${xpAward}`,
        level: sql`((${userHistoryTable.xp} + ${xpAward}) / 300) + 1`,
        passportStamps: sql`jsonb_set(
          ${userHistoryTable.passportStamps},
          array[${countryId}],
          to_jsonb(coalesce((${userHistoryTable.passportStamps} ->> ${countryId})::int, 0) + 1)
        )`,
        updatedAt: sql`now()`,
      })
      .where(eq(userHistoryTable.userId, userId))
      .returning();

    res.json({ history: row });
  }),
);

// ═══════════════════════════════════════════════════════════════════
// Bookmarks
// ═══════════════════════════════════════════════════════════════════

router.put(
  "/users/me/bookmarks/:recipeId",
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    const recipeId = req.params.recipeId;
    if (typeof recipeId !== "string" || recipeId.length === 0 || recipeId.length > 100) {
      res.status(400).json({ error: "Invalid recipeId" });
      return;
    }
    // Idempotent — DO NOTHING on conflict.
    await db
      .insert(bookmarksTable)
      .values({ userId, recipeId })
      .onConflictDoNothing();
    res.json({ success: true });
  }),
);

router.delete(
  "/users/me/bookmarks/:recipeId",
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    const recipeId = req.params.recipeId;
    if (typeof recipeId !== "string" || recipeId.length === 0 || recipeId.length > 100) {
      res.status(400).json({ error: "Invalid recipeId" });
      return;
    }
    await db
      .delete(bookmarksTable)
      .where(
        and(eq(bookmarksTable.userId, userId), eq(bookmarksTable.recipeId, recipeId)),
      );
    res.json({ success: true });
  }),
);

// ═══════════════════════════════════════════════════════════════════
// Dinner parties
// ═══════════════════════════════════════════════════════════════════

router.post(
  "/users/me/dinner-parties",
  asyncHandler(async (req, res) => {
    const parsed = dinnerPartyCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
      return;
    }
    const userId = getUserId(req);
    const body = parsed.data;

    const [row] = await db
      .insert(dinnerPartiesTable)
      .values({
        userId,
        date: body.date,
        title: body.title,
        targetServingTime: body.targetServingTime,
        cuisineCountryId: body.cuisineCountryId,
        menu: body.menu ?? {},
        guests: body.guests ?? [],
        estimatedStartTime: body.estimatedStartTime ?? null,
        totalCookMinutes: body.totalCookMinutes ?? null,
      })
      .returning();

    res.json({ party: row });
  }),
);

router.patch(
  "/users/me/dinner-parties/:id",
  asyncHandler(async (req, res) => {
    const parsed = dinnerPartyUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
      return;
    }
    const userId = getUserId(req);
    const partyId = req.params.id;
    if (typeof partyId !== "string" || partyId.length === 0) {
      res.status(400).json({ error: "Invalid party id" });
      return;
    }

    const updates: Record<string, unknown> = { updatedAt: sql`now()` };
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined) updates[key] = value;
    }

    const [row] = await db
      .update(dinnerPartiesTable)
      .set(updates)
      .where(
        and(eq(dinnerPartiesTable.id, partyId), eq(dinnerPartiesTable.userId, userId)),
      )
      .returning();

    if (!row) {
      res.status(404).json({ error: "Party not found" });
      return;
    }
    res.json({ party: row });
  }),
);

router.delete(
  "/users/me/dinner-parties/:id",
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);
    const partyId = req.params.id;
    if (typeof partyId !== "string" || partyId.length === 0) {
      res.status(400).json({ error: "Invalid party id" });
      return;
    }

    const result = await db
      .delete(dinnerPartiesTable)
      .where(
        and(eq(dinnerPartiesTable.id, partyId), eq(dinnerPartiesTable.userId, userId)),
      )
      .returning({ id: dinnerPartiesTable.id });

    if (result.length === 0) {
      res.status(404).json({ error: "Party not found" });
      return;
    }
    res.json({ success: true });
  }),
);

export default router;
