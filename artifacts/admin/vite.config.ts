import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    "BASE_PATH environment variable is required but was not provided.",
  );
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    // Forward /api/* requests to the Express api-server. The api-server
    // runs as a separate process (usually on port 3001 in dev) and owns
    // routes like /api/admin/login, /api/countries, /api/users/*. This
    // proxy is only active in `vite dev`; production deploys should serve
    // the admin static build and the api-server from the same origin.
    //
    // We target 127.0.0.1 (not "localhost") because Node 17+ resolves
    // "localhost" to IPv6 ::1 first, and Express apps that bind with
    // app.listen(port) usually only listen on IPv4. Using localhost
    // would silently 502 every request on Replit.
    //
    // Override via env var `API_PROXY_TARGET` if you run api-server on a
    // different port or host (e.g. a dedicated dev backend URL).
    proxy: {
      "/api": {
        target: process.env.API_PROXY_TARGET || "http://127.0.0.1:3001",
        changeOrigin: true,
        // Surface proxy errors in the Vite console. Without this, a
        // downed api-server just hangs the browser until timeout and
        // the only clue is a 504 in the network tab.
        configure: (proxy) => {
          proxy.on("error", (err, req) => {
            // eslint-disable-next-line no-console
            console.warn(
              `[vite proxy] ${req.method} ${req.url} → ${
                (err as Error & { code?: string }).code ?? "error"
              }: ${(err as Error).message}`,
            );
          });
        },
      },
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
