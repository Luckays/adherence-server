import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { getConfig } from "./config.js";
import { createD1Database } from "./d1shim.js";

let dbInstance = null;
let d1Instance = null;

export function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const config = getConfig();
  fs.mkdirSync(path.dirname(config.sqlitePath), { recursive: true });

  const db = new DatabaseSync(config.sqlitePath);
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA journal_mode = WAL;");
  dbInstance = db;
  return dbInstance;
}

export function getD1() {
  if (d1Instance) {
    return d1Instance;
  }

  d1Instance = createD1Database(getDb());
  return d1Instance;
}

export async function createSafeBackupFile(targetPath) {
  const config = getConfig();
  const db = getDb();
  const backupDir = path.join(path.dirname(config.sqlitePath), "backups");
  const timestamp = new Date().toISOString().slice(0, 19).replaceAll(":", "-");
  const finalPath = path.resolve(targetPath || path.join(backupDir, `app-backup-${timestamp}.db`));
  const tempPath = `${finalPath}.tmp`;

  await fsp.mkdir(path.dirname(finalPath), { recursive: true });
  await fsp.rm(tempPath, { force: true });
  await fsp.rm(finalPath, { force: true });

  // Create a consistent SQLite snapshot even while the database runs in WAL mode.
  db.exec("PRAGMA wal_checkpoint(FULL);");
  db.exec(`VACUUM INTO ${quoteSqlString(tempPath)};`);
  await fsp.rename(tempPath, finalPath);

  return finalPath;
}

export async function createSafeBackupDownload() {
  const timestamp = new Date().toISOString().slice(0, 19).replaceAll(":", "-");
  const filename = `sqlite-backup-${timestamp}.db`;
  const backupPath = await createSafeBackupFile(path.join(path.dirname(getConfig().sqlitePath), filename));

  try {
    const data = await fsp.readFile(backupPath);
    return { data, filename };
  } finally {
    await fsp.rm(backupPath, { force: true });
  }
}

function quoteSqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}
