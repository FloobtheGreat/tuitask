import os from 'node:os';
import path from 'node:path';

export type DatabasePathOptions = {
  env?: NodeJS.ProcessEnv;
  platform?: NodeJS.Platform;
  homeDirectory?: string;
};

export function getDatabasePath(options: DatabasePathOptions = {}): string {
  const env = options.env ?? process.env;
  const override = env.TUITASK_DB_PATH?.trim();
  if (override) return path.resolve(override);

  const platform = options.platform ?? process.platform;
  const home = options.homeDirectory ?? os.homedir();

  if (platform === 'win32') {
    const appData =
      env.APPDATA?.trim() || path.join(home, 'AppData', 'Roaming');
    return path.join(appData, 'tuitask', 'tasks.sqlite');
  }

  if (platform === 'darwin') {
    return path.join(
      home,
      'Library',
      'Application Support',
      'tuitask',
      'tasks.sqlite',
    );
  }

  const dataHome =
    env.XDG_DATA_HOME?.trim() || path.join(home, '.local', 'share');
  return path.join(dataHome, 'tuitask', 'tasks.sqlite');
}
