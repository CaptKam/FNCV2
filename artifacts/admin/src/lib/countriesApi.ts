/**
 * Thin fetch wrapper for /api/admin/regions + /api/admin/country-metadata.
 * Mirrors the other admin API modules.
 */
import { getAdminToken, clearAdminToken } from "./auth";

export interface Region {
  id: number;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CountryMetadata {
  countryId: string;
  regionId: number | null;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
}

export class CountriesApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

async function call<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json",
  };
  if (token) headers["authorization"] = `Bearer ${token}`;

  const response = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    clearAdminToken();
    if (typeof window !== "undefined" && !window.location.pathname.endsWith("/login")) {
      window.location.assign((import.meta.env.BASE_URL.replace(/\/$/, "") || "") + "/login");
    }
    throw new CountriesApiError(401, "Session expired");
  }

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const errBody = await response.json();
      if (errBody && typeof errBody === "object" && "error" in errBody && typeof errBody.error === "string") {
        message = errBody.error;
      }
    } catch {
      /* no body */
    }
    throw new CountriesApiError(response.status, message);
  }

  return (await response.json()) as T;
}

// ─── Regions ──────────────────────────────────────────────────────

export async function listRegions(): Promise<Region[]> {
  const res = await call<{ regions: Region[] }>("GET", "/api/admin/regions");
  return res.regions;
}

export function createRegion(name: string, sortOrder: number): Promise<Region> {
  return call<Region>("POST", "/api/admin/regions", { name, sortOrder });
}

export function updateRegion(
  id: number,
  input: { name?: string; sortOrder?: number },
): Promise<Region> {
  return call<Region>("PATCH", `/api/admin/regions/${id}`, input);
}

export function deleteRegion(id: number): Promise<{ success: true }> {
  return call<{ success: true }>("DELETE", `/api/admin/regions/${id}`);
}

// ─── Country metadata ─────────────────────────────────────────────

export async function listCountryMetadata(): Promise<CountryMetadata[]> {
  const res = await call<{ countries: CountryMetadata[] }>(
    "GET",
    "/api/admin/country-metadata",
  );
  return res.countries;
}

export function updateCountryMetadata(
  countryId: string,
  input: { regionId?: number | null; isFeatured?: boolean },
): Promise<CountryMetadata> {
  return call<CountryMetadata>(
    "PATCH",
    `/api/admin/country-metadata/${encodeURIComponent(countryId)}`,
    input,
  );
}
