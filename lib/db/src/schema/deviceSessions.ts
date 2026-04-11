import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

/**
 * Device-bound auth sessions for the mobile app.
 *
 * Phase 1 is anonymous-only: each mobile install generates a stable
 * device ID and POSTs it to /api/users/register. The server creates
 * a user row and a device session row, and returns a token. The
 * token is an HMAC of `session.id` — verifying it server-side
 * just requires looking up the session row.
 *
 * Kept as a separate table (rather than a token column on `users`)
 * because:
 *   - we can issue multiple tokens per user in the future (one per
 *     device when the email-claim upgrade lets a user sign in on
 *     device B)
 *   - we can revoke an individual session without nuking the user
 *   - `lastSeenAt` is the foundation for "last active" analytics
 */
export const deviceSessionsTable = pgTable(
  "device_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    /** Stable device identifier sent at register time. */
    deviceId: text("device_id").notNull(),
    /** Optional platform tag for debugging — "ios", "android", "web". */
    platform: text("platform"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
    /**
     * Set to a non-null timestamp to revoke the session. Requests
     * with a token for a revoked session are rejected with 401.
     */
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => ({
    userIdx: index("device_sessions_user_idx").on(t.userId),
    deviceIdx: index("device_sessions_device_idx").on(t.deviceId),
  }),
);

export const insertDeviceSessionSchema = createInsertSchema(deviceSessionsTable).omit({
  id: true,
  createdAt: true,
  lastSeenAt: true,
  revokedAt: true,
});
export type InsertDeviceSession = z.infer<typeof insertDeviceSessionSchema>;
export type DeviceSession = typeof deviceSessionsTable.$inferSelect;
