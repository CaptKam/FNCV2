/**
 * End-to-end integration tests for the api-server.
 *
 * Uses node's built-in test runner (no new dependencies). Spins up
 * the Express app on an ephemeral 127.0.0.1 port, hits it with
 * real HTTP requests, and verifies side effects against Postgres.
 *
 * Run with:
 *
 *   DATABASE_URL=postgresql://... pnpm --filter @workspace/api-server test
 *
 * The test database is the same Postgres the dev server uses. Test
 * data is isolated via:
 *   - "test-" prefix on device IDs (users)
 *   - "test_" prefix on ingredient slugs
 *   - year-2099 dates for featured overrides
 * All created rows are cleaned up in the top-level after() hook.
 *
 * Coverage (38 cases across 7 describe blocks):
 *   - Admin auth (login, dev fallback, token validation)
 *   - Mobile registration & authentication
 *   - Cook completion atomic updates (the Fix #1 verification)
 *   - Itinerary sync
 *   - Grocery sync
 *   - Ingredient taxonomy CRUD
 *   - Featured country overrides
 *   - User-scoping security
 *   - Request validation
 */
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  adminLogin,
  asObject,
  cleanupAll,
  registerTestUser,
  request,
  startTestServer,
  stopTestServer,
  trackFlag,
  trackIngredient,
  trackOverride,
} from "./helpers";

before(async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set to run integration tests. " +
        "Example: DATABASE_URL=postgresql://... pnpm test",
    );
  }
  await startTestServer();
});

after(async () => {
  await cleanupAll();
  await stopTestServer();
});

// ═══════════════════════════════════════════════════════════════════
// Admin authentication
// ═══════════════════════════════════════════════════════════════════

