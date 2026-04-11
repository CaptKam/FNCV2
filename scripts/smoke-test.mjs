#!/usr/bin/env node
/**
 * Smoke test — runs against a live api-server.
 *
 * Usage:
 *   node scripts/smoke-test.mjs                  # defaults to http://127.0.0.1:3001
 *   node scripts/smoke-test.mjs http://host:port # override target
 *   API_URL=https://api.example.com node scripts/smoke-test.mjs
 *
 * Prints a pass/fail checklist for every critical path and exits
 * with a non-zero status if any check fails. Safe to run against
 * the dev server — all created test data is cleaned up at the end
 * (or tagged with "smoke-" prefixes so it's easy to identify and
 * remove manually if a check aborts mid-run).
 *
 * Zero dependencies. Uses Node's built-in fetch (Node 18+).
 */

const DEFAULT_URL = "http://127.0.0.1:3001";
const BASE_URL = (process.argv[2] || process.env.API_URL || DEFAULT_URL).replace(
  /\/+$/,
  "",
);

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

let passed = 0;
let failed = 0;
const failures = [];

/** Run a labeled check. If the callback throws, the check fails. */
async function check(label, fn) {
  try {
    await fn();
    console.log(`${GREEN}✓${RESET} ${label}`);
    passed++;
  } catch (err) {
    console.log(`${RED}✗${RESET} ${label}`);
    console.log(`  ${DIM}${err.message}${RESET}`);
    failed++;
    failures.push(`${label}: ${err.message}`);
  }
}

/** Minimal fetch wrapper with error context. */
async function call(method, path, { body, token } = {}) {
  const headers = { "content-type": "application/json", accept: "application/json" };
  if (token) headers["authorization"] = `Bearer ${token}`;
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new Error(`fetch failed: ${err.message}`);
  }
  let parsed = null;
  try {
    parsed = await response.json();
  } catch {
    /* no body */
  }
  return { status: response.status, body: parsed };
}

function mustEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function mustBeArray(value, label) {
  if (!Array.isArray(value)) {
    throw new Error(`${label}: expected array, got ${typeof value}`);
  }
}

function mustBeString(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label}: expected non-empty string, got ${JSON.stringify(value)}`);
  }
}

function mustBeObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label}: expected object, got ${JSON.stringify(value)}`);
  }
}

// ═══════════════════════════════════════════════════════════════════

console.log();
console.log(`Smoke-testing ${BASE_URL}`);
console.log(`${DIM}${"─".repeat(50)}${RESET}`);
console.log();

// ─── Server reachability ────────────────────────────────────────────

await check("Server responding on /api/countries", async () => {
  const r = await call("GET", "/api/countries");
  mustEqual(r.status, 200, "status");
  mustBeArray(r.body, "response body");
});

await check("Public ingredient taxonomy endpoint returns an array", async () => {
  const r = await call("GET", "/api/ingredients");
  mustEqual(r.status, 200, "status");
  mustBeArray(r.body, "response body");
});

await check("Featured/today returns 404 when no override exists", async () => {
  const r = await call("GET", "/api/featured/today");
  if (r.status !== 404 && r.status !== 200) {
    throw new Error(`expected 404 or 200, got ${r.status}`);
  }
});

// ─── Admin auth ─────────────────────────────────────────────────────

let adminToken;
await check("Admin login with dev credentials returns a token", async () => {
  const r = await call("POST", "/api/admin/login", {
    body: { email: "admin@forkandcompass.com", password: "admin123" },
  });
  mustEqual(r.status, 200, "status");
  mustBeObject(r.body, "body");
  mustBeString(r.body.token, "token");
  adminToken = r.body.token;
});

await check("Admin login with wrong password returns 401", async () => {
  const r = await call("POST", "/api/admin/login", {
    body: { email: "admin@forkandcompass.com", password: "nope" },
  });
  mustEqual(r.status, 401, "status");
});

await check("Admin /stats endpoint requires a token", async () => {
  const r = await call("GET", "/api/admin/stats");
  mustEqual(r.status, 401, "status");
});

await check("Admin /stats with valid token returns stats", async () => {
  if (!adminToken) throw new Error("no admin token from previous check");
  const r = await call("GET", "/api/admin/stats", { token: adminToken });
  mustEqual(r.status, 200, "status");
  mustBeObject(r.body, "body");
});

// ─── Mobile registration + auth ─────────────────────────────────────

