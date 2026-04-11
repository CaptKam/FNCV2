/**
 * Mobile-app device authentication middleware.
 *
 * Separate from admin auth (middlewares/auth.ts). Admins get HMAC
 * tokens encoding an email subject; mobile clients get HMAC tokens
 * encoding a `device_sessions.id`. Same crypto primitive, different
 * lookup path, different revocation semantics.
 *
 * Phase 1: anonymous-only. A mobile client POSTs a stable device ID
 * to /api/users/register, the server creates a `users` row and a
 * `device_sessions` row, and returns `signMobileToken(session.id)`.
 * Subsequent requests must include `Authorization: Bearer <token>`.
 *
 * On every request, the middleware:
 *   1. HMAC-verifies the token (timing-safe)
 *   2. Looks up the session in Postgres
 *   3. Rejects if the session is revoked
 *   4. Bumps last_seen_at for analytics
 *   5. Attaches { userId, sessionId } to req.mobileUser
 *
 * Revocation is cheap: set device_sessions.revoked_at. The next
 * request with that token returns 401 and the mobile client clears
 * its stored token and re-registers.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { db, deviceSessionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

function getSecret(): string {
  // We reuse ADMIN_AUTH_SECRET because it's already required in
  // production and rotating it rotates both admin and mobile tokens
  // at the same time, which is usually what you want.
  const secret = process.env.ADMIN_AUTH_SECRET;
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "ADMIN_AUTH_SECRET env var is required (min 16 chars) in production",
      );
    }
    return "dev-only-insecure-fallback-secret-replace-in-production-k9x2";
  }
  return secret;
}

function base64urlEncode(data: Buffer | string): string {
  const buf = typeof data === "string" ? Buffer.from(data, "utf8") : data;
  return buf.toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64urlDecode(str: string): Buffer {
  const pad = str.length % 4 === 2 ? "==" : str.length % 4 === 3 ? "=" : "";
  return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

/**
 * Sign a mobile device token. The payload is just the session ID —
 * unlike admin tokens, we don't encode an expiry because the session
 * row is the source of truth for validity. Revocation is handled by
 * setting `device_sessions.revoked_at`.
 */
export function signMobileToken(sessionId: string): string {
  const payloadB64 = base64urlEncode(sessionId);
  const sig = createHmac("sha256", getSecret()).update(payloadB64).digest();
  return `${payloadB64}.${base64urlEncode(sig)}`;
}

/** Verify a mobile token's signature. Returns the session ID or null. */
function verifyMobileTokenSignature(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;

  const expectedSig = createHmac("sha256", getSecret()).update(payloadB64).digest();
  let providedSig: Buffer;
  try {
    providedSig = base64urlDecode(sigB64);
  } catch {
    return null;
  }
  if (providedSig.length !== expectedSig.length) return null;
  if (!timingSafeEqual(providedSig, expectedSig)) return null;

  try {
    const sessionId = base64urlDecode(payloadB64).toString("utf8");
    // Cheap sanity check: UUIDs are 36 chars.
    if (sessionId.length !== 36) return null;
    return sessionId;
  } catch {
    return null;
  }
}

export interface MobileAuthedRequest extends Request {
  mobileUser?: {
    userId: string;
    sessionId: string;
  };
}

/**
 * Express middleware: reject if the bearer token isn't valid, the
 * session doesn't exist, or the session has been revoked. On success,
 * attach `req.mobileUser` and bump `last_seen_at`.
 *
 * Note: last_seen_at is bumped fire-and-forget — we don't await it so
 * auth stays fast. If the DB write fails, auth still succeeds (the
 * analytics timestamp just stays stale).
 */
export async function requireMobileAuth(
  req: MobileAuthedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers["authorization"];
  if (!header || typeof header !== "string" || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or malformed Authorization header" });
    return;
  }
  const token = header.slice("Bearer ".length).trim();

  const sessionId = verifyMobileTokenSignature(token);
  if (!sessionId) {
    res.status(401).json({ error: "Invalid token signature" });
    return;
  }

  // Look up the session, rejecting revoked rows.
  const rows = await db
    .select({
      id: deviceSessionsTable.id,
      userId: deviceSessionsTable.userId,
      revokedAt: deviceSessionsTable.revokedAt,
    })
    .from(deviceSessionsTable)
    .where(eq(deviceSessionsTable.id, sessionId))
    .limit(1);

  if (rows.length === 0) {
    res.status(401).json({ error: "Session not found" });
    return;
  }
  const session = rows[0];
  if (session.revokedAt !== null) {
    res.status(401).json({ error: "Session revoked" });
    return;
  }

  // Bump last_seen_at fire-and-forget. Don't await; don't surface errors.
  void db
    .update(deviceSessionsTable)
    .set({ lastSeenAt: sql`now()` })
    .where(eq(deviceSessionsTable.id, sessionId))
    .catch(() => {
      /* analytics-only; swallow */
    });

  req.mobileUser = { userId: session.userId, sessionId };
  next();
}
