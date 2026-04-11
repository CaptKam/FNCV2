import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Explicitly bind to 0.0.0.0 (all IPv4 interfaces). Without the
// host arg, Node's default is ambiguous across versions — some
// default to ::, which means IPv6-only on certain container setups
// and breaks IPv4 clients like the admin panel's Vite proxy.
// Binding to 0.0.0.0 makes the server reachable from:
//   - 127.0.0.1 (same-container dev, Vite proxy target)
//   - LAN IP (real phone on the same network running Expo Go)
//   - The container's public interface (production deploys)
app.listen(port, "0.0.0.0", (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening on 0.0.0.0");
});
