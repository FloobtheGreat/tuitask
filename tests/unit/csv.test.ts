import {describe, expect, it} from 'vitest';
import {tasksToCsv} from '../../src/domain/csv.js';
import type {Task} from '../../src/domain/task.js';
import type {Project} from '../../src/domain/project.js';

const inbox: Project = {
  id: 1,
  name: 'Inbox',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 7,
    projectId: 1,
    title: 'Write report',
    description: null,
    priority: null,
    dueDate: null,
    completedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    ...overrides,
  };
}

describe('task CSV export', () => {
  it('exports headers and every task field in order', () => {
    expect(
      tasksToCsv([
        task({
          priority: 3,
          dueDate: '2026-07-12',
          completedAt: '2026-07-11T15:00:00.000Z',
        }),
      ]),
    ).toBe(
      'id,projectId,projectName,title,description,priority,dueDate,completedAt,createdAt,updatedAt\r\n' +
        '7,1,,Write report,,3,2026-07-12,2026-07-11T15:00:00.000Z,2026-01-01T00:00:00.000Z,2026-01-02T00:00:00.000Z\r\n',
    );
  });

  it('quotes commas, quotes, and multiline Unicode text', () => {
    expect(
      tasksToCsv([
        task({
          title: 'Review, then ship',
          description: 'Say "hello"\nShip 🚀',
        }),
      ]),
    ).toContain('"Review, then ship","Say ""hello""\nShip 🚀"');
  });

  it('includes the project name when project data is provided', () => {
    expect(tasksToCsv([task()], [inbox])).toContain('7,1,Inbox,Write report');
  });

  it('exports only headers for an empty task list', () => {
    expect(tasksToCsv([])).toBe(
      'id,projectId,projectName,title,description,priority,dueDate,completedAt,createdAt,updatedAt\r\n',
    );
  });
});
