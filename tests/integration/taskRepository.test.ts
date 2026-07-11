import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type {DatabaseConnection} from '../../src/db/client.js';
import {openDatabase} from '../../src/db/client.js';
import {SQLiteTaskRepository} from '../../src/db/taskRepository.js';
import {TaskNotFoundError} from '../../src/utils/errors.js';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';

const firstTime = new Date('2026-07-10T10:00:00.000Z');
const secondTime = new Date('2026-07-10T11:00:00.000Z');

let directory: string;
let databasePath: string;
let connection: DatabaseConnection;

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tuitask-test-'));
  databasePath = path.join(directory, 'tasks.sqlite');
  connection = openDatabase(databasePath);
});

afterEach(() => {
  connection.close();
  fs.rmSync(directory, {recursive: true, force: true});
});

describe('SQLiteTaskRepository', () => {
  it('migrates an empty database and creates and retrieves a task', () => {
    const repository = new SQLiteTaskRepository(
      connection.database,
      () => firstTime,
    );
    const created = repository.create({
      title: '  Ship release  ',
      description: '  Notes\nfor release  ',
      priority: 3,
      dueDate: '2026-07-12',
    });

    expect(created).toMatchObject({
      id: 1,
      title: 'Ship release',
      description: 'Notes\nfor release',
      priority: 3,
      dueDate: '2026-07-12',
      completedAt: null,
      createdAt: firstTime.toISOString(),
      updatedAt: firstTime.toISOString(),
    });
    expect(repository.getById(created.id)).toEqual(created);
    expect(repository.list()).toEqual([created]);
  });

  it('updates and clears optional fields without reopening a task', () => {
    let currentTime = firstTime;
    const repository = new SQLiteTaskRepository(
      connection.database,
      () => currentTime,
    );
    const created = repository.create({
      title: 'Task',
      description: 'Description',
      priority: 2,
      dueDate: '2026-07-12',
    });
    currentTime = secondTime;
    const completed = repository.setCompleted(created.id, true);
    const updated = repository.update(created.id, {
      title: 'Updated',
      description: null,
      priority: null,
      dueDate: null,
    });

    expect(updated).toMatchObject({
      title: 'Updated',
      description: null,
      priority: null,
      dueDate: null,
      completedAt: completed.completedAt,
      updatedAt: secondTime.toISOString(),
    });
  });

  it('completes, reopens, and deletes a task', () => {
    let currentTime = firstTime;
    const repository = new SQLiteTaskRepository(
      connection.database,
      () => currentTime,
    );
    const created = repository.create({
      title: 'Task',
      description: null,
      priority: null,
      dueDate: null,
    });

    currentTime = secondTime;
    expect(repository.setCompleted(created.id, true)).toMatchObject({
      completedAt: secondTime.toISOString(),
      updatedAt: secondTime.toISOString(),
    });
    expect(repository.setCompleted(created.id, false).completedAt).toBeNull();
    expect(repository.delete(created.id)).toBe(true);
    expect(repository.delete(created.id)).toBe(false);
    expect(repository.getById(created.id)).toBeNull();
  });

  it('throws a typed error when updating a missing task', () => {
    const repository = new SQLiteTaskRepository(connection.database);
    expect(() =>
      repository.update(404, {
        title: 'Missing',
        description: null,
        priority: null,
        dueDate: null,
      }),
    ).toThrow(TaskNotFoundError);
  });

  it('enforces database constraints', () => {
    expect(() =>
      connection.sqlite
        .prepare(
          `INSERT INTO tasks
           (title, priority, created_at, updated_at)
           VALUES (?, ?, ?, ?)`,
        )
        .run(' ', 4, firstTime.toISOString(), firstTime.toISOString()),
    ).toThrow();
  });

  it('persists data after closing and reopening', () => {
    const repository = new SQLiteTaskRepository(
      connection.database,
      () => firstTime,
    );
    repository.create({
      title: 'Persistent',
      description: null,
      priority: 1,
      dueDate: null,
    });

    connection.close();
    connection = openDatabase(databasePath);
    expect(new SQLiteTaskRepository(connection.database).list()[0]?.title).toBe(
      'Persistent',
    );
  });
});
