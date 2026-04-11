/**
 * Global ingredient taxonomy cache for the mobile grocery list.
 *
 * Problem this module solves:
 *   The grocery list dedupes items by `stableId`. Historically
 *   `stableId` was computed as `"ingredient-" + name.toLowerCase()`,
 *   which means "Red Onion" and "Onions, red" get two separate
 *   line items even though they're the same thing. The aisle was
 *   also chosen by a small regex — usable but crude.
 *
 * What this module does:
 *   1. Fetches the canonical ingredient list from `/api/ingredients`
 *      (public endpoint, no auth needed). Caches it in AsyncStorage
 *      for 24h so offline use keeps working.
 *   2. Builds a fast lowercase-name → canonical lookup so
 *      `normalizeIngredient("Onions, red")` and
 *      `normalizeIngredient("red onion")` both return the same
 *      `red_onion` canonical.
 *   3. Exposes `normalizeIngredient(name)` which returns
 *      `{ stableId, canonicalName, aisle }`. Callers use stableId
 *      to dedupe and aisle to categorize.
 *   4. Falls back to the pre-Phase-3 regex if the name isn't in
 *      the taxonomy (long-tail ingredients we haven't seeded yet).
 *      Falls back to in-memory regex if the fetch fails and the
 *      cache is empty.
 *
 * Load lifecycle:
 *   - At app start, `bootstrapSync()` calls `loadIngredientTaxonomy()`
 *     which reads the AsyncStorage cache synchronously if valid,
 *     otherwise fires a background fetch.
 *   - The in-memory lookup table is populated from either source.
 *   - `normalizeIngredient` works immediately — if the taxonomy
 *     isn't loaded yet, it just falls back to the regex path until
 *     the fetch completes.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiBaseUrl } from "./apiBaseUrl";

const CACHE_KEY = "@fork_compass_ingredient_taxonomy_v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export type IngredientAisle = "produce" | "protein" | "dairy" | "pantry" | "spice";

export interface TaxonomyEntry {
  id: string;
  canonicalName: string;
  aisle: IngredientAisle;
  synonyms: string[];
}

interface CachedTaxonomy {
  entries: TaxonomyEntry[];
  fetchedAt: number;
}

// In-memory state — populated from cache or network fetch
let entries: TaxonomyEntry[] = [];
let lookup: Map<string, TaxonomyEntry> = new Map();

/** Build the lowercase-name → entry lookup. Called after any load. */
function rebuildLookup(): void {
  lookup = new Map();
  for (const entry of entries) {
    // Canonical name itself, and every synonym, both folded to lowercase.
    lookup.set(entry.canonicalName.toLowerCase().trim(), entry);
    for (const syn of entry.synonyms) {
      lookup.set(syn.toLowerCase().trim(), entry);
    }
  }
}

/**
 * Regex fallback — same logic that lived inline in AppContext.
 * Used when (a) the name isn't in the taxonomy or (b) the
 * taxonomy hasn't loaded yet.
 */
function regexCategorize(lower: string): IngredientAisle {
  if (/chicken|beef|lamb|fish|shrimp|pork|salmon|tofu/.test(lower)) return "protein";
  if (/tomato|onion|garlic|pepper|lettuce|basil|lemon|carrot|potato|mushroom|avocado|cilantro|ginger/.test(lower)) return "produce";
  if (/milk|cheese|butter|cream|yogurt|egg/.test(lower)) return "dairy";
  if (/cumin|paprika|cinnamon|saffron|turmeric|oregano|thyme|salt|pepper|chili/.test(lower)) return "spice";
  return "pantry";
}

/**
 * Turn an arbitrary ingredient name into a slug for the fallback
 * stableId — preserves the pre-Phase-3 "ingredient-<name>" pattern
 * so existing grocery items on device don't suddenly get orphaned
 * when the taxonomy isn't loaded yet.
 */
function fallbackSlug(lower: string): string {
  return (
    "ingredient-" +
    lower
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
  );
}

export interface NormalizedIngredient {
  /** Stable dedup key. `"ingredient-<id>"` for canonical, `"ingredient-<slug>"` for fallback. */
  stableId: string;
  /** Display name on the grocery list. */
  canonicalName: string;
  /** Aisle for categorization. */
  aisle: IngredientAisle;
  /** True if we found this in the taxonomy. False means regex fallback. */
  canonical: boolean;
}

/**
 * Turn a raw ingredient name into its canonical form. Always
 * returns a valid result — falls back to the regex categorizer
 * if the name isn't in the taxonomy (or the taxonomy isn't loaded).
 */
