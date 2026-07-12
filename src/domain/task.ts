export type Priority = 1 | 2 | 3;
export type TaskFilter = 'active' | 'completed' | 'all';

export type Task = {
  id: number;
  projectId: number;
  title: string;
  description: string | null;
  priority: Priority | null;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateTaskInput = {
  projectId: number;
  title: string;
  description: string | null;
  priority: Priority | null;
  dueDate: string | null;
};

export type UpdateTaskInput = CreateTaskInput;

export interface TaskRepository {
  list(): Task[];
  getById(id: number): Task | null;
  create(input: CreateTaskInput): Task;
  update(id: number, input: UpdateTaskInput): Task;
  setCompleted(id: number, completed: boolean): Task;
  delete(id: number): boolean;
}
