import {describe, expect, it} from 'vitest';
import {
  moveSelection,
  nextFilter,
  recoverSelection,
} from '../../src/state/appState.js';
import type {Task} from '../../src/domain/task.js';

const task = (id: number): Task => ({
  id,
  projectId: 1,
  title: `Task ${id}`,
  description: null,
  priority: null,
  dueDate: null,
  completedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

describe('task selection', () => {
  const tasks = [task(1), task(2), task(3)];

  it('selects the first task and preserves a visible ID', () => {
    expect(recoverSelection(tasks, null)).toBe(1);
    expect(recoverSelection(tasks, 2)).toBe(2);
  });

  it('recovers at the nearest available index and handles empty lists', () => {
    expect(recoverSelection([task(1), task(3)], 2, 1)).toBe(3);
    expect(recoverSelection([], 2)).toBeNull();
  });

  it('moves within list bounds', () => {
    expect(moveSelection(tasks, 1, -1)).toBe(1);
    expect(moveSelection(tasks, 1, 1)).toBe(2);
    expect(moveSelection(tasks, 3, 1)).toBe(3);
  });

  it('cycles all filters', () => {
    expect(nextFilter('active')).toBe('completed');
    expect(nextFilter('completed')).toBe('all');
    expect(nextFilter('all')).toBe('active');
  });
});
