import {describe, expect, it} from 'vitest';
import {
  filterAndSortTasks,
  isDueToday,
  isOverdue,
} from '../../src/domain/sorting.js';
import type {Task} from '../../src/domain/task.js';

const now = new Date(2026, 6, 10, 12);

function task(overrides: Partial<Task> & Pick<Task, 'id' | 'title'>): Task {
  return {
    description: null,
    priority: null,
    dueDate: null,
    completedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('task ordering and filtering', () => {
  it('orders active tasks by date group, date, priority, creation, and id', () => {
    const tasks = [
      task({id: 8, title: 'none low', priority: 1}),
      task({id: 7, title: 'none high', priority: 3}),
      task({id: 6, title: 'future later', dueDate: '2026-07-12'}),
      task({
        id: 5,
        title: 'future early low',
        dueDate: '2026-07-11',
        priority: 1,
      }),
      task({
        id: 4,
        title: 'future early high',
        dueDate: '2026-07-11',
        priority: 3,
      }),
      task({id: 3, title: 'today', dueDate: '2026-07-10'}),
      task({
        id: 2,
        title: 'overdue newer',
        dueDate: '2026-07-09',
        createdAt: '2026-02-01T00:00:00.000Z',
      }),
      task({id: 1, title: 'overdue older', dueDate: '2026-07-09'}),
    ];

    expect(filterAndSortTasks(tasks, 'active', now).map(({id}) => id)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ]);
  });

  it('orders completed tasks newest first with deterministic ties', () => {
    const tasks = [
      task({id: 1, title: 'old', completedAt: '2026-07-08T00:00:00.000Z'}),
      task({
        id: 2,
        title: 'new low',
        priority: 1,
        completedAt: '2026-07-09T00:00:00.000Z',
      }),
      task({
        id: 3,
        title: 'new high',
        priority: 3,
        completedAt: '2026-07-09T00:00:00.000Z',
      }),
    ];

    expect(
      filterAndSortTasks(tasks, 'completed', now).map(({id}) => id),
    ).toEqual([3, 2, 1]);
  });

  it('puts active tasks before completed tasks in All', () => {
    const active = task({id: 1, title: 'active'});
    const completed = task({
      id: 2,
      title: 'done',
      completedAt: '2026-07-10T00:00:00.000Z',
    });
    expect(filterAndSortTasks([completed, active], 'all', now)).toEqual([
      active,
      completed,
    ]);
  });
});

describe('overdue status', () => {
  it('only marks active tasks due before today as overdue', () => {
    expect(
      isOverdue(task({id: 1, title: 'past', dueDate: '2026-07-09'}), now),
    ).toBe(true);
    expect(
      isOverdue(task({id: 2, title: 'today', dueDate: '2026-07-10'}), now),
    ).toBe(false);
    expect(
      isOverdue(
        task({
          id: 3,
          title: 'done',
          dueDate: '2026-07-09',
          completedAt: '2026-07-10T00:00:00.000Z',
        }),
        now,
      ),
    ).toBe(false);
  });

  it('only marks active tasks due on the local calendar date as due today', () => {
    expect(
      isDueToday(task({id: 1, title: 'today', dueDate: '2026-07-10'}), now),
    ).toBe(true);
    expect(
      isDueToday(
        task({
          id: 2,
          title: 'completed today',
          dueDate: '2026-07-10',
          completedAt: '2026-07-10T12:00:00.000Z',
        }),
        now,
      ),
    ).toBe(false);
    expect(
      isDueToday(task({id: 3, title: 'past', dueDate: '2026-07-09'}), now),
    ).toBe(false);
    expect(
      isDueToday(task({id: 4, title: 'future', dueDate: '2026-07-11'}), now),
    ).toBe(false);
    expect(isDueToday(task({id: 5, title: 'undated'}), now)).toBe(false);
  });
});
