#!/usr/bin/env node
/**
 * `jikken` bin entry point.
 *
 * The CLI is written in TypeScript (src/index.ts) and executed via tsx, so
 * this wrapper just forwards argv/stdio/exit-code to tsx running that file.
 * Keeping the actual program logic out of this file means `npx tsx
 * src/index.ts ...` (used by the tests and by local development) and the
 * installed `jikken` binary run the exact same code path.
 */
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const binDir = dirname(fileURLToPath(import.meta.url));
const cliDir = resolve(binDir, '..'); // cli/bin -> cli
const entry = join(cliDir, 'src', 'index.ts');
const tsxCli = join(cliDir, '..', 'node_modules', 'tsx', 'dist', 'cli.mjs');

const result = spawnSync(process.execPath, [tsxCli, entry, ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: cliDir,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
