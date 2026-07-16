import {useEffect, useMemo, useReducer, useState} from 'react';
import {Box, Text, useApp, useInput, useWindowSize} from 'ink';
import {systemClipboard, type ClipboardWriter} from './clipboard.js';
import {FilterBar} from './components/FilterBar.js';
import {ConfirmDialog} from './components/ConfirmDialog.js';
import {HelpOverlay} from './components/HelpOverlay.js';
import {ProjectManager} from './components/ProjectManager.js';
import {StatusBar} from './components/StatusBar.js';
import {TaskDetails} from './components/TaskDetails.js';
import {TaskList} from './components/TaskList.js';
import {TaskForm} from './components/TaskForm.js';
import {filterAndSortTasks} from './domain/sorting.js';
import {tasksToCsv} from './domain/csv.js';
import {
  sortProjects,
  type Project,
  type ProjectRepository,
  type ProjectTaskGroup,
} from './domain/project.js';
import type {Task, TaskFilter, TaskRepository} from './domain/task.js';
import {
  appReducer,
  nextFilter,
  recoverSelection,
  type AppState,
} from './state/appState.js';

type Dimensions = {columns: number; rows: number};
type Props = {
  repository: TaskRepository & ProjectRepository;
  now?: Date;
  dimensions?: Dimensions;
  clipboard?: ClipboardWriter;
};
type Screen =
  | {name: 'list'}
  | {name: 'add'}
  | {name: 'edit'; taskId: number}
  | {name: 'confirm-delete'; taskId: number}
  | {name: 'projects'}
  | {name: 'help'};

function groupTasks(
  tasks: readonly Task[],
  projects: readonly Project[],
  filter: TaskFilter,
  now: Date,
): ProjectTaskGroup<Task>[] {
  return sortProjects(projects).flatMap((project) => {
    const projectTasks = filterAndSortTasks(
      tasks.filter(({projectId}) => projectId === project.id),
      filter,
      now,
    );
    return projectTasks.length === 0 ? [] : [{project, tasks: projectTasks}];
  });
}

function flattenGroups(groups: readonly ProjectTaskGroup<Task>[]): Task[] {
  return groups.flatMap(({tasks}) => tasks);
}

