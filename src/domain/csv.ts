import type {Task} from './task.js';

export const TASK_CSV_HEADERS = [
  'id',
  'title',
  'description',
  'priority',
  'dueDate',
  'completedAt',
  'createdAt',
  'updatedAt',
] as const;

function escapeCsvField(value: string | number | null): string {
  if (value === null) return '';
  const text = String(value);
  return /[",\r\n]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function tasksToCsv(tasks: readonly Task[]): string {
  const rows = tasks.map((task) => [
    task.id,
    task.title,
    task.description,
    task.priority,
    task.dueDate,
    task.completedAt,
    task.createdAt,
    task.updatedAt,
  ]);

  return [TASK_CSV_HEADERS, ...rows]
    .map((row) => row.map(escapeCsvField).join(','))
    .join('\r\n')
    .concat('\r\n');
}
