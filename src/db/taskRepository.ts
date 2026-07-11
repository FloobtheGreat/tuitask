import {eq} from 'drizzle-orm';
import {normalizeTaskInput} from '../domain/validation.js';
import type {
  CreateTaskInput,
  Priority,
  Task,
  TaskRepository,
  UpdateTaskInput,
} from '../domain/task.js';
import {DatabaseError, TaskNotFoundError} from '../utils/errors.js';
import type {AppDatabase} from './client.js';
import {tasks, type TaskRow} from './schema.js';

export type Clock = () => Date;

function mapTask(row: TaskRow): Task {
  return {
    ...row,
    priority: row.priority as Priority | null,
  };
}

function databaseFailure(operation: string, error: unknown): never {
  if (error instanceof TaskNotFoundError) throw error;
  throw new DatabaseError(`Unable to ${operation}`, {cause: error});
}

export class SQLiteTaskRepository implements TaskRepository {
  constructor(
    private readonly database: AppDatabase,
    private readonly clock: Clock = () => new Date(),
  ) {}

  list(): Task[] {
    try {
      return this.database.select().from(tasks).all().map(mapTask);
    } catch (error) {
      return databaseFailure('list tasks', error);
    }
  }

  getById(id: number): Task | null {
    try {
      const row = this.database
        .select()
        .from(tasks)
        .where(eq(tasks.id, id))
        .get();
      return row ? mapTask(row) : null;
    } catch (error) {
      return databaseFailure(`load task ${id}`, error);
    }
  }

  create(input: CreateTaskInput): Task {
    try {
      const now = this.clock();
      const normalized = normalizeTaskInput(input, now);
      const timestamp = now.toISOString();
      const row = this.database
        .insert(tasks)
        .values({...normalized, createdAt: timestamp, updatedAt: timestamp})
        .returning()
        .get();
      return mapTask(row);
    } catch (error) {
      return databaseFailure('create task', error);
    }
  }

  update(id: number, input: UpdateTaskInput): Task {
    try {
      const now = this.clock();
      const normalized = normalizeTaskInput(input, now);
      const row = this.database
        .update(tasks)
        .set({...normalized, updatedAt: now.toISOString()})
        .where(eq(tasks.id, id))
        .returning()
        .get();
      if (!row) throw new TaskNotFoundError(id);
      return mapTask(row);
    } catch (error) {
      return databaseFailure(`update task ${id}`, error);
    }
  }

  setCompleted(id: number, completed: boolean): Task {
    try {
      const timestamp = this.clock().toISOString();
      const row = this.database
        .update(tasks)
        .set({
          completedAt: completed ? timestamp : null,
          updatedAt: timestamp,
        })
        .where(eq(tasks.id, id))
        .returning()
        .get();
      if (!row) throw new TaskNotFoundError(id);
      return mapTask(row);
    } catch (error) {
      return databaseFailure(
        `${completed ? 'complete' : 'reopen'} task ${id}`,
        error,
      );
    }
  }

  delete(id: number): boolean {
    try {
      return (
        this.database.delete(tasks).where(eq(tasks.id, id)).run().changes > 0
      );
    } catch (error) {
      return databaseFailure(`delete task ${id}`, error);
    }
  }
}
