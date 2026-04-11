import { pgTable, serial, varchar, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Geographic regions — admin-editable metadata for the country list.
 *
 * Historically each country in artifacts/mobile/data/countries.ts
 * had a hardcoded `region` string ("Southern Europe", "East Asia",
 * etc.). This table moves that to the DB so an admin can edit the
 * region names or reassign countries without a code change.
 *
 * The actual country list (id, name, flag, hero image, description)
 * stays in the mobile TS file for now — we only track DB-editable
 * metadata per country (region assignment + is_featured flag) in
 * country_metadata. If/when we decide to move the full country
 * list into Postgres we can add those columns here.
 *
 * sortOrder controls display order wherever regions are grouped
 * (e.g. filter chips).
 */
export const regionsTable = pgTable(
  "regions",
  {
    id: serial("id").primaryKey(),
    /** Display name — "Southern Europe", "East Asia", etc. */
    name: varchar("name", { length: 100 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    nameUnique: uniqueIndex("regions_name_idx").on(t.name),
  }),
);

export const insertRegionSchema = createInsertSchema(regionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertRegion = z.infer<typeof insertRegionSchema>;
export type Region = typeof regionsTable.$inferSelect;
