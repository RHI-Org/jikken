// AUTO-GENERATED from shared/src/scenarios.ts by scripts/sync-edge-shared.mjs — do not edit.
/**
 * Deterministic demo scenarios.
 *
 * Each scenario is a (flag config, user set) pair constructed so the engine
 * provably yields the named outcome — the presentation's scenario picker,
 * the CLI, and the SDK all replay these exact inputs, which is how "same
 * scenario → same result on every surface" stays true. Data lives in code
 * (not JSON files) so it imports identically in browser, Node, and Deno.
 */

import type { FlagConfig, MockUser } from './types.ts';

export type ScenarioId = 'all-clear' | 'conflict' | 'warning';

export interface Scenario {
  id: ScenarioId;
  label: string;
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

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  'all-clear': {
    id: 'all-clear',
    label: 'All clear',
    description: 'Every user matches the audience rule and the 100% rollout — exit 0.',
    flag: {
      id: 'dark-mode',
      name: 'Dark Mode Toggle',
      description: 'Enables dark mode UI for eligible users',
      enabled: true,
      rollout_percentage: 100,
      audience_rules: [{ type: 'segment', operator: 'equals', value: 'early_adopter' }],
      environment: 'staging',
      created_at: T0,
      updated_at: T0,
    },
    users: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => user(n)),
  },

  conflict: {
    id: 'conflict',
    label: 'Conflict',
    description: 'Internal-domain users are excluded by rule — exit 1 halts deployment.',
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
    users: [
      user(1),
      user(2),
      user(3),
      user(4, { email: 'user_004@internal.company.com' }),
      user(5, { email: 'user_005@internal.company.com' }),
      user(6),
      user(7),
    ],
  },

  warning: {
    id: 'warning',
    label: 'Warning',
    description: 'Some users match only part of the targeting rules — exit 2, proceed with caution.',
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
    users: [
      user(1),
      user(2, { country: 'CA' }),
      user(3),
      user(4, { country: 'DE' }),
      user(5, { country: 'FR' }),
      user(6, { country: 'CA' }),
    ],
  },
};

export const SCENARIO_IDS = Object.keys(SCENARIOS) as ScenarioId[];
