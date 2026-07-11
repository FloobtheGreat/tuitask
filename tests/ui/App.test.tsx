import {render} from 'ink-testing-library';
import {describe, expect, it} from 'vitest';
import {App} from '../../src/App.js';

describe('App', () => {
  it('renders the initial screen', () => {
    const view = render(<App />);

    expect(view.lastFrame()).toContain('tuitask');
    expect(view.lastFrame()).toContain('No tasks yet.');

    view.unmount();
  });
});
