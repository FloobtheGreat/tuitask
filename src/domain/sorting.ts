import {isOverdue, localCalendarDate} from './dates.js';
import type {Task, TaskFilter} from './task.js';

function comparePriority(left: Task, right: Task): number {
  return (right.priority ?? 0) - (left.priority ?? 0);
}

function activeDateGroup(task: Task, today: string): number {
  if (task.dueDate === null) return 3;
  if (task.dueDate < today) return 0;
  if (task.dueDate === today) return 1;
  return 2;
}

export function compareActiveTasks(
  left: Task,
  right: Task,
  now: Date = new Date(),
): number {
  const today = localCalendarDate(now);
  const groupDifference =
    activeDateGroup(left, today) - activeDateGroup(right, today);
  if (groupDifference !== 0) return groupDifference;

  if (left.dueDate !== null && right.dueDate !== null) {
    const dateDifference = left.dueDate.localeCompare(right.dueDate);
    if (dateDifference !== 0) return dateDifference;
  }

  const priorityDifference = comparePriority(left, right);
  if (priorityDifference !== 0) return priorityDifference;

  const creationDifference = left.createdAt.localeCompare(right.createdAt);
  if (creationDifference !== 0) return creationDifference;

  return left.id - right.id;
}

export function compareCompletedTasks(left: Task, right: Task): number {
  const completionDifference = (right.completedAt ?? '').localeCompare(
    left.completedAt ?? '',
  );
  if (completionDifference !== 0) return completionDifference;

  const priorityDifference = comparePriority(left, right);
  if (priorityDifference !== 0) return priorityDifference;

  const creationDifference = right.createdAt.localeCompare(left.createdAt);
  if (creationDifference !== 0) return creationDifference;

  return right.id - left.id;
}

export function filterAndSortTasks(
  tasks: readonly Task[],
  filter: TaskFilter,
  now: Date = new Date(),
): Task[] {
  const active = tasks
    .filter((task) => task.completedAt === null)
    .sort((left, right) => compareActiveTasks(left, right, now));
  const completed = tasks
    .filter((task) => task.completedAt !== null)
    .sort(compareCompletedTasks);

  if (filter === 'active') return active;
  if (filter === 'completed') return completed;
  return [...active, ...completed];
}

export {isOverdue};
