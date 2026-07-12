import {afterEach, describe, expect, it, vi} from 'vitest';

const mocks = vi.hoisted(() => ({
  close: vi.fn(),
  render: vi.fn(() => ({
    unmount: vi.fn(),
    waitUntilExit: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('ink', () => ({render: mocks.render}));
vi.mock('../../src/db/client.js', () => ({
  openDatabase: vi.fn(() => ({
    database: {},
    close: mocks.close,
  })),
}));
vi.mock('../../src/db/taskRepository.js', () => ({
  SQLiteTaskRepository: vi.fn(),
}));

describe('CLI', () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('renders the app in the alternate screen buffer', async () => {
    await import('../../src/cli.js');

    expect(mocks.render).toHaveBeenCalledWith(expect.anything(), {
      alternateScreen: true,
    });
    expect(mocks.close).toHaveBeenCalledOnce();
  });
});
