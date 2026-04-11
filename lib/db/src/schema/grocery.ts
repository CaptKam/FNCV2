import { pgTable, uuid, text, boolean, jsonb, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

/**
 * One row per grocery item a user has on their list.
 *
 * `stableId` is the same ingredient-normalized ID the mobile app
 * generates (e.g. `ingredient-red-onion` or `manual-milk`), so the
 * mobile client can compute the ID locally and the server can
 * upsert without a round-trip lookup.
 *
 * `sourceDates` is the important piece from the date-system rework:
 * it maps each contributing recipe name to the YYYY-MM-DD the
 * recipe is planned for. Date-scoped removal in the mobile app
 * depends on this being present and correct.
 */
export const groceryItemsTable = pgTable(
  "grocery_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    /** Client-generated stable ID. Example: `ingredient-red-onion`, `manual-milk`. */
    stableId: text("stable_id").notNull(),
    name: text("name").notNull(),
    amount: text("amount").default("").notNull(),
    unit: text("unit").default("").notNull(),
    category: text("category", {
      enum: ["produce", "protein", "dairy", "pantry", "spice"],
    }).notNull(),
    /** Names of the recipes that contributed to this item. */
    recipeNames: jsonb("recipe_names").$type<string[]>().default([]).notNull(),
    /** Map recipeName → amount contributed by that recipe. */
    sourceAmounts: jsonb("source_amounts")
      .$type<Record<string, string>>()
      .default({})
      .notNull(),
    /** Map recipeName → YYYY-MM-DD date the recipe is planned for. */
    sourceDates: jsonb("source_dates")
      .$type<Record<string, string>>()
      .default({})
      .notNull(),
    checked: boolean("checked").default(false).notNull(),
    excluded: boolean("excluded").default(false).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userStableUnique: uniqueIndex("grocery_items_user_stable_idx").on(t.userId, t.stableId),
    userIdx: index("grocery_items_user_idx").on(t.userId),
  }),
);

export const insertGroceryItemSchema = createInsertSchema(groceryItemsTable).omit({
  id: true,
  updatedAt: true,
});
export type InsertGroceryItem = z.infer<typeof insertGroceryItemSchema>;
export type GroceryItem = typeof groceryItemsTable.$inferSelect;
