/**
 * Remote-config routes — feature flags + app settings.
 *
 * Three API surfaces:
 *
 *   1. Admin CRUD for feature flags
 *        GET    /api/admin/feature-flags
 *        PATCH  /api/admin/feature-flags/:key      { enabled }
 *        POST   /api/admin/feature-flags           (create new flag)
 *
 *   2. Admin CRUD for app settings
 *        GET    /api/admin/app-settings
 *        PATCH  /api/admin/app-settings/:key       { value }
 *
 *   3. Public combined config for mobile clients
 *        GET    /api/config
 *
 * The public endpoint is intentionally unauthenticated because the
 * mobile app needs configuration *before* a user logs in. It returns
 * only non-sensitive configuration (flags and tunable values) — no
 * secrets, no user data. Responses carry a 5-minute Cache-Control
 * header so mobile clients don't hammer it.
 */
import { Router, type IRouter, type Request, type Response } from "express";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdminAuth } from "../middlewares/auth";
import { invalidateSettingsCache } from "../lib/settingsCache";
import {
  db,
  featureFlagsTable,
  appSettingsTable,
  type AppSetting,
} from "@workspace/db";

const router: IRouter = Router();

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

const keyRegex = /^[a-z0-9_]+$/;

/**
 * Parse a setting's text `value` into its runtime type according
 * to `value_type`. Used by the public /api/config endpoint so the
 * mobile client receives real numbers/arrays/objects, not strings.
 *
 * On parse failure we return the raw string — the mobile app has
 * sensible defaults for every setting and will fall back to them
 * if the value doesn't match what it expects.
 */
function parseSettingValue(row: AppSetting): unknown {
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

/**
 * Validate a raw string value against the declared value_type.
 * Returns null if valid, or an error message if not.
 */
function validateValueForType(value: string, valueType: string): string | null {
  switch (valueType) {
    case "number":
      return Number.isFinite(Number(value)) ? null : "Value must be a valid number";
    case "json_array": {
      try {
        const parsed: unknown = JSON.parse(value);
        return Array.isArray(parsed) ? null : "Value must be a JSON array";
      } catch {
        return "Value must be valid JSON";
      }
    }
    case "json_object": {
      try {
        const parsed: unknown = JSON.parse(value);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? null
          : "Value must be a JSON object";
      } catch {
        return "Value must be valid JSON";
      }
    }
    case "string":
      return null;
    default:
      return `Unknown value_type: ${valueType}`;
  }
}

// ═══════════════════════════════════════════════════════════════════
// Request schemas
// ═══════════════════════════════════════════════════════════════════

const patchFlagSchema = z.object({
  enabled: z.boolean(),
});

const createFlagSchema = z.object({
  key: z.string().min(1).max(100).regex(keyRegex, {
    message: "key must be lowercase letters, digits, or underscores",
  }),
  label: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  category: z.string().max(50).optional().nullable(),
  enabled: z.boolean().optional().default(true),
});

const patchSettingSchema = z.object({
  value: z.string(),
});

// ═══════════════════════════════════════════════════════════════════
// Admin: feature flags CRUD
// ═══════════════════════════════════════════════════════════════════

router.get(
  "/admin/feature-flags",
  requireAdminAuth,
  async (_req: Request, res: Response) => {
    try {
      const rows = await db
        .select()
        .from(featureFlagsTable)
        .orderBy(asc(featureFlagsTable.category), asc(featureFlagsTable.label));
      res.json({ flags: rows });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch feature flags", details: String(err) });
    }
  },
);

router.patch(
  "/admin/feature-flags/:key",
  requireAdminAuth,
  async (req: Request, res: Response) => {
    const key = req.params.key;
    if (typeof key !== "string" || !keyRegex.test(key)) {
      res.status(400).json({ error: "Invalid flag key" });
      return;
    }
    const parsed = patchFlagSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
      return;
    }
    try {
      const authedReq = req as Request & { adminSub?: string };
      const [row] = await db
        .update(featureFlagsTable)
        .set({
          enabled: parsed.data.enabled,
          updatedAt: new Date(),
          updatedBy: authedReq.adminSub ?? null,
        })
        .where(eq(featureFlagsTable.key, key))
        .returning();
      if (!row) {
        res.status(404).json({ error: "Feature flag not found" });
        return;
      }
      res.json(row);
    } catch (err) {
      res.status(500).json({ error: "Failed to update feature flag", details: String(err) });
    }
  },
);

