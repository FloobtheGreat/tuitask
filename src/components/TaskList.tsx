import {Box, Text} from 'ink';
import type {Task, TaskFilter} from '../domain/task.js';
import {TaskRow} from './TaskRow.js';

type Props = {
  tasks: readonly Task[];
  filter: TaskFilter;
  selectedTaskId: number | null;
  now: Date;
};

export function TaskList({tasks, filter, selectedTaskId, now}: Props) {
  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1} flexGrow={1}>
      <Text bold>Tasks</Text>
      {tasks.length === 0 ? (
        <Text dimColor>No {filter} tasks.</Text>
      ) : (
        tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            selected={task.id === selectedTaskId}
            now={now}
          />
        ))
      )}
    </Box>
  );
}
