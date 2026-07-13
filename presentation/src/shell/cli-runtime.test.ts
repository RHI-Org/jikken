import { describe, expect, it } from 'vitest';
import { colorizeCommand, runCommand } from './cli-runtime';

describe('browser CLI terminal helpers', () => {
  it('supports clearing the terminal without producing output', () => {
    expect(runCommand('clear')).toMatchObject({
      clear: true,
      exitCode: 0,
      result: null,
      text: '',
    });
  });

  it('adds syntax color while preserving the typed command text', () => {
    const command = 'jikken diff --feature dark-mode --scenario conflict';
    const colored = colorizeCommand(command);
    const plain = colored.replace(/\x1b\[[0-9;]*m/g, '');

    expect(colored).toContain('\x1b[');
    expect(plain).toBe(command);
  });

  it('rejects a pattern-valid but unknown flag with the nearest catalog flag suggested', () => {
    const output = runCommand('simulate --flag drak-mode');
    const plain = output.text.replace(/\x1b\[[0-9;]*m/g, '');

    expect(output.exitCode).toBe(3);
    expect(plain).toMatch(/Flag 'drak-mode' not found/);
    expect(plain).toMatch(/Did you mean 'dark-mode'\?/);
  });

  it('warns that --flag is ignored when --scenario is set, but still runs the scenario', () => {
    const output = runCommand('simulate --scenario all-clear --flag dark-mode --quiet');
    const plain = output.text.replace(/\x1b\[[0-9;]*m/g, '');

    expect(output.exitCode).toBe(0);
    expect(plain).toMatch(/--flag 'dark-mode' is ignored when --scenario is set/);
  });
});
