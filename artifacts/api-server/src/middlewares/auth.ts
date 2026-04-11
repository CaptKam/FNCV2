/**
 * Admin authentication middleware.
 *
 * Uses HMAC-SHA256 signed tokens (a minimal JWT-alike) so we don't
 * pull a new dependency just to gate the admin panel.
 *
 * Token format: `<payload_b64>.<signature_b64>` where payload is a
 * JSON object `{ sub, iat, exp }`. The signature is an HMAC of the
 * payload with the shared secret.
 *
 * Password format: `<salt_hex>:<hash_hex>` generated with scrypt.
 * Compare with timing-safe equality.
 */
import { createHmac, scryptSync, timingSafeEqual, randomBytes } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const SCRYPT_KEYLEN = 64;

function getSecret(): string {
  const secret = process.env.ADMIN_AUTH_SECRET;
  if (!secret || secret.length < 16) {
    // Fail fast in production; in dev fall back to a stable local key.
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

interface TokenPayload {
  sub: string; // subject (admin email)
  iat: number; // issued at (ms)
  exp: number; // expires at (ms)
}

/** Sign a new admin token for the given subject. */
export function signAdminToken(sub: string): string {
  const now = Date.now();
  const payload: TokenPayload = { sub, iat: now, exp: now + TOKEN_TTL_MS };
  const payloadB64 = base64urlEncode(JSON.stringify(payload));
  const sig = createHmac("sha256", getSecret()).update(payloadB64).digest();
  return `${payloadB64}.${base64urlEncode(sig)}`;
}

/** Verify a token and return its payload, or null if invalid/expired. */
export function verifyAdminToken(token: string): TokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;

  // Recompute signature and compare with timing-safe equality.
  const expectedSig = createHmac("sha256", getSecret()).update(payloadB64).digest();
  let providedSig: Buffer;
  try {
    providedSig = base64urlDecode(sigB64);
  } catch {
    return null;
  }
  if (providedSig.length !== expectedSig.length) return null;
  if (!timingSafeEqual(providedSig, expectedSig)) return null;

  // Parse payload and check expiry.
  let payload: TokenPayload;
  try {
    payload = JSON.parse(base64urlDecode(payloadB64).toString("utf8"));
  } catch {
    return null;
  }
  if (typeof payload.exp !== "number" || Date.now() > payload.exp) return null;
  if (typeof payload.sub !== "string" || !payload.sub) return null;
  return payload;
}

/** Hash a password with scrypt. Returns `<salt_hex>:<hash_hex>`. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

/** Verify a password against a stored scrypt hash. Timing-safe. */
export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 2) return false;
  const [saltHex, hashHex] = parts;
  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(saltHex, "hex");
    expected = Buffer.from(hashHex, "hex");
  } catch {
    return false;
  }
  if (expected.length !== SCRYPT_KEYLEN) return false;
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN);
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

/**
 * Look up the admin password hash for the given email.
 *
 * Priority:
 *   1. `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH` env vars (production path)
 *   2. Dev fallback: `admin@forkandcompass.com` / `admin123`
 *
 * In production, set ADMIN_PASSWORD_HASH to the output of
 * `hashPassword("your-password")`.
 */
function lookupAdminHash(email: string): string | null {
  const envEmail = process.env.ADMIN_EMAIL;
  const envHash = process.env.ADMIN_PASSWORD_HASH;
  if (envEmail && envHash) {
    return email === envEmail ? envHash : null;
  }
  if (process.env.NODE_ENV === "production") {
    // No admin configured in production — refuse all logins.
    return null;
  }
  // Dev fallback. This hash is `admin123` — regenerated on every module load
  // because scrypt with a random salt produces a different hash each time,
  // but the stored format is deterministic to verify.
  if (email === "admin@forkandcompass.com") {
    // Cache the dev hash so we don't rehash on every login attempt.
    if (!cachedDevHash) cachedDevHash = hashPassword("admin123");
    return cachedDevHash;
  }
  return null;
}
let cachedDevHash: string | null = null;

/**
 * Verify admin credentials. Returns the subject on success, null on failure.
 * Uses timing-safe password verification.
 */
export function verifyAdminCredentials(email: string, password: string): string | null {
  if (!email || !password) return null;
  const stored = lookupAdminHash(email);
  if (!stored) {
    // Still run scrypt against a dummy hash to keep the timing consistent
    // whether or not the email exists (prevents user enumeration).
    const dummy =
      "0000000000000000000000000000000000000000000000000000000000000000" +
      ":" +
      "0".repeat(128);
    verifyPassword(password, dummy);
    return null;
  }
  if (!verifyPassword(password, stored)) return null;
  return email;
}

/**
 * Express middleware that gates a route behind a valid admin token.
 *
 * Reads the `Authorization: Bearer <token>` header and, on success,
 * attaches the decoded subject to `req.adminSub`.
 */
export interface AuthedRequest extends Request {
  adminSub?: string;
}

export function requireAdminAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers["authorization"];
  if (!header || typeof header !== "string" || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or malformed Authorization header" });
    return;
  }
  const token = header.slice("Bearer ".length).trim();
  const payload = verifyAdminToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
  req.adminSub = payload.sub;
  next();
}
