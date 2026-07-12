import {sql} from 'drizzle-orm';
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const projects = sqliteTable(
  'projects',
  {
    id: integer('id').primaryKey({autoIncrement: true}),
    name: text('name').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    check('projects_name_check', sql`length(trim(${table.name})) > 0`),
    uniqueIndex('idx_projects_name_unique').on(sql`lower(${table.name})`),
  ],
);

export const tasks = sqliteTable(
  'tasks',
  {
    id: integer('id').primaryKey({autoIncrement: true}),
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id, {onDelete: 'restrict'}),
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
    index('idx_tasks_project').on(table.projectId),
  ],
);

export type TaskRow = typeof tasks.$inferSelect;
export type ProjectRow = typeof projects.$inferSelect;
