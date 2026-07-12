import type {Task, TaskFilter} from '../domain/task.js';

export type AppState = {
  tasks: Task[];
  filter: TaskFilter;
  selectedTaskId: number | null;
  error: string | null;
};

export type AppAction =
  | {type: 'select'; taskId: number}
  | {type: 'move-selection'; offset: -1 | 1; visibleTasks: readonly Task[]}
  | {type: 'cycle-filter'; visibleTasks: readonly Task[]}
  | {
      type: 'replace-tasks';
      tasks: Task[];
      selectedTaskId: number | null;
      filter?: TaskFilter;
      error?: string | null;
    };

export const FILTERS: readonly TaskFilter[] = ['active', 'completed', 'all'];

export function recoverSelection(
  visibleTasks: readonly Task[],
  selectedTaskId: number | null,
  previousIndex = 0,
): number | null {
  if (visibleTasks.length === 0) return null;
  if (visibleTasks.some(({id}) => id === selectedTaskId)) return selectedTaskId;
  return (
    visibleTasks[Math.min(previousIndex, visibleTasks.length - 1)]?.id ?? null
  );
}

export function moveSelection(
  visibleTasks: readonly Task[],
  selectedTaskId: number | null,
  offset: -1 | 1,
): number | null {
  if (visibleTasks.length === 0) return null;
  const currentIndex = visibleTasks.findIndex(({id}) => id === selectedTaskId);
  const index = currentIndex < 0 ? 0 : currentIndex;
  const nextIndex = Math.max(
    0,
    Math.min(index + offset, visibleTasks.length - 1),
  );
  return visibleTasks[nextIndex]?.id ?? null;
}

export function nextFilter(filter: TaskFilter): TaskFilter {
  const index = FILTERS.indexOf(filter);
  return FILTERS[(index + 1) % FILTERS.length] ?? 'active';
}

export function appReducer(state: AppState, action: AppAction): AppState {
  if (action.type === 'replace-tasks') {
    return {
      ...state,
      tasks: action.tasks,
      filter: action.filter ?? state.filter,
      selectedTaskId: action.selectedTaskId,
      error: action.error ?? null,
    };
  }
  if (action.type === 'select') {
    return {...state, selectedTaskId: action.taskId};
  }
  if (action.type === 'move-selection') {
    return {
      ...state,
      selectedTaskId: moveSelection(
        action.visibleTasks,
        state.selectedTaskId,
        action.offset,
      ),
    };
  }
  return {
    ...state,
    filter: nextFilter(state.filter),
    selectedTaskId: recoverSelection(action.visibleTasks, state.selectedTaskId),
  };
}
