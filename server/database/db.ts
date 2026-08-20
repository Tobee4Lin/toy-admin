import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './sqlite-schema';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

export { schema };
export type DbType = BetterSQLite3Database<typeof schema>;

let dbInstance: DbType | null = null;

export function getDatabase(dbPath?: string): DbType {
  if (dbInstance) return dbInstance;

  const resolvedPath = dbPath || process.env.DB_PATH || join(process.cwd(), 'data', 'app.db');
  const dir = join(resolvedPath, '..');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const sqlite = new Database(resolvedPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  dbInstance = drizzle(sqlite, { schema });
  return dbInstance;
}
