/**
 * Browser CLI runtime — mirrors cli/src/index.ts, but runs in the terminal
 * tab. It uses the SAME shared engine and the SAME formatter as the installed
 * `jikken` binary, so on-screen output (and exit codes) are bit-identical —
 * that is the color/terminology-parity thesis, demonstrated live.
 */
import {
  ANSI_RESET,
  COLORS,
  EXIT_CODES,
  PATTERNS,
  SCENARIOS,
  SCENARIO_IDS,
  evaluateFlag,
  type FlagConfig,
  type MockUser,
  type ScenarioId,
  type SimulationResult,
} from '@jikken/shared';
import { formatOutput } from '@jikken/cli-formatter';

export interface RunOutput {
  /** ANSI-colored text to write to xterm. */
  text: string;
  /** Process-equivalent exit code. */
  exitCode: number;
  /** The result, when a simulation actually ran (for persistence / hand-off). */
  result: SimulationResult | null;
  /** The scenario id, when the run replayed one. */
  scenario: ScenarioId | null;
}

function err(message: string): string {
  return `${COLORS.EXCLUDE.ansi}[ERROR]${ANSI_RESET} ${message}\r\n`;
}

function suggestFlagId(input: string): string {
  return input.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function isScenarioId(v: string): v is ScenarioId {
  return (SCENARIO_IDS as readonly string[]).includes(v);
}

/** Minimal flag builder for --flag (no filesystem in the browser). */
function buildFlagConfig(flagId: string, rollout: number): FlagConfig {
  const ts = '2026-07-13T10:00:00Z';
  return {
    id: flagId,
    name: flagId,
    enabled: true,
    rollout_percentage: rollout,
    environment: 'staging',
    created_at: ts,
    updated_at: ts,
  };
}

/** Tokenize a command line, respecting no quoting (demo inputs are simple). */
function parseArgs(line: string): { cmd: string; opts: Record<string, string | true> } {
  const parts = line.trim().split(/\s+/).filter(Boolean);
  // Drop a leading "jikken" so both `jikken simulate ...` and `simulate ...` work.
  if (parts[0] === 'jikken') parts.shift();
  const cmd = parts.shift() ?? '';
  const opts: Record<string, string | true> = {};
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.startsWith('--')) {
      const key = p.slice(2);
      const next = parts[i + 1];
      if (next && !next.startsWith('--')) {
        opts[key] = next;
        i++;
      } else {
        opts[key] = true;
      }
    }
  }
  return { cmd, opts };
}

function resolveInput(opts: Record<string, string | true>):
  | { flag: FlagConfig; users: MockUser[]; scenario: ScenarioId | null }
  | { error: string; exitCode: number } {
  const scenario = typeof opts.scenario === 'string' ? opts.scenario : undefined;
  if (scenario) {
    if (!isScenarioId(scenario)) {
      return {
        error: err(`Unknown scenario '${scenario}'. Valid scenarios: ${SCENARIO_IDS.join(', ')}.`),
        exitCode: EXIT_CODES.INVALID_INPUT,
      };
    }
    const s = SCENARIOS[scenario];
    return { flag: s.flag, users: s.users, scenario };
  }

  const flagId = typeof opts.flag === 'string' ? opts.flag : undefined;
  if (!flagId) {
    return {
      error: err('Missing required option --flag <id> (or use --scenario).'),
      exitCode: EXIT_CODES.INVALID_INPUT,
    };
  }
  if (!PATTERNS.FLAG_ID.test(flagId)) {
    return {
      error:
        err('Invalid flag ID. Use lowercase letters, numbers, and hyphens.') +
        `Did you mean '${suggestFlagId(flagId)}'?\r\n`,
      exitCode: EXIT_CODES.INVALID_INPUT,
    };
  }

  let rollout = 100;
  if (typeof opts.rollout === 'string') {
    rollout = Number(opts.rollout);
    if (!Number.isInteger(rollout) || rollout < 0 || rollout > 100) {
      return {
        error: err('Invalid rollout percentage. Must be an integer 0–100.'),
        exitCode: EXIT_CODES.INVALID_INPUT,
      };
    }
  }
  // Scenario users give a deterministic, small, readable set for --flag runs too.
  return { flag: buildFlagConfig(flagId, rollout), users: SCENARIOS['all-clear'].users, scenario: null };
}

