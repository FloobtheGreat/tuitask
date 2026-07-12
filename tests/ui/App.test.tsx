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

async function send(view: ReturnType<typeof render>, input: string) {
  view.stdin.write(input);
  await new Promise((resolve) => setTimeout(resolve, 15));
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

  it('creates a task through the form and returns to the list', async () => {
    const created = task({
      id: 1,
      title: 'Write docs',
      description: 'First line\nSecond line',
      priority: 1,
      dueDate: '2026-07-12',
    });
    const create = vi.fn<TaskRepository['create']>().mockReturnValue(created);
    const repo = {...repository([]), create};
    const view = render(
      <App repository={repo} now={now} dimensions={{columns: 100, rows: 30}} />,
    );

    await send(view, 'a');
    await expect.poll(() => view.lastFrame()).toContain('Add task');
    await send(view, 'Write docs');
    await send(view, '\t');
    await send(view, 'First line');
    await send(view, '\r');
    await send(view, 'Second line');
    await send(view, '\t');
    await send(view, '\u001B[C');
    await send(view, '\t');
    await send(view, 'tomorrow');
    await send(view, '\t');
    await send(view, '\r');

    await expect
      .poll(() => create)
      .toHaveBeenCalledWith({
        title: 'Write docs',
        description: 'First line\nSecond line',
        priority: 1,
        dueDate: '2026-07-12',
      });
    await expect.poll(() => view.lastFrame()).toContain('Write docs');
    view.unmount();
  });

  it('preserves form input after a due-date validation error', async () => {
    const create = vi.fn<TaskRepository['create']>();
    const repo = {...repository([]), create};
    const view = render(
      <App repository={repo} now={now} dimensions={{columns: 100, rows: 30}} />,
    );
    await send(view, 'a');
    await expect.poll(() => view.lastFrame()).toContain('Add task');
    await send(view, 'Keep this title');
    await send(view, '\t');
    await send(view, '\t');
    await send(view, '\t');
    await send(view, '2026-02-30');
    await send(view, '\t');
    await send(view, '\r');

    await expect.poll(() => view.lastFrame()).toContain('Use YYYY-MM-DD');
    expect(view.lastFrame()).toContain('Keep this title');
    expect(create).not.toHaveBeenCalled();
    view.unmount();
  });

  it('edits a task, clears optional fields, and treats q as text', async () => {
    const original = task({
      id: 4,
      title: 'Old title',
      description: 'notes',
      priority: 3,
      dueDate: '2026-07-20',
    });
    const updated = task({id: 4, title: 'Old titleq'});
    const update = vi.fn<TaskRepository['update']>().mockReturnValue(updated);
    const repo = {...repository([original]), update};
    const view = render(
      <App repository={repo} now={now} dimensions={{columns: 100, rows: 30}} />,
    );
    await send(view, 'e');
    await expect.poll(() => view.lastFrame()).toContain('Edit task');
    await send(view, 'q');
    await send(view, '\t');
    for (let index = 0; index < 5; index += 1) await send(view, '\u007f');
    await send(view, '\t');
    for (let index = 0; index < 3; index += 1) await send(view, '\u001B[D');
    await send(view, '\t');
    for (let index = 0; index < 10; index += 1) await send(view, '\u007f');
    await send(view, '\t');
    await send(view, '\r');

    await expect
      .poll(() => update)
      .toHaveBeenCalledWith(4, {
        title: 'Old titleq',
        description: null,
        priority: null,
        dueDate: null,
      });
    await expect.poll(() => view.lastFrame()).toContain('Old titleq');
    view.unmount();
  });

  it('cancels an add form without writing', async () => {
    const create = vi.fn<TaskRepository['create']>();
    const repo = {...repository([]), create};
    const view = render(
      <App repository={repo} now={now} dimensions={{columns: 100, rows: 30}} />,
    );
    await send(view, 'a');
    await expect.poll(() => view.lastFrame()).toContain('Add task');
    await send(view, 'Discard me');
    await send(view, '\u001B');
    await expect.poll(() => view.lastFrame()).toContain('No active tasks.');
    expect(create).not.toHaveBeenCalled();
    view.unmount();
  });
});
