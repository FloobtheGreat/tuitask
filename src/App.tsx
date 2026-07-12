import {useMemo, useReducer, useState} from 'react';
import {Box, Text, useApp, useInput, useWindowSize} from 'ink';
import {FilterBar} from './components/FilterBar.js';
import {StatusBar} from './components/StatusBar.js';
import {TaskDetails} from './components/TaskDetails.js';
import {TaskList} from './components/TaskList.js';
import {TaskForm} from './components/TaskForm.js';
import {filterAndSortTasks} from './domain/sorting.js';
import type {TaskRepository} from './domain/task.js';
import {
  appReducer,
  nextFilter,
  recoverSelection,
  type AppState,
} from './state/appState.js';

type Dimensions = {columns: number; rows: number};
type Props = {repository: TaskRepository; now?: Date; dimensions?: Dimensions};
type Screen = {name: 'list'} | {name: 'add'} | {name: 'edit'; taskId: number};

export function App({repository, now = new Date(), dimensions}: Props) {
  const {exit} = useApp();
  const windowSize = useWindowSize();
  const size = dimensions ?? windowSize;
  const [screen, setScreen] = useState<Screen>({name: 'list'});
  const [state, dispatch] = useReducer(appReducer, undefined, (): AppState => {
    try {
      const tasks = repository.list();
      const visible = filterAndSortTasks(tasks, 'active', now);
      return {
        tasks,
        filter: 'active',
        selectedTaskId: recoverSelection(visible, null),
        error: null,
      };
    } catch (error) {
      return {
        tasks: [],
        filter: 'active',
        selectedTaskId: null,
        error: error instanceof Error ? error.message : 'Unable to load tasks',
      };
    }
  });
  const visibleTasks = useMemo(
    () => filterAndSortTasks(state.tasks, state.filter, now),
    [now, state.filter, state.tasks],
  );
  const selectedTask =
    visibleTasks.find(({id}) => id === state.selectedTaskId) ?? null;

  useInput(
    (input, key) => {
      if (input === 'q') exit();
      if (key.upArrow || input === 'k') {
        dispatch({type: 'move-selection', offset: -1, visibleTasks});
      }
      if (key.downArrow || input === 'j') {
        dispatch({type: 'move-selection', offset: 1, visibleTasks});
      }
      if (input === 'f') {
        const nextTasks = filterAndSortTasks(
          state.tasks,
          nextFilter(state.filter),
          now,
        );
        dispatch({type: 'cycle-filter', visibleTasks: nextTasks});
      }
      if (input === 'a') setScreen({name: 'add'});
      if (input === 'e' && selectedTask !== null) {
        setScreen({name: 'edit', taskId: selectedTask.id});
      }
    },
    {isActive: screen.name === 'list'},
  );

  if (size.columns < 40 || size.rows < 10) {
    return <Text>Terminal too small. Resize to at least 40x10.</Text>;
  }

  if (screen.name !== 'list') {
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
  return (
    <Box flexDirection="column">
      <Text bold color="cyan">
        tuitask
      </Text>
      <Box flexDirection={wide ? 'row' : 'column'}>
        <Box width={wide ? '50%' : '100%'}>
          <TaskList
            tasks={visibleTasks}
            filter={state.filter}
            selectedTaskId={state.selectedTaskId}
            now={now}
          />
        </Box>
        <Box width={wide ? '50%' : '100%'}>
          <TaskDetails task={selectedTask} now={now} />
        </Box>
      </Box>
      <FilterBar filter={state.filter} />
      <StatusBar count={visibleTasks.length} error={state.error} />
    </Box>
  );
}
