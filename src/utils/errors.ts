export class TaskNotFoundError extends Error {
  constructor(id: number) {
    super(`Task ${id} was not found`);
    this.name = 'TaskNotFoundError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'DatabaseError';
  }
}
