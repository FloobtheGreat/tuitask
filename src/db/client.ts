import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import {drizzle} from 'drizzle-orm/better-sqlite3';
import {DatabaseError} from '../utils/errors.js';
import {migrateDatabase} from './migrate.js';
import {getDatabasePath} from './paths.js';
import * as schema from './schema.js';

export type AppDatabase = ReturnType<typeof createDrizzleDatabase>;

function createDrizzleDatabase(sqlite: Database.Database) {
  return drizzle(sqlite, {schema});
}

export type DatabaseConnection = {
  database: AppDatabase;
  sqlite: Database.Database;
  path: string;
  close(): void;
};

export function openDatabase(
  databasePath = getDatabasePath(),
): DatabaseConnection {
  let sqlite: Database.Database | undefined;

  try {
    fs.mkdirSync(path.dirname(databasePath), {recursive: true});
    sqlite = new Database(databasePath);
    sqlite.pragma('foreign_keys = ON');
    const database = createDrizzleDatabase(sqlite);
    migrateDatabase(database);

    return {
      database,
      sqlite,
      path: databasePath,
      close: () => sqlite?.close(),
    };
  } catch (error) {
    sqlite?.close();
    throw new DatabaseError(
      `Unable to initialize the tuitask database at ${databasePath}`,
      {cause: error},
    );
  }
}
