import { pgTable, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { regionsTable } from "./regions";

/**
 * DB-editable metadata for each country in the mobile TS catalog.
 *
 * The mobile data at artifacts/mobile/data/countries.ts is still the
 * source of truth for the country list itself (id, name, flag, hero
 * image, description, cuisine label) — adding a new country is still
 * a code change. This table holds the two pieces an admin needs to
 * edit at runtime:
 *
 *   - regionId: which Region this country belongs to. The mobile
 *     app falls back to the hardcoded `country.region` string if
 *     no DB row exists, so countries newly added to the TS file
 *     keep working until an admin opens the Countries page.
 *
 *   - isFeatured: whether the country is eligible for the default
 *     "Country of the Day" rotation on the mobile Discover tab.
 *     When false, the country is hidden from the rotation entirely
 *     (but still fully usable everywhere else in the app — filters,
 *     recipes, planning, etc.). The admin uses this as a soft
 *     visibility toggle. Date-specific overrides in
 *     featured_country_overrides take precedence regardless.
 *
 * The primary key is the country_id slug (e.g. "italy", "france") —
 * matching the id strings used by recipes.countryId and elsewhere.
 * We don't use a FK to a countries table because the country list
 * still lives in TS.
 */
export const countryMetadataTable = pgTable("country_metadata", {
  /** Country slug matching artifacts/mobile/data/countries.ts ids. */
  countryId: text("country_id").primaryKey(),
  /** Which region this country belongs to; null → use TS fallback. */
  regionId: integer("region_id").references(() => regionsTable.id, {
    onDelete: "set null",
  }),
  /** Eligible for the default Discover tab rotation. */
  isFeatured: boolean("is_featured").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  updatedBy: text("updated_by"),
});

export const insertCountryMetadataSchema = createInsertSchema(countryMetadataTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertCountryMetadata = z.infer<typeof insertCountryMetadataSchema>;
export type CountryMetadata = typeof countryMetadataTable.$inferSelect;
