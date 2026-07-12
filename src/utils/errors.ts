export class TaskNotFoundError extends Error {
  constructor(id: number) {
    super(`Task ${id} was not found`);
    this.name = 'TaskNotFoundError';
  }
}

export class ProjectNotFoundError extends Error {
  constructor(id: number) {
    super(`Project ${id} was not found`);
    this.name = 'ProjectNotFoundError';
  }
}

export class ProjectConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProjectConflictError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'DatabaseError';
  }
}
