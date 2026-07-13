import {chmodSync, cpSync, mkdirSync, readdirSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const tsc = resolve(projectRoot, 'node_modules', 'typescript', 'bin', 'tsc');
const result = spawnSync(process.execPath, [tsc, '-p', 'tsconfig.build.json'], {
  cwd: projectRoot,
  stdio: 'inherit',
});

if (result.error) {
  console.error(`Failed to run TypeScript: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const migrationsSource = resolve(projectRoot, 'src', 'db', 'migrations');
const migrationsDestination = resolve(projectRoot, 'dist', 'db', 'migrations');
mkdirSync(migrationsDestination, {recursive: true});

for (const entry of readdirSync(migrationsSource)) {
  cpSync(
    resolve(migrationsSource, entry),
    resolve(migrationsDestination, entry),
    {recursive: true},
  );
}

// Unix uses this permission for direct execution; Windows does not.
if (process.platform !== 'win32') {
  chmodSync(resolve(projectRoot, 'dist', 'cli.js'), 0o755);
}