export function App({
  repository,
  now = new Date(),
  dimensions,
  clipboard = systemClipboard,
}: Props) {
  const {exit} = useApp();
  const windowSize = useWindowSize();
  const size = dimensions ?? windowSize;
  const [screen, setScreen] = useState<Screen>({name: 'list'});
  const [copyResult, setCopyResult] = useState<{
    message: string;
    isError: boolean;
  } | null>(null);
  const [state, dispatch] = useReducer(appReducer, undefined, (): AppState => {
    try {
      const tasks = repository.list();
      const projects = repository.listProjects();
      const visible = flattenGroups(groupTasks(tasks, projects, 'active', now));
      return {
        tasks,
        projects,
        filter: 'active',
        selectedTaskId: recoverSelection(visible, null),
        error: null,
      };
    } catch (error) {
      return {
        tasks: [],
        projects: [],
        filter: 'active',
        selectedTaskId: null,
        error: error instanceof Error ? error.message : 'Unable to load tasks',
      };
    }
  });
  const visibleGroups = useMemo(
    () => groupTasks(state.tasks, state.projects, state.filter, now),
    [now, state.filter, state.projects, state.tasks],
  );
  const visibleTasks = useMemo(
    () => flattenGroups(visibleGroups),
    [visibleGroups],
  );
  const selectedTask =
    visibleTasks.find(({id}) => id === state.selectedTaskId) ?? null;

  useEffect(() => {
    if (
      screen.name === 'confirm-delete' &&
      !state.tasks.some(({id}) => id === screen.taskId)
    ) {
      setScreen({name: 'list'});
    }
  }, [screen, state.tasks]);

  useInput(
    (input, key) => {
      if (input.toLowerCase() !== 'c') setCopyResult(null);
      if (input.toLowerCase() === 'q') exit();
      if (key.upArrow || input.toLowerCase() === 'k') {
        dispatch({type: 'move-selection', offset: -1, visibleTasks});
      }
      if (key.downArrow || input.toLowerCase() === 'j') {
        dispatch({type: 'move-selection', offset: 1, visibleTasks});
      }
      if (input.toLowerCase() === 'f') {
        const nextTasks = flattenGroups(
          groupTasks(
            state.tasks,
            state.projects,
            nextFilter(state.filter),
            now,
          ),
        );
        dispatch({type: 'cycle-filter', visibleTasks: nextTasks});
      }
      if (input.toLowerCase() === 'c') {
        void clipboard.writeText(tasksToCsv(visibleTasks, state.projects)).then(
          () => {
            setCopyResult({
              message: `Copied ${visibleTasks.length} task(s) to clipboard`,
              isError: false,
            });
          },
          (error: unknown) => {
            const reason =
              error instanceof Error
                ? error.message
                : 'Unknown clipboard error';
            setCopyResult({
              message: `Unable to copy tasks: ${reason}`,
              isError: true,
            });
          },
        );
      }
      if (input.toLowerCase() === 'a') setScreen({name: 'add'});
      if (input.toLowerCase() === 'p') setScreen({name: 'projects'});
      if (input.toLowerCase() === 'e' && selectedTask !== null) {
        setScreen({name: 'edit', taskId: selectedTask.id});
      }
      if (input === ' ' && selectedTask !== null) {
        const previousIndex = visibleTasks.findIndex(
          ({id}) => id === selectedTask.id,
        );
        try {
          const saved = repository.setCompleted(
            selectedTask.id,
            selectedTask.completedAt === null,
          );
          const tasks = [
            ...state.tasks.filter(({id}) => id !== saved.id),
            saved,
          ];
          const nextTasks = flattenGroups(
            groupTasks(tasks, state.projects, state.filter, now),
          );
          dispatch({
            type: 'replace-tasks',
            tasks,
            selectedTaskId: recoverSelection(
              nextTasks,
              saved.id,
              previousIndex,
            ),
          });
        } catch (error) {
          let tasks = state.tasks;
          try {
            tasks = repository.list();
          } catch {
            // Keep the last known persisted view when a refresh also fails.
          }
          const nextTasks = flattenGroups(
            groupTasks(tasks, state.projects, state.filter, now),
          );
          dispatch({
            type: 'replace-tasks',
            tasks,
            selectedTaskId: recoverSelection(
              nextTasks,
              state.selectedTaskId,
              previousIndex,
            ),
            error:
              error instanceof Error
                ? error.message
                : 'Unable to update task status',
          });
        }
      }
      if (input.toLowerCase() === 'd' && selectedTask !== null) {
        setScreen({name: 'confirm-delete', taskId: selectedTask.id});
      }
      if (input.toLowerCase() === '?') setScreen({name: 'help'});
    },
    {isActive: screen.name === 'list'},
  );

  if (size.columns < 40 || size.rows < 10) {
    return <Text>Terminal too small. Resize to at least 40x10.</Text>;
  }

  if (screen.name !== 'list') {
    if (screen.name === 'help') {
      return <HelpOverlay onClose={() => setScreen({name: 'list'})} />;
    }
    if (screen.name === 'projects') {
      const refreshProjects = () => {
        dispatch({
          type: 'replace-projects',
          projects: repository.listProjects(),
        });
      };
      return (
        <Box flexDirection="column">
          <Text bold color="cyan">
            tuitask
          </Text>
          <ProjectManager
            projects={state.projects}
            onClose={() => setScreen({name: 'list'})}
            onCreate={(name) => {
              try {
                repository.createProject({name});
                refreshProjects();
                return null;
              } catch (error) {
                return error instanceof Error
                  ? error.message
                  : 'Unable to create project';
              }
            }}
            onRename={(id, name) => {
              try {
                repository.updateProject(id, {name});
                refreshProjects();
                return null;
              } catch (error) {
                return error instanceof Error
                  ? error.message
                  : 'Unable to rename project';
              }
            }}
            onDelete={(id) => {
              try {
                if (!repository.deleteProject(id)) {
                  return `Project ${id} was not found`;
                }
                refreshProjects();
                return null;
              } catch (error) {
                return error instanceof Error
                  ? error.message
                  : 'Unable to delete project';
              }
            }}
          />
        </Box>
      );
    }
    if (screen.name === 'confirm-delete') {
      const task = state.tasks.find(({id}) => id === screen.taskId);
      if (task === undefined) {
        return null;
      }
      const previousIndex = visibleTasks.findIndex(({id}) => id === task.id);
      return (
        <Box flexDirection="column">
          <Text bold color="cyan">
            tuitask
          </Text>
          <ConfirmDialog
            task={task}
            onCancel={() => setScreen({name: 'list'})}
            onConfirm={() => {
              try {
                if (!repository.delete(task.id)) {
                  const tasks = repository.list();
                  const nextTasks = flattenGroups(
                    groupTasks(tasks, state.projects, state.filter, now),
                  );
                  dispatch({
                    type: 'replace-tasks',
                    tasks,
                    selectedTaskId: recoverSelection(
                      nextTasks,
                      null,
                      previousIndex,
                    ),
                    error: `Task ${task.id} was not found`,
                  });
                  setScreen({name: 'list'});
                  return null;
                }
                const tasks = state.tasks.filter(({id}) => id !== task.id);
                const nextTasks = flattenGroups(
                  groupTasks(tasks, state.projects, state.filter, now),
                );
                dispatch({
                  type: 'replace-tasks',
                  tasks,
                  selectedTaskId: recoverSelection(
                    nextTasks,
                    null,
                    previousIndex,
                  ),
                });
                setScreen({name: 'list'});
                return null;
              } catch (error) {
                return error instanceof Error
                  ? error.message
                  : 'Unable to delete task';
              }
            }}
          />
        </Box>
      );
    }
    const editedTask =
      screen.name === 'edit'
        ? state.tasks.find(({id}) => id === screen.taskId)
        : undefined;
    return (
      <Box flexDirection="column">
        <Text bold color="cyan">
          tuitask
        </Text>
        <TaskForm
          {...(editedTask === undefined ? {} : {task: editedTask})}
          projects={state.projects}
          now={now}
          onCancel={() => setScreen({name: 'list'})}
          onSave={(input) => {
            try {
              const saved =
                screen.name === 'add'
                  ? repository.create(input)
                  : repository.update(screen.taskId, input);
              const tasks = [
                ...state.tasks.filter(({id}) => id !== saved.id),
                saved,
              ];
              dispatch({
                type: 'replace-tasks',
                tasks,
                selectedTaskId: saved.id,
                ...(screen.name === 'add' ? {filter: 'active'} : {}),
              });
              setScreen({name: 'list'});
              return null;
            } catch (error) {
              return error instanceof Error
                ? error.message
                : 'Unable to save task';
            }
          }}
        />
      </Box>
    );
  }

  const wide = size.columns >= 90;
  const maxListItems = Math.max(
    1,
    wide ? size.rows - 9 : Math.floor(size.rows / 3),
  );
  const maxTitleLength = Math.max(
    10,
    (wide ? Math.floor(size.columns / 2) : size.columns) - 32,
  );
  return (
    <Box flexDirection="column">
      <Text bold color="cyan">
        tuitask
      </Text>
      <Box flexDirection={wide ? 'row' : 'column'}>
        <Box width={wide ? '50%' : '100%'}>
          <TaskList
            groups={visibleGroups}
            filter={state.filter}
            selectedTaskId={state.selectedTaskId}
            now={now}
            maxItems={maxListItems}
            maxTitleLength={maxTitleLength}
          />
        </Box>
        <Box width={wide ? '50%' : '100%'}>
          <TaskDetails task={selectedTask} now={now} />
        </Box>
      </Box>
      <FilterBar filter={state.filter} />
      <StatusBar
        count={visibleTasks.length}
        error={state.error}
        message={copyResult?.message ?? null}
        messageIsError={copyResult?.isError ?? false}
      />
    </Box>
  );
}
