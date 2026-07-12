import {describe, expect, it} from 'vitest';
import {InvalidDueDateError, parseDueDate} from '../../src/domain/dates.js';
import {
  normalizeProjectInput,
  normalizeTaskInput,
} from '../../src/domain/validation.js';

const now = new Date(2026, 11, 31, 23, 30);

describe('task validation', () => {
  it('normalizes title, description, and a canonical date', () => {
    expect(
      normalizeTaskInput(
        {
          projectId: 1,
          title: '  Write tests  ',
          description: '  first line\nsecond line  ',
          priority: 3,
          dueDate: '2027-01-02',
        },
        now,
      ),
    ).toEqual({
      projectId: 1,
      title: 'Write tests',
      description: 'first line\nsecond line',
      priority: 3,
      dueDate: '2027-01-02',
    });
  });

  it('turns blank optional text into null', () => {
    const result = normalizeTaskInput(
      {
        projectId: 1,
        title: 'Task',
        description: ' \n ',
        priority: null,
        dueDate: ' ',
      },
      now,
    );
    expect(result.description).toBeNull();
    expect(result.dueDate).toBeNull();
  });

  it('rejects blank titles and invalid priorities', () => {
    expect(() =>
      normalizeTaskInput({
        projectId: 1,
        title: '  ',
        description: null,
        priority: null,
        dueDate: null,
      }),
    ).toThrow('Title is required');
    expect(() =>
      normalizeTaskInput({
        projectId: 1,
        title: 'Task',
        description: null,
        // @ts-expect-error Testing runtime validation.
        priority: 4,
        dueDate: null,
      }),
    ).toThrow();
  });
});

describe('project validation', () => {
  it('trims names and rejects blank projects', () => {
    expect(normalizeProjectInput({name: '  Work  '})).toEqual({name: 'Work'});
    expect(() => normalizeProjectInput({name: '  '})).toThrow(
      'Project name is required',
    );
  });
});

describe('due-date parsing', () => {
  it('parses today and tomorrow across a year boundary', () => {
    expect(parseDueDate('today', now)).toBe('2026-12-31');
    expect(parseDueDate('tomorrow', now)).toBe('2027-01-01');
  });

  it.each(['2026-02-30', '2026-2-03', 'next week'])('rejects %s', (value) => {
    expect(() => parseDueDate(value, now)).toThrow(InvalidDueDateError);
  });

  it('allows past calendar dates', () => {
    expect(parseDueDate('2020-01-01', now)).toBe('2020-01-01');
  });
});
