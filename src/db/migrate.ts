import {fileURLToPath} from 'node:url';
import {migrate} from 'drizzle-orm/better-sqlite3/migrator';
import type {AppDatabase} from './client.js';

export function migrateDatabase(database: AppDatabase): void {
  migrate(database, {
    migrationsFolder: fileURLToPath(new URL('./migrations', import.meta.url)),
  });
}
