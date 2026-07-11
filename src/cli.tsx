#!/usr/bin/env node

import process from 'node:process';
import {render} from 'ink';
import {App} from './App.js';

const instance = render(<App />);

const shutdown = () => {
  instance.unmount();
};

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

await instance.waitUntilExit();
