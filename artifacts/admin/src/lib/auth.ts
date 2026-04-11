/**
 * Admin-panel auth helpers.
 *
 * The token is a `<payload_b64>.<sig_b64>` string produced by the
 * api-server. The payload is a JSON `{ sub, iat, exp }` object — we
 * don't verify the signature client-side (the server does that on
 * every request), but we do decode the expiry so the UI can redirect
 * users to login before firing a doomed request.
 */

const STORAGE_KEY = "admin_token";

interface TokenPayload {
  sub: string;
  iat: number;
  exp: number;
}

function base64urlDecode(str: string): string {
  const pad = str.length % 4 === 2 ? "==" : str.length % 4 === 3 ? "=" : "";
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/") + pad;
  try {
    return atob(b64);
  } catch {
    return "";
  }
}

function decodePayload(token: string): TokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  try {
    const json = base64urlDecode(parts[0]);
    if (!json) return null;
    const parsed = JSON.parse(json);
    if (
      typeof parsed !== "object" ||
      parsed == null ||
      typeof parsed.sub !== "string" ||
      typeof parsed.exp !== "number"
    ) {
      return null;
    }
    return parsed as TokenPayload;
  } catch {
    return null;
  }
}

/** Returns the stored token, or null if missing/expired. Clears expired tokens. */
export function getAdminToken(): string | null {
  const token = localStorage.getItem(STORAGE_KEY);
  if (!token) return null;
  const payload = decodePayload(token);
  if (!payload || payload.exp < Date.now()) {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
  return token;
}

/** Clears the stored token and redirects to login. */
export function clearAdminToken(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** True if a valid, non-expired token exists. */
export function isAuthenticated(): boolean {
  return getAdminToken() !== null;
}
