import {render} from 'ink-testing-library';
import {describe, expect, it, vi} from 'vitest';
import {App} from '../../src/App.js';
import type {ClipboardWriter} from '../../src/clipboard.js';
import type {Project, ProjectRepository} from '../../src/domain/project.js';
import type {Task, TaskRepository} from '../../src/domain/task.js';

const now = new Date(2026, 6, 11, 12);
const inbox: Project = {
  id: 1,
  name: 'Inbox',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};
const task = (overrides: Partial<Task> & Pick<Task, 'id' | 'title'>): Task => ({
  projectId: 1,
  description: null,
  priority: null,
  dueDate: null,
  completedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

function repository(
  tasks: Task[],
  projects: Project[] = [inbox],
): TaskRepository & ProjectRepository {
  return {
    list: () => tasks,
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    setCompleted: vi.fn(),
    delete: vi.fn(),
    listProjects: () => projects,
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
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

  it('groups tasks under Inbox and alphabetically ordered projects', async () => {
    const alpha = {...inbox, id: 2, name: 'Alpha'};
    const zebra = {...inbox, id: 3, name: 'Zebra'};
    const view = render(
      <App
        repository={repository(
          [
            task({id: 3, projectId: 3, title: 'Zebra task'}),
            task({id: 2, projectId: 2, title: 'Alpha task'}),
            task({id: 1, title: 'Inbox task'}),
          ],
          [zebra, inbox, alpha],
        )}
        now={now}
        dimensions={{columns: 100, rows: 30}}
      />,
    );

    const frame = view.lastFrame() ?? '';
    expect(frame.indexOf('Inbox')).toBeLessThan(frame.indexOf('Alpha'));
    expect(frame.indexOf('Alpha')).toBeLessThan(frame.indexOf('Zebra'));
    expect(frame).toContain('Inbox task');
    expect(frame).toContain('Alpha task');
    expect(frame).toContain('Zebra task');
    await send(view, 'j');
    await expect.poll(() => view.lastFrame()).toContain('Alpha task');
    view.unmount();
  });

  it('creates, renames, and deletes an empty project', async () => {
    let projects = [inbox];
    const repo = repository([]);
    repo.listProjects = () => projects;
    const createProject = vi.fn<ProjectRepository['createProject']>(
      ({name}) => {
        const created = {...inbox, id: 2, name};
        projects = [...projects, created];
        return created;
      },
    );
    const updateProject = vi.fn<ProjectRepository['updateProject']>(
      (id, {name}) => {
        const updated = {
          ...(projects.find((project) => project.id === id) ?? inbox),
          name,
        };
        projects = projects.map((project) =>
          project.id === id ? updated : project,
        );
        return updated;
      },
    );
    const deleteProject = vi.fn<ProjectRepository['deleteProject']>((id) => {
      projects = projects.filter((project) => project.id !== id);
      return true;
    });
    repo.createProject = createProject;
    repo.updateProject = updateProject;
    repo.deleteProject = deleteProject;
    const view = render(
      <App repository={repo} now={now} dimensions={{columns: 100, rows: 30}} />,
    );

    await send(view, 'p');
    await expect.poll(() => view.lastFrame()).toContain('Projects');
    await send(view, 'n');
    await send(view, 'Work');
    await send(view, '\r');
    await expect.poll(() => view.lastFrame()).toContain('Work');
    await send(view, 'j');
    await send(view, 'r');
    for (let index = 0; index < 4; index += 1) await send(view, '\u007f');
    await send(view, 'Personal');
    await send(view, '\r');
    await expect.poll(() => view.lastFrame()).toContain('Personal');
    await send(view, 'd');
    await expect.poll(() => view.lastFrame()).toContain('Delete Personal?');
    await send(view, 'y');
    await expect.poll(() => view.lastFrame()).not.toContain('Personal');
    expect(createProject).toHaveBeenCalledWith({name: 'Work'});
    expect(updateProject).toHaveBeenCalledWith(2, {name: 'Personal'});
    expect(deleteProject).toHaveBeenCalledWith(2);
    view.unmount();
  });

  it('assigns a new task to the project selected in the form', async () => {
    const work = {...inbox, id: 2, name: 'Work'};
    const created = task({id: 1, projectId: 2, title: 'Work task'});
    const create = vi.fn<TaskRepository['create']>().mockReturnValue(created);
    const repo = {...repository([], [inbox, work]), create};
    const view = render(
      <App repository={repo} now={now} dimensions={{columns: 100, rows: 30}} />,
    );

    await send(view, 'a');
    await send(view, 'Work task');
    await send(view, '\t');
    await send(view, '\t');
    await send(view, '\u001B[C');
    await send(view, '\t');
    await send(view, '\t');
    await send(view, '\t');
    await send(view, '\r');
    await expect
      .poll(() => create)
      .toHaveBeenCalledWith({
        projectId: 2,
        title: 'Work task',
        description: null,
        priority: null,
        dueDate: null,
      });
    view.unmount();
  });

  it('copies the filtered tasks as CSV in displayed order', async () => {
    const writeText = vi.fn<ClipboardWriter['writeText']>().mockResolvedValue();
    const firstActive = task({id: 1, title: 'Active, first'});
    const secondActive = task({id: 3, title: 'Active second'});
    const completed = task({
      id: 2,
      title: 'Finished',
      completedAt: '2026-07-10T15:00:00.000Z',
    });
    const view = render(
      <App
        repository={repository([completed, secondActive, firstActive])}
        clipboard={{writeText}}
        now={now}
        dimensions={{columns: 100, rows: 30}}
      />,
    );

    await send(view, 'c');
    await expect.poll(() => writeText).toHaveBeenCalledOnce();
    const csv = writeText.mock.calls[0]?.[0] ?? '';
    expect(csv).toContain(
      'id,projectId,projectName,title,description,priority',
    );
    expect(csv).toContain('1,1,Inbox,"Active, first"');
    expect(csv.indexOf('Active, first')).toBeLessThan(
      csv.indexOf('Active second'),
    );
    expect(csv).not.toContain('Finished');
    await expect
      .poll(() => view.lastFrame())
      .toContain('Copied 2 task(s) to clipboard');
    view.unmount();
  });

  it('copies headers for an empty view and reports clipboard failures', async () => {
    const writeText = vi
      .fn<ClipboardWriter['writeText']>()
      .mockRejectedValue(new Error('Clipboard unavailable'));
    const view = render(
      <App
        repository={repository([])}
        clipboard={{writeText}}
        now={now}
        dimensions={{columns: 100, rows: 30}}
      />,
    );

    await send(view, 'c');
    await expect
      .poll(() => writeText)
      .toHaveBeenCalledWith(
        'id,projectId,projectName,title,description,priority,dueDate,completedAt,createdAt,updatedAt\r\n',
      );
    await expect
      .poll(() => view.lastFrame())
      .toContain('Unable to copy tasks: Clipboard unavailable');
    expect(view.lastFrame()).toContain('No active tasks.');
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
    await send(view, '\t');
    await send(view, '\u001B[C');
    await send(view, '\t');
    await send(view, 'tomorrow');
    await send(view, '\t');
    await send(view, '\r');

    await expect
      .poll(() => create)
      .toHaveBeenCalledWith({
        projectId: 1,
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
    await send(view, '\t');
    for (let index = 0; index < 3; index += 1) await send(view, '\u001B[D');
    await send(view, '\t');
    for (let index = 0; index < 10; index += 1) await send(view, '\u007f');
    await send(view, '\t');
    await send(view, '\r');

    await expect
      .poll(() => update)
      .toHaveBeenCalledWith(4, {
        projectId: 1,
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

  it('completes an active task, restores selection, and shows its completion date', async () => {
    const first = task({id: 1, title: 'Finish me'});
    const second = task({id: 2, title: 'Stay active'});
    const completed = {...first, completedAt: '2026-07-11T17:00:00.000Z'};
    const setCompleted = vi
      .fn<TaskRepository['setCompleted']>()
      .mockReturnValue(completed);
    const repo = {...repository([first, second]), setCompleted};
    const view = render(
      <App repository={repo} now={now} dimensions={{columns: 100, rows: 30}} />,
    );

    await send(view, ' ');
    expect(setCompleted).toHaveBeenCalledWith(1, true);
    await expect.poll(() => view.lastFrame()).not.toContain('Finish me');
    expect(view.lastFrame()).toContain('Stay active');
    await send(view, 'f');
    await expect.poll(() => view.lastFrame()).toContain('Finish me');
    expect(view.lastFrame()).toContain('Completed: Jul 11, 2026');
    view.unmount();
  });

  it('reopens a task and removes it from Completed', async () => {
    const completed = task({
      id: 1,
      title: 'Reopen me',
      completedAt: '2026-07-11T17:00:00.000Z',
    });
    const reopened = {...completed, completedAt: null};
    const setCompleted = vi
      .fn<TaskRepository['setCompleted']>()
      .mockReturnValue(reopened);
    const repo = {...repository([completed]), setCompleted};
    const view = render(
      <App repository={repo} now={now} dimensions={{columns: 100, rows: 30}} />,
    );
    await send(view, 'f');
    await send(view, ' ');

    expect(setCompleted).toHaveBeenCalledWith(1, false);
    await expect.poll(() => view.lastFrame()).toContain('No completed tasks.');
    view.unmount();
  });

  it('keeps a completed task selected in All', async () => {
    const original = task({id: 1, title: 'Complete in All'});
    const completed = {
      ...original,
      completedAt: '2026-07-11T17:00:00.000Z',
    };
    const setCompleted = vi
      .fn<TaskRepository['setCompleted']>()
      .mockReturnValue(completed);
    const repo = {...repository([original]), setCompleted};
    const view = render(
      <App repository={repo} now={now} dimensions={{columns: 100, rows: 30}} />,
    );
    await send(view, 'f');
    await send(view, 'f');
    await send(view, ' ');

    await expect.poll(() => view.lastFrame()).toContain('Complete in All');
    expect(view.lastFrame()).toContain('Status: Completed');
    view.unmount();
  });

  it('defaults delete confirmation to cancel, then explicitly deletes', async () => {
    const first = task({id: 1, title: 'Delete me'});
    const second = task({id: 2, title: 'Keep me'});
    const remove = vi.fn<TaskRepository['delete']>().mockReturnValue(true);
    const repo = {...repository([first, second]), delete: remove};
    const view = render(
      <App repository={repo} now={now} dimensions={{columns: 100, rows: 30}} />,
    );

    await send(view, 'd');
    await expect.poll(() => view.lastFrame()).toContain('Delete task?');
    await send(view, '\r');
    expect(remove).not.toHaveBeenCalled();
    await expect.poll(() => view.lastFrame()).toContain('Delete me');
    await send(view, 'd');
    await send(view, 'y');

    expect(remove).toHaveBeenCalledWith(1);
    await expect.poll(() => view.lastFrame()).not.toContain('Delete me');
    expect(view.lastFrame()).toContain('Keep me');
    view.unmount();
  });

  it('keeps persisted state visible after a completion error', async () => {
    const original = task({id: 1, title: 'Still active'});
    const setCompleted = vi
      .fn<TaskRepository['setCompleted']>()
      .mockImplementation(() => {
        throw new Error('Database is busy');
      });
    const repo = {...repository([original]), setCompleted};
    const view = render(
      <App repository={repo} now={now} dimensions={{columns: 100, rows: 30}} />,
    );

    await send(view, ' ');
    await expect.poll(() => view.lastFrame()).toContain('Database is busy');
    expect(view.lastFrame()).toContain('Still active');
    view.unmount();
  });

  it('opens and closes help with every main shortcut documented', async () => {
    const view = render(
      <App
        repository={repository([])}
        now={now}
        dimensions={{columns: 100, rows: 30}}
      />,
    );
    await send(view, '?');
    await expect.poll(() => view.lastFrame()).toContain('tuitask help');
    expect(view.lastFrame()).toContain('a Add');
    expect(view.lastFrame()).toContain('Space Complete or reopen');
    expect(view.lastFrame()).toContain('d Delete');
    expect(view.lastFrame()).toContain('c Copy CSV');
    expect(view.lastFrame()).toContain('? Help q Quit');
    await send(view, '?');
    await expect.poll(() => view.lastFrame()).toContain('No active tasks.');
    view.unmount();
  });

  it('truncates long list titles, preserves full details, and windows long lists', async () => {
    const longTitle = 'A very long task title that cannot fit in the list pane';
    const tasks = [
      task({id: 1, title: longTitle}),
      ...Array.from({length: 7}, (_, index) =>
        task({id: index + 2, title: `Task ${index + 2}`}),
      ),
    ];
    const view = render(
      <App
        repository={repository(tasks)}
        now={now}
        dimensions={{columns: 90, rows: 12}}
      />,
    );
    expect(view.lastFrame()).toContain('A very lon...');
    expect(view.lastFrame()).toContain(
      'A very long task title that cannot fit in the',
    );
    expect(view.lastFrame()).toContain('list pane');
    expect(view.lastFrame()).toContain('more below');
    for (let index = 0; index < 5; index += 1) await send(view, 'j');
    expect(view.lastFrame()).toContain('more above');
    view.unmount();
  });

  it('labels active tasks due today without marking completed tasks', async () => {
    const dueToday = task({
      id: 1,
      title: 'Due now',
      dueDate: '2026-07-11',
    });
    const completed = task({
      id: 2,
      title: 'Already done',
      dueDate: '2026-07-11',
      completedAt: '2026-07-11T17:00:00.000Z',
    });
    const view = render(
      <App
        repository={repository([dueToday, completed])}
        now={now}
        dimensions={{columns: 100, rows: 30}}
      />,
    );
    expect(view.lastFrame()).toContain('Due now DUE TODAY');
    await send(view, 'f');
    await expect.poll(() => view.lastFrame()).toContain('Already done');
    expect(view.lastFrame()).not.toContain('DUE TODAY');
    view.unmount();
  });

  it('explains how to change priority when the field is focused', async () => {
    const view = render(
      <App
        repository={repository([])}
        now={now}
        dimensions={{columns: 40, rows: 20}}
      />,
    );
    await send(view, 'a');
    await send(view, '\t');
    await send(view, '\t');
    await send(view, '\t');
    expect(view.lastFrame()).toContain('Left/Right or Space to change');
    expect(view.lastFrame()).toContain('priority');
    view.unmount();
  });
});
