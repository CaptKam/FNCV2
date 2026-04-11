/**
 * Resolves the base URL for API calls at runtime.
 *
 * The naive approach — just use `http://localhost:3001` — breaks on
 * a real phone running Expo Go. On-device, `localhost` means the
 * phone itself, not the dev machine. The phone can't reach the
 * dev machine's localhost; it needs the dev machine's LAN IP.
 *
 * Resolution order:
 *
 *   1. `EXPO_PUBLIC_API_URL` env var — always wins. Set this for
 *      production deploys (points at the real server) or to override
 *      any of the heuristics below.
 *
 *   1b. `EXPO_PUBLIC_DOMAIN` env var — Replit dev. The mobile dev
 *      script sets this to $REPLIT_DEV_DOMAIN, the main HTTPS dev
 *      domain. Replit's proxy forwards /api/* from that domain to
 *      the api-server on port 3001, so hitting `https://<domain>`
 *      works. Building `http://<domain>:3001` like branch 2 would
 *      fails because Replit doesn't expose arbitrary ports.
 *
 *   2. Expo dev server host — when running in Expo Go or a dev
 *      client on a local network (laptop + phone), `Constants.expoConfig.hostUri`
 *      is something like "192.168.1.42:8081" (the dev machine's LAN
 *      IP that the phone is already reaching to download the JS
 *      bundle). We reuse that IP with the api-server's port.
 *
 *   3. Web — when running in the browser (Expo web), we can trust
 *      `window.location.origin`. In production deploys the web build
 *      is served from the same origin as the api-server, so /api
 *      paths just work. In dev the Vite proxy forwards /api, same
 *      deal.
 *
 *   4. Fallback — `http://localhost:3001`. Works on simulators
 *      (they share localhost with the dev machine) and as a last
 *      resort.
 *
 * The resolved URL is computed once at module load. If you ever
 * need to change it at runtime (unlikely — dev machines don't
 * hop IPs mid-session), restart the JS bundle.
 */
import Constants from "expo-constants";
import { Platform } from "react-native";

const DEFAULT_API_PORT = 3001;

function resolveBaseUrl(): string {
  // 1. Explicit env var (production, or when you want to override).
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.length > 0) {
    return envUrl.replace(/\/+$/, "");
  }

  // 1b. Replit dev: the mobile dev script sets EXPO_PUBLIC_DOMAIN to
  //     $REPLIT_DEV_DOMAIN (the main https dev domain). The api-server
  //     is reachable at that domain through Replit's proxy, which
  //     forwards /api/* to the api-server on port 3001. The phone
  //     reaches the domain over HTTPS on 443 — direct http://host:3001
  //     will NOT work because Replit doesn't expose arbitrary ports
  //     externally.
  //
  //     This branch runs after the explicit EXPO_PUBLIC_API_URL check
  //     so a consumer can always override, and BEFORE the hostUri
  //     branch below, which on Replit would build an unreachable
  //     `http://<replit-domain>:3001` URL.
  const replitDomain = process.env.EXPO_PUBLIC_DOMAIN;
  if (replitDomain && replitDomain.length > 0) {
    const stripped = replitDomain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    return `https://${stripped}`;
  }

  // 2. Expo dev server: reuse the dev machine's LAN IP.
  //    Constants.expoConfig.hostUri is typically "192.168.1.42:8081"
  //    (IP:port of the Metro bundler). On the legacy manifest path
  //    it's at Constants.manifest.debuggerHost. We handle both.
  const expoConfig = Constants.expoConfig as { hostUri?: string } | null | undefined;
  const legacyManifest = (Constants as unknown as {
    manifest?: { debuggerHost?: string };
    manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } };
  });
  const hostUri =
    expoConfig?.hostUri ??
    legacyManifest.manifest?.debuggerHost ??
    legacyManifest.manifest2?.extra?.expoGo?.debuggerHost;

  if (hostUri && typeof hostUri === "string") {
    // Strip the port — we want just the IP (or hostname).
    const host = hostUri.split(":")[0];
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      return `http://${host}:${DEFAULT_API_PORT}`;
    }
  }

  // 3. Web: same-origin. In dev, the Vite proxy handles /api. In
  //    production, the api-server serves the admin static build
  //    from the same origin.
  if (Platform.OS === "web" && typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }

  // 4. Simulator / fallback.
  return `http://localhost:${DEFAULT_API_PORT}`;
}

const BASE_URL = resolveBaseUrl();

if (__DEV__) {
  console.log(`[api] base URL resolved to ${BASE_URL}`);
}

/** The resolved API base URL. Computed once at module load. */
export function getApiBaseUrl(): string {
  return BASE_URL;
}
