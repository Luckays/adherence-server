import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDb } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const migrationsDir = path.join(rootDir, "migrations");

const db = getDb();
db.exec(`
  CREATE TABLE IF NOT EXISTS _schema_migrations (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const migrationFiles = fs
  .readdirSync(migrationsDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
  .map((entry) => entry.name)
  .sort((left, right) => left.localeCompare(right));

const appliedRows = db.prepare("SELECT name FROM _schema_migrations ORDER BY name ASC").all();
const applied = new Set(appliedRows.map((row) => String(row.name)));

let appliedCount = 0;
for (const migrationName of migrationFiles) {
  if (applied.has(migrationName)) {
    continue;
  }

  const migrationPath = path.join(migrationsDir, migrationName);
  const migrationSql = fs.readFileSync(migrationPath, "utf8");

  db.exec("BEGIN;");
  try {
    db.exec(migrationSql);
    db.prepare("INSERT INTO _schema_migrations (name) VALUES (?)").run(migrationName);
    db.exec("COMMIT;");
    appliedCount += 1;
    console.log(`Applied migration: ${migrationName}`);
  } catch (error) {
    db.exec("ROLLBACK;");
    throw error;
  }
}

if (appliedCount === 0) {
  console.log("No new SQLite migrations to apply.");
} else {
  console.log(`SQLite migrations applied: ${appliedCount}`);
}
