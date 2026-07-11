import {z} from 'zod';
import {parseDueDate} from './dates.js';
import type {CreateTaskInput} from './task.js';

const taskInputSchema = z.object({
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
