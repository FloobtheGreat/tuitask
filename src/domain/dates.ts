import {addDays, format, isValid, parse} from 'date-fns';
import type {Task} from './task.js';

const DATE_FORMAT = 'yyyy-MM-dd';
const CANONICAL_DATE = /^\d{4}-\d{2}-\d{2}$/;

export class InvalidDueDateError extends Error {
  constructor(value: string) {
    super(`Invalid due date: ${value}`);
    this.name = 'InvalidDueDateError';
  }
}

export function localCalendarDate(date: Date): string {
  return format(date, DATE_FORMAT);
}

export function parseDueDate(
  value: string,
  now: Date = new Date(),
): string | null {
  const normalized = value.trim().toLowerCase();

  if (normalized === '') return null;
  if (normalized === 'today') return localCalendarDate(now);
  if (normalized === 'tomorrow') return localCalendarDate(addDays(now, 1));

  if (!CANONICAL_DATE.test(normalized)) {
    throw new InvalidDueDateError(value);
  }

  const parsed = parse(normalized, DATE_FORMAT, now);
  if (!isValid(parsed) || format(parsed, DATE_FORMAT) !== normalized) {
    throw new InvalidDueDateError(value);
  }

  return normalized;
}

export function isOverdue(task: Task, now: Date = new Date()): boolean {
  return (
    task.completedAt === null &&
    task.dueDate !== null &&
    task.dueDate < localCalendarDate(now)
  );
}

export function isDueToday(task: Task, now: Date = new Date()): boolean {
  return task.completedAt === null && task.dueDate === localCalendarDate(now);
}
