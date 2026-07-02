import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, "..");

export function getConfig() {
  return {
    host: process.env.HOST || "127.0.0.1",
    port: Number(process.env.PORT || 3000),
    appBaseUrl: process.env.APP_BASE_URL || "http://127.0.0.1:3000",
    sqlitePath: path.resolve(rootDir, process.env.SQLITE_PATH || "./data/app.db"),
    bootstrapSetupToken: process.env.BOOTSTRAP_SETUP_TOKEN || "",
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    rateLimitMaxAttempts: Number(process.env.RATE_LIMIT_MAX_ATTEMPTS || 10)
  };
}

export { rootDir };
