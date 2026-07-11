import path from 'node:path';
import {describe, expect, it} from 'vitest';
import {getDatabasePath} from '../../src/db/paths.js';

describe('database paths', () => {
  it('honors TUITASK_DB_PATH', () => {
    expect(
      getDatabasePath({env: {TUITASK_DB_PATH: '/tmp/custom.sqlite'}}),
    ).toBe(path.resolve('/tmp/custom.sqlite'));
  });

  it('uses platform-standard locations', () => {
    expect(
      getDatabasePath({
        platform: 'linux',
        homeDirectory: '/home/test',
        env: {},
      }),
    ).toBe('/home/test/.local/share/tuitask/tasks.sqlite');
    expect(
      getDatabasePath({
        platform: 'darwin',
        homeDirectory: '/Users/test',
        env: {},
      }),
    ).toBe('/Users/test/Library/Application Support/tuitask/tasks.sqlite');
    expect(
      getDatabasePath({
        platform: 'win32',
        homeDirectory: 'C:\\Users\\test',
        env: {APPDATA: 'C:\\Data'},
      }),
    ).toBe(path.join('C:\\Data', 'tuitask', 'tasks.sqlite'));
  });
});
