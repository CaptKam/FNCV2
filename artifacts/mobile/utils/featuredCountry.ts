/**
 * Featured country override fetcher for the Discover tab hero carousel.
 *
 * The mobile Discover tab's default behavior is to pick a featured
 * country via `dayOfYear % countries.length`. Admins can override
 * that for a specific date (seasonal dishes, holidays, promos) via
 * the Admin Panel → Featured Country page, which writes a row to
 * the `featured_country_overrides` table.
 *
 * This module fetches today's override from `/api/featured/today`
 * (public endpoint, no auth) and caches the result in AsyncStorage
 * for one hour so the Discover tab stays snappy and works offline.
 *
 * Graceful degradation:
 *   - If the fetch fails: fall back to whatever the cache says
 *   - If the cache is stale + offline: fall back to algorithmic rotation
 *   - If the endpoint 404s: no override for today, use algorithmic rotation
 *
 * The Discover tab renders with the algorithmic default immediately,
 * then switches to the override once this fetch resolves.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_KEY = "@fork_compass_featured_today_v1";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface FeaturedTodayOverride {
  countryId: string;
  reason: string | null;
  /** YYYY-MM-DD — so stale cache from yesterday can be detected. */
  date: string;
}

interface CachedOverride {
  /** Null means "we checked and there was no override today" (negative cache). */
  override: FeaturedTodayOverride | null;
  fetchedAt: number;
  /** The local date when this was cached, so we invalidate across midnight. */
  cachedForDate: string;
}

function getBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv && fromEnv.length > 0) return fromEnv.replace(/\/+$/, "");
  return "http://localhost:3001";
}

function todayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function readCache(): Promise<CachedOverride | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as { fetchedAt?: unknown }).fetchedAt === "number" &&
      typeof (parsed as { cachedForDate?: unknown }).cachedForDate === "string"
    ) {
      return parsed as CachedOverride;
    }
    return null;
  } catch {
    return null;
  }
}

async function writeCache(override: FeaturedTodayOverride | null): Promise<void> {
  try {
    const payload: CachedOverride = {
      override,
      fetchedAt: Date.now(),
      cachedForDate: todayLocal(),
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* non-fatal */
  }
}

async function fetchFromNetwork(): Promise<FeaturedTodayOverride | null | undefined> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/featured/today`, {
      method: "GET",
      headers: { accept: "application/json" },
    });
    if (response.status === 404) {
      // Explicit "no override" — cache the negative result.
      return null;
    }
    if (!response.ok) return undefined;
    const data = (await response.json()) as unknown;
    if (
      data &&
      typeof data === "object" &&
      typeof (data as { countryId?: unknown }).countryId === "string" &&
      typeof (data as { date?: unknown }).date === "string"
    ) {
      return {
        countryId: (data as { countryId: string }).countryId,
        reason: ((data as { reason?: unknown }).reason ?? null) as string | null,
        date: (data as { date: string }).date,
      };
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Returns today's override if one exists, or null.
 *
 * Cache behavior:
 *   - Fresh cache (<1h, same local date) → return immediately, no network
 *   - Stale or cross-midnight → fetch from network, update cache
 *   - Network failure → return stale cache if any, else null
 *
 * A null return value means "no override today, use algorithmic rotation".
 * Callers should treat this as a pure data lookup and not as an error.
 */
export async function getTodaysFeaturedOverride(): Promise<FeaturedTodayOverride | null> {
  const today = todayLocal();
  const cached = await readCache();

  if (
    cached &&
    cached.cachedForDate === today &&
    Date.now() - cached.fetchedAt < CACHE_TTL_MS
  ) {
    return cached.override;
  }

  const fetched = await fetchFromNetwork();
  if (fetched === undefined) {
    // Network or parse failure — use whatever stale cache we have.
    return cached?.override ?? null;
  }
  // Either the real override or a confirmed null. Cache it.
  await writeCache(fetched);
  return fetched;
}
