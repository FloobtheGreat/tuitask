import {asc, eq, sql} from 'drizzle-orm';
import {
  INBOX_PROJECT_ID,
  type Project,
  type ProjectRepository,
} from '../domain/project.js';
import {
  normalizeProjectInput,
  normalizeTaskInput,
} from '../domain/validation.js';
import type {
  CreateTaskInput,
  Priority,
  Task,
  TaskRepository,
  UpdateTaskInput,
} from '../domain/task.js';
import {
  DatabaseError,
  ProjectConflictError,
  ProjectNotFoundError,
  TaskNotFoundError,
} from '../utils/errors.js';
import type {AppDatabase} from './client.js';
import {projects, tasks, type ProjectRow, type TaskRow} from './schema.js';

export type Clock = () => Date;

function mapTask(row: TaskRow): Task {
  return {
    ...row,
    priority: row.priority as Priority | null,
  };
}

function mapProject(row: ProjectRow): Project {
  return row;
}

function databaseFailure(operation: string, error: unknown): never {
  if (
    error instanceof TaskNotFoundError ||
    error instanceof ProjectNotFoundError ||
    error instanceof ProjectConflictError
  )
    throw error;
  throw new DatabaseError(`Unable to ${operation}`, {cause: error});
}

export class SQLiteTaskRepository implements TaskRepository, ProjectRepository {
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

  listProjects(): Project[] {
    try {
      return this.database
        .select()
        .from(projects)
        .orderBy(asc(projects.id))
        .all()
        .map(mapProject);
    } catch (error) {
      return databaseFailure('list projects', error);
    }
  }

  createProject(input: {name: string}): Project {
    try {
      const normalized = normalizeProjectInput(input);
      const timestamp = this.clock().toISOString();
      const row = this.database
        .insert(projects)
        .values({...normalized, createdAt: timestamp, updatedAt: timestamp})
        .returning()
        .get();
      return mapProject(row);
    } catch (error) {
      if (this.isUniqueProjectNameError(error)) {
        throw new ProjectConflictError(
          'A project with that name already exists',
        );
      }
      return databaseFailure('create project', error);
    }
  }

  updateProject(id: number, input: {name: string}): Project {
    try {
      if (id === INBOX_PROJECT_ID) {
        throw new ProjectConflictError('Inbox cannot be renamed');
      }
      const normalized = normalizeProjectInput(input);
      const row = this.database
        .update(projects)
        .set({...normalized, updatedAt: this.clock().toISOString()})
        .where(eq(projects.id, id))
        .returning()
        .get();
      if (!row) throw new ProjectNotFoundError(id);
      return mapProject(row);
    } catch (error) {
      if (this.isUniqueProjectNameError(error)) {
        throw new ProjectConflictError(
          'A project with that name already exists',
        );
      }
      return databaseFailure(`update project ${id}`, error);
    }
  }

  deleteProject(id: number): boolean {
    try {
      if (id === INBOX_PROJECT_ID) {
        throw new ProjectConflictError('Inbox cannot be deleted');
      }
      const taskCount = this.database
        .select({count: sql<number>`count(*)`})
        .from(tasks)
        .where(eq(tasks.projectId, id))
        .get()?.count;
      if ((taskCount ?? 0) > 0) {
        throw new ProjectConflictError(
          'Move or delete all tasks before deleting this project',
        );
      }
      return (
        this.database.delete(projects).where(eq(projects.id, id)).run()
          .changes > 0
      );
    } catch (error) {
      return databaseFailure(`delete project ${id}`, error);
    }
  }

  private isUniqueProjectNameError(error: unknown): boolean {
    return (
      error instanceof Error &&
      error.message.includes('UNIQUE constraint failed')
    );
  }
}