/** xterm needs CRLF; formatter emits LF. */
function crlf(s: string): string {
  return s.replace(/\n/g, '\r\n');
}

export function runCommand(line: string): RunOutput {
  const { cmd, opts } = parseArgs(line);

  if (cmd === '' ) {
    return { text: '', exitCode: 0, result: null, scenario: null };
  }
  if (cmd === 'help') {
    return {
      text:
        'jikken — feature flag lifecycle tool\r\n\r\n' +
        'Commands:\r\n' +
        '  simulate --scenario <all-clear|conflict|warning>\r\n' +
        '  simulate --flag <id> [--rollout 0-100] [--format json] [--quiet]\r\n' +
        '  validate --scenario <id> [--strict]\r\n',
      exitCode: 0,
      result: null,
      scenario: null,
    };
  }
  if (cmd !== 'simulate' && cmd !== 'validate') {
    return {
      text: err(`Unknown command '${cmd}'.`) + "Did you mean 'simulate'?\r\n",
      exitCode: EXIT_CODES.INVALID_INPUT,
      result: null,
      scenario: null,
    };
  }

  const format = typeof opts.format === 'string' ? opts.format : 'text';
  if (cmd === 'simulate' && format !== 'text' && format !== 'json') {
    return {
      text: err(`Invalid --format '${format}'. Use 'text' or 'json'.`),
      exitCode: EXIT_CODES.INVALID_INPUT,
      result: null,
      scenario: null,
    };
  }

  const resolved = resolveInput(opts);
  if ('error' in resolved) {
    return { text: resolved.error, exitCode: resolved.exitCode, result: null, scenario: null };
  }

  const result = evaluateFlag(resolved.flag, resolved.users);

  if (cmd === 'validate') {
    let text: string;
    let exitCode: number;
    if (result.exit_code === EXIT_CODES.CONFLICT) {
      text = `${COLORS.EXCLUDE.ansi}[FAIL]${ANSI_RESET} Conflict detected. Deployment halted.\r\n`;
      exitCode = EXIT_CODES.CONFLICT;
    } else if (result.exit_code === EXIT_CODES.WARNING && opts.strict) {
      text = `${COLORS.PARTIAL.ansi}[WARN]${ANSI_RESET} Partial matches detected. --strict mode halting.\r\n`;
      exitCode = EXIT_CODES.WARNING;
    } else {
      text = `${COLORS.RECEIVE.ansi}[OK]${ANSI_RESET} Flag validated. Ready for deployment.\r\n`;
      exitCode = EXIT_CODES.ALL_CLEAR;
    }
    return { text, exitCode, result, scenario: resolved.scenario };
  }

  const output = crlf(formatOutput(result, format as 'text' | 'json', Boolean(opts.quiet)));
  return { text: output + '\r\n', exitCode: result.exit_code, result, scenario: resolved.scenario };
}

/**
 * Preset command chips shown above the terminal. These demonstrate the CLI's
 * own capabilities — a real command, JSON output for machines, the CI
 * validation gate, an error with a "did you mean?" suggestion, and help. They
 * are deliberately NOT scenario switchers: the scenario (the shared situation
 * across all three surfaces) is chosen once in the top bar, not down here.
 */
export const PRESET_COMMANDS: { label: string; command: string }[] = [
  { label: 'simulate --flag dark-mode', command: 'jikken simulate --flag dark-mode --rollout 25' },
  { label: '--format json', command: 'jikken simulate --flag dark-mode --rollout 25 --format json' },
  { label: 'validate --strict', command: 'jikken validate --scenario conflict --strict' },
  { label: '"did you mean?"', command: 'jikken simulate --flag "Dark Mode!"' },
  { label: 'help', command: 'help' },
];