let userToken;
let userId;
const deviceId = `smoke-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

await check("Mobile register creates a user and returns a token", async () => {
  const r = await call("POST", "/api/users/register", { body: { deviceId } });
  mustEqual(r.status, 200, "status");
  mustBeObject(r.body, "body");
  mustBeString(r.body.token, "token");
  mustBeString(r.body.userId, "userId");
  userToken = r.body.token;
  userId = r.body.userId;
});

await check("GET /users/me without token returns 401", async () => {
  const r = await call("GET", "/api/users/me");
  mustEqual(r.status, 401, "status");
});

await check("GET /users/me with valid token returns full state", async () => {
  if (!userToken) throw new Error("no user token");
  const r = await call("GET", "/api/users/me", { token: userToken });
  mustEqual(r.status, 200, "status");
  mustBeObject(r.body, "body");
  mustBeArray(r.body.itinerary, "itinerary");
  mustBeArray(r.body.grocery, "grocery");
  mustBeArray(r.body.bookmarks, "bookmarks");
  mustBeArray(r.body.dinnerParties, "dinnerParties");
});

// ─── Itinerary round-trip ───────────────────────────────────────────

await check("PUT itinerary day then GET /me returns it", async () => {
  const date = "2099-05-01";
  const putRes = await call("PUT", `/api/users/me/itinerary/${date}`, {
    token: userToken,
    body: {
      dayLabel: "Friday",
      hasDinnerParty: false,
      courses: {
        main: {
          recipeId: "it-1",
          recipeName: "Smoke Test Recipe",
          recipeImage: "",
          countryFlag: "🇮🇹",
          cookTime: 30,
          addedAt: new Date().toISOString(),
        },
      },
    },
  });
  mustEqual(putRes.status, 200, "put status");

  const meRes = await call("GET", "/api/users/me", { token: userToken });
  const found = meRes.body.itinerary.find((d) => d.date === date);
  if (!found) throw new Error(`day ${date} not found in /me response`);
});

// ─── Grocery round-trip ─────────────────────────────────────────────

await check("PUT grocery item then GET /me returns it", async () => {
  const putRes = await call("PUT", "/api/users/me/grocery", {
    token: userToken,
    body: {
      stableId: "smoke-test-item",
      name: "Smoke Onion",
      amount: "1",
      unit: "",
      category: "produce",
      recipeNames: ["Smoke Test"],
      sourceAmounts: { "Smoke Test": "1" },
      sourceDates: { "Smoke Test": "2099-05-01" },
      checked: false,
      excluded: false,
    },
  });
  mustEqual(putRes.status, 200, "put status");

  const meRes = await call("GET", "/api/users/me", { token: userToken });
  const found = meRes.body.grocery.find((g) => g.stableId === "smoke-test-item");
  if (!found) throw new Error("item not found in /me response");
});

// ─── Cook completion (the Fix #1 verification) ──────────────────────

await check("POST /cook increments xp + level + passport stamp", async () => {
  const before = await call("GET", "/api/users/me", { token: userToken });
  const xpBefore = before.body.history?.xp ?? 0;
  const cookedBefore = before.body.history?.totalRecipesCooked ?? 0;

  const cookRes = await call("POST", "/api/users/me/cook", {
    token: userToken,
    body: { recipeId: "it-1", countryId: "italy", xpAward: 50 },
  });
  mustEqual(cookRes.status, 200, "cook status");
  mustBeObject(cookRes.body, "cook body");
  mustBeObject(cookRes.body.history, "history");
  const after = cookRes.body.history;
  if (after.xp !== xpBefore + 50) {
    throw new Error(`xp expected ${xpBefore + 50}, got ${after.xp}`);
  }
  if (after.totalRecipesCooked !== cookedBefore + 1) {
    throw new Error(`totalRecipesCooked expected ${cookedBefore + 1}, got ${after.totalRecipesCooked}`);
  }
  if (typeof after.level !== "number" || after.level < 1) {
    throw new Error(`level expected >= 1, got ${after.level}`);
  }
  if (!after.passportStamps || after.passportStamps.italy === undefined) {
    throw new Error(`passport stamps missing italy: ${JSON.stringify(after.passportStamps)}`);
  }
});

// ─── Cleanup ────────────────────────────────────────────────────────

await check("DELETE test grocery item", async () => {
  const r = await call("DELETE", "/api/users/me/grocery/smoke-test-item", { token: userToken });
  mustEqual(r.status, 200, "status");
});

await check("DELETE test itinerary day", async () => {
  const r = await call("DELETE", "/api/users/me/itinerary/2099-05-01", { token: userToken });
  mustEqual(r.status, 200, "status");
});

// ─── Summary ────────────────────────────────────────────────────────

console.log();
console.log(`${DIM}${"─".repeat(50)}${RESET}`);
console.log(`${passed} passed, ${failed} failed`);
if (userId) console.log(`${DIM}Test user id: ${userId} (deviceId: ${deviceId})${RESET}`);
console.log();

if (failed > 0) {
  console.log(`${RED}Failures:${RESET}`);
  for (const f of failures) console.log(`  - ${f}`);
  console.log();
  console.log(
    `${DIM}The test user ${userId ?? "(unknown)"} may still be in the database.${RESET}`,
  );
  console.log(
    `${DIM}To clean up: psql "$DATABASE_URL" -c "DELETE FROM users WHERE device_id LIKE 'smoke-%';"${RESET}`,
  );
  console.log();
  process.exit(1);
}

console.log(
  `${DIM}Test user was created but not deleted (anonymous accounts persist).${RESET}`,
);
console.log(
  `${DIM}To clean up: psql "$DATABASE_URL" -c "DELETE FROM users WHERE device_id LIKE 'smoke-%';"${RESET}`,
);
console.log();
process.exit(0);
