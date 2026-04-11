/**
 * Curated Collections routes — admin CRUD + public list.
 *
 * Three surfaces:
 *
 *   Admin (requires token):
 *     GET    /api/admin/curated-collections
 *     POST   /api/admin/curated-collections           (create)
 *     PATCH  /api/admin/curated-collections/:id       (edit)
 *     DELETE /api/admin/curated-collections/:id       (delete)
 *     POST   /api/admin/curated-collections/reorder   (bulk sortOrder update)
 *
 *   Public (mobile clients, no auth):
 *     GET    /api/curated-collections
 *       Returns only active collections ordered by sortOrder asc.
 *       Cached 5 minutes on the wire so mobile clients don't hammer.
 */
import { Router, type IRouter, type Request, type Response } from "express";
import { asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAdminAuth } from "../middlewares/auth";
import { db, curatedCollectionsTable } from "@workspace/db";

const router: IRouter = Router();

// ═══════════════════════════════════════════════════════════════════
// Request schemas
// ═══════════════════════════════════════════════════════════════════

const slugRegex = /^[a-z0-9-]+$/;

const createCollectionSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(slugRegex, {
      message: "slug must be lowercase letters, digits, and hyphens only",
    }),
  title: z.string().min(1).max(255),
  subtitle: z.string().optional().nullable(),
  heroImage: z.string().url().optional().nullable(),
  recipeIds: z.array(z.string().min(1).max(100)).max(100).default([]),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

const updateCollectionSchema = z
  .object({
    title: z.string().min(1).max(255).optional(),
    subtitle: z.string().optional().nullable(),
    heroImage: z.string().url().optional().nullable(),
    recipeIds: z.array(z.string().min(1).max(100)).max(100).optional(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

const reorderSchema = z.object({
  /** Array of `{ id, sortOrder }` pairs — the admin sends them all at once. */
  items: z
    .array(
      z.object({
        id: z.number().int().positive(),
        sortOrder: z.number().int(),
      }),
    )
    .max(100),
});

// ═══════════════════════════════════════════════════════════════════
// Admin routes
// ═══════════════════════════════════════════════════════════════════

router.get(
  "/admin/curated-collections",
  requireAdminAuth,
  async (_req: Request, res: Response) => {
    try {
      const rows = await db
        .select()
        .from(curatedCollectionsTable)
        .orderBy(asc(curatedCollectionsTable.sortOrder), asc(curatedCollectionsTable.title));
      res.json({ collections: rows });
    } catch (err) {
      res.status(500).json({
        error: "Failed to fetch curated collections",
        details: String(err),
      });
    }
  },
);

router.post(
  "/admin/curated-collections",
  requireAdminAuth,
  async (req: Request, res: Response) => {
    const parsed = createCollectionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
      return;
    }
    try {
      const authedReq = req as Request & { adminSub?: string };
      const [row] = await db
        .insert(curatedCollectionsTable)
        .values({
          slug: parsed.data.slug,
          title: parsed.data.title,
          subtitle: parsed.data.subtitle ?? null,
          heroImage: parsed.data.heroImage ?? null,
          recipeIds: parsed.data.recipeIds,
          sortOrder: parsed.data.sortOrder,
          isActive: parsed.data.isActive,
          createdBy: authedReq.adminSub ?? null,
          updatedBy: authedReq.adminSub ?? null,
        })
        .returning();
      res.json(row);
    } catch (err) {
      const errObj = err as { code?: string; cause?: { code?: string } } | null;
      const pgCode = errObj?.cause?.code ?? errObj?.code;
      if (pgCode === "23505") {
        res.status(409).json({ error: "Collection slug already exists" });
        return;
      }
      res.status(500).json({ error: "Failed to create collection", details: String(err) });
    }
  },
);

router.patch(
  "/admin/curated-collections/:id",
  requireAdminAuth,
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "Invalid collection id" });
      return;
    }
    const parsed = updateCollectionSchema.safeParse(req.body);
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
      const [row] = await db
        .update(curatedCollectionsTable)
        .set({
          ...parsed.data,
          updatedAt: sql`now()`,
          updatedBy: authedReq.adminSub ?? null,
        })
        .where(eq(curatedCollectionsTable.id, id))
        .returning();
      if (!row) {
        res.status(404).json({ error: "Collection not found" });
        return;
      }
      res.json(row);
    } catch (err) {
      res.status(500).json({ error: "Failed to update collection", details: String(err) });
    }
  },
);

router.delete(
  "/admin/curated-collections/:id",
  requireAdminAuth,
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "Invalid collection id" });
      return;
    }
    try {
      const result = await db
        .delete(curatedCollectionsTable)
        .where(eq(curatedCollectionsTable.id, id))
        .returning({ id: curatedCollectionsTable.id });
      if (result.length === 0) {
        res.status(404).json({ error: "Collection not found" });
        return;
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete collection", details: String(err) });
    }
  },
);

router.post(
  "/admin/curated-collections/reorder",
  requireAdminAuth,
  async (req: Request, res: Response) => {
    const parsed = reorderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
      return;
    }
    try {
      // Update each row's sortOrder in a single transaction so the
      // list never appears half-sorted to a concurrent reader.
      await db.transaction(async (tx) => {
        for (const item of parsed.data.items) {
          await tx
            .update(curatedCollectionsTable)
            .set({ sortOrder: item.sortOrder, updatedAt: sql`now()` })
            .where(eq(curatedCollectionsTable.id, item.id));
        }
      });
      res.json({ success: true, count: parsed.data.items.length });
    } catch (err) {
      res.status(500).json({ error: "Failed to reorder collections", details: String(err) });
    }
  },
);

// ═══════════════════════════════════════════════════════════════════
// Public route — mobile Search screen reads this on launch
// ═══════════════════════════════════════════════════════════════════

router.get("/curated-collections", async (_req: Request, res: Response) => {
  try {
    const rows = await db
      .select()
      .from(curatedCollectionsTable)
      .where(eq(curatedCollectionsTable.isActive, true))
      .orderBy(asc(curatedCollectionsTable.sortOrder), asc(curatedCollectionsTable.title));
    // Match the /api/config 5-minute cache policy.
    res.set("Cache-Control", "public, max-age=300");
    res.json({ collections: rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch collections", details: String(err) });
  }
});

export default router;
