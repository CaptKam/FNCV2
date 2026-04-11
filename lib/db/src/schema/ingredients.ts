import { pgTable, text, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Global ingredient taxonomy.
 *
 * The mobile app's grocery list currently categorizes ingredients
 * with a regex (`categorizeIngredient()` in AppContext), which
 * fails on "Red Onion" vs "Onions, red" vs "onion, red". This
 * table is the single source of truth for:
 *
 *   1. Canonical name ("Red Onion")
 *   2. Aisle (produce / protein / dairy / pantry / spice)
 *   3. Synonyms — all the variations that should deduplicate into
 *      the same grocery line item
 *
 * The mobile app downloads this table on launch, caches for 24h,
 * and falls back to the regex if offline. The admin panel has a
 * management page for editing it (Phase 3).
 *
 * `id` is a human-readable slug (e.g. "red_onion") rather than a
 * UUID so the mobile client can generate stable grocery item IDs
 * by concatenating with a prefix.
 */
export const ingredientsTable = pgTable(
  "ingredients",
  {
    /** Human-readable slug, e.g. "red_onion", "heavy_cream". */
    id: text("id").primaryKey(),
    canonicalName: text("canonical_name").notNull(),
    aisle: text("aisle", {
      enum: ["produce", "protein", "dairy", "pantry", "spice"],
    }).notNull(),
    /** All alternate names that should match this canonical entry. */
    synonyms: jsonb("synonyms").$type<string[]>().default([]).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    aisleIdx: index("ingredients_aisle_idx").on(t.aisle),
  }),
);

export const insertIngredientSchema = createInsertSchema(ingredientsTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertIngredient = z.infer<typeof insertIngredientSchema>;
export type Ingredient = typeof ingredientsTable.$inferSelect;