export function normalizeIngredient(name: string): NormalizedIngredient {
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();

  // First: exact lookup against canonical names + synonyms.
  const exact = lookup.get(lower);
  if (exact) {
    return {
      stableId: "ingredient-" + exact.id,
      canonicalName: exact.canonicalName,
      aisle: exact.aisle,
      canonical: true,
    };
  }

  // Second: substring match. Handles "fresh red onion" → `red_onion`
  // by finding the first synonym/canonical that's a substring of the
  // input. This is O(n) in taxonomy size (80-ish entries), which is
  // fast enough to call inline during grocery list builds.
  for (const entry of entries) {
    if (lower.includes(entry.canonicalName.toLowerCase())) {
      return {
        stableId: "ingredient-" + entry.id,
        canonicalName: entry.canonicalName,
        aisle: entry.aisle,
        canonical: true,
      };
    }
    for (const syn of entry.synonyms) {
      if (lower.includes(syn.toLowerCase())) {
        return {
          stableId: "ingredient-" + entry.id,
          canonicalName: entry.canonicalName,
          aisle: entry.aisle,
          canonical: true,
        };
      }
    }
  }

  // Third: fall back to the regex categorizer + slugified stableId.
  return {
    stableId: fallbackSlug(lower),
    canonicalName: trimmed,
    aisle: regexCategorize(lower),
    canonical: false,
  };
}

/** True if the taxonomy has been loaded (from cache or network). */
export function isTaxonomyLoaded(): boolean {
  return entries.length > 0;
}

/** Returns the raw taxonomy list for consumers that need it (e.g. debug UI). */
export function getTaxonomyEntries(): readonly TaxonomyEntry[] {
  return entries;
}

async function fetchFromNetwork(): Promise<TaxonomyEntry[] | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/ingredients`, {
      method: "GET",
      headers: { accept: "application/json" },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as unknown;
    if (!Array.isArray(data)) return null;
    // Light shape check on each row — reject anything malformed.
    const valid: TaxonomyEntry[] = [];
    for (const row of data) {
      if (
        row &&
        typeof row === "object" &&
        typeof (row as { id?: unknown }).id === "string" &&
        typeof (row as { canonicalName?: unknown }).canonicalName === "string" &&
        typeof (row as { aisle?: unknown }).aisle === "string" &&
        Array.isArray((row as { synonyms?: unknown }).synonyms)
      ) {
        const aisle = (row as { aisle: string }).aisle;
        if (["produce", "protein", "dairy", "pantry", "spice"].includes(aisle)) {
          valid.push({
            id: (row as { id: string }).id,
            canonicalName: (row as { canonicalName: string }).canonicalName,
            aisle: aisle as IngredientAisle,
            synonyms: ((row as { synonyms: unknown[] }).synonyms).filter(
              (s): s is string => typeof s === "string",
            ),
          });
        }
      }
    }
    return valid;
  } catch {
    return null;
  }
}

async function readCache(): Promise<CachedTaxonomy | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { entries?: unknown }).entries) &&
      typeof (parsed as { fetchedAt?: unknown }).fetchedAt === "number"
    ) {
      return parsed as CachedTaxonomy;
    }
    return null;
  } catch {
    return null;
  }
}

async function writeCache(fresh: TaxonomyEntry[]): Promise<void> {
  try {
    const payload: CachedTaxonomy = { entries: fresh, fetchedAt: Date.now() };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* non-fatal */
  }
}

/**
 * Load the taxonomy into memory. Call once at app start from the
 * sync bootstrap. Cache-first: if the cache is fresh (<24h), use it
 * and kick off a background refetch. If stale or missing, fetch
 * from network and populate the cache.
 *
 * Safe to call multiple times — only the first call triggers a
 * network fetch.
 */
let loadPromise: Promise<void> | null = null;

export function loadIngredientTaxonomy(): Promise<void> {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    const cached = await readCache();
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      // Fresh cache — use it immediately.
      entries = cached.entries;
      rebuildLookup();
      // Background refresh (don't await).
      void (async () => {
        const fresh = await fetchFromNetwork();
        if (fresh && fresh.length > 0) {
          entries = fresh;
          rebuildLookup();
          await writeCache(fresh);
        }
      })();
      return;
    }
    // Stale or missing — fetch from network.
    const fresh = await fetchFromNetwork();
    if (fresh && fresh.length > 0) {
      entries = fresh;
      rebuildLookup();
      await writeCache(fresh);
      return;
    }
    // Network failed — use whatever stale cache we have, if any.
    if (cached) {
      entries = cached.entries;
      rebuildLookup();
      return;
    }
    // Nothing available — `entries` stays empty, `normalizeIngredient`
    // falls back to the regex. The app continues to work; it just
    // loses taxonomy-level dedup until the next attempt.
  })();
  return loadPromise;
}
