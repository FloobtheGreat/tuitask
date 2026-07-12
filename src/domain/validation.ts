import {z} from 'zod';
import {parseDueDate} from './dates.js';
import type {CreateTaskInput} from './task.js';
import type {CreateProjectInput} from './project.js';

const taskInputSchema = z.object({
  projectId: z.number().int().positive(),
  title: z.string().trim().min(1, 'Title is required'),
  description: z
    .string()
    .nullable()
    .transform((value) => {
      const trimmed = value?.trim() ?? '';
      return trimmed === '' ? null : trimmed;
    }),
  priority: z.union([z.literal(1), z.literal(2), z.literal(3)]).nullable(),
  dueDate: z.string().nullable(),
});

const projectInputSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required'),
});

export type RawTaskInput = z.input<typeof taskInputSchema>;

export function normalizeTaskInput(
  input: RawTaskInput,
  now: Date = new Date(),
): CreateTaskInput {
  const parsed = taskInputSchema.parse(input);

  return {
    ...parsed,
    dueDate: parseDueDate(parsed.dueDate ?? '', now),
  };
}

export function normalizeProjectInput(input: {
  name: string;
}): CreateProjectInput {
  return projectInputSchema.parse(input);
}
