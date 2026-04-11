/**
 * In-memory cache for app_settings.
 *
 * The /cook endpoint reads `xp_per_recipe` and `level_thresholds`
 * on every request to make the XP math server-authoritative. Going
 * to the DB on every request would add a ~5ms query per cook, so
 * we cache the parsed settings in memory with a short TTL.
 *
 * The public /api/config endpoint also benefits from this cache
 * (HTTP clients already get a 5-minute Cache-Control header, but
 * cache misses within the 5-minute window would otherwise hit the
 * DB every time).
 *
 * The cache is process-local, so admin changes take up to TTL_MS
 * to propagate to the server process that handled the change +
 * all other server processes. 60 seconds is short enough that
 * admins never have to wait long and long enough that the cache
 * does its job under burst load.
 */
import { db, appSettingsTable, type AppSetting } from "@workspace/db";

const TTL_MS = 60 * 1000;

interface CacheEntry {
  settings: Record<string, unknown>;
  raw: AppSetting[];
  loadedAt: number;
}

let entry: CacheEntry | null = null;
let inFlight: Promise<CacheEntry> | null = null;

function parseValue(row: AppSetting): unknown {
  try {
    switch (row.valueType) {
      case "number": {
        const n = Number(row.value);
        return Number.isFinite(n) ? n : row.value;
      }
      case "json_array": {
        const parsed: unknown = JSON.parse(row.value);
        return Array.isArray(parsed) ? parsed : row.value;
      }
      case "json_object": {
        const parsed: unknown = JSON.parse(row.value);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? parsed
          : row.value;
      }
      case "string":
      default:
        return row.value;
    }
  } catch {
    return row.value;
  }
}

async function loadFromDb(): Promise<CacheEntry> {
  const rows = await db.select().from(appSettingsTable);
  const settings: Record<string, unknown> = {};
  for (const row of rows) settings[row.key] = parseValue(row);
  const loaded: CacheEntry = {
    settings,
    raw: rows,
    loadedAt: Date.now(),
  };
  entry = loaded;
  return loaded;
}

/**
 * Returns cached settings (parsed values). Refreshes from the DB
 * if the cache is older than TTL_MS or has never been loaded.
 *
 * Concurrent callers during a refresh share the same in-flight
 * promise so we never fire more than one load query at a time.
 */
export async function getCachedAppSettings(): Promise<Record<string, unknown>> {
  if (entry && Date.now() - entry.loadedAt < TTL_MS) {
    return entry.settings;
  }
  if (inFlight) {
    const loaded = await inFlight;
    return loaded.settings;
  }
  inFlight = loadFromDb().finally(() => {
    inFlight = null;
  });
  const loaded = await inFlight;
  return loaded.settings;
}

/**
 * Force the cache to refresh on the next read. Call this from
 * admin PATCH handlers so changes propagate immediately on the
 * process that handled the write. Other processes will still see
 * stale values until their TTL expires.
 */
export function invalidateSettingsCache(): void {
  entry = null;
}

/**
 * Helper for server-authoritative settings with sensible defaults.
 * If the DB has no value (or the wrong type), returns the fallback.
 */
export async function getSettingNumber(
  key: string,
  fallback: number,
): Promise<number> {
  const all = await getCachedAppSettings();
  const v = all[key];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

export async function getSettingNumberArray(
  key: string,
  fallback: number[],
): Promise<number[]> {
  const all = await getCachedAppSettings();
  const v = all[key];
  if (Array.isArray(v) && v.every((x) => typeof x === "number" && Number.isFinite(x))) {
    return v as number[];
  }
  return fallback;
}
