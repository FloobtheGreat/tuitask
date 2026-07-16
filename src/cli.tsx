#!/usr/bin/env node

import process from 'node:process';
import {render} from 'ink';
import {App} from './App.js';
import {openDatabase} from './db/client.js';
import {SQLiteTaskRepository} from './db/taskRepository.js';
import ansiEscapes from 'ansi-escapes';

process.stdout.write(ansiEscapes.clearViewport);
process.stdout.write(ansiEscapes.cursorTo(0, 0));

async function main(): Promise<void> {
  const connection = openDatabase();
  const repository = new SQLiteTaskRepository(connection.database);
  const instance = render(<App repository={repository} />, {
    alternateScreen: true,
  });
  const shutdown = () => {
    instance.unmount();
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);

  try {
    await instance.waitUntilExit();
  } finally {
    process.removeListener('SIGINT', shutdown);
    process.removeListener('SIGTERM', shutdown);
    connection.close();
  }
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`tuitask: ${message}`);
  console.error(
    'Check the database path and permissions, or set TUITASK_DB_PATH.',
  );
  process.exitCode = 1;
}
