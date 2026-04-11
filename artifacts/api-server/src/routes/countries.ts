/**
 * Countries + Regions routes.
 *
 * Surfaces:
 *
 *   Admin (token required):
 *     GET    /api/admin/regions
 *     POST   /api/admin/regions                  { name, sortOrder }
 *     PATCH  /api/admin/regions/:id              { name?, sortOrder? }
 *     DELETE /api/admin/regions/:id              (FK set null cascades
 *                                                  any countries linked
 *                                                  to this region.)
 *
 *     GET    /api/admin/country-metadata         list every country_metadata
 *                                                row (admin UI builds a
 *                                                "feature checkbox + region
 *                                                dropdown" view by joining
 *                                                against the mobile TS list)
 *     PATCH  /api/admin/country-metadata/:id     { regionId?, isFeatured? }
 *                                                upsert by country id
 *
 *   Public (no auth):
 *     GET    /api/countries                      returns all regions + all
 *                                                country metadata rows.
 *                                                Mobile client joins this
 *                                                against its local TS list
 *                                                to determine which countries
 *                                                appear in the rotation and
 *                                                which region each belongs to.
 *                                                5-min Cache-Control.
 */
import { Router, type IRouter, type Request, type Response } from "express";
import { asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAdminAuth } from "../middlewares/auth";
import {
  db,
  regionsTable,
  countryMetadataTable,
} from "@workspace/db";

const router: IRouter = Router();

// ═══════════════════════════════════════════════════════════════════
// Request schemas
// ═══════════════════════════════════════════════════════════════════

const createRegionSchema = z.object({
  name: z.string().min(1).max(100),
  sortOrder: z.number().int().default(0),
});

const updateRegionSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    sortOrder: z.number().int().optional(),
  })
  .strict();

const patchCountryMetadataSchema = z
  .object({
    regionId: z.number().int().positive().nullable().optional(),
    isFeatured: z.boolean().optional(),
  })
  .strict();

// ═══════════════════════════════════════════════════════════════════
// Admin: regions CRUD
// ═══════════════════════════════════════════════════════════════════

router.get("/admin/regions", requireAdminAuth, async (_req: Request, res: Response) => {
  try {
    const rows = await db
      .select()
      .from(regionsTable)
      .orderBy(asc(regionsTable.sortOrder), asc(regionsTable.name));
    res.json({ regions: rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch regions", details: String(err) });
  }
});

router.post("/admin/regions", requireAdminAuth, async (req: Request, res: Response) => {
  const parsed = createRegionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }
  try {
    const [row] = await db
      .insert(regionsTable)
      .values({ name: parsed.data.name, sortOrder: parsed.data.sortOrder })
      .returning();
    res.json(row);
  } catch (err) {
    const errObj = err as { code?: string; cause?: { code?: string } } | null;
    const pgCode = errObj?.cause?.code ?? errObj?.code;
    if (pgCode === "23505") {
      res.status(409).json({ error: "Region name already exists" });
      return;
    }
    res.status(500).json({ error: "Failed to create region", details: String(err) });
  }
});

router.patch("/admin/regions/:id", requireAdminAuth, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid region id" });
    return;
  }
  const parsed = updateRegionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }
  if (Object.keys(parsed.data).length === 0) {
    res.status(400).json({ error: "At least one field must be provided" });
    return;
  }
  try {
    const [row] = await db
      .update(regionsTable)
      .set({ ...parsed.data, updatedAt: sql`now()` })
      .where(eq(regionsTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Region not found" });
      return;
    }
    res.json(row);
  } catch (err) {
    const errObj = err as { code?: string; cause?: { code?: string } } | null;
    const pgCode = errObj?.cause?.code ?? errObj?.code;
    if (pgCode === "23505") {
      res.status(409).json({ error: "Region name already exists" });
      return;
    }
    res.status(500).json({ error: "Failed to update region", details: String(err) });
  }
});

router.delete(
  "/admin/regions/:id",
  requireAdminAuth,
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "Invalid region id" });
      return;
    }
    try {
      // FK on country_metadata.region_id is ON DELETE SET NULL so
      // orphaned countries fall back to their hardcoded TS region.
      const result = await db
        .delete(regionsTable)
        .where(eq(regionsTable.id, id))
        .returning({ id: regionsTable.id });
      if (result.length === 0) {
        res.status(404).json({ error: "Region not found" });
        return;
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete region", details: String(err) });
    }
  },
);

// ═══════════════════════════════════════════════════════════════════
// Admin: country metadata (featured toggle + region assignment)
// ═══════════════════════════════════════════════════════════════════

router.get(
  "/admin/country-metadata",
  requireAdminAuth,
  async (_req: Request, res: Response) => {
    try {
      const rows = await db
        .select()
        .from(countryMetadataTable)
        .orderBy(asc(countryMetadataTable.countryId));
      res.json({ countries: rows });
    } catch (err) {
      res
        .status(500)
        .json({ error: "Failed to fetch country metadata", details: String(err) });
    }
  },
);

router.patch(
  "/admin/country-metadata/:countryId",
  requireAdminAuth,
  async (req: Request, res: Response) => {
    const countryId = req.params.countryId;
    if (typeof countryId !== "string" || countryId.length === 0 || countryId.length > 50) {
      res.status(400).json({ error: "Invalid country id" });
      return;
    }
    const parsed = patchCountryMetadataSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
      return;
    }
    if (Object.keys(parsed.data).length === 0) {
      res.status(400).json({ error: "At least one field must be provided" });
      return;
    }
    try {
      const authedReq = req as Request & { adminSub?: string };
      // Upsert so the admin panel works even for countries that
      // don't have a row yet (e.g. a newly added TS country the
      // seed hasn't been run against).
      const insertValues = {
        countryId,
        regionId: parsed.data.regionId ?? null,
        isFeatured: parsed.data.isFeatured ?? true,
        updatedBy: authedReq.adminSub ?? null,
      };
      const [row] = await db
        .insert(countryMetadataTable)
        .values(insertValues)
        .onConflictDoUpdate({
          target: countryMetadataTable.countryId,
          set: {
            ...(parsed.data.regionId !== undefined ? { regionId: parsed.data.regionId } : {}),
            ...(parsed.data.isFeatured !== undefined
              ? { isFeatured: parsed.data.isFeatured }
              : {}),
            updatedAt: sql`now()`,
            updatedBy: authedReq.adminSub ?? null,
          },
        })
        .returning();
      res.json(row);
    } catch (err) {
      res
        .status(500)
        .json({ error: "Failed to update country metadata", details: String(err) });
    }
  },
);

// ═══════════════════════════════════════════════════════════════════
// Public: combined regions + country metadata
//
// Named /country-metadata to avoid a collision with the existing
// /api/countries endpoint in routes/admin.ts which returns the flat
// country list (id, name, flag, region string) from the mobile TS
// file. The admin panel's useGetCountries() hook still uses the old
// one. Mobile clients fetch BOTH — the old one for country names
// and flags, and this new one to decide which ones are eligible for
// the Discover rotation and which region they belong to.
// ═══════════════════════════════════════════════════════════════════

router.get("/country-metadata", async (_req: Request, res: Response) => {
  try {
    const [regions, countries] = await Promise.all([
      db
        .select()
        .from(regionsTable)
        .orderBy(asc(regionsTable.sortOrder), asc(regionsTable.name)),
      db.select().from(countryMetadataTable),
    ]);
    res.set("Cache-Control", "public, max-age=300");
    res.json({ regions, countries });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch country metadata", details: String(err) });
  }
});

export default router;
