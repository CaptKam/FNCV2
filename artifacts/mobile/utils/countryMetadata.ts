/**
 * Country metadata client — reads the admin-editable regions +
 * is_featured flags from the server and merges them with the
 * hardcoded country list in artifacts/mobile/data/countries.ts.
 *
 * Consumers:
 *   - Discover tab hero carousel: filter to countries where
 *     isFeaturedForCountry() returns true, so admins can hide
 *     countries from the default rotation.
 *   - Country detail screen + DestinationCard: call
 *     getDisplayRegion(countryId) to get the admin-edited region
 *     name (falls back to the hardcoded TS region string if no
 *     DB row exists or the API is unreachable).
 *
 * Same loading pattern as utils/remoteConfig.ts and
 * utils/curatedCollections.ts:
 *   - Module-level singleton store.
 *   - Cache-first load from AsyncStorage, then background fetch.
 *   - Subscribe API for React components.
 *   - Safe to call the lookup functions before load completes —
 *     they fall through to the TS hardcoded values.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiBaseUrl } from "./apiBaseUrl";
import { countries as tsCountries } from "@/data/countries";

const CACHE_KEY = "@fork_compass_country_metadata_v1";
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

interface RegionRow {
  id: number;
  name: string;
  sortOrder: number;
}

interface CountryMetadataRow {
  countryId: string;
  regionId: number | null;
  isFeatured: boolean;
}

interface CountryMetadataPayload {
  regions: RegionRow[];
  countries: CountryMetadataRow[];
}

interface CacheEnvelope {
  payload: CountryMetadataPayload;
  fetchedAt: number;
}

let current: CountryMetadataPayload = { regions: [], countries: [] };
const listeners = new Set<(next: CountryMetadataPayload) => void>();

function notify(): void {
  for (const fn of listeners) fn(current);
}

export function subscribeCountryMetadata(
  fn: (next: CountryMetadataPayload) => void,
): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/**
 * Is a country eligible for the Discover hero rotation?
 * Defaults to true when the server hasn't returned a row yet or
 * the country isn't in the DB — so new TS countries stay visible
 * until an admin explicitly hides them.
 */
export function isFeaturedForCountry(countryId: string): boolean {
  const row = current.countries.find((c) => c.countryId === countryId);
  if (!row) return true;
  return row.isFeatured;
}

/**
 * Display region name for a country. Uses the admin-edited DB
 * value if available, otherwise falls back to the hardcoded
 * `country.region` string in the mobile TS file.
 */
export function getDisplayRegion(countryId: string): string {
  const row = current.countries.find((c) => c.countryId === countryId);
  if (row && row.regionId !== null) {
    const region = current.regions.find((r) => r.id === row.regionId);
    if (region) return region.name;
  }
  // Fallback: TS hardcoded value.
  const ts = tsCountries.find((c) => c.id === countryId);
  return ts?.region ?? "";
}

/**
 * Returns all regions (admin-edited) sorted by sortOrder. Empty
 * until the first load completes.
 */
export function getAllRegions(): readonly RegionRow[] {
  return current.regions;
}

function isValidPayload(input: unknown): input is CountryMetadataPayload {
  if (!input || typeof input !== "object") return false;
  const obj = input as Record<string, unknown>;
  return Array.isArray(obj.regions) && Array.isArray(obj.countries);
}

async function readCache(): Promise<CountryMetadataPayload | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as { fetchedAt?: unknown }).fetchedAt === "number"
    ) {
      const envelope = parsed as CacheEnvelope;
      if (Date.now() - envelope.fetchedAt > CACHE_MAX_AGE_MS) return null;
      return isValidPayload(envelope.payload) ? envelope.payload : null;
    }
    return null;
  } catch {
    return null;
  }
}

async function writeCache(payload: CountryMetadataPayload): Promise<void> {
  try {
    const envelope: CacheEnvelope = { payload, fetchedAt: Date.now() };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(envelope));
  } catch {
    /* non-fatal */
  }
}

async function fetchFromNetwork(): Promise<CountryMetadataPayload | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/country-metadata`, {
      method: "GET",
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as unknown;
    return isValidPayload(data) ? data : null;
  } catch {
    return null;
  }
}

let loadPromise: Promise<void> | null = null;

export function loadCountryMetadata(): Promise<void> {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    const cached = await readCache();
    if (cached) {
      current = cached;
      notify();
    }
    const fresh = await fetchFromNetwork();
    if (fresh) {
      current = fresh;
      notify();
      await writeCache(fresh);
    }
  })();
  return loadPromise;
}

export async function refreshCountryMetadata(): Promise<boolean> {
  const fresh = await fetchFromNetwork();
  if (fresh) {
    current = fresh;
    notify();
    await writeCache(fresh);
    return true;
  }
  return false;
}
