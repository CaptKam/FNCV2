/**
 * Thin fetch wrapper for /api/admin/featured-overrides.
 *
 * Same pattern as lib/ingredientsApi.ts — bypasses the
 * auto-generated @workspace/api-client-react hooks because the
 * feature-overrides endpoints aren't in the OpenAPI spec, and
 * regenerating the client for one route is overkill.
 */
import { getAdminToken, clearAdminToken } from "./auth";

export interface FeaturedOverride {
  id: number;
  date: string; // YYYY-MM-DD
  countryId: string;
  reason: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface FeaturedOverridesResponse {
  upcoming: FeaturedOverride[];
  past: FeaturedOverride[];
}

export interface UpsertFeaturedOverrideInput {
  date: string;
  countryId: string;
  reason?: string | null;
}

export class FeaturedApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

async function call<T>(
  method: "GET" | "POST" | "DELETE",
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
    throw new FeaturedApiError(401, "Session expired");
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
    throw new FeaturedApiError(response.status, message);
  }

  return (await response.json()) as T;
}

export function listFeaturedOverrides(): Promise<FeaturedOverridesResponse> {
  return call<FeaturedOverridesResponse>("GET", "/api/admin/featured-overrides");
}

export function upsertFeaturedOverride(input: UpsertFeaturedOverrideInput): Promise<FeaturedOverride> {
  return call<FeaturedOverride>("POST", "/api/admin/featured-overrides", input);
}

export function deleteFeaturedOverride(date: string): Promise<{ success: true }> {
  return call<{ success: true }>(
    "DELETE",
    `/api/admin/featured-overrides/${encodeURIComponent(date)}`,
  );
}
