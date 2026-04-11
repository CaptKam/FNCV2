import { pgTable, uuid, text, date, boolean, jsonb, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

/**
 * Shape of a single planned meal inside a day's `courses` map.
 * Mirrors the mobile `PlannedMeal` interface — recipe metadata is
 * snapshotted at plan time so the plan view stays readable even if
 * the recipe catalog changes.
 */
export interface PlannedMeal {
  recipeId: string;
  recipeName: string;
  recipeImage: string;
  countryFlag: string;
  cookTime: number;
  addedAt: string;
  servings?: number;
}

/**
 * One row per (userId, date) pair. The full day's course slots
 * live in a single `courses` jsonb column because reads and writes
 * are always "the whole day" on mobile — there's no UI that asks
 * for just the appetizer.
 *
 * `unique(user_id, date)` is enforced so sync-from-mobile can
 * upsert with ON CONFLICT without ambiguity.
 */
export const itineraryDaysTable = pgTable(
  "itinerary_days",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    /** Local YYYY-MM-DD date. Stored as SQL DATE so range queries work. */
    date: date("date", { mode: "string" }).notNull(),
    dayLabel: text("day_label").notNull(),
    hasDinnerParty: boolean("has_dinner_party").default(false).notNull(),
    courses: jsonb("courses")
      .$type<{
        appetizer?: PlannedMeal;
        main?: PlannedMeal;
        dessert?: PlannedMeal;
      }>()
      .default({})
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userDateUnique: uniqueIndex("itinerary_days_user_date_idx").on(t.userId, t.date),
    userIdx: index("itinerary_days_user_idx").on(t.userId),
  }),
);

export const insertItineraryDaySchema = createInsertSchema(itineraryDaysTable).omit({
  id: true,
  updatedAt: true,
});
export type InsertItineraryDay = z.infer<typeof insertItineraryDaySchema>;
export type ItineraryDay = typeof itineraryDaysTable.$inferSelect;
