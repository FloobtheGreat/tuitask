import {render} from 'ink-testing-library';
import {describe, expect, it, vi} from 'vitest';
import {App} from '../../src/App.js';
import type {Task, TaskRepository} from '../../src/domain/task.js';

const now = new Date(2026, 6, 11, 12);
const task = (overrides: Partial<Task> & Pick<Task, 'id' | 'title'>): Task => ({
  description: null,
  priority: null,
  dueDate: null,
  completedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

function repository(tasks: Task[]): TaskRepository {
  return {
    list: () => tasks,
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    setCompleted: vi.fn(),
    delete: vi.fn(),
  };
}

describe('App', () => {
  it('renders an empty Active view', () => {
    const view = render(
      <App
        repository={repository([])}
        now={now}
        dimensions={{columns: 100, rows: 30}}
      />,
    );
    expect(view.lastFrame()).toContain('No active tasks.');
    expect(view.lastFrame()).toContain('Select a task');
    view.unmount();
  });

  it('navigates tasks and updates details', async () => {
    const view = render(
      <App
        repository={repository([
          task({id: 1, title: 'First', description: 'First details'}),
          task({id: 2, title: 'Second', description: 'Second details'}),
        ])}
        now={now}
        dimensions={{columns: 100, rows: 30}}
      />,
    );
    expect(view.lastFrame()).toContain('First details');
    view.stdin.write('j');
    await expect.poll(() => view.lastFrame()).toContain('Second details');
    view.unmount();
  });

  it('cycles Completed and All views', async () => {
    const view = render(
      <App
        repository={repository([
          task({id: 1, title: 'Active task'}),
          task({
            id: 2,
            title: 'Finished task',
            completedAt: '2026-07-10T15:00:00.000Z',
          }),
        ])}
        now={now}
        dimensions={{columns: 100, rows: 30}}
      />,
    );
    expect(view.lastFrame()).not.toContain('Finished task');
    view.stdin.write('f');
    await expect.poll(() => view.lastFrame()).toContain('Finished task');
    expect(view.lastFrame()).not.toContain('Active task');
    view.stdin.write('f');
    await expect.poll(() => view.lastFrame()).toContain('Active task');
    expect(view.lastFrame()).toContain('Finished task');
    view.unmount();
  });

  it('renders narrow and tiny terminal states', () => {
    const repo = repository([task({id: 1, title: 'Visible task'})]);
    const narrow = render(
      <App repository={repo} now={now} dimensions={{columns: 60, rows: 20}} />,
    );
    expect(narrow.lastFrame()).toContain('Visible task');
    narrow.unmount();
    const tiny = render(
      <App repository={repo} now={now} dimensions={{columns: 39, rows: 20}} />,
    );
    expect(tiny.lastFrame()).toContain('Terminal too small');
    tiny.unmount();
  });
});
