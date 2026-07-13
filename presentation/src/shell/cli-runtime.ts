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
  FEATURES,
  PATTERNS,
  SCENARIOS,
  SCENARIO_IDS,
  diffSimulations,
  evaluateFlag,
  type FeatureDef,
  type FlagConfig,
  type MockUser,
  type Scenario,
  type ScenarioId,
  type SimulationDiff,
  type SimulationResult,
} from '@jikken/shared';
import { formatDiff, formatOutput } from '@jikken/cli-formatter';

// ── Greyscale visual hierarchy (matches the concurrent formatter change) ──
// COLORS.RECEIVE/EXCLUDE/PARTIAL stay reserved for semantic states; these tones
// only shape the non-semantic chrome: banners, prompt, help, echoed commands.
// Tuned for the light stone console (bg stone-100): dark-on-light greys.
const C_HEADER = '\x1b[1m\x1b[38;5;232m'; // bold dark header
const C_LABEL = '\x1b[38;5;244m'; // mid-grey label
const C_FAINT = '\x1b[38;5;250m'; // faint separator (light)
const C_ROOT = '\x1b[1m\x1b[38;5;232m'; // executable (bold dark)
const C_CMD = '\x1b[1m\x1b[38;5;25m'; // command keyword (blue)
const C_FLAG = '\x1b[38;5;97m'; // --flags (purple)
const C_VALUE = '\x1b[38;5;30m'; // values (teal)

const CMD_KEYWORDS = new Set(['simulate', 'diff', 'validate', 'help', 'clear']);

/**
 * Colorize an echoed command line: the command keyword(s) render bold-grey and
 * their --flags a dimmer grey, so an injected command reads with hierarchy
 * instead of a flat wall of white. Flag values keep the default foreground.
 */
export function colorizeCommand(line: string): string {
  return line
    .trim()
    .split(/\s+/)
    .map((tok) => {
      if (tok === 'jikken') return `${C_ROOT}${tok}${ANSI_RESET}`;
      if (tok.startsWith('--')) return `${C_FLAG}${tok}${ANSI_RESET}`;
      if (CMD_KEYWORDS.has(tok)) return `${C_CMD}${tok}${ANSI_RESET}`;
      return `${C_VALUE}${tok}${ANSI_RESET}`;
    })
    .join(' ');
}

