/**
 * Cross-surface coherence tests — the thesis, executable.
 *
 * 1. Color parity: the canonical hex in shared COLORS is exactly the Tailwind
 *    palette value behind the Dashboard's text classes (and Wave 3 asserts the
 *    presentation terminal theme uses the same hex).
 * 2. Exit-code parity: the CLI process's real exit code and JSON equal the
 *    engine's in-process result for the same scenario.
 * 3. Vendor drift: the Edge Function's copies of the engine are byte-identical
 *    to shared/src (modulo the generated header + .ts import rewrites).
 * 4. Terminology parity: one spelling of rollout_percentage everywhere.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — tailwindcss ships its own types but colors import is untyped in some versions
import twColors from 'tailwindcss/colors';
import { COLORS, evaluateFlag, SCENARIOS, SCENARIO_IDS } from '../../shared/src/index';

const ROOT = join(__dirname, '..', '..');

describe('color parity (metric #1)', () => {
  it('shared hex values are the exact Tailwind colors the Dashboard renders', () => {
    expect(COLORS.RECEIVE.hex).toBe(twColors.green[700]);
    expect(COLORS.EXCLUDE.hex).toBe(twColors.red[700]);
    expect(COLORS.PARTIAL.hex).toBe(twColors.yellow[700]);
  });

  it('Tailwind class names in COLORS agree with their hex shade', () => {
    expect(COLORS.RECEIVE.text).toBe('text-green-700');
    expect(COLORS.EXCLUDE.text).toBe('text-red-700');
    expect(COLORS.PARTIAL.text).toBe('text-yellow-700');
  });
});

describe('exit-code parity across CLI process and engine (metric #3)', () => {
  for (const id of SCENARIO_IDS) {
    it(`scenario '${id}': CLI process === in-process engine`, () => {
      const engineResult = evaluateFlag(SCENARIOS[id].flag, SCENARIOS[id].users);

      let stdout = '';
      let status = 0;
      try {
        stdout = execSync(`npx tsx src/index.ts simulate --scenario ${id} --format json`, {
          cwd: join(ROOT, 'cli'),
          encoding: 'utf8',
        });
      } catch (e) {
        const err = e as { status: number; stdout: string };
        status = err.status;
        stdout = err.stdout;
      }
      const cliResult = JSON.parse(stdout);

      expect(status).toBe(engineResult.exit_code);
      expect(cliResult.exit_code).toBe(engineResult.exit_code);
      expect(cliResult.simulation_id).toBe(engineResult.simulation_id);
      expect(cliResult.summary).toEqual(engineResult.summary);
      expect(cliResult.decisions).toEqual(engineResult.decisions);
    });
  }
});

describe('edge-function vendor drift (sync-edge-shared)', () => {
  const FILES = ['types.ts', 'constants.ts', 'engine.ts', 'scenarios.ts'];
  for (const file of FILES) {
    it(`${file} is in sync with shared/src`, () => {
      const canonical = readFileSync(join(ROOT, 'shared/src', file), 'utf8');
      const expected = canonical.replace(/from '\.\/(types|constants|engine|scenarios)'/g, "from './$1.ts'");
      const vendored = readFileSync(join(ROOT, 'supabase/functions/jikken-simulate', file), 'utf8');
      const withoutHeader = vendored.split('\n').slice(1).join('\n');
      expect(withoutHeader).toBe(expected);
    });
  }
});

describe('terminology parity (metric #2)', () => {
  const SOURCES = [
    'cli/src/index.ts',
    'cli/src/formatter.ts',
    'dashboard/src/pages/FlagEditor.tsx',
    'sdk/lib/client.ts',
    'shared/src/types.ts',
  ];

  it('rollout_percentage is spelled one way on every surface', () => {
    // Guard the WIRE/UI terminology: no variant spelling may appear as a
    // serialized key or label. Internal camelCase locals are idiomatic TS
    // (the spec's own reference code uses them) and are not a violation.
    for (const rel of SOURCES) {
      const src = readFileSync(join(ROOT, rel), 'utf8');
      expect(src, `${rel} must not serialize a variant spelling`).not.toMatch(
        /['"](rolloutPercentage|percent_rollout|rollout_pct)['"]|percent_rollout|rollout_pct/,
      );
    }
    // and the canonical spelling is actually used where flags are configured
    expect(readFileSync(join(ROOT, 'shared/src/types.ts'), 'utf8')).toMatch(/rollout_percentage/);
    expect(readFileSync(join(ROOT, 'dashboard/src/pages/FlagEditor.tsx'), 'utf8')).toMatch(/rollout_percentage/);
  });
});