describe("admin auth", () => {
  test("POST /api/admin/login with correct dev credentials returns a token", async () => {
    const res = await request("POST", "/api/admin/login", {
      body: { email: "admin@forkandcompass.com", password: "admin123" },
    });
    assert.equal(res.status, 200);
    const body = asObject(res.body);
    assert.equal(typeof body.token, "string");
    const token = body.token as string;
    // Signed token format: <payload_b64>.<sig_b64>
    assert.match(token, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    const user = asObject(body.user);
    assert.equal(user.email, "admin@forkandcompass.com");
    assert.equal(user.role, "admin");
  });

  test("POST /api/admin/login with wrong password returns 401", async () => {
    const res = await request("POST", "/api/admin/login", {
      body: { email: "admin@forkandcompass.com", password: "wrong" },
    });
    assert.equal(res.status, 401);
  });

  test("POST /api/admin/login with unknown email returns 401", async () => {
    const res = await request("POST", "/api/admin/login", {
      body: { email: "nobody@example.com", password: "whatever" },
    });
    assert.equal(res.status, 401);
  });

  test("GET /api/admin/stats without token returns 401", async () => {
    const res = await request("GET", "/api/admin/stats");
    assert.equal(res.status, 401);
  });

  test("GET /api/admin/stats with malformed token returns 401", async () => {
    const res = await request("GET", "/api/admin/stats", {
      token: "not.a.real.token",
    });
    assert.equal(res.status, 401);
  });

  test("GET /api/admin/stats with valid admin token returns stats", async () => {
    const token = await adminLogin();
    const res = await request("GET", "/api/admin/stats", { token });
    assert.equal(res.status, 200);
    const body = asObject(res.body);
    assert.equal(typeof body.totalRecipes, "number");
    assert.equal(typeof body.totalUsers, "number");
    assert.equal(typeof body.totalCountries, "number");
    assert.equal(typeof body.totalRegions, "number");
  });
});

// ═══════════════════════════════════════════════════════════════════
// Mobile registration & auth
// ═══════════════════════════════════════════════════════════════════

describe("mobile registration", () => {
  test("POST /api/users/register creates a user + returns a token", async () => {
    const { userId, token, deviceId } = await registerTestUser();
    assert.match(userId, /^[0-9a-f-]{36}$/);
    assert.match(token, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    assert.ok(deviceId.startsWith("test-"));
  });

  test("POST /api/users/register with same deviceId returns same userId", async () => {
    const { userId, deviceId } = await registerTestUser();
    const res = await request("POST", "/api/users/register", { body: { deviceId } });
    assert.equal(res.status, 200);
    const body = asObject(res.body);
    assert.equal(body.userId, userId);
  });

  test("POST /api/users/register with missing deviceId returns 400", async () => {
    const res = await request("POST", "/api/users/register", { body: {} });
    assert.equal(res.status, 400);
  });

  test("GET /api/users/me without token returns 401", async () => {
    const res = await request("GET", "/api/users/me");
    assert.equal(res.status, 401);
  });

  test("GET /api/users/me with valid token returns the full state shape", async () => {
    const { token } = await registerTestUser();
    const res = await request("GET", "/api/users/me", { token });
    assert.equal(res.status, 200);
    const body = asObject(res.body);
    const user = asObject(body.user);
    assert.equal(typeof user.id, "string");
    assert.equal(Array.isArray(body.itinerary), true);
    assert.equal(Array.isArray(body.grocery), true);
    assert.equal(Array.isArray(body.bookmarks), true);
    assert.equal(Array.isArray(body.dinnerParties), true);
    // Freshly-registered user has an empty history with zero xp.
    const history = asObject(body.history);
    assert.equal(history.xp, 0);
    assert.equal(history.totalRecipesCooked, 0);
    assert.deepEqual(history.passportStamps, {});
  });
});

// ═══════════════════════════════════════════════════════════════════
// Itinerary sync
// ═══════════════════════════════════════════════════════════════════

describe("itinerary sync", () => {
  test("PUT /itinerary/:date creates a day, then GET /me returns it", async () => {
    const { token } = await registerTestUser();
    const date = "2099-05-01";
    const day = {
      dayLabel: "Friday",
      hasDinnerParty: false,
      courses: {
        main: {
          recipeId: "it-1",
          recipeName: "Test Recipe",
          recipeImage: "https://example.com/img.jpg",
          countryFlag: "🇮🇹",
          cookTime: 30,
          addedAt: new Date().toISOString(),
        },
      },
    };
    const putRes = await request("PUT", `/api/users/me/itinerary/${date}`, {
      token,
      body: day,
    });
    assert.equal(putRes.status, 200);

    const meRes = await request("GET", "/api/users/me", { token });
    assert.equal(meRes.status, 200);
    const me = asObject(meRes.body);
    const itinerary = me.itinerary as Array<Record<string, unknown>>;
    assert.equal(itinerary.length, 1);
    assert.equal(itinerary[0].date, date);
    assert.equal(itinerary[0].dayLabel, "Friday");
  });

  test("PUT /itinerary/:date twice updates the same day (upsert)", async () => {
    const { token } = await registerTestUser();
    const date = "2099-05-02";
    const base = {
      dayLabel: "Saturday",
      hasDinnerParty: false,
      courses: { main: { recipeId: "it-1", recipeName: "First", recipeImage: "", countryFlag: "", cookTime: 30, addedAt: "2099-05-02T00:00:00Z" } },
    };
    await request("PUT", `/api/users/me/itinerary/${date}`, { token, body: base });
    await request("PUT", `/api/users/me/itinerary/${date}`, {
      token,
      body: { ...base, courses: { main: { ...base.courses.main, recipeName: "Updated" } } },
    });
    const meRes = await request("GET", "/api/users/me", { token });
    const me = asObject(meRes.body);
    const itinerary = me.itinerary as Array<Record<string, unknown>>;
    assert.equal(itinerary.length, 1);
    const courses = itinerary[0].courses as Record<string, Record<string, unknown>>;
    assert.equal(courses.main.recipeName, "Updated");
  });

  test("DELETE /itinerary/:date removes the day", async () => {
    const { token } = await registerTestUser();
    const date = "2099-05-03";
    await request("PUT", `/api/users/me/itinerary/${date}`, {
      token,
      body: { dayLabel: "Sunday", hasDinnerParty: false, courses: {} },
    });
    const delRes = await request("DELETE", `/api/users/me/itinerary/${date}`, { token });
    assert.equal(delRes.status, 200);
    const meRes = await request("GET", "/api/users/me", { token });
    const me = asObject(meRes.body);
    assert.equal((me.itinerary as unknown[]).length, 0);
  });

  test("PUT /itinerary/:date with malformed body returns 400", async () => {
    const { token } = await registerTestUser();
    const res = await request("PUT", "/api/users/me/itinerary/2099-05-04", {
      token,
      body: { not: "a valid day" },
    });
    assert.equal(res.status, 400);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Grocery sync
// ═══════════════════════════════════════════════════════════════════

describe("grocery sync", () => {
  test("PUT /grocery creates an item, GET /me returns it", async () => {
    const { token } = await registerTestUser();
    const item = {
      stableId: "test-grocery-1",
      name: "Test Onion",
      amount: "2",
      unit: "",
      category: "produce" as const,
      recipeNames: ["Test Recipe"],
      sourceAmounts: { "Test Recipe": "2" },
      sourceDates: { "Test Recipe": "2099-05-01" },
      checked: false,
      excluded: false,
    };
    const putRes = await request("PUT", "/api/users/me/grocery", { token, body: item });
    assert.equal(putRes.status, 200);

    const meRes = await request("GET", "/api/users/me", { token });
    const me = asObject(meRes.body);
    const grocery = me.grocery as Array<Record<string, unknown>>;
    assert.equal(grocery.length, 1);
    assert.equal(grocery[0].stableId, "test-grocery-1");
    assert.equal(grocery[0].name, "Test Onion");
    assert.deepEqual(grocery[0].sourceDates, { "Test Recipe": "2099-05-01" });
  });

  test("POST /grocery/bulk creates multiple items in one request", async () => {
    const { token } = await registerTestUser();
    const items = [
      {
        stableId: "test-bulk-1",
        name: "Tomato",
        amount: "3",
        unit: "",
        category: "produce" as const,
        recipeNames: ["R1"],
        sourceAmounts: { R1: "3" },
        sourceDates: { R1: "2099-05-01" },
        checked: false,
        excluded: false,
      },
      {
        stableId: "test-bulk-2",
        name: "Basil",
        amount: "1 bunch",
        unit: "",
        category: "produce" as const,
        recipeNames: ["R1"],
        sourceAmounts: { R1: "1 bunch" },
        sourceDates: { R1: "2099-05-01" },
        checked: false,
        excluded: false,
      },
    ];
    const bulkRes = await request("POST", "/api/users/me/grocery/bulk", {
      token,
      body: { items },
    });
    assert.equal(bulkRes.status, 200);
    const body = asObject(bulkRes.body);
    assert.equal(body.count, 2);

    const meRes = await request("GET", "/api/users/me", { token });
    const me = asObject(meRes.body);
    assert.equal((me.grocery as unknown[]).length, 2);
  });

  test("PUT /grocery then toggle checked via second PUT", async () => {
    const { token } = await registerTestUser();
    const base = {
      stableId: "test-grocery-toggle",
      name: "Garlic",
      amount: "3 cloves",
      unit: "",
      category: "produce" as const,
      recipeNames: ["R1"],
      sourceAmounts: { R1: "3 cloves" },
      sourceDates: { R1: "2099-05-01" },
      checked: false,
      excluded: false,
    };
    await request("PUT", "/api/users/me/grocery", { token, body: base });
    await request("PUT", "/api/users/me/grocery", {
      token,
      body: { ...base, checked: true },
    });
    const meRes = await request("GET", "/api/users/me", { token });
    const me = asObject(meRes.body);
    const grocery = me.grocery as Array<Record<string, unknown>>;
    assert.equal(grocery.length, 1);
    assert.equal(grocery[0].checked, true);
  });

  test("DELETE /grocery/:stableId removes the item", async () => {
    const { token } = await registerTestUser();
    const item = {
      stableId: "test-grocery-delete",
      name: "Flour",
      amount: "2 cups",
      unit: "",
      category: "pantry" as const,
      recipeNames: ["R1"],
      sourceAmounts: { R1: "2 cups" },
      sourceDates: { R1: "2099-05-01" },
      checked: false,
      excluded: false,
    };
    await request("PUT", "/api/users/me/grocery", { token, body: item });
    const delRes = await request(
      "DELETE",
      "/api/users/me/grocery/test-grocery-delete",
      { token },
    );
    assert.equal(delRes.status, 200);
    const meRes = await request("GET", "/api/users/me", { token });
    const me = asObject(meRes.body);
    assert.equal((me.grocery as unknown[]).length, 0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Cook completion — the Fix #1 verification
// ═══════════════════════════════════════════════════════════════════

describe("cook completion (fix #1)", () => {
  test("first cook: increments totalRecipesCooked, xp, level, stamp", async () => {
    const { token } = await registerTestUser();
    const res = await request("POST", "/api/users/me/cook", {
      token,
      body: { recipeId: "it-1", countryId: "italy", xpAward: 50 },
    });
    assert.equal(res.status, 200);
    const body = asObject(res.body);
    const history = asObject(body.history);
    assert.equal(history.totalRecipesCooked, 1);
    assert.equal(history.xp, 50);
    // xp 50 < thresholds[1] = 100 → still level 1
    assert.equal(history.level, 1);
    assert.deepEqual(history.passportStamps, { italy: 1 });
  });

  test("second cook same country: stamp increments to 2, xp to 100", async () => {
    const { token } = await registerTestUser();
    await request("POST", "/api/users/me/cook", {
      token,
      body: { recipeId: "it-1", countryId: "italy", xpAward: 50 },
    });
    const res = await request("POST", "/api/users/me/cook", {
      token,
      body: { recipeId: "it-2", countryId: "italy", xpAward: 50 },
    });
    const body = asObject(res.body);
    const history = asObject(body.history);
    assert.equal(history.xp, 100);
    assert.equal(history.totalRecipesCooked, 2);
    assert.deepEqual(history.passportStamps, { italy: 2 });
  });

  test("different countries: independent stamps", async () => {
    const { token } = await registerTestUser();
    await request("POST", "/api/users/me/cook", {
      token,
      body: { recipeId: "it-1", countryId: "italy", xpAward: 50 },
    });
    await request("POST", "/api/users/me/cook", {
      token,
      body: { recipeId: "fr-1", countryId: "france", xpAward: 50 },
    });
    const res = await request("POST", "/api/users/me/cook", {
      token,
      body: { recipeId: "jp-1", countryId: "japan", xpAward: 50 },
    });
    const body = asObject(res.body);
    const history = asObject(body.history);
    assert.deepEqual(history.passportStamps, { italy: 1, france: 1, japan: 1 });
    assert.equal(history.totalRecipesCooked, 3);
    assert.equal(history.xp, 150);
  });

  test("level recomputes from app_settings thresholds", async () => {
    const { token } = await registerTestUser();
    // Cook 6 times @ 50 XP each (server-authoritative) = 300 XP.
    // With the seeded level_thresholds [0,100,250,500,1000,...]:
    //   xp 300 satisfies >= 250 but not >= 500 → level 3.
    // If the seed hasn't run, the server falls back to the same
    // default thresholds, so this test is stable either way.
    for (let i = 0; i < 6; i++) {
      await request("POST", "/api/users/me/cook", {
        token,
        body: { recipeId: `it-${i}`, countryId: "italy" },
      });
    }
    const meRes = await request("GET", "/api/users/me", { token });
    const me = asObject(meRes.body);
    const history = asObject(me.history);
    assert.equal(history.xp, 300);
    assert.equal(history.level, 3);
    assert.deepEqual(history.passportStamps, { italy: 6 });
  });

  test("cook endpoint without token returns 401", async () => {
    const res = await request("POST", "/api/users/me/cook", {
      body: { recipeId: "it-1", countryId: "italy" },
    });
    assert.equal(res.status, 401);
  });
});

// ═══════════════════════════════════════════════════════════════════
// User scoping — security critical
// ═══════════════════════════════════════════════════════════════════

describe("user scoping", () => {
  test("user A cannot see user B's itinerary", async () => {
    const a = await registerTestUser();
    const b = await registerTestUser();
    // A creates a day
    await request("PUT", "/api/users/me/itinerary/2099-06-01", {
      token: a.token,
      body: { dayLabel: "Tuesday", hasDinnerParty: false, courses: {} },
    });
    // B reads their own state
    const meB = await request("GET", "/api/users/me", { token: b.token });
    const bodyB = asObject(meB.body);
    assert.equal((bodyB.itinerary as unknown[]).length, 0);
  });

  test("user A cannot delete user B's grocery item", async () => {
    const a = await registerTestUser();
    const b = await registerTestUser();
    // A creates a grocery item
    await request("PUT", "/api/users/me/grocery", {
      token: a.token,
      body: {
        stableId: "test-scope-item",
        name: "Test",
        amount: "",
        unit: "",
        category: "produce" as const,
        recipeNames: [],
        sourceAmounts: {},
        sourceDates: {},
        checked: false,
        excluded: false,
      },
    });
    // B tries to delete by the same stableId — the DELETE succeeds but
    // scopes to B's own items, so A's item is untouched.
    await request("DELETE", "/api/users/me/grocery/test-scope-item", { token: b.token });
    const meA = await request("GET", "/api/users/me", { token: a.token });
    const bodyA = asObject(meA.body);
    assert.equal((bodyA.grocery as unknown[]).length, 1);
  });

  test("user A's cook completion doesn't affect user B's xp", async () => {
    const a = await registerTestUser();
    const b = await registerTestUser();
    await request("POST", "/api/users/me/cook", {
      token: a.token,
      body: { recipeId: "it-1", countryId: "italy", xpAward: 50 },
    });
    const meB = await request("GET", "/api/users/me", { token: b.token });
    const bodyB = asObject(meB.body);
    const historyB = asObject(bodyB.history);
    assert.equal(historyB.xp, 0);
    assert.equal(historyB.totalRecipesCooked, 0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Ingredient taxonomy
// ═══════════════════════════════════════════════════════════════════

describe("ingredient taxonomy", () => {
  test("GET /api/ingredients is public and returns an array", async () => {
    const res = await request("GET", "/api/ingredients");
    assert.equal(res.status, 200);
    assert.equal(Array.isArray(res.body), true);
  });

  test("GET /api/admin/ingredients without token returns 401", async () => {
    const res = await request("GET", "/api/admin/ingredients");
    assert.equal(res.status, 401);
  });

  test("POST then DELETE /api/admin/ingredients round-trips", async () => {
    const token = await adminLogin();
    const id = `test_ingredient_${Date.now()}`;
    trackIngredient(id);
    const createRes = await request("POST", "/api/admin/ingredients", {
      token,
      body: {
        id,
        canonicalName: "Test Ingredient",
        aisle: "produce",
        synonyms: ["test ingredient", "testing"],
      },
    });
    assert.equal(createRes.status, 200);
    const created = asObject(createRes.body);
    assert.equal(created.id, id);
    assert.equal(created.canonicalName, "Test Ingredient");

    const delRes = await request("DELETE", `/api/admin/ingredients/${id}`, { token });
    assert.equal(delRes.status, 200);
  });

  test("POST duplicate id returns 409", async () => {
    const token = await adminLogin();
    const id = `test_dup_${Date.now()}`;
    trackIngredient(id);
    await request("POST", "/api/admin/ingredients", {
      token,
      body: { id, canonicalName: "Dup", aisle: "pantry", synonyms: [] },
    });
    const res = await request("POST", "/api/admin/ingredients", {
      token,
      body: { id, canonicalName: "Dup", aisle: "pantry", synonyms: [] },
    });
    assert.equal(res.status, 409);
  });

  test("POST with invalid id format returns 400", async () => {
    const token = await adminLogin();
    const res = await request("POST", "/api/admin/ingredients", {
      token,
      body: {
        id: "INVALID CAPS AND SPACES",
        canonicalName: "Bad",
        aisle: "pantry",
        synonyms: [],
      },
    });
    assert.equal(res.status, 400);
  });

  test("PATCH updates a subset of fields", async () => {
    const token = await adminLogin();
    const id = `test_patch_${Date.now()}`;
    trackIngredient(id);
    await request("POST", "/api/admin/ingredients", {
      token,
      body: { id, canonicalName: "Original", aisle: "pantry", synonyms: ["a"] },
    });
    const patchRes = await request("PATCH", `/api/admin/ingredients/${id}`, {
      token,
      body: { canonicalName: "Updated" },
    });
    assert.equal(patchRes.status, 200);
    const updated = asObject(patchRes.body);
    assert.equal(updated.canonicalName, "Updated");
    assert.equal(updated.aisle, "pantry"); // unchanged
    assert.deepEqual(updated.synonyms, ["a"]); // unchanged
  });
});

// ═══════════════════════════════════════════════════════════════════
// Featured country overrides
// ═══════════════════════════════════════════════════════════════════

describe("featured country overrides", () => {
  test("POST /admin/featured-overrides then GET /featured/today for that date", async () => {
    const token = await adminLogin();
    // Use today so GET /featured/today can find it.
    const today = new Date().toISOString().slice(0, 10);
    trackOverride(today);

    const createRes = await request("POST", "/api/admin/featured-overrides", {
      token,
      body: { date: today, countryId: "italy", reason: "integration test" },
    });
    assert.equal(createRes.status, 200);
    const created = asObject(createRes.body);
    assert.equal(created.date, today);
    assert.equal(created.countryId, "italy");

    const todayRes = await request("GET", "/api/featured/today");
    assert.equal(todayRes.status, 200);
    const body = asObject(todayRes.body);
    assert.equal(body.countryId, "italy");

    const delRes = await request("DELETE", `/api/admin/featured-overrides/${today}`, {
      token,
    });
    assert.equal(delRes.status, 200);

    // After delete, /featured/today should 404 again.
    const afterRes = await request("GET", "/api/featured/today");
    assert.equal(afterRes.status, 404);
  });

  test("POST with same date upserts instead of conflicting", async () => {
    const token = await adminLogin();
    const date = "2099-12-25";
    trackOverride(date);
    await request("POST", "/api/admin/featured-overrides", {
      token,
      body: { date, countryId: "italy", reason: "first" },
    });
    const res = await request("POST", "/api/admin/featured-overrides", {
      token,
      body: { date, countryId: "france", reason: "second" },
    });
    assert.equal(res.status, 200);
    const body = asObject(res.body);
    assert.equal(body.countryId, "france");
    assert.equal(body.reason, "second");
  });

  test("GET /api/admin/featured-overrides returns upcoming + past buckets", async () => {
    const token = await adminLogin();
    const res = await request("GET", "/api/admin/featured-overrides", { token });
    assert.equal(res.status, 200);
    const body = asObject(res.body);
    assert.equal(Array.isArray(body.upcoming), true);
    assert.equal(Array.isArray(body.past), true);
  });

  test("DELETE nonexistent override returns 404", async () => {
    const token = await adminLogin();
    const res = await request("DELETE", "/api/admin/featured-overrides/2099-01-01", {
      token,
    });
    assert.equal(res.status, 404);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Remote config — feature flags + app settings
// ═══════════════════════════════════════════════════════════════════

describe("remote config", () => {
  test("GET /api/config is public and returns flags + settings", async () => {
    const res = await request("GET", "/api/config");
    assert.equal(res.status, 200);
    const body = asObject(res.body);
    assert.equal(typeof body.flags, "object");
    assert.equal(typeof body.settings, "object");
    assert.equal(typeof body.version, "string");
    assert.equal(typeof body.updated_at, "string");
  });

  test("GET /api/admin/feature-flags requires auth", async () => {
    const res = await request("GET", "/api/admin/feature-flags");
    assert.equal(res.status, 401);
  });

  test("GET /api/admin/feature-flags returns an array", async () => {
    const token = await adminLogin();
    const res = await request("GET", "/api/admin/feature-flags", { token });
    assert.equal(res.status, 200);
    const body = asObject(res.body);
    assert.equal(Array.isArray(body.flags), true);
  });

  test("POST /api/admin/feature-flags creates a new flag", async () => {
    const token = await adminLogin();
    const key = `test_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    trackFlag(key);
    const res = await request("POST", "/api/admin/feature-flags", {
      token,
      body: {
        key,
        label: "Test Flag",
        description: "integration test",
        category: "Testing",
        enabled: false,
      },
    });
    assert.equal(res.status, 200);
    const body = asObject(res.body);
    assert.equal(body.key, key);
    assert.equal(body.enabled, false);
  });

  test("POST duplicate flag key returns 409", async () => {
    const token = await adminLogin();
    const key = `test_dup_${Date.now()}`;
    trackFlag(key);
    await request("POST", "/api/admin/feature-flags", {
      token,
      body: { key, label: "First", enabled: true },
    });
    const res = await request("POST", "/api/admin/feature-flags", {
      token,
      body: { key, label: "Second", enabled: true },
    });
    assert.equal(res.status, 409);
  });

  test("PATCH /api/admin/feature-flags/:key flips enabled", async () => {
    const token = await adminLogin();
    const key = `test_patch_${Date.now()}`;
    trackFlag(key);
    await request("POST", "/api/admin/feature-flags", {
      token,
      body: { key, label: "Patch", enabled: true },
    });
    const res = await request("PATCH", `/api/admin/feature-flags/${key}`, {
      token,
      body: { enabled: false },
    });
    assert.equal(res.status, 200);
    const body = asObject(res.body);
    assert.equal(body.enabled, false);
  });

  test("PATCH nonexistent feature flag returns 404", async () => {
    const token = await adminLogin();
    const res = await request(
      "PATCH",
      "/api/admin/feature-flags/test_definitely_nonexistent_xxx",
      { token, body: { enabled: true } },
    );
    assert.equal(res.status, 404);
  });

  test("GET /api/admin/app-settings requires auth", async () => {
    const res = await request("GET", "/api/admin/app-settings");
    assert.equal(res.status, 401);
  });

  test("GET /api/admin/app-settings returns an array", async () => {
    const token = await adminLogin();
    const res = await request("GET", "/api/admin/app-settings", { token });
    assert.equal(res.status, 200);
    const body = asObject(res.body);
    assert.equal(Array.isArray(body.settings), true);
  });

  test("PATCH /api/admin/app-settings/:key updates a number setting", async () => {
    const token = await adminLogin();
    // Requires the seed to have run — xp_per_recipe is a seeded row.
    // Skip gracefully if the seed wasn't applied.
    const before = await request("GET", "/api/admin/app-settings", { token });
    const beforeBody = asObject(before.body) as { settings: Array<{ key: string; value: string }> };
    const existing = beforeBody.settings.find((s) => s.key === "xp_per_recipe");
    if (!existing) {
      // Can't test without a seeded setting — note and move on.
      return;
    }
    const original = existing.value;
    const res = await request("PATCH", "/api/admin/app-settings/xp_per_recipe", {
      token,
      body: { value: "75" },
    });
    assert.equal(res.status, 200);
    const body = asObject(res.body);
    assert.equal(body.value, "75");
    // Put it back so we don't leave the DB polluted for other tests.
    await request("PATCH", "/api/admin/app-settings/xp_per_recipe", {
      token,
      body: { value: original },
    });
  });

  test("PATCH app-setting with invalid number returns 400", async () => {
    const token = await adminLogin();
    const before = await request("GET", "/api/admin/app-settings", { token });
    const beforeBody = asObject(before.body) as { settings: Array<{ key: string }> };
    if (!beforeBody.settings.find((s) => s.key === "xp_per_recipe")) return;
    const res = await request("PATCH", "/api/admin/app-settings/xp_per_recipe", {
      token,
      body: { value: "not-a-number" },
    });
    assert.equal(res.status, 400);
  });

  test("PATCH nonexistent app setting returns 404", async () => {
    const token = await adminLogin();
    const res = await request(
      "PATCH",
      "/api/admin/app-settings/test_definitely_nonexistent_xxx",
      { token, body: { value: "1" } },
    );
    assert.equal(res.status, 404);
  });

  test("GET /api/config parses number + json_array settings correctly", async () => {
    const res = await request("GET", "/api/config");
    assert.equal(res.status, 200);
    const body = asObject(res.body);
    const settings = body.settings as Record<string, unknown>;
    // Only assert shape if the seed has run — otherwise these keys
    // simply won't be present and there's nothing to verify.
    if (settings.xp_per_recipe !== undefined) {
      assert.equal(typeof settings.xp_per_recipe, "number");
    }
    if (settings.level_thresholds !== undefined) {
      assert.equal(Array.isArray(settings.level_thresholds), true);
    }
  });
});
