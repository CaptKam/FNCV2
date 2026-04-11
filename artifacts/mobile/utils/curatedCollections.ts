/**
 * Curated collections client — fetches from /api/curated-collections,
 * caches in AsyncStorage for offline use, exposes synchronous reads.
 *
 * Matches the pattern in utils/ingredientTaxonomy.ts:
 *   - On app start, `loadCuratedCollections()` populates the
 *     in-memory store from cache (fast) then fires a background
 *     refetch to update.
 *   - Consumers call `getCuratedCollections()` from anywhere to
 *     get the current list synchronously. Returns [] until loaded.
 *   - `subscribeCuratedCollections(fn)` lets React components
 *     re-render when the list updates.
 *
 * The list is always filtered to `isActive: true` rows, ordered
 * by sortOrder. The admin panel controls the rest.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiBaseUrl } from "./apiBaseUrl";

const CACHE_KEY = "@fork_compass_curated_collections_v1";
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface CuratedCollection {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  heroImage: string | null;
  recipeIds: string[];
  sortOrder: number;
  isActive: boolean;
}

interface CacheEnvelope {
  collections: CuratedCollection[];
  fetchedAt: number;
}

let current: CuratedCollection[] = [];
const listeners = new Set<(next: CuratedCollection[]) => void>();

function notify(): void {
  for (const fn of listeners) fn(current);
}

export function subscribeCuratedCollections(fn: (next: CuratedCollection[]) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getCuratedCollections(): readonly CuratedCollection[] {
  return current;
}

function isValidCollection(input: unknown): input is CuratedCollection {
  if (!input || typeof input !== "object") return false;
  const obj = input as Record<string, unknown>;
  return (
    typeof obj.id === "number" &&
    typeof obj.slug === "string" &&
    typeof obj.title === "string" &&
    (obj.subtitle === null || typeof obj.subtitle === "string") &&
    (obj.heroImage === null || typeof obj.heroImage === "string") &&
    Array.isArray(obj.recipeIds) &&
    typeof obj.sortOrder === "number" &&
    typeof obj.isActive === "boolean"
  );
}

async function readCache(): Promise<CuratedCollection[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as { fetchedAt?: unknown }).fetchedAt === "number" &&
      Array.isArray((parsed as { collections?: unknown }).collections)
    ) {
      const envelope = parsed as CacheEnvelope;
      if (Date.now() - envelope.fetchedAt > CACHE_MAX_AGE_MS) return null;
      return envelope.collections.filter(isValidCollection);
    }
    return null;
  } catch {
    return null;
  }
}

async function writeCache(collections: CuratedCollection[]): Promise<void> {
  try {
    const envelope: CacheEnvelope = { collections, fetchedAt: Date.now() };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(envelope));
  } catch {
    /* non-fatal */
  }
}

async function fetchFromNetwork(): Promise<CuratedCollection[] | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/curated-collections`, {
      method: "GET",
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as unknown;
    if (!data || typeof data !== "object") return null;
    const arr = (data as { collections?: unknown }).collections;
    if (!Array.isArray(arr)) return null;
    return arr.filter(isValidCollection);
  } catch {
    return null;
  }
}

let loadPromise: Promise<void> | null = null;

export function loadCuratedCollections(): Promise<void> {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    const cached = await readCache();
    if (cached) {
      current = cached.filter((c) => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
      notify();
    }
    const fresh = await fetchFromNetwork();
    if (fresh) {
      current = fresh.filter((c) => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
      notify();
      await writeCache(fresh);
    }
  })();
  return loadPromise;
}

/** Force a background refresh (used by AppState 'active' handlers). */
export async function refreshCuratedCollections(): Promise<boolean> {
  const fresh = await fetchFromNetwork();
  if (fresh) {
    current = fresh.filter((c) => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
    notify();
    await writeCache(fresh);
    return true;
  }
  return false;
}