router.post(
  "/admin/feature-flags",
  requireAdminAuth,
  async (req: Request, res: Response) => {
    const parsed = createFlagSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
      return;
    }
    try {
      const authedReq = req as Request & { adminSub?: string };
      const [row] = await db
        .insert(featureFlagsTable)
        .values({
          key: parsed.data.key,
          label: parsed.data.label,
          description: parsed.data.description ?? null,
          category: parsed.data.category ?? null,
          enabled: parsed.data.enabled ?? true,
          updatedBy: authedReq.adminSub ?? null,
        })
        .returning();
      res.json(row);
    } catch (err) {
      // Postgres unique_violation on `key` → 409. drizzle wraps pg errors
      // in DrizzleQueryError with the original on `.cause`.
      const errObj = err as { code?: string; cause?: { code?: string } } | null;
      const pgCode = errObj?.cause?.code ?? errObj?.code;
      if (pgCode === "23505") {
        res.status(409).json({ error: "Feature flag key already exists" });
        return;
      }
      res.status(500).json({ error: "Failed to create feature flag", details: String(err) });
    }
  },
);

// ═══════════════════════════════════════════════════════════════════
// Admin: app settings CRUD
// ═══════════════════════════════════════════════════════════════════

router.get(
  "/admin/app-settings",
  requireAdminAuth,
  async (_req: Request, res: Response) => {
    try {
      const rows = await db
        .select()
        .from(appSettingsTable)
        .orderBy(asc(appSettingsTable.category), asc(appSettingsTable.label));
      res.json({ settings: rows });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch app settings", details: String(err) });
    }
  },
);

router.patch(
  "/admin/app-settings/:key",
  requireAdminAuth,
  async (req: Request, res: Response) => {
    const key = req.params.key;
    if (typeof key !== "string" || !keyRegex.test(key)) {
      res.status(400).json({ error: "Invalid setting key" });
      return;
    }
    const parsed = patchSettingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
      return;
    }
    try {
      // Look up the existing row to get value_type so we can validate
      // the new value before writing.
      const [existing] = await db
        .select()
        .from(appSettingsTable)
        .where(eq(appSettingsTable.key, key))
        .limit(1);
      if (!existing) {
        res.status(404).json({ error: "App setting not found" });
        return;
      }
      const err = validateValueForType(parsed.data.value, existing.valueType);
      if (err !== null) {
        res.status(400).json({ error: err, valueType: existing.valueType });
        return;
      }

      const authedReq = req as Request & { adminSub?: string };
      const [row] = await db
        .update(appSettingsTable)
        .set({
          value: parsed.data.value,
          updatedAt: new Date(),
          updatedBy: authedReq.adminSub ?? null,
        })
        .where(eq(appSettingsTable.key, key))
        .returning();
      if (!row) {
        res.status(404).json({ error: "App setting not found" });
        return;
      }
      // Drop the in-memory cache so /cook and other server-authoritative
      // readers pick up the new value immediately on this process. Other
      // processes will refresh on their own TTL.
      invalidateSettingsCache();
      res.json(row);
    } catch (err) {
      res.status(500).json({ error: "Failed to update app setting", details: String(err) });
    }
  },
);

// ═══════════════════════════════════════════════════════════════════
// Public: combined config for mobile clients
// ═══════════════════════════════════════════════════════════════════

router.get("/config", async (_req: Request, res: Response) => {
  try {
    const [flagRows, settingRows] = await Promise.all([
      db.select().from(featureFlagsTable),
      db.select().from(appSettingsTable),
    ]);

    const flags: Record<string, boolean> = {};
    for (const row of flagRows) {
      flags[row.key] = row.enabled;
    }

    const settings: Record<string, unknown> = {};
    let latest = new Date(0);
    for (const row of settingRows) {
      settings[row.key] = parseSettingValue(row);
      if (row.updatedAt > latest) latest = row.updatedAt;
    }
    for (const row of flagRows) {
      if (row.updatedAt > latest) latest = row.updatedAt;
    }

    // 5-minute public cache — mobile clients should refetch on
    // foreground resume anyway, and this prevents runaway requests.
    res.set("Cache-Control", "public, max-age=300");
    res.json({
      flags,
      settings,
      version: "1.0.0",
      updated_at: latest.toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch config", details: String(err) });
  }
});

export default router;
