/**
 * Remote-config module-level store.
 *
 * Loads feature flags and app settings from `GET /api/config` and
 * keeps them in a module-level singleton so any screen, hook, or
 * non-React utility can read the current values synchronously
 * without props-drilling or Context.
 *
 * Lifecycle:
 *   1. App startup calls `loadRemoteConfig()` (non-blocking,
 *      fire-and-forget from AppContext's hydrate() effect).
 *   2. That function reads any cached config from AsyncStorage
 *      and populates the in-memory store immediately, so every
 *      screen renders with the last-known-good values even before
 *      the network fetch returns.
 *   3. In parallel it fires a network fetch. On success, the
 *      store is updated and listeners (registered by hooks) are
 *      notified so screens re-render with the fresh values.
 *   4. If the network fails and there's no cache, the store
 *      stays at its DEFAULT values so the app is fully functional
 *      offline.
 *
 * Foreground refresh:
 *   Call `refreshRemoteConfig()` from AppState 'active' handlers
 *   so users who leave the app open for days still pick up admin
 *   flag flips the next time they bring the app to the foreground.
 *
 * Why Option X (module-level store, not React Context):
 *   - AppContext runs outside the remote-config provider, so
 *     wiring RC into xp calculations via Context would create a
 *     circular dependency.
 *   - Non-React code (utils, syncClient, timers) needs to read
 *     settings too.
 *   - The store is a drop-in: `getRemoteConfig()` from anywhere.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiBaseUrl } from "./apiBaseUrl";

const CACHE_KEY = "@fork_compass_remote_config_v1";
// Never trust a cache older than this — if the app is offline for
// a week, we'd rather use hardcoded defaults than ancient config.
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// ═══════════════════════════════════════════════════════════════════
// Default config — ships inside the app binary so zero-network first
// launches still work. Every value here MUST match the seed values in
// lib/db/src/seed/remoteConfig.ts so the behavior is identical whether
// the server is reachable or not.
// ═══════════════════════════════════════════════════════════════════

export interface RemoteConfig {
  flags: Record<string, boolean>;
  settings: Record<string, unknown>;
  version: string;
  updated_at: string;
}

export const DEFAULT_REMOTE_CONFIG: RemoteConfig = {
  flags: {
    xp_system: true,
    passport_stamps: true,
    level_up_celebrations: true,
    streak_tracking: false,
    smart_cook_bar: true,
    cook_mode_step_images: false,
    voice_commands: false,
    measurement_conversion: false,
    skill_adaptive_instructions: true,
    auto_generate_fab: true,
    multiple_meals_daily_view: false,
    tonight_strip: true,
    dinner_party_system: true,
    online_grocery: false,
    pull_to_refresh: true,
    swipe_gestures: true,
    technique_library: true,
  },
  settings: {
    xp_per_recipe: 50,
    xp_per_dinner_party: 100,
    level_thresholds: [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000],
    level_names: [
      "Novice",
      "Home Cook",
      "Skilled Cook",
      "Sous Chef",
      "Head Chef",
      "Executive Chef",
      "Master Chef",
      "Culinary Artist",
      "Grand Master",
      "Legend",
    ],
    max_featured_per_country: 5,
    tonight_strip_start_hour: 12,
    tonight_dismiss_reset_days: 7,
    grocery_cleanup_days: 28,
    recency_avoidance_days: 14,
    auto_gen_fallback_pool_min: 3,
    default_course_preference: "main",
    skill_nudge_threshold_1: 5,
    skill_nudge_threshold_2: 15,
    cook_session_stale_hours: 24,
    app_tagline: "Pick a country, cook a dinner, feel like you traveled.",
    support_email: "support@forkandcompass.com",
  },
  version: "1.0.0",
  updated_at: "1970-01-01T00:00:00.000Z",
};

// ═══════════════════════════════════════════════════════════════════
// Module-level store
// ═══════════════════════════════════════════════════════════════════

let current: RemoteConfig = DEFAULT_REMOTE_CONFIG;
const listeners = new Set<(next: RemoteConfig) => void>();

function notify(): void {
  for (const fn of listeners) fn(current);
}

/**
 * Subscribe to store changes. Returns an unsubscribe function.
 * Used by the useRemoteConfig hook to re-render on updates.
 */
