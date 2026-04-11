import { pgTable, serial, date, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Admin-controlled "featured country of the day" overrides.
 *
 * The mobile Discover tab currently picks a featured country via
 * `dayOfYear % countries.length`. This table lets admins pin a
 * specific country to a specific date — seasonal dishes, holiday
 * specials, partnership promos.
 *
 * At most one override per date. The mobile client requests
 * GET /api/featured/today, which either returns the override row
 * or 404s (mobile falls back to the algorithm).
 */
export const featuredOverridesTable = pgTable(
  "featured_country_overrides",
  {
    id: serial("id").primaryKey(),
    date: date("date", { mode: "string" }).notNull(),
    countryId: text("country_id").notNull(),
    /** Editorial note explaining why this was pinned. */
    reason: text("reason"),
    /** Admin email that created the override. */
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    dateUnique: uniqueIndex("featured_overrides_date_idx").on(t.date),
  }),
);

export const insertFeaturedOverrideSchema = createInsertSchema(featuredOverridesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertFeaturedOverride = z.infer<typeof insertFeaturedOverrideSchema>;
export type FeaturedOverride = typeof featuredOverridesTable.$inferSelect;
