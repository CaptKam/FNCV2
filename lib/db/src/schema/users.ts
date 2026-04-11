import { pgTable, text, timestamp, boolean, integer, jsonb, uuid, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Mobile app user accounts.
 *
 * Phase 1: silent anonymous accounts. The mobile app generates a
 * device-bound ID on first launch, POSTs it to /api/users/register,
 * and receives back the server-side `id` + an auth token.
 *
 * `email` + `passwordHash` are nullable for now — the upgrade path to
 * email/password is "claim your anonymous account" and can be layered
 * on top later without touching existing rows.
 */
export const usersTable = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    deviceId: text("device_id").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),

    // Future: email/password upgrade path
    email: text("email"),
    passwordHash: text("password_hash"),

    // Profile
    displayName: text("display_name").default("").notNull(),
    avatarId: text("avatar_id").default("chef").notNull(),

    // Cooking preferences
    cookingLevel: text("cooking_level", { enum: ["beginner", "home_cook", "chef"] })
      .default("home_cook")
      .notNull(),
    coursePreference: text("course_preference", { enum: ["main", "full"] })
      .default("main")
      .notNull(),
    groceryPartner: text("grocery_partner", {
      enum: ["instacart", "kroger", "walmart", "amazon_fresh"],
    })
      .default("instacart")
      .notNull(),
    zipCode: text("zip_code").default("").notNull(),
    useMetric: boolean("use_metric").default(true).notNull(),
    defaultServings: integer("default_servings").default(4).notNull(),

    // Restrictions
    dietaryFlags: jsonb("dietary_flags").$type<string[]>().default([]).notNull(),
    allergens: jsonb("allergens").$type<string[]>().default([]).notNull(),

    // Onboarding
    hasCompletedOnboarding: boolean("has_completed_onboarding").default(false).notNull(),
  },
  (t) => ({
    deviceIdIdx: index("users_device_id_idx").on(t.deviceId),
  }),
);

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
