import { pgTable, serial, varchar, boolean, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Remote-config feature flags.
 *
 * Admins flip a switch in the admin panel → the mobile app picks
 * it up on next launch (or next foreground refresh). Every feature
 * that can be shown/hidden in the app should be behind a flag in
 * this table.
 *
 * Flags with `enabled = false` are features that exist in code but
 * are hidden from users until they're ready. Flipping to `true`
 * activates them for everyone instantly.
 *
 * The mobile client fetches all flags at once via `GET /api/config`
 * (public, 5-min cache) and stores the result in AsyncStorage so
 * the app works offline with the last-known state.
 */
export const featureFlagsTable = pgTable(
  "feature_flags",
  {
    id: serial("id").primaryKey(),
    /** Stable key used by the mobile app, e.g. "xp_system". */
    key: varchar("key", { length: 100 }).notNull(),
    enabled: boolean("enabled").notNull().default(true),
    /** Human-readable name for the admin UI. */
    label: varchar("label", { length: 255 }).notNull(),
    /** Explains what this flag controls; rendered under the label. */
    description: text("description"),
    /** Groups flags in the admin UI (Gamification, Cooking, UX, …). */
    category: varchar("category", { length: 50 }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    /** Email of the admin who last flipped the flag. */
    updatedBy: varchar("updated_by", { length: 255 }),
  },
  (t) => ({
    keyUnique: uniqueIndex("feature_flags_key_idx").on(t.key),
  }),
);

export const insertFeatureFlagSchema = createInsertSchema(featureFlagsTable).omit({
  id: true,
  updatedAt: true,
});
export type InsertFeatureFlag = z.infer<typeof insertFeatureFlagSchema>;
export type FeatureFlag = typeof featureFlagsTable.$inferSelect;
