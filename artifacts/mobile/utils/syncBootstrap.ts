/**
 * One-shot sync bootstrap — called during AppContext hydration.
 *
 * Sequence:
 *   1. Get (or generate) a stable device ID
 *   2. If we already have a mobile auth token, we're done
 *   3. Otherwise POST /api/users/register, store the returned token
 *
 * Failure handling:
 *   - If /register fails (server offline, network error, etc.), the
 *     app continues working in local-only mode exactly as it did
 *     before Phase 2. On the next launch we'll retry.
 *   - We deliberately don't block app startup waiting for the server.
 *     This is the "fire and forget" philosophy — local is the source
 *     of truth; the server is a passive backup.
 *
 * The bootstrap runs exactly once per app session. Subsequent
 * mutations call sync functions directly from AppContext actions.
 */
import { Platform } from "react-native";
import { getOrCreateDeviceId } from "./deviceId";
import { getMobileToken, setMobileToken, syncRegister } from "./syncClient";
import { loadIngredientTaxonomy } from "./ingredientTaxonomy";
import { loadRemoteConfig } from "./remoteConfig";

let bootstrapPromise: Promise<BootstrapResult> | null = null;

export interface BootstrapResult {
  /** True if the device has a valid auth token (either cached or freshly obtained). */
  ready: boolean;
  /** Server-assigned user UUID, once /register has succeeded. */
  userId?: string;
  /** Reason the bootstrap didn't complete, for logging. */
  error?: string;
}

function platformTag(): "ios" | "android" | "web" {
  if (Platform.OS === "ios") return "ios";
  if (Platform.OS === "android") return "android";
  return "web";
}

async function runBootstrap(): Promise<BootstrapResult> {
  // Kick off the ingredient taxonomy + remote-config loads in
  // parallel with registration. Both endpoints are public (no
  // auth) so they start immediately and populate their in-memory
  // stores even if registration fails.
  void loadIngredientTaxonomy();
  void loadRemoteConfig();

  // Step 1: ensure we have a device ID. This always succeeds (falls
  // back to an in-memory ID if AsyncStorage is broken).
  const deviceId = await getOrCreateDeviceId();

  // Step 2: if a token is already cached, we're done. No network call.
  const existingToken = await getMobileToken();
  if (existingToken) {
    return { ready: true };
  }

  // Step 3: register with the server. Any failure here is non-fatal —
  // the app stays in local-only mode until the next launch retries.
  try {
    const result = await syncRegister(deviceId, platformTag());
    await setMobileToken(result.token);
    return { ready: true, userId: result.userId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Swallowing the error intentionally — local-only mode is the
    // graceful degradation. Log for diagnostics only.
    if (__DEV__) {
      console.warn("[syncBootstrap] register failed, continuing offline:", message);
    }
    return { ready: false, error: message };
  }
}

/**
 * Kick off the bootstrap. Safe to call multiple times — returns the
 * same promise until it resolves, then caches the result.
 */
export function bootstrapSync(): Promise<BootstrapResult> {
  if (!bootstrapPromise) {
    bootstrapPromise = runBootstrap();
  }
  return bootstrapPromise;
}

/** True if bootstrapSync has completed and we have a usable token. */
export async function isSyncReady(): Promise<boolean> {
  if (!bootstrapPromise) return false;
  const result = await bootstrapPromise;
  return result.ready;
}
