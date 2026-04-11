import { pgTable, serial, varchar, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Remote-config tunable values (numbers, strings, JSON arrays).
 *
 * Complement to `feature_flags`: where flags are on/off toggles,
 * this table holds the *values* the app reads at runtime — XP per
 * recipe, level thresholds, cleanup windows, copy strings.
 *
 * Values are stored as text (`value`) with a `value_type` tag that
 * tells the API how to parse them before serving the public
 * `/api/config` endpoint:
 *
 *   - "number"       → parsed with Number(v)
 *   - "string"       → returned as-is
 *   - "json_array"   → JSON.parse, must be an array
 *   - "json_object"  → JSON.parse, must be a plain object
 *
 * The server also reads these directly (not via /api/config) to
 * make authoritative decisions — e.g. the /cook endpoint reads
 * `xp_per_recipe` and `level_thresholds` so the client can't lie
 * about how much XP to award.
 */
export const appSettingsTable = pgTable(
  "app_settings",
  {
    id: serial("id").primaryKey(),
    /** Stable key used by server + mobile app, e.g. "xp_per_recipe". */
    key: varchar("key", { length: 100 }).notNull(),
    /** Raw value — JSON-encoded for arrays/objects, plain for number/string. */
    value: text("value").notNull(),
    /** Human-readable name for the admin UI. */
    label: varchar("label", { length: 255 }).notNull(),
    description: text("description"),
    /** Groups settings in the admin UI. */
    category: varchar("category", { length: 50 }),
    /** Tells the API how to parse `value` before serving it. */
    valueType: varchar("value_type", { length: 20 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    updatedBy: varchar("updated_by", { length: 255 }),
  },
  (t) => ({
    keyUnique: uniqueIndex("app_settings_key_idx").on(t.key),
  }),
);

export const insertAppSettingSchema = createInsertSchema(appSettingsTable).omit({
  id: true,
  updatedAt: true,
});
export type InsertAppSetting = z.infer<typeof insertAppSettingSchema>;
export type AppSetting = typeof appSettingsTable.$inferSelect;
