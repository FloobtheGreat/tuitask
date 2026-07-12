import type {Task} from './task.js';
import type {Project} from './project.js';

export const TASK_CSV_HEADERS = [
  'id',
  'projectId',
  'projectName',
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

export function tasksToCsv(
  tasks: readonly Task[],
  projects: readonly Project[] = [],
): string {
  const projectNames = new Map(projects.map(({id, name}) => [id, name]));
  const rows = tasks.map((task) => [
    task.id,
    task.projectId,
    projectNames.get(task.projectId) ?? '',
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
