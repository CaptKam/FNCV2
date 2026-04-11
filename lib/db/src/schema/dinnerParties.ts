import { pgTable, uuid, text, date, jsonb, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

/**
 * Host view of a dinner party (the guest's view will come later
 * when we add cross-user invites). Guests + menu are stored as
 * jsonb blobs because the mobile app always reads them as a unit.
 */
export interface DinnerGuest {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  rsvpStatus: "pending" | "accepted" | "maybe" | "declined";
  dietaryRestrictions?: string[];
  allergens?: string[];
  notes?: string;
  inviteSentAt?: string;
  rsvpRespondedAt?: string;
}

export interface DinnerPartyMenu {
  appetizer?: { recipeId: string; recipeName: string };
  main?: { recipeId: string; recipeName: string };
  dessert?: { recipeId: string; recipeName: string };
}

export const dinnerPartiesTable = pgTable(
  "dinner_parties",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    date: date("date", { mode: "string" }).notNull(),
    title: text("title").notNull(),
    targetServingTime: text("target_serving_time").notNull(),
    cuisineCountryId: text("cuisine_country_id").notNull(),
    status: text("status", {
      enum: ["planning", "invites_sent", "cooking", "completed", "cancelled"],
    })
      .default("planning")
      .notNull(),
    menu: jsonb("menu").$type<DinnerPartyMenu>().default({}).notNull(),
    guests: jsonb("guests").$type<DinnerGuest[]>().default([]).notNull(),
    estimatedStartTime: text("estimated_start_time"),
    totalCookMinutes: integer("total_cook_minutes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("dinner_parties_user_idx").on(t.userId),
    userDateIdx: index("dinner_parties_user_date_idx").on(t.userId, t.date),
  }),
);

export const insertDinnerPartySchema = createInsertSchema(dinnerPartiesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDinnerParty = z.infer<typeof insertDinnerPartySchema>;
export type DinnerParty = typeof dinnerPartiesTable.$inferSelect;
