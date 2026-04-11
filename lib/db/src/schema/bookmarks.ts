import { pgTable, uuid, text, timestamp, primaryKey, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

/**
 * Saved recipes. Composite primary key `(userId, recipeId)` so
 * there's exactly one row per save and unsave is idempotent.
 */
export const bookmarksTable = pgTable(
  "bookmarks",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    recipeId: text("recipe_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.recipeId] }),
    userIdx: index("bookmarks_user_idx").on(t.userId),
  }),
);

export const insertBookmarkSchema = createInsertSchema(bookmarksTable).omit({
  createdAt: true,
});
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type Bookmark = typeof bookmarksTable.$inferSelect;
