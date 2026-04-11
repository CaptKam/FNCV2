import { pgTable, uuid, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

/**
 * Per-user gamification state: XP, level, passport stamps, and the
 * lifetime cook counter.
 *
 * Kept in its own table (1:1 with users) so it can be updated on a
 * hot path without rewriting the full user row. Also makes future
 * leaderboards trivial: one SELECT on this table, no JOINs.
 */
export const userHistoryTable = pgTable("user_history", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  totalRecipesCooked: integer("total_recipes_cooked").default(0).notNull(),
  xp: integer("xp").default(0).notNull(),
  level: integer("level").default(1).notNull(),
  /** Map from countryId → number of recipes cooked from that country. */
  passportStamps: jsonb("passport_stamps")
    .$type<Record<string, number>>()
    .default({})
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertUserHistorySchema = createInsertSchema(userHistoryTable).omit({
  updatedAt: true,
});
export type InsertUserHistory = z.infer<typeof insertUserHistorySchema>;
export type UserHistory = typeof userHistoryTable.$inferSelect;
