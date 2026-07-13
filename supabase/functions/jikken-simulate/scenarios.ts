// AUTO-GENERATED from shared/src/scenarios.ts by scripts/sync-edge-shared.mjs — do not edit.
/**
 * Deterministic demo scenarios.
 *
 * A scenario is a targeting rule applied to ONE shared user population
 * (`MOCK_USERS`). All three scenarios evaluate the exact same users; they
 * differ only in the flag's `audience_rules` and `rollout_percentage`. The
 * engine provably yields the named outcome for each — the presentation's
 * scenario picker, the CLI, and the SDK all replay these exact inputs, which
 * is how "same scenario → same result on every surface" stays true. Data lives
 * in code (not JSON files) so it imports identically in browser, Node, and Deno.
 */

import type { FlagConfig, MockUser } from './types.ts';

export type ScenarioId = 'all-clear' | 'conflict' | 'warning';

export interface Scenario {
  id: ScenarioId;
  /** Product feature the flag gates — same for every scenario. */
  feature: string;
  /** Human name for the targeting rule (describes the rule, not the outcome). */
  label: string;
  /** One-line plain-English summary of the rule. */
  description: string;
  flag: FlagConfig;
  users: MockUser[];
}

const T0 = '2026-07-13T10:00:00Z';

function user(n: number, overrides: Partial<MockUser> = {}): MockUser {
  const id = `user_${String(n).padStart(3, '0')}`;
  return {
    user_id: id,
    email: `${id}@example.com`,
    country: 'US',
    segment: 'early_adopter',
    ...overrides,
  };
}

/**
 * One realistic population, shared by every scenario.
 *
 * Mixed segments (early_adopter / mainstream), countries (US, CA, DE, FR), and
 * email domains (three internal accounts, the rest external). Constructed so
 * that a single population yields exit 0, 1, and 2 under three different
 * targeting rules — no per-scenario rigging. Invariant relied on by the
 * `warning` rules: no user is both `mainstream` AND outside US/CA, so nobody
 * matches zero rules there (which would escalate a warning into a conflict).
 */
export const MOCK_USERS: MockUser[] = [
  user(1, { segment: 'early_adopter', country: 'US' }),
  user(2, { segment: 'early_adopter', country: 'CA' }),
  user(3, { segment: 'mainstream', country: 'US' }),
  user(4, { segment: 'early_adopter', country: 'DE', email: 'user_004@internal.company.com' }),
  user(5, { segment: 'early_adopter', country: 'FR', email: 'user_005@internal.company.com' }),
  user(6, { segment: 'mainstream', country: 'CA' }),
  user(7, { segment: 'early_adopter', country: 'US' }),
  user(8, { segment: 'mainstream', country: 'US' }),
  user(9, { segment: 'early_adopter', country: 'CA', email: 'user_009@internal.company.com' }),
  user(10, { segment: 'early_adopter', country: 'DE' }),
];

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  'all-clear': {
    id: 'all-clear',
    feature: 'Dark Mode',
    label: 'Full rollout',
    description: '100% rollout to everyone, no audience rules — every user receives (exit 0).',
    flag: {
      id: 'dark-mode',
      name: 'Dark Mode Toggle',
      description: 'Enables dark mode UI for eligible users',
      enabled: true,
      rollout_percentage: 100,
      audience_rules: [],
      environment: 'staging',
      created_at: T0,
      updated_at: T0,
    },
    users: MOCK_USERS,
  },

  conflict: {
    id: 'conflict',
    feature: 'Dark Mode',
    label: 'Exclude employees',
    description: 'Blocks @internal.company.com accounts — those users are excluded by rule (exit 1).',
    flag: {
      id: 'dark-mode',
      name: 'Dark Mode Toggle',
      description: 'Enables dark mode UI for eligible users',
      enabled: true,
      rollout_percentage: 100,
      audience_rules: [{ type: 'email_domain', operator: 'not_equals', value: 'internal.company.com' }],
      environment: 'production',
      created_at: T0,
      updated_at: T0,
    },
    users: MOCK_USERS,
  },

  warning: {
    id: 'warning',
    feature: 'Dark Mode',
    label: 'Early adopters in US / CA',
    description: 'Targets early adopters in the US and Canada — users matching only one rule partially match (exit 2).',
    flag: {
      id: 'dark-mode',
      name: 'Dark Mode Toggle',
      description: 'Enables dark mode UI for eligible users',
      enabled: true,
      rollout_percentage: 100,
      audience_rules: [
        { type: 'segment', operator: 'equals', value: 'early_adopter' },
        { type: 'country', operator: 'in_list', value: ['US', 'CA'] },
      ],
      environment: 'staging',
      created_at: T0,
      updated_at: T0,
    },
    users: MOCK_USERS,
  },
};

export const SCENARIO_IDS = Object.keys(SCENARIOS) as ScenarioId[];
