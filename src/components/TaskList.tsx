import {Box, Text} from 'ink';
import type {Task, TaskFilter} from '../domain/task.js';
import {TaskRow} from './TaskRow.js';

type Props = {
  tasks: readonly Task[];
  filter: TaskFilter;
  selectedTaskId: number | null;
  now: Date;
  maxItems: number;
  maxTitleLength: number;
};

export function TaskList({
  tasks,
  filter,
  selectedTaskId,
  now,
  maxItems,
  maxTitleLength,
}: Props) {
  const selectedIndex = Math.max(
    0,
    tasks.findIndex(({id}) => id === selectedTaskId),
  );
  const start = Math.max(
    0,
    Math.min(selectedIndex - Math.floor(maxItems / 2), tasks.length - maxItems),
  );
  const visibleTasks = tasks.slice(start, start + maxItems);

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1} flexGrow={1}>
      <Text bold>Tasks</Text>
      {tasks.length === 0 ? (
        <Text dimColor>No {filter} tasks.</Text>
      ) : (
        <>
          {start > 0 && <Text dimColor>... {start} more above</Text>}
          {visibleTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              selected={task.id === selectedTaskId}
              now={now}
              maxTitleLength={maxTitleLength}
            />
          ))}
          {start + visibleTasks.length < tasks.length && (
            <Text dimColor>
              ... {tasks.length - start - visibleTasks.length} more below
            </Text>
          )}
        </>
      )}
    </Box>
  );
}
