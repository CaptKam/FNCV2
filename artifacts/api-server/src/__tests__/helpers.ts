/**
 * Shared test utilities for the api-server integration suite.
 *
 * Conventions:
 * - Every test user gets a unique deviceId with a "test-" prefix
 *   so real dev data is never touched.
 * - Every ingredient created in tests gets a "test_" id prefix.
 * - Featured-override test dates are in 2099 so they never collide
 *   with real overrides an admin might schedule.
 * - All created users are tracked and cleaned up at teardown via
 *   the ON DELETE CASCADE in the Phase 1.1 schema, which wipes
 *   every related row (history, sessions, itinerary, grocery,
 *   bookmarks, dinner parties) in one DELETE.
 */
import type { Server } from "node:http";
import { eq, inArray, like } from "drizzle-orm";
import app from "../app";
import {
  db,
  pool,
  usersTable,
  ingredientsTable,
  featuredOverridesTable,
} from "@workspace/db";

// ═══════════════════════════════════════════════════════════════════
// Server lifecycle
// ═══════════════════════════════════════════════════════════════════

let server: Server | null = null;
let baseUrl = "";

/**
 * Start the Express app on an ephemeral port bound to 127.0.0.1.
 * Returns the base URL. Idempotent — calling twice returns the
 * same URL without restarting.
 */
export async function startTestServer(): Promise<string> {
  if (server && baseUrl) return baseUrl;
  await new Promise<void>((resolve, reject) => {
    const s = app.listen(0, "127.0.0.1", (err) => {
      if (err) {
        reject(err);
        return;
      }
      const addr = s.address();
      if (!addr || typeof addr !== "object") {
        reject(new Error("failed to get server address"));
        return;
      }
      baseUrl = `http://127.0.0.1:${addr.port}`;
      server = s;
      resolve();
    });
  });
  return baseUrl;
}

/**
 * Stop the test server and close the pg pool so the test process
 * can exit cleanly. Call from the top-level after() hook.
 */
export async function stopTestServer(): Promise<void> {
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server!.close((err) => (err ? reject(err) : resolve()));
    });
    server = null;
    baseUrl = "";
  }
  try {
    await pool.end();
  } catch {
    /* pool may already be closed */
  }
}

export function getBaseUrl(): string {
  if (!baseUrl) throw new Error("Test server not started. Call startTestServer() first.");
  return baseUrl;
}

// ═══════════════════════════════════════════════════════════════════
// Cleanup tracking
// ═══════════════════════════════════════════════════════════════════

const createdUserIds: string[] = [];
const createdIngredientIds: string[] = [];
const createdOverrideDates: string[] = [];

export function trackUser(id: string): void {
  createdUserIds.push(id);
}
export function trackIngredient(id: string): void {
  createdIngredientIds.push(id);
}
export function trackOverride(date: string): void {
  createdOverrideDates.push(date);
}

/**
 * Remove every resource created during the test run. Users cascade
 * to their related rows automatically (see schema FKs).
 * Ingredients and featured overrides need explicit cleanup.
 */
export async function cleanupAll(): Promise<void> {
  if (createdUserIds.length > 0) {
    await db.delete(usersTable).where(inArray(usersTable.id, createdUserIds));
    createdUserIds.length = 0;
  }
  if (createdIngredientIds.length > 0) {
    await db
      .delete(ingredientsTable)
      .where(inArray(ingredientsTable.id, createdIngredientIds));
    createdIngredientIds.length = 0;
  }
  if (createdOverrideDates.length > 0) {
    await db
      .delete(featuredOverridesTable)
      .where(inArray(featuredOverridesTable.date, createdOverrideDates));
    createdOverrideDates.length = 0;
  }
  // Belt-and-suspenders: remove any leftover "test_" ingredients from
  // previous interrupted runs so the ingredients table stays clean.
  await db.delete(ingredientsTable).where(like(ingredientsTable.id, "test\\_%"));
}

// ═══════════════════════════════════════════════════════════════════
// HTTP helpers
// ═══════════════════════════════════════════════════════════════════

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function request(
  method: Method,
  path: string,
  options: { body?: unknown; token?: string } = {},
): Promise<{ status: number; body: unknown }> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json",
  };
  if (options.token) headers["authorization"] = `Bearer ${options.token}`;
  const response = await fetch(`${getBaseUrl()}${path}`, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    /* empty body / not JSON */
  }
  return { status: response.status, body };
}

// ═══════════════════════════════════════════════════════════════════
// Auth helpers
// ═══════════════════════════════════════════════════════════════════

/**
 * Login with the dev-fallback admin credentials and return the token.
 * Works only when NODE_ENV !== 'production' and ADMIN_EMAIL is unset,
 * which is the default for the test suite (package.json sets
 * NODE_ENV=test).
 */
export async function adminLogin(): Promise<string> {
  const res = await request("POST", "/api/admin/login", {
    body: { email: "admin@forkandcompass.com", password: "admin123" },
  });
  if (res.status !== 200) {
    throw new Error(
      `Admin login failed: ${res.status}. Body: ${JSON.stringify(res.body)}`,
    );
  }
  const body = res.body as { token?: string };
  if (!body.token) throw new Error("Admin login returned no token");
  return body.token;
}

export interface TestUser {
  userId: string;
  token: string;
  deviceId: string;
}

/**
 * Register a fresh anonymous test user, track the id for cleanup,
 * and return the token + userId.
 */
export async function registerTestUser(): Promise<TestUser> {
  const deviceId = `test-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const res = await request("POST", "/api/users/register", {
    body: { deviceId },
  });
  if (res.status !== 200) {
    throw new Error(
      `registerTestUser failed: ${res.status}. Body: ${JSON.stringify(res.body)}`,
    );
  }
  const body = res.body as { userId: string; token: string };
  trackUser(body.userId);
  return { userId: body.userId, token: body.token, deviceId };
}

// ═══════════════════════════════════════════════════════════════════
// Type-safe JSON assertion helpers
// ═══════════════════════════════════════════════════════════════════

/** Narrow an unknown body to a plain object for property access. */
export function asObject(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object") {
    throw new Error(`Expected an object response, got: ${JSON.stringify(body)}`);
  }
  return body as Record<string, unknown>;
}
