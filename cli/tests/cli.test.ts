/**
 * CLI Test Suite
 *
 * Tests command-line interface behavior: exit codes, output formatting
 * (text and JSON), error handling, and determinism. Runs the real binary
 * entry point via `npx tsx src/index.ts <args>` so these tests exercise the
 * exact code path a user would hit.
 */
import { execSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const CLI_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function run(args: string): string {
  return execSync(`npx tsx src/index.ts ${args}`, { cwd: CLI_DIR, encoding: 'utf8' });
}

interface FailureResult {
  status: number;
  stderr: string;
  stdout: string;
}

function runExpectFailure(args: string): FailureResult {
  try {
    execSync(`npx tsx src/index.ts ${args}`, { cwd: CLI_DIR, encoding: 'utf8', stdio: 'pipe' });
    throw new Error(`Expected command to fail: ${args}`);
  } catch (err) {
    const failure = err as { status: number; stderr?: string; stdout?: string };
    return {
      status: failure.status,
      stderr: failure.stderr ?? '',
      stdout: failure.stdout ?? '',
    };
  }
}

describe('simulate scenarios', () => {
  it('outputs the simulation header and summary for the all-clear scenario', () => {
    const output = run('simulate --scenario all-clear');
    expect(output).toMatch(/FLAG SIMULATION RESULT/);
    expect(output).toMatch(/Received/);
  });

  it('exits 0 for the all-clear scenario', () => {
    // execSync only throws on a non-zero exit code, so not throwing proves exit 0.
    expect(() => run('simulate --scenario all-clear')).not.toThrow();
  });

  it('exits 1 for the conflict scenario', () => {
    const result = runExpectFailure('simulate --scenario conflict');
    expect(result.status).toBe(1);
  });

  it('exits 2 for the warning scenario', () => {
    const result = runExpectFailure('simulate --scenario warning');
    expect(result.status).toBe(2);
  });
});

describe('diff command', () => {
  it('reports the change impact and gained access for the all-clear scenario (exit 0)', () => {
    const output = run('diff --scenario all-clear');
    expect(output).toMatch(/CHANGE IMPACT/);
    expect(output).toMatch(/GAINED ACCESS/);
  });

  it('exits 1 and reports lost access for the conflict scenario', () => {
    const result = runExpectFailure('diff --scenario conflict');
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('LOST ACCESS (3)');
  });

  it('produces machine-parseable JSON with lost users for the conflict scenario', () => {
    const result = runExpectFailure('diff --scenario conflict --format json');
    const diff = JSON.parse(result.stdout);
    expect(Array.isArray(diff.lost)).toBe(true);
    expect(diff.lost.length).toBe(3);
    expect(diff.exit_code).toBe(1);
  });
});

describe('output format', () => {
  it('produces machine-parseable JSON with --format json', () => {
    const output = run('simulate --scenario all-clear --format json');
    const result = JSON.parse(output);

    expect(typeof result.simulation_id).toBe('string');
    expect(Array.isArray(result.decisions)).toBe(true);
    expect(typeof result.exit_code).toBe('number');
    expect(result.exit_code).toBeGreaterThanOrEqual(0);
    expect(result.exit_code).toBeLessThanOrEqual(6);
  });

  it('omits the decision trace with --quiet', () => {
    const output = run('simulate --scenario all-clear --quiet');
    expect(output).not.toContain('DECISION TRACE');
  });
});

describe('error handling', () => {
  it('rejects an invalid flag ID with a suggestion and exit code 3', () => {
    const result = runExpectFailure('simulate --flag "Dark Mode!"');
    expect(result.stderr).toMatch(/Invalid flag ID/i);
    expect(result.stderr).toMatch(/Did you mean/i);
    expect(result.status).toBe(3);
  });

  it('rejects an out-of-range rollout percentage with exit code 3', () => {
    const result = runExpectFailure('simulate --flag dark-mode --rollout 150');
    expect(result.status).toBe(3);
  });
});

describe('determinism', () => {
  it('produces identical decisions and simulation_id across repeated runs', () => {
    // The conflict scenario exits 1, so execSync throws — capture stdout via
    // the same failure-handling path used for the error-handling tests.
    const first = JSON.parse(runExpectFailure('simulate --scenario conflict --format json').stdout);
    const second = JSON.parse(runExpectFailure('simulate --scenario conflict --format json').stdout);

    expect(first.decisions).toEqual(second.decisions);
    expect(first.simulation_id).toBe(second.simulation_id);
  });
});
