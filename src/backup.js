import { createSafeBackupFile } from "./db.js";

const backupPath = await createSafeBackupFile();
console.log(`SQLite backup created: ${backupPath}`);
