/**
 * Seeded, deterministic simulation engine.
 *
 * Pure, dependency-free TypeScript — runs identically in the browser
 * (presentation CLI tab), Node (installed `jikken` CLI), and Deno
 * (Supabase Edge Function for the SDK). Same inputs → bit-identical
 * decisions and exit codes everywhere. That is the coherence thesis,
 * so nothing here may read clocks, randomness, or environment for
 * anything that affects a decision.
 */

import type {
  AudienceRule,
  FlagConfig,
  FlagDecision,
  MockUser,
  SimulationDiff,
  SimulationResult,
  UserDelta,
} from './types';
import { EXIT_CODES } from './constants';

/** FNV-1a 32-bit — stable across JS runtimes, good enough spread for rollout bucketing. */
function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Deterministic 0–99 bucket for a user under a flag. */
export function rolloutBucket(flagId: string, userId: string): number {
  return fnv1a(`${flagId}:${userId}`) % 100;
}

/** Extract the user attribute an audience rule targets. */
function userValueFor(rule: AudienceRule, user: MockUser): string | undefined {
  switch (rule.type) {
    case 'segment':
      return user.segment;
    case 'country':
      return user.country;
    case 'email_domain':
      return user.email?.split('@')[1];
    case 'user_id':
      return user.user_id;
    case 'plan_tier':
      return user.plan_tier;
    case 'income_band':
      return user.income_band;
    case 'age_band':
      return user.age_band;
    case 'region':
      return user.region;
  }
}

function ruleMatches(rule: AudienceRule, user: MockUser): boolean {
  const value = userValueFor(rule, user);
  if (value === undefined) return false;
  switch (rule.operator) {
    case 'equals':
      return value === rule.value;
    case 'not_equals':
      return value !== rule.value;
    case 'contains':
      return typeof rule.value === 'string' && value.includes(rule.value);
    case 'in_list':
      return Array.isArray(rule.value) && rule.value.includes(value);
  }
}

/** Label like `segment:early_adopter` — same string on every surface. */
function ruleLabel(rule: AudienceRule): string {
  const v = Array.isArray(rule.value) ? rule.value.join(',') : rule.value;
  return `${rule.type}:${v}`;
}

function decideUser(config: FlagConfig, user: MockUser): FlagDecision {
  const source = (line: number) => [`flags/${config.id}.json:${line}`];

  if (!config.enabled) {
    return {
      user_id: user.user_id,
      decision: 'exclude',
      matched_rules: [],
      reason: 'Flag is disabled in this environment',
      rule_sources: source(4),
    };
  }

  const rules = config.audience_rules ?? [];
  const matched = rules.filter((r) => ruleMatches(r, user));
  const failed = rules.filter((r) => !ruleMatches(r, user));

  // Exclusion by rule: at least one rule exists and none match.
  if (rules.length > 0 && matched.length === 0) {
    return {
      user_id: user.user_id,
      decision: 'exclude',
      matched_rules: failed.map(ruleLabel),
      reason: `User excluded by audience rule (${ruleLabel(failed[0])})`,
      rule_sources: source(14),
    };
  }

  // Partial: matches some but not all rules.
  if (rules.length > 1 && matched.length < rules.length) {
    return {
      user_id: user.user_id,
      decision: 'partial',
      matched_rules: matched.map(ruleLabel),
      reason: 'User matches some but not all targeting rules',
      rule_sources: source(12),
    };
  }

  // Rules pass (or none defined) — rollout percentage decides.
  if (rolloutBucket(config.id, user.user_id) >= config.rollout_percentage) {
    return {
      user_id: user.user_id,
      decision: 'exclude',
      matched_rules: matched.map(ruleLabel),
      reason: `User outside the ${config.rollout_percentage}% rollout`,
      rule_sources: source(6),
    };
  }

  return {
    user_id: user.user_id,
    decision: 'receive',
    matched_rules: matched.length > 0 ? matched.map(ruleLabel) : ['rollout:percentage'],
    reason:
      matched.length > 0
        ? `User matches ${matched.map(ruleLabel).join(', ')} and rollout percentage`
        : 'User within rollout percentage (no audience rules defined)',
    rule_sources: source(8),
  };
}

/**
 * Evaluate a flag against a set of users.
 *
 * `simulation_id` is a hash of the inputs, so identical runs are visibly
 * identical across surfaces. Only `evaluated_at` and `total_latency_ms`
 * are wall-clock values — never decision inputs.
 */
export function evaluateFlag(config: FlagConfig, users: MockUser[]): SimulationResult {
  const started = Date.now();
  const decisions = users.map((user) => decideUser(config, user));

  const summary = {
    passed: decisions.filter((d) => d.decision === 'receive').length,
    conflicted: decisions.filter((d) => d.decision === 'exclude').length,
    warned: decisions.filter((d) => d.decision === 'partial').length,
    total: decisions.length,
  };

  let exitCode: number = EXIT_CODES.ALL_CLEAR;
  if (summary.conflicted > 0) exitCode = EXIT_CODES.CONFLICT;
  else if (summary.warned > 0) exitCode = EXIT_CODES.WARNING;

  const idHash = fnv1a(
    JSON.stringify([config.id, config.rollout_percentage, config.audience_rules, users.map((u) => u.user_id)]),
  )
    .toString(16)
    .padStart(8, '0');

  return {
    flag_id: config.id,
    simulation_id: `sim_${idHash}`,
    result: exitCode === EXIT_CODES.ALL_CLEAR ? 'all_clear' : exitCode === EXIT_CODES.CONFLICT ? 'conflict' : 'warning',
    summary,
    decisions,
    exit_code: exitCode,
    evaluated_at: new Date().toISOString(),
    total_latency_ms: Math.max(Date.now() - started, 0),
  };
}

/**
 * Diff a proposed flag edit against the currently-live baseline: who gains
 * access, who loses it. "Access" == decision 'receive'. Pure/deterministic
 * like evaluateFlag — same inputs, same diff on every surface.
 */
export function diffSimulations(baseline: FlagConfig, proposed: FlagConfig, users: MockUser[]): SimulationDiff {
  const before = evaluateFlag(baseline, users);
  const after = evaluateFlag(proposed, users);
  const beforeDecision = new Map(before.decisions.map((d) => [d.user_id, d.decision]));
  const gained: UserDelta[] = [];
  const lost: UserDelta[] = [];
  for (const d of after.decisions) {
    const was = beforeDecision.get(d.user_id);
    const wasReceive = was === 'receive';
    const isReceive = d.decision === 'receive';
    if (was && !wasReceive && isReceive) gained.push({ user_id: d.user_id, before: was, after: d.decision, reason: d.reason });
    if (was && wasReceive && !isReceive) lost.push({ user_id: d.user_id, before: was, after: d.decision, reason: d.reason });
  }
  return { flag_id: proposed.id, before, after, gained, lost, net_receivers: after.summary.passed - before.summary.passed, exit_code: after.exit_code };
}
