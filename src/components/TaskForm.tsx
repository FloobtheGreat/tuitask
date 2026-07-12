import {useState} from 'react';
import {Box, Text, useInput} from 'ink';
import {ZodError} from 'zod';
import {InvalidDueDateError} from '../domain/dates.js';
import type {CreateTaskInput, Priority, Task} from '../domain/task.js';
import {normalizeTaskInput} from '../domain/validation.js';

type Field =
  'title' | 'description' | 'priority' | 'dueDate' | 'save' | 'cancel';
type Errors = Partial<Record<'title' | 'dueDate' | 'form', string>>;
const FIELDS: readonly Field[] = [
  'title',
  'description',
  'priority',
  'dueDate',
  'save',
  'cancel',
];
const PRIORITIES: readonly (Priority | null)[] = [null, 1, 2, 3];
const PRIORITY_NAMES = {1: 'Low', 2: 'Medium', 3: 'High'} as const;

type Props = {
  task?: Task;
  now: Date;
  onSave: (input: CreateTaskInput) => string | null;
  onCancel: () => void;
};

export function TaskForm({task, now, onSave, onCancel}: Props) {
  const [fieldIndex, setFieldIndex] = useState(0);
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<Priority | null>(
    task?.priority ?? null,
  );
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '');
  const [errors, setErrors] = useState<Errors>({});
  const field = FIELDS[fieldIndex] ?? 'title';

  const moveFocus = (offset: number) => {
    setFieldIndex(
      (current) => (current + offset + FIELDS.length) % FIELDS.length,
    );
  };
  const submit = () => {
    setErrors({});
    try {
      const input = normalizeTaskInput(
        {title, description, priority, dueDate},
        now,
      );
      const error = onSave(input);
      if (error !== null) setErrors({form: error});
    } catch (error) {
      if (error instanceof InvalidDueDateError) {
        setErrors({dueDate: 'Use YYYY-MM-DD, today, or tomorrow'});
      } else if (error instanceof ZodError) {
        setErrors({title: 'Title is required'});
      } else {
        setErrors({
          form: error instanceof Error ? error.message : 'Unable to save task',
        });
      }
    }
  };

  useInput((input, key) => {
    if (key.escape) return onCancel();
    if (key.tab) return moveFocus(key.shift ? -1 : 1);
    if (key.return) {
      if (field === 'description')
        return setDescription((value) => `${value}\n`);
      if (field === 'save') return submit();
      if (field === 'cancel') return onCancel();
      return moveFocus(1);
    }
    if (field === 'priority' && (key.leftArrow || key.upArrow)) {
      const index = PRIORITIES.indexOf(priority);
      return setPriority(PRIORITIES[Math.max(0, index - 1)] ?? null);
    }
    if (
      field === 'priority' &&
      (key.rightArrow || key.downArrow || input === ' ')
    ) {
      const index = PRIORITIES.indexOf(priority);
      return setPriority(
        PRIORITIES[Math.min(PRIORITIES.length - 1, index + 1)] ?? null,
      );
    }
    if (key.backspace || key.delete) {
      if (field === 'title') setTitle((value) => value.slice(0, -1));
      if (field === 'description')
        setDescription((value) => value.slice(0, -1));
      if (field === 'dueDate') setDueDate((value) => value.slice(0, -1));
      return;
    }
    if (key.ctrl || key.meta || input === '') return;
    if (field === 'title') setTitle((value) => value + input);
    if (field === 'description') setDescription((value) => value + input);
    if (field === 'dueDate') setDueDate((value) => value + input);
  });

  const marker = (name: Field) => (field === name ? '>' : ' ');
  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1}>
      <Text bold>{task === undefined ? 'Add task' : 'Edit task'}</Text>
      <Text inverse={field === 'title'}>
        {marker('title')} Title: {title}
      </Text>
      {errors.title && <Text color="red"> {errors.title}</Text>}
      <Text inverse={field === 'description'}>
        {marker('description')} Description: {description || 'No description'}
      </Text>
      <Text inverse={field === 'priority'}>
        {marker('priority')} Priority:{' '}
        {priority === null ? 'None' : PRIORITY_NAMES[priority]}
      </Text>
      <Text inverse={field === 'dueDate'}>
        {marker('dueDate')} Due date: {dueDate}
      </Text>
      {errors.dueDate && <Text color="red"> {errors.dueDate}</Text>}
      <Text>
        <Text inverse={field === 'save'}>{marker('save')} Save</Text>
        {'  '}
        <Text inverse={field === 'cancel'}>{marker('cancel')} Cancel</Text>
      </Text>
      {errors.form && <Text color="red">{errors.form}</Text>}
      <Text dimColor>Tab/Shift+Tab Move Enter Select Esc Cancel</Text>
    </Box>
  );
}
