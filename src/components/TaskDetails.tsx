import {Box, Text} from 'ink';
import {format, parse} from 'date-fns';
import {isOverdue} from '../domain/sorting.js';
import type {Task} from '../domain/task.js';

const PRIORITY = {1: 'Low', 2: 'Medium', 3: 'High'} as const;
const displayDate = (value: string) =>
  format(parse(value, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy');
const displayTimestamp = (value: string) =>
  format(new Date(value), 'MMM d, yyyy');

export function TaskDetails({task, now}: {task: Task | null; now: Date}) {
  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1} flexGrow={1}>
      <Text bold>Details</Text>
      {task === null ? (
        <Text dimColor>Select a task to see its details.</Text>
      ) : (
        <>
          <Text bold>{task.title}</Text>
          <Text>
            Status: {task.completedAt === null ? 'Active' : 'Completed'}
          </Text>
          <Text>
            Priority:{' '}
            {task.priority === null ? 'None' : PRIORITY[task.priority]}
          </Text>
          <Text>
            Due: {task.dueDate === null ? 'None' : displayDate(task.dueDate)}
          </Text>
          {isOverdue(task, now) && <Text color="red">Overdue: Yes</Text>}
          {task.completedAt !== null && (
            <Text>Completed: {displayTimestamp(task.completedAt)}</Text>
          )}
          <Text>Description: {task.description ?? 'No description'}</Text>
          <Text dimColor>Created: {displayTimestamp(task.createdAt)}</Text>
        </>
      )}
    </Box>
  );
}
