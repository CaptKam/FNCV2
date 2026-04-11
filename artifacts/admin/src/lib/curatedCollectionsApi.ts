/**
 * Thin fetch wrapper for /api/admin/curated-collections endpoints.
 *
 * Mirrors remoteConfigApi.ts — direct fetch calls with the admin
 * token attached.
 */
import { getAdminToken, clearAdminToken } from "./auth";

export interface CuratedCollection {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  heroImage: string | null;
  recipeIds: string[];
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface CreateCollectionInput {
  slug: string;
  title: string;
  subtitle?: string | null;
  heroImage?: string | null;
  recipeIds: string[];
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCollectionInput {
  title?: string;
  subtitle?: string | null;
  heroImage?: string | null;
  recipeIds?: string[];
  sortOrder?: number;
  isActive?: boolean;
}

export class CuratedCollectionsApiError extends Error {
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
    throw new CuratedCollectionsApiError(401, "Session expired");
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
    throw new CuratedCollectionsApiError(response.status, message);
  }

  return (await response.json()) as T;
}

export async function listCollections(): Promise<CuratedCollection[]> {
  const res = await call<{ collections: CuratedCollection[] }>(
    "GET",
    "/api/admin/curated-collections",
  );
  return res.collections;
}

export function createCollection(input: CreateCollectionInput): Promise<CuratedCollection> {
  return call<CuratedCollection>("POST", "/api/admin/curated-collections", input);
}

export function updateCollection(
  id: number,
  input: UpdateCollectionInput,
): Promise<CuratedCollection> {
  return call<CuratedCollection>(
    "PATCH",
    `/api/admin/curated-collections/${id}`,
    input,
  );
}

export function deleteCollection(id: number): Promise<{ success: true }> {
  return call<{ success: true }>("DELETE", `/api/admin/curated-collections/${id}`);
}

export function reorderCollections(
  items: { id: number; sortOrder: number }[],
): Promise<{ success: true; count: number }> {
  return call<{ success: true; count: number }>(
    "POST",
    "/api/admin/curated-collections/reorder",
    { items },
  );
}
