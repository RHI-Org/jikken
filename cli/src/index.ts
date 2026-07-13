#!/usr/bin/env node
/**
 * CLI Entry Point — `jikken`
 *
 * Feature flag lifecycle tool — simulation and validation commands.
 * Evaluation is local: the shared, seeded engine (@jikken/shared) decides,
 * so a CLI run and a browser/SDK run of the same inputs are bit-identical.
 *
 * Design Principle: Exit codes are the real product.
 * Design Principle: Suggestions beat diagnoses.
 * Design Principle: Validate before you compute.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import type { FlagConfig, MockUser, SimulationDiff, SimulationResult } from '@jikken/shared';
import { ANSI_RESET, COLORS, EXIT_CODES, PATTERNS, SCENARIOS, SCENARIO_IDS, diffSimulations, evaluateFlag } from '@jikken/shared';
import { formatDiff, formatOutput } from './formatter';

type ScenarioId = (typeof SCENARIO_IDS)[number];

// cli/src/index.ts -> cli -> repo root, so ../flags and ../data resolve correctly
// whether this runs from a source checkout or the installed package.
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

function errorLine(message: string): void {
  console.error(`${COLORS.EXCLUDE.ansi}[ERROR]${ANSI_RESET} ${message}`);
}

/** lowercase, spaces -> hyphens, strip anything outside PATTERNS.FLAG_ID's alphabet. */
function suggestFlagId(input: string): string {
  return input
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function loadJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function defaultMockUsers(): MockUser[] {
  const dataPath = join(REPO_ROOT, 'data', 'mock-users.json');
  if (existsSync(dataPath)) {
    return loadJson<MockUser[]>(dataPath);
  }

  // Fallback generator (matches the spec's generateDefaultMockUsers) for the
  // case where the CLI is installed standalone, away from the monorepo data.
  const segments = ['early_adopter', 'standard', 'premium', 'enterprise'];
  const countries = ['US', 'CA', 'UK', 'DE', 'FR'];
  return Array.from({ length: 100 }, (_, i) => ({
    user_id: `user_${String(i).padStart(3, '0')}`,
    email: `user${i}@example.com`,
    segment: segments[i % segments.length],
    country: countries[i % countries.length],
  }));
}

function buildFlagConfig(flagId: string, rolloutPercentage: number): FlagConfig {
  const flagFilePath = join(REPO_ROOT, 'flags', `${flagId}.json`);
  if (existsSync(flagFilePath)) {
    const loaded = loadJson<FlagConfig>(flagFilePath);
    return { ...loaded, rollout_percentage: rolloutPercentage };
  }

  const ts = new Date().toISOString();
  return {
    id: flagId,
    name: flagId,
    enabled: true,
    rollout_percentage: rolloutPercentage,
    environment: 'staging',
    created_at: ts,
    updated_at: ts,
  };
}

function isScenarioId(value: string): value is ScenarioId {
  return (SCENARIO_IDS as readonly string[]).includes(value);
}

interface ResolvedInput {
  flag: FlagConfig;
  users: MockUser[];
}

/**
 * Shared front-half of both commands: resolve --scenario or --flag into a
 * concrete FlagConfig + MockUser[], validating flag IDs before any compute.
 * Exits the process directly on invalid input (INVALID_INPUT), matching
 * "validate before you compute."
 */
function resolveFlagAndUsers(options: {
  scenario?: string;
  flag?: string;
  rollout?: string;
  users?: string;
}): ResolvedInput {
  if (options.scenario) {
    if (!isScenarioId(options.scenario)) {
      errorLine(`Unknown scenario '${options.scenario}'. Valid scenarios: ${SCENARIO_IDS.join(', ')}.`);
      process.exit(EXIT_CODES.INVALID_INPUT);
    }
    const scenario = SCENARIOS[options.scenario];
    return { flag: scenario.flag, users: scenario.users };
  }

  if (!options.flag) {
    errorLine('Missing required option --flag <id> (or use --scenario).');
    process.exit(EXIT_CODES.INVALID_INPUT);
  }
  const flagId = options.flag;

  if (!PATTERNS.FLAG_ID.test(flagId)) {
    errorLine('Invalid flag ID. Use lowercase letters, numbers, and hyphens.');
    console.error(`Did you mean '${suggestFlagId(flagId)}'?`);
    process.exit(EXIT_CODES.INVALID_INPUT);
  }

  let rolloutPercentage = 100;
  if (options.rollout !== undefined) {
    rolloutPercentage = Number(options.rollout);
    if (!Number.isInteger(rolloutPercentage) || rolloutPercentage < 0 || rolloutPercentage > 100) {
      errorLine('Invalid rollout percentage. Must be an integer 0–100.');
      process.exit(EXIT_CODES.INVALID_INPUT);
    }
  }

  const flag = buildFlagConfig(flagId, rolloutPercentage);
  const users = options.users ? loadJson<MockUser[]>(resolve(options.users)) : defaultMockUsers();
  return { flag, users };
}

const program = new Command();

program
  .name('jikken')
  .description('Feature flag lifecycle tool — simulate and validate flag configurations')
  .version('1.0.0');

// ─── Simulate Command ───
program
  .command('simulate')
  .description('Run simulation for a feature flag')
  .option('--flag <id>', 'Flag identifier (e.g., dark-mode)')
  .option('--rollout <percentage>', 'Rollout percentage (0–100)', '100')
  .option('--users <path>', 'Path to a mock users JSON file')
  .option('--format <type>', 'Output format: text or json', 'text')
  .option('--quiet', 'Suppress the decision trace')
  .option('--scenario <id>', `Replay a named demo scenario: ${SCENARIO_IDS.join(' | ')}`)
  .action(
    (options: {
      flag?: string;
      rollout: string;
      users?: string;
      format: string;
      quiet?: boolean;
      scenario?: string;
    }) => {
      if (options.format !== 'text' && options.format !== 'json') {
        errorLine(`Invalid --format '${options.format}'. Use 'text' or 'json'.`);
        process.exit(EXIT_CODES.INVALID_INPUT);
      }

      const { flag, users } = resolveFlagAndUsers(options);
      const result: SimulationResult = evaluateFlag(flag, users);
      const output = formatOutput(result, options.format, Boolean(options.quiet));
      console.log(output);
      process.exit(result.exit_code);
    },
  );

// ─── Validate Command (for CI/CD) ───
program
  .command('validate')
  .description('Validate flag configuration before deployment')
  .option('--flag <id>', 'Flag identifier (e.g., dark-mode)')
  .option('--scenario <id>', `Replay a named demo scenario: ${SCENARIO_IDS.join(' | ')}`)
  .option('--strict', 'Fail on warnings (CI/CD mode)')
  .action((options: { flag?: string; scenario?: string; strict?: boolean }) => {
    const { flag, users } = resolveFlagAndUsers(options);
    const result = evaluateFlag(flag, users);

    if (result.exit_code === EXIT_CODES.CONFLICT) {
      console.error(`${COLORS.EXCLUDE.ansi}[FAIL]${ANSI_RESET} Conflict detected. Deployment halted.`);
      process.exit(EXIT_CODES.CONFLICT);
    }

    if (result.exit_code === EXIT_CODES.WARNING && options.strict) {
      console.error(`${COLORS.PARTIAL.ansi}[REVIEW]${ANSI_RESET} Some targeting rules matched, but users are not eligible. --strict mode halting.`);
      process.exit(EXIT_CODES.WARNING);
    }

    console.log(`${COLORS.RECEIVE.ansi}[OK]${ANSI_RESET} Flag validated. Ready for deployment.`);
    process.exit(EXIT_CODES.ALL_CLEAR);
  });

// ─── Diff Command (change-impact report / CI gate) ───
program
  .command('diff')
  .description('Show who gains or loses access between the live baseline and a proposed flag edit')
  .option('--scenario <id>', `Replay a named demo scenario: ${SCENARIO_IDS.join(' | ')}`)
  .option('--format <type>', 'Output format: text or json', 'text')
  .option('--quiet', 'Suppress the per-user gained/lost detail')
  .action((options: { scenario?: string; format: string; quiet?: boolean }) => {
    if (options.format !== 'text' && options.format !== 'json') {
      errorLine(`Invalid --format '${options.format}'. Use 'text' or 'json'.`);
      process.exit(EXIT_CODES.INVALID_INPUT);
    }

    // A diff needs a baseline to compare against, which only scenarios carry.
    if (!options.scenario) {
      errorLine(`Missing required option --scenario <id>. Valid scenarios: ${SCENARIO_IDS.join(', ')}.`);
      process.exit(EXIT_CODES.INVALID_INPUT);
    }
    if (!isScenarioId(options.scenario)) {
      errorLine(`Unknown scenario '${options.scenario}'. Valid scenarios: ${SCENARIO_IDS.join(', ')}.`);
      process.exit(EXIT_CODES.INVALID_INPUT);
    }

    const scenario = SCENARIOS[options.scenario];
    const diff: SimulationDiff = diffSimulations(scenario.baseline, scenario.flag, scenario.users);
    const output = formatDiff(diff, options.format, Boolean(options.quiet));
    console.log(output);
    process.exit(diff.exit_code);
  });

program.parseAsync(process.argv);