export function subscribeRemoteConfig(fn: (next: RemoteConfig) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Synchronous read — always returns a valid config (defaults if nothing loaded). */
export function getRemoteConfig(): RemoteConfig {
  return current;
}

/** Shortcut for the common case of reading a single flag. */
export function getFlag(key: string): boolean {
  const v = current.flags[key];
  return typeof v === "boolean" ? v : (DEFAULT_REMOTE_CONFIG.flags[key] ?? false);
}

/**
 * Shortcut for reading a typed setting with a fallback. The
 * caller provides a runtime type check so bad data from the
 * server doesn't silently poison computations.
 */
export function getSetting<T>(key: string, fallback: T): T {
  const v = current.settings[key];
  if (v === undefined || v === null) return fallback;
  // If fallback is a number, coerce numeric values carefully.
  if (typeof fallback === "number") {
    return (typeof v === "number" && Number.isFinite(v) ? v : fallback) as T;
  }
  if (typeof fallback === "string") {
    return (typeof v === "string" ? v : fallback) as T;
  }
  if (Array.isArray(fallback)) {
    return (Array.isArray(v) ? v : fallback) as T;
  }
  if (typeof fallback === "object") {
    return (v && typeof v === "object" && !Array.isArray(v) ? v : fallback) as T;
  }
  return (v as T) ?? fallback;
}

// ═══════════════════════════════════════════════════════════════════
// Cache + network
// ═══════════════════════════════════════════════════════════════════

interface CacheEnvelope {
  config: RemoteConfig;
  fetchedAt: number;
}

async function readCache(): Promise<RemoteConfig | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      (parsed as { fetchedAt?: unknown }).fetchedAt !== undefined &&
      typeof (parsed as { fetchedAt?: unknown }).fetchedAt === "number"
    ) {
      const envelope = parsed as CacheEnvelope;
      if (Date.now() - envelope.fetchedAt > CACHE_MAX_AGE_MS) return null;
      return validateShape(envelope.config);
    }
    return null;
  } catch {
    return null;
  }
}

async function writeCache(config: RemoteConfig): Promise<void> {
  try {
    const envelope: CacheEnvelope = { config, fetchedAt: Date.now() };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(envelope));
  } catch {
    /* non-fatal */
  }
}

/**
 * Validate the top-level shape of a RemoteConfig. We don't do
 * per-key typing here — the get* helpers apply fallbacks at read
 * time — but we do reject anything that isn't a plain object with
 * flags + settings sub-objects.
 */
function validateShape(input: unknown): RemoteConfig | null {
  if (!input || typeof input !== "object") return null;
  const obj = input as Record<string, unknown>;
  if (!obj.flags || typeof obj.flags !== "object") return null;
  if (!obj.settings || typeof obj.settings !== "object") return null;
  return {
    flags: { ...DEFAULT_REMOTE_CONFIG.flags, ...(obj.flags as Record<string, boolean>) },
    settings: { ...DEFAULT_REMOTE_CONFIG.settings, ...(obj.settings as Record<string, unknown>) },
    version: typeof obj.version === "string" ? obj.version : "unknown",
    updated_at: typeof obj.updated_at === "string" ? obj.updated_at : new Date().toISOString(),
  };
}

async function fetchFromNetwork(): Promise<RemoteConfig | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/config`, {
      method: "GET",
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as unknown;
    return validateShape(data);
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// Load + refresh
// ═══════════════════════════════════════════════════════════════════

let loadPromise: Promise<void> | null = null;

/**
 * Primary entry point — call once at app start. Cache-first so
 * screens render with known values immediately; network fetch
 * runs in the background and updates the store when it returns.
 *
 * Safe to call multiple times — only the first call triggers the
 * async work.
 */
export function loadRemoteConfig(): Promise<void> {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    // 1. Try cache first — populate the store immediately so
    //    first-paint uses last-known-good values.
    const cached = await readCache();
    if (cached) {
      current = cached;
      notify();
    }
    // 2. Fire a network fetch in the background. If it succeeds,
    //    we overwrite the store and write back to cache.
    const fresh = await fetchFromNetwork();
    if (fresh) {
      current = fresh;
      notify();
      await writeCache(fresh);
      return;
    }
    // 3. Network failed. If we had a cache, we're already using
    //    it. If we didn't, the store is still at DEFAULT and the
    //    app continues to work — just with baked-in values until
    //    the next successful refresh.
  })();
  return loadPromise;
}

/**
 * Force a fresh network fetch. Called from AppState 'active'
 * handlers so a user returning from a weekend picks up any
 * admin changes that landed while the app was backgrounded.
 */
export async function refreshRemoteConfig(): Promise<boolean> {
  const fresh = await fetchFromNetwork();
  if (fresh) {
    current = fresh;
    notify();
    await writeCache(fresh);
    return true;
  }
  return false;
}
