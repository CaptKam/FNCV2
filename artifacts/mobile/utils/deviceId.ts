import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Stable per-install device identifier for the Phase 1 anonymous
 * account system.
 *
 * - Generated once per install and stored in AsyncStorage.
 * - Survives app restarts but NOT reinstalls.
 * - A reinstall creates a new anonymous account on the server.
 *   Recovery from a reinstall is a future feature ("claim your
 *   account" via email).
 *
 * Not cryptographically sensitive — this is an opaque identifier,
 * not a secret. The server's auth token (returned from /register)
 * is what actually authenticates requests.
 */
const DEVICE_ID_KEY = "@fork_compass_device_id";

const HEX = "0123456789abcdef";

function generateRandomId(): string {
  // 128 bits of entropy from Math.random(). Not cryptographic — just
  // enough to make collisions vanishingly unlikely across installs.
  let out = "";
  for (let i = 0; i < 32; i++) {
    out += HEX[Math.floor(Math.random() * 16)];
  }
  // Format as a uuid-ish string so server-side logs are readable.
  return `${out.slice(0, 8)}-${out.slice(8, 12)}-${out.slice(12, 16)}-${out.slice(
    16,
    20,
  )}-${out.slice(20, 32)}`;
}

/**
 * Returns the device's stable ID, generating and persisting one on
 * first call. Subsequent calls return the same value until the app
 * is reinstalled.
 */
export async function getOrCreateDeviceId(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (existing && existing.length >= 8) return existing;
  } catch {
    // Storage read failure — fall through to generation.
  }
  const id = generateRandomId();
  try {
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  } catch {
    // If we can't persist, the in-memory ID works for this session
    // and the next launch will generate another one. Not ideal but
    // not fatal.
  }
  return id;
}
