/**
 * Mobile sync client — thin fetch wrapper for the /api/users/*
 * endpoints in artifacts/api-server/src/routes/users.ts.
 *
 * Kept deliberately simple:
 *   - No react-query, no codegen. Just fetch + JSON + error handling.
 *   - All calls attach the stored auth token from AsyncStorage.
 *   - Base URL comes from EXPO_PUBLIC_API_URL (Expo exposes
 *     EXPO_PUBLIC_* vars to runtime).
 *
 * Errors:
 *   - Network failures throw `SyncNetworkError` (caller can decide
 *     whether to retry later).
 *   - HTTP 4xx/5xx throws `SyncHttpError` with the status code so
 *     callers can distinguish "retry this" from "drop this".
 *
 * Not imported anywhere that runs during module load — the base URL
 * and auth token resolution both happen at call time, so hot-reload
 * of env vars and login state works without restarting the app.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "@fork_compass_mobile_token";

/** Default to a local dev server. Override with EXPO_PUBLIC_API_URL. */
function getBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv && fromEnv.length > 0) return fromEnv.replace(/\/+$/, "");
  // Local dev default. Replit usually exposes a forwarded URL via
  // EXPO_PUBLIC_API_URL; this fallback keeps the simulator working.
  return "http://localhost:3001";
}

export class SyncNetworkError extends Error {
  readonly name = "SyncNetworkError";
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
  }
}

export class SyncHttpError extends Error {
  readonly name = "SyncHttpError";
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
  }
}

/** Persist the auth token. Called once after /register succeeds. */
export async function setMobileToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

/** Read the stored auth token, or null if we haven't registered yet. */
export async function getMobileToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Clear the stored token (for future "sign out" / revocation flows). */
export async function clearMobileToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {
    /* swallow */
  }
}

interface FetchOptions {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  body?: unknown;
  requireAuth?: boolean; // default true
}

async function syncFetch<T>(options: FetchOptions): Promise<T> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json",
  };

  if (options.requireAuth !== false) {
    const token = await getMobileToken();
    if (token) headers["authorization"] = `Bearer ${token}`;
  }

  const url = `${getBaseUrl()}${options.path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch (err) {
    // Offline, DNS failure, CORS rejection, etc. — any pre-response
    // failure lands here.
    throw new SyncNetworkError(`Network error calling ${options.method} ${options.path}`, err);
  }

  if (!response.ok) {
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      // Ignore body parse errors — the status code is still meaningful.
    }
    throw new SyncHttpError(
      response.status,
      `HTTP ${response.status} ${response.statusText} on ${options.method} ${options.path}`,
      body,
    );
  }

  // Some DELETE endpoints return only { success: true }. Still JSON.
  try {
    return (await response.json()) as T;
  } catch {
    return null as T;
  }
}

// ═══════════════════════════════════════════════════════════════════
// Typed endpoint wrappers
// ═══════════════════════════════════════════════════════════════════

export interface RegisterResponse {
  userId: string;
  token: string;
  user: {
    id: string;
    deviceId: string;
    createdAt: string;
    [k: string]: unknown;
  };
}

/** POST /api/users/register — public, creates or resumes anonymous account. */
export async function syncRegister(
  deviceId: string,
  platform?: "ios" | "android" | "web",
): Promise<RegisterResponse> {
  return syncFetch<RegisterResponse>({
    method: "POST",
    path: "/api/users/register",
    body: { deviceId, ...(platform ? { platform } : {}) },
    requireAuth: false,
  });
}

/** GET /api/users/me — full user snapshot for foreground reconcile. */
export async function syncGetMe(): Promise<unknown> {
  return syncFetch({ method: "GET", path: "/api/users/me" });
}

/** PATCH /api/users/me/preferences — partial prefs update. */
export async function syncPreferences(patch: Record<string, unknown>): Promise<unknown> {
  return syncFetch({ method: "PATCH", path: "/api/users/me/preferences", body: patch });
}

/** PUT /api/users/me/itinerary/:date — upsert a single day. */
export async function syncItineraryDay(
  date: string,
  day: {
    dayLabel: string;
    hasDinnerParty?: boolean;
    courses: Record<string, unknown>;
  },
): Promise<unknown> {
  return syncFetch({
    method: "PUT",
    path: `/api/users/me/itinerary/${encodeURIComponent(date)}`,
    body: day,
  });
}

/** DELETE /api/users/me/itinerary/:date — clear a day. */
export async function syncDeleteItineraryDay(date: string): Promise<unknown> {
  return syncFetch({
    method: "DELETE",
    path: `/api/users/me/itinerary/${encodeURIComponent(date)}`,
  });
}

/** PUT /api/users/me/grocery — upsert one grocery item by stableId. */
export async function syncGroceryItem(item: {
  stableId: string;
  name: string;
  amount: string;
  unit: string;
  category: "produce" | "protein" | "dairy" | "pantry" | "spice";
  recipeNames: string[];
  sourceAmounts: Record<string, string>;
  sourceDates: Record<string, string>;
  checked: boolean;
  excluded: boolean;
}): Promise<unknown> {
  return syncFetch({ method: "PUT", path: "/api/users/me/grocery", body: item });
}

/** POST /api/users/me/grocery/bulk — batch upsert (up to 500 items). */
export async function syncGroceryBulk(
  items: Parameters<typeof syncGroceryItem>[0][],
): Promise<unknown> {
  return syncFetch({
    method: "POST",
    path: "/api/users/me/grocery/bulk",
    body: { items },
  });
}

/** DELETE /api/users/me/grocery/:stableId — remove one item. */
export async function syncDeleteGroceryItem(stableId: string): Promise<unknown> {
  return syncFetch({
    method: "DELETE",
    path: `/api/users/me/grocery/${encodeURIComponent(stableId)}`,
  });
}

/** POST /api/users/me/cook — record cook completion, bumps XP + stamp. */
export async function syncCookCompletion(
  recipeId: string,
  countryId: string,
  options?: { recipeName?: string; xpAward?: number },
): Promise<unknown> {
  return syncFetch({
    method: "POST",
    path: "/api/users/me/cook",
    body: {
      recipeId,
      countryId,
      ...(options?.recipeName ? { recipeName: options.recipeName } : {}),
      ...(options?.xpAward ? { xpAward: options.xpAward } : {}),
    },
  });
}

/** PUT /api/users/me/bookmarks/:recipeId — idempotent add. */
export async function syncBookmarkAdd(recipeId: string): Promise<unknown> {
  return syncFetch({
    method: "PUT",
    path: `/api/users/me/bookmarks/${encodeURIComponent(recipeId)}`,
  });
}

/** DELETE /api/users/me/bookmarks/:recipeId — idempotent remove. */
export async function syncBookmarkRemove(recipeId: string): Promise<unknown> {
  return syncFetch({
    method: "DELETE",
    path: `/api/users/me/bookmarks/${encodeURIComponent(recipeId)}`,
  });
}
