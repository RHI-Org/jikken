#!/usr/bin/env node
/**
 * Vendor @jikken/shared into the Edge Function directory.
 *
 * Deno (Edge runtime) requires explicit .ts import extensions, and function
 * deploys can't reach outside supabase/functions/, so the shared sources are
 * copied here with imports rewritten. Run after any change to shared/src:
 *
 *   node scripts/sync-edge-shared.mjs
 *
 * shared/src is canonical — never edit the copies.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'supabase/functions/jikken-simulate');
mkdirSync(outDir, { recursive: true });

const FILES = ['types.ts', 'constants.ts', 'engine.ts', 'scenarios.ts'];
for (const file of FILES) {
  const src = readFileSync(join(root, 'shared/src', file), 'utf8');
  const rewritten = src.replace(/from '\.\/(types|constants|engine|scenarios)'/g, "from './$1.ts'");
  writeFileSync(
    join(outDir, file),
    `// AUTO-GENERATED from shared/src/${file} by scripts/sync-edge-shared.mjs — do not edit.\n${rewritten}`,
  );
  console.log(`synced ${file}`);
}
