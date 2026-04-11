import { pgTable, serial, text, varchar, boolean, integer, jsonb, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Admin-curated recipe collections — "Staff Picks" shelves on the
 * mobile Search screen.
 *
 * Each collection is a title/subtitle/hero-image + an ordered list
 * of recipe ids. The mobile Search screen renders active collections
 * as horizontal carousels above the results when the search query is
 * empty. Tap a card → recipe detail.
 *
 * Recipe ids are stored as a JSONB array of text (matching the recipe
 * slugs in artifacts/mobile/data/recipes.ts — e.g. "it-1", "fr-3").
 * We use JSONB instead of a join table because:
 *   - Recipes aren't in Postgres (they live in the mobile TS file),
 *     so there's no recipes.id to foreign-key into.
 *   - Collection membership is small (a few dozen recipes max per
 *     collection) and the ordering matters.
 *   - Reads are always "give me the whole collection" — no need to
 *     query individual memberships.
 *
 * sortOrder controls the order of carousels on the Search screen;
 * isActive hides a collection without deleting it (for seasonal
 * collections you want to resurrect later).
 */
export const curatedCollectionsTable = pgTable(
  "curated_collections",
  {
    id: serial("id").primaryKey(),
    /** Slug — stable identifier used by admin URLs if we ever need them. */
    slug: varchar("slug", { length: 100 }).notNull(),
    /** Display title on the mobile Search screen ("Quick Weeknight Dinners"). */
    title: varchar("title", { length: 255 }).notNull(),
    /** Optional subtitle ("30 minutes or less"). */
    subtitle: text("subtitle"),
    /** Optional hero image for the collection card. */
    heroImage: text("hero_image"),
    /** Ordered list of recipe slugs. */
    recipeIds: jsonb("recipe_ids").$type<string[]>().default([]).notNull(),
    /** Lower sortOrder → renders earlier on the Search screen. */
    sortOrder: integer("sort_order").notNull().default(0),
    /** Hide without deleting (seasonal content, deprecated). */
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
  },
  (t) => ({
    slugUnique: uniqueIndex("curated_collections_slug_idx").on(t.slug),
  }),
);

export const insertCuratedCollectionSchema = createInsertSchema(curatedCollectionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCuratedCollection = z.infer<typeof insertCuratedCollectionSchema>;
export type CuratedCollection = typeof curatedCollectionsTable.$inferSelect;
