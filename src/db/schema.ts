import {sql} from 'drizzle-orm';
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';

export const tasks = sqliteTable(
  'tasks',
  {
    id: integer('id').primaryKey({autoIncrement: true}),
    title: text('title').notNull(),
    description: text('description'),
    priority: integer('priority'),
    dueDate: text('due_date'),
    completedAt: text('completed_at'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    check('tasks_title_check', sql`length(trim(${table.title})) > 0`),
    check(
      'tasks_priority_check',
      sql`${table.priority} IS NULL OR ${table.priority} IN (1, 2, 3)`,
    ),
    check(
      'tasks_due_date_check',
      sql`${table.dueDate} IS NULL OR ${table.dueDate} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'`,
    ),
    index('idx_tasks_completed_due').on(table.completedAt, table.dueDate),
    index('idx_tasks_priority').on(table.priority),
  ],
);

export type TaskRow = typeof tasks.$inferSelect;
