import {Box, Text} from 'ink';
import type {ProjectTaskGroup} from '../domain/project.js';
import type {Task, TaskFilter} from '../domain/task.js';
import {TaskRow} from './TaskRow.js';

type Props = {
  groups: readonly ProjectTaskGroup<Task>[];
  filter: TaskFilter;
  selectedTaskId: number | null;
  now: Date;
  maxItems: number;
  maxTitleLength: number;
};

export function TaskList({
  groups,
  filter,
  selectedTaskId,
  now,
  maxItems,
  maxTitleLength,
}: Props) {
  const entries = groups.flatMap(({project, tasks}) => [
    {kind: 'heading' as const, project},
    ...tasks.map((task) => ({kind: 'task' as const, project, task})),
  ]);
  const selectedIndex = Math.max(
    0,
    entries.findIndex(
      (entry) => entry.kind === 'task' && entry.task.id === selectedTaskId,
    ),
  );
  const start = Math.max(
    0,
    Math.min(
      selectedIndex - Math.floor(maxItems / 2),
      entries.length - maxItems,
    ),
  );
  const visibleEntries = entries.slice(start, start + maxItems);
  const contextProject =
    visibleEntries[0]?.kind === 'task' ? visibleEntries[0].project : null;

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1} flexGrow={1}>
      <Text bold>Tasks</Text>
      {entries.length === 0 ? (
        <Text dimColor>No {filter} tasks.</Text>
      ) : (
        <>
          {start > 0 && <Text dimColor>... {start} more above</Text>}
          {contextProject !== null && (
            <Text bold color="cyan">
              {contextProject.name}
            </Text>
          )}
          {visibleEntries.map((entry) =>
            entry.kind === 'heading' ? (
              <Text key={`project-${entry.project.id}`} bold color="cyan">
                {entry.project.name}
              </Text>
            ) : (
              <TaskRow
                key={entry.task.id}
                task={entry.task}
                selected={entry.task.id === selectedTaskId}
                now={now}
                maxTitleLength={maxTitleLength}
              />
            ),
          )}
          {start + visibleEntries.length < entries.length && (
            <Text dimColor>
              ... {entries.length - start - visibleEntries.length} more below
            </Text>
          )}
        </>
      )}
    </Box>
  );
}
