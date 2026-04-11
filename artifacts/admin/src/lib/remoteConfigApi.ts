/**
 * Thin fetch wrapper for /api/admin/feature-flags and
 * /api/admin/app-settings endpoints.
 *
 * Mirrors the pattern in ingredientsApi.ts — direct fetch calls
 * with the admin token attached, because the auto-generated
 * @workspace/api-client-react hooks don't cover these routes.
 */
import { getAdminToken, clearAdminToken } from "./auth";

export interface FeatureFlag {
  id: number;
  key: string;
  enabled: boolean;
  label: string;
  description: string | null;
  category: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

export type AppSettingValueType = "number" | "string" | "json_array" | "json_object";

export interface AppSetting {
  id: number;
  key: string;
  value: string;
  label: string;
  description: string | null;
  category: string | null;
  valueType: AppSettingValueType;
  updatedAt: string;
  updatedBy: string | null;
}

export interface CreateFeatureFlagInput {
  key: string;
  label: string;
  description?: string | null;
  category?: string | null;
  enabled?: boolean;
}

export class RemoteConfigApiError extends Error {
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
    throw new RemoteConfigApiError(401, "Session expired");
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
    throw new RemoteConfigApiError(response.status, message);
  }

  return (await response.json()) as T;
}

// ─── Feature flags ────────────────────────────────────────────────

export async function listFeatureFlags(): Promise<FeatureFlag[]> {
  const res = await call<{ flags: FeatureFlag[] }>("GET", "/api/admin/feature-flags");
  return res.flags;
}

export function updateFeatureFlag(key: string, enabled: boolean): Promise<FeatureFlag> {
  return call<FeatureFlag>(
    "PATCH",
    `/api/admin/feature-flags/${encodeURIComponent(key)}`,
    { enabled },
  );
}

export function createFeatureFlag(input: CreateFeatureFlagInput): Promise<FeatureFlag> {
  return call<FeatureFlag>("POST", "/api/admin/feature-flags", input);
}

// ─── App settings ─────────────────────────────────────────────────

export async function listAppSettings(): Promise<AppSetting[]> {
  const res = await call<{ settings: AppSetting[] }>("GET", "/api/admin/app-settings");
  return res.settings;
}

export function updateAppSetting(key: string, value: string): Promise<AppSetting> {
  return call<AppSetting>(
    "PATCH",
    `/api/admin/app-settings/${encodeURIComponent(key)}`,
    { value },
  );
}
