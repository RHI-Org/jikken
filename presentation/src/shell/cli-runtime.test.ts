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
});
