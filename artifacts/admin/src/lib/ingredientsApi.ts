/**
 * Thin fetch wrapper for the /api/admin/ingredients endpoints.
 *
 * We don't use the auto-generated @workspace/api-client-react hooks
 * here because those are regenerated from an OpenAPI spec that
 * doesn't include the ingredient taxonomy routes yet. A handful of
 * direct fetch calls avoids the need to update the codegen pipeline
 * for one feature.
 *
 * The admin token (stored under "admin_token" in localStorage by
 * the login flow) is attached on every request, matching the
 * pattern the existing code uses.
 */
import { getAdminToken, clearAdminToken } from "./auth";

export type IngredientAisle = "produce" | "protein" | "dairy" | "pantry" | "spice";

export interface Ingredient {
  id: string;
  canonicalName: string;
  aisle: IngredientAisle;
  synonyms: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateIngredientInput {
  id: string;
  canonicalName: string;
  aisle: IngredientAisle;
  synonyms: string[];
}

export interface UpdateIngredientInput {
  canonicalName?: string;
  aisle?: IngredientAisle;
  synonyms?: string[];
}

export class IngredientsApiError extends Error {
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
    // Expired or invalid token — kick back to login, same pattern as
    // the react-query onError handler in App.tsx.
    clearAdminToken();
    if (typeof window !== "undefined" && !window.location.pathname.endsWith("/login")) {
      window.location.assign((import.meta.env.BASE_URL.replace(/\/$/, "") || "") + "/login");
    }
    throw new IngredientsApiError(401, "Session expired");
  }

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const errBody = await response.json();
      if (errBody && typeof errBody === "object" && "error" in errBody && typeof errBody.error === "string") {
        message = errBody.error;
      }
    } catch {
      /* no body — use status code */
    }
    throw new IngredientsApiError(response.status, message);
  }

  return (await response.json()) as T;
}

export function listIngredients(search?: string): Promise<Ingredient[]> {
  const qs = search && search.length > 0 ? `?search=${encodeURIComponent(search)}` : "";
  return call<Ingredient[]>("GET", `/api/admin/ingredients${qs}`);
}

export function createIngredient(input: CreateIngredientInput): Promise<Ingredient> {
  return call<Ingredient>("POST", "/api/admin/ingredients", input);
}

export function updateIngredient(id: string, input: UpdateIngredientInput): Promise<Ingredient> {
  return call<Ingredient>("PATCH", `/api/admin/ingredients/${encodeURIComponent(id)}`, input);
}

export function deleteIngredient(id: string): Promise<{ success: true }> {
  return call<{ success: true }>("DELETE", `/api/admin/ingredients/${encodeURIComponent(id)}`);
}