export interface RunOutput {
  /** ANSI-colored text to write to xterm. */
  text: string;
  /** Process-equivalent exit code. */
  exitCode: number;
  /** The result, when a simulation actually ran (for persistence / hand-off). */
  result: SimulationResult | null;
  /** The scenario id, when the run replayed one. */
  scenario: ScenarioId | null;
  /** Clear the visible terminal and scrollback instead of printing output. */
  clear?: boolean;
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

// The catalog the CLI resolves against. Defaults to the bundled FEATURES, but
// the Shell swaps in the Supabase-loaded catalog once it resolves, so a run
// targets exactly what the menus show — including DB-only features.
let activeCatalog: FeatureDef[] = FEATURES;
export function setActiveCatalog(catalog: FeatureDef[]): void {
  activeCatalog = catalog.length > 0 ? catalog : FEATURES;
}

/**
 * Resolve a (feature × situation) pair from parsed opts against the active
 * catalog. `--feature` is optional and defaults to `dark-mode`, so the
 * historical `--scenario <id>` form (and every existing test) is unchanged.
 */
function resolveScenario(
  opts: Record<string, string | true>,
): { scenario: Scenario; situation: ScenarioId } | { error: string } {
  const situation = typeof opts.scenario === 'string' ? opts.scenario : undefined;
  if (!situation || !isScenarioId(situation)) {
    return { error: err(`Unknown scenario '${situation ?? ''}'. Valid scenarios: ${SCENARIO_IDS.join(', ')}.`) };
  }
  const featureId = typeof opts.feature === 'string' ? opts.feature : 'dark-mode';
  const feature = activeCatalog.find((f) => f.id === featureId);
  if (!feature) {
    return { error: err(`Unknown feature '${featureId}'. Valid features: ${activeCatalog.map((f) => f.id).join(', ')}.`) };
  }
  return { scenario: feature.situations[situation], situation };
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
  if (typeof opts.scenario === 'string') {
    const resolved = resolveScenario(opts);
    if ('error' in resolved) {
      return { error: resolved.error, exitCode: EXIT_CODES.INVALID_INPUT };
    }
    return { flag: resolved.scenario.flag, users: resolved.scenario.users, scenario: resolved.situation };
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
  if (cmd === 'clear') {
    return { text: '', exitCode: 0, result: null, scenario: null, clear: true };
  }
  if (cmd === 'help') {
    const cmdLine = (keyword: string, rest: string) =>
      `  ${C_CMD}${keyword}${ANSI_RESET} ${rest}\r\n`;
    return {
      text:
        `${C_HEADER}jikken${ANSI_RESET}${C_LABEL} — feature flag lifecycle tool${ANSI_RESET}\r\n\r\n` +
        `${C_LABEL}Commands:${ANSI_RESET}\r\n` +
        cmdLine('diff', `${C_FLAG}--scenario${ANSI_RESET} ${C_FAINT}<all-clear|conflict|warning>${ANSI_RESET} ${C_LABEL}— what the change does to real users${ANSI_RESET}`) +
        cmdLine('simulate', `${C_FLAG}--scenario${ANSI_RESET} ${C_FAINT}<all-clear|conflict|warning>${ANSI_RESET}`) +
        cmdLine('simulate', `${C_FLAG}--flag${ANSI_RESET} ${C_FAINT}<id>${ANSI_RESET} ${C_FLAG}--rollout${ANSI_RESET} ${C_FAINT}0-100${ANSI_RESET} ${C_FLAG}--format${ANSI_RESET} ${C_FAINT}json${ANSI_RESET} ${C_FLAG}--quiet${ANSI_RESET}`) +
        cmdLine('validate', `${C_FLAG}--scenario${ANSI_RESET} ${C_FAINT}<id>${ANSI_RESET} ${C_FLAG}--strict${ANSI_RESET}`) +
        cmdLine('clear', `${C_LABEL}— clear the terminal${ANSI_RESET}`),
      exitCode: 0,
      result: null,
      scenario: null,
    };
  }
  if (cmd === 'diff') {
    const format = typeof opts.format === 'string' ? opts.format : 'text';
    if (format !== 'text' && format !== 'json') {
      return {
        text: err(`Invalid --format '${format}'. Use 'text' or 'json'.`),
        exitCode: EXIT_CODES.INVALID_INPUT,
        result: null,
        scenario: null,
      };
    }
    // A diff needs a baseline to compare against, so --scenario is required here
    // (a bare --flag has nothing to diff from).
    if (typeof opts.scenario !== 'string') {
      return {
        text: err('Missing required option --scenario <id> for diff (a diff needs a baseline to compare against).'),
        exitCode: EXIT_CODES.INVALID_INPUT,
        result: null,
        scenario: null,
      };
    }
    const resolved = resolveScenario(opts);
    if ('error' in resolved) {
      return { text: resolved.error, exitCode: EXIT_CODES.INVALID_INPUT, result: null, scenario: null };
    }
    const s = resolved.scenario;
    const diff: SimulationDiff = diffSimulations(s.baseline, s.flag, s.users);
    const output = crlf(formatDiff(diff, format as 'text' | 'json', Boolean(opts.quiet)));
    return { text: output + '\r\n', exitCode: diff.exit_code, result: diff.after, scenario: resolved.situation };
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
 * Preset command shortcuts shown in the Commands tab. These demonstrate the CLI's
 * own capabilities — a real command, JSON output for machines, the CI
 * validation gate, an error with a "did you mean?" suggestion, and help. They
 * are deliberately NOT scenario switchers: the scenario (the shared situation
 * across all three surfaces) is chosen once in the top bar, not down here.
 */
export type PresetCommandGroup = 'workflow' | 'output' | 'guidance';

export const PRESET_COMMANDS: { label: string; command: string; group: PresetCommandGroup }[] = [
  { label: 'diff --scenario conflict', command: 'jikken diff --scenario conflict', group: 'workflow' },
  { label: 'simulate --flag dark-mode', command: 'jikken simulate --flag dark-mode --rollout 25', group: 'workflow' },
  { label: 'validate --strict', command: 'jikken validate --scenario conflict --strict', group: 'workflow' },
  { label: '--format json', command: 'jikken simulate --flag dark-mode --rollout 25 --format json', group: 'output' },
  { label: '--quiet', command: 'jikken simulate --flag dark-mode --rollout 25 --quiet', group: 'output' },
  { label: '"did you mean?"', command: 'jikken simulate --flag "Dark Mode!"', group: 'guidance' },
  { label: 'help', command: 'help', group: 'guidance' },
];
