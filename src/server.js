import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getConfig } from "./config.js";
import { createSafeBackupDownload, getD1 } from "./db.js";
import { handleApi } from "./appApi.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const publicDir = path.join(projectRoot, "public");

const config = getConfig();
const app = express();
const shouldUseSecureCookies = config.appBaseUrl.startsWith("https://");
const rateLimitStore = new Map();

app.disable("x-powered-by");
// Trust only the local reverse proxy in front of the Node app.
app.set("trust proxy", "loopback");
app.use("/api", createSensitiveApiRateLimit());
app.use("/api", express.raw({ type: "*/*", limit: "10mb" }));
app.use(express.static(publicDir));

app.use("/api", async (req, res) => {
  try {
    const requestUrl = new URL(req.originalUrl, config.appBaseUrl).toString();
    const headers = new Headers();

    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) {
        headers.set(key, value.join(", "));
      } else if (value != null) {
        headers.set(key, String(value));
      }
    }

    const method = req.method.toUpperCase();
    const bodyAllowed = !["GET", "HEAD"].includes(method);
    const body = bodyAllowed ? req.body : undefined;

    const request = new Request(requestUrl, {
      method,
      headers,
      body
    });

    const env = {
      DB: getD1(),
      SELFHOST_SQLITE_PATH: config.sqlitePath,
      SELFHOST_CREATE_SQLITE_BACKUP: createSafeBackupDownload,
      BOOTSTRAP_SETUP_TOKEN: config.bootstrapSetupToken,
      CLOUDFLARE_API_TOKEN: "",
      CLOUDFLARE_ACCOUNT_ID: "",
      CLOUDFLARE_D1_DATABASE_ID: ""
    };

    const response = await handleApi(request, env, new URL(requestUrl));
    res.status(response.status);

    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        const normalizedCookie = shouldUseSecureCookies ? value : value.replace(/;\s*Secure/gi, "");
        res.append("Set-Cookie", normalizedCookie);
      } else {
        res.setHeader(key, value);
      }
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);
  } catch (error) {
    console.error("Selfhost API bridge error", error);
    res.status(500).json({
      error: "server_error",
      message: "Self-hosted server error."
    });
  }
});

app.get("/zdravotnik", (req, res) => {
  res.sendFile(path.join(publicDir, "zdravotnik.html"));
});

app.get("/zdravotnik.html", (req, res) => {
  res.sendFile(path.join(publicDir, "zdravotnik.html"));
});

app.get("/doktor", (req, res) => {
  res.redirect("/zdravotnik.html");
});

app.get("*", (req, res) => {
  const target = req.path.startsWith("/zdravotnik")
    ? path.join(publicDir, "zdravotnik.html")
    : path.join(publicDir, "index.html");
  res.sendFile(target);
});

app.listen(config.port, config.host, () => {
  console.log(`Self-hosted server running on http://${config.host}:${config.port}`);
});

function createSensitiveApiRateLimit() {
  const sensitivePaths = new Set([
    "/api/setup/bootstrap",
    "/api/auth/login",
    "/api/doctor-portal/login"
  ]);

  return (req, res, next) => {
    if (!sensitivePaths.has(req.path) || req.method.toUpperCase() !== "POST") {
      next();
      return;
    }

    const now = Date.now();
    const key = `${req.path}:${getClientIp(req)}`;
    const current = rateLimitStore.get(key);

    if (!current || current.resetAt <= now) {
      rateLimitStore.set(key, { count: 1, resetAt: now + config.rateLimitWindowMs });
      next();
      return;
    }

    if (current.count >= config.rateLimitMaxAttempts) {
      const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSeconds));
      res.status(429).json({
        error: "rate_limited",
        message: "Prilis mnoho pokusu o prihlaseni. Zkuste to znovu pozdeji."
      });
      return;
    }

    current.count += 1;
    next();
  };
}

function getClientIp(req) {
  return req.ip || req.socket.remoteAddress || "unknown";
}
