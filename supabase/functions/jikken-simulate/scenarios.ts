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

import type { AudienceRule, Environment, FlagConfig, MockUser } from './types.ts';

export type ScenarioId = 'all-clear' | 'conflict' | 'warning';

export interface Scenario {
  id: ScenarioId;
  /** Product feature the flag gates — same for every scenario. */
  feature: string;
  /** Human name for the targeting rule (describes the rule, not the outcome). */
  label: string;
  /** One-line plain-English summary of the rule. */
  description: string;
  /** The currently-LIVE config; only the diff uses it (never the exit-code parity tests). */
  baseline: FlagConfig;
  flag: FlagConfig;
  /** Before→after narrative: what the edit does and what the tool catches. */
  story: { title: string; summary: string; caught: string };
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
  user(9, { segment: 'early_adopter', country: 'CA', email: 'user_009@internal.company.com', attributes: { account_type: 'beta_partner' } }),
  user(10, { segment: 'early_adopter', country: 'DE' }),
];

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  'all-clear': {
    id: 'all-clear',
    feature: 'Dark Mode',
    label: 'All clear',
    description: '100% rollout to everyone, no audience rules — every user receives (exit 0).',
    baseline: {
      id: 'dark-mode',
      name: 'Dark Mode Toggle',
      description: 'Enables dark mode UI for eligible users',
      enabled: true,
      rollout_percentage: 25,
      audience_rules: [],
      environment: 'staging',
      created_at: T0,
      updated_at: T0,
    },
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
    story: {
      title: 'Expand to everyone',
      summary: 'Dark Mode is live at 25%. This change takes it to 100%.',
      caught: 'Purely additive — users gain access, none lose it. Safe to ship.',
    },
    users: MOCK_USERS,
  },

  conflict: {
    id: 'conflict',
    feature: 'Dark Mode',
    label: 'Conflict',
    description: 'Blocks @internal.company.com accounts — those users are excluded by rule (exit 1).',
    baseline: {
      id: 'dark-mode',
      name: 'Dark Mode Toggle',
      description: 'Enables dark mode UI for eligible users',
      enabled: true,
      rollout_percentage: 100,
      audience_rules: [],
      environment: 'production',
      created_at: T0,
      updated_at: T0,
    },
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
    story: {
      title: 'Exclude employees',
      summary: 'Dark Mode is live for everyone. This change adds a rule to exclude @internal.company.com.',
      caught: '3 users who have Dark Mode today would lose it — including a beta partner on the internal domain. CI blocks the deploy until you confirm.',
    },
    users: MOCK_USERS,
  },

  warning: {
    id: 'warning',
    feature: 'Dark Mode',
    label: 'Warning',
    description: 'Targets early adopters in the US and Canada — users matching only one rule need review and are not eligible yet (exit 2).',
    baseline: {
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
    story: {
      title: 'Restrict to US / CA',
      summary: 'Dark Mode is live for all early adopters. This change also requires country US or CA.',
      caught: 'Early adopters in Germany and France match only some rules, so they are not eligible until the targeting is reviewed.',
    },
    users: MOCK_USERS,
  },
};

export const SCENARIO_IDS = Object.keys(SCENARIOS) as ScenarioId[];

// ── Feature catalog ────────────────────────────────────────────────────────
//
// "Feature" and "Situation" are two independent dimensions the presentation
// exposes as two menus. A Situation is one of the three outcome archetypes
// (all-clear / conflict / warning); a Feature is a product surface a flag
// gates. The bundled "Dark Mode" feature is the SCENARIOS above (identity /
// geography targeting). The two features below add FINANCIAL and DEMOGRAPHIC
// targeting — plan_tier, region, income_band, age_band — so the gained/lost
// diff reads like a real commercial decision, not just a country filter.
//
// Every feature carries its own small population and flag configs, tuned so
// its three situations provably evaluate to exit 0 / 1 / 2 (asserted by
// scripts/verify-catalog.mjs). The catalog is the exact shape the Phase-2
// Supabase table mirrors, with this bundled data as the offline fallback.

/** A situation is one of the three outcome archetypes. */
export type SituationId = ScenarioId;
export const SITUATION_IDS = SCENARIO_IDS;

export type FeatureId = 'dark-mode' | 'checkout-redesign' | 'premium-tier';

export interface FeatureDef {
  id: FeatureId;
  /** Display name shown in the Feature menu. */
  label: string;
  /** One-line summary of what the flag gates. */
  description: string;
  /** The three outcome archetypes for this feature. */
  situations: Record<SituationId, Scenario>;
}

/** Terse FlagConfig builder — the new features share a lot of boilerplate. */
function flag(
  id: string,
  name: string,
  rollout: number,
  rules: AudienceRule[],
  environment: Environment = 'staging',
): FlagConfig {
  return {
    id,
    name,
    description: `Gates ${name}`,
    enabled: true,
    rollout_percentage: rollout,
    audience_rules: rules,
    environment,
    created_at: T0,
    updated_at: T0,
  };
}

// ── Checkout Redesign — financial targeting (plan_tier) + region ────────────
const checkoutUsers: MockUser[] = [
  user(1, { plan_tier: 'free', region: 'NA' }),
  user(2, { plan_tier: 'free', region: 'EU' }),
  user(3, { plan_tier: 'pro', region: 'NA' }),
  user(4, { plan_tier: 'pro', region: 'EU' }),
  user(5, { plan_tier: 'pro', region: 'APAC' }),
  user(6, { plan_tier: 'enterprise', region: 'NA' }),
  user(7, { plan_tier: 'enterprise', region: 'LATAM' }),
  user(8, { plan_tier: 'free', region: 'NA' }),
];

const CHECKOUT: Record<SituationId, Scenario> = {
  'all-clear': {
    id: 'all-clear',
    feature: 'Checkout Redesign',
    label: 'All clear',
    description: 'Take the new checkout from a 30% test to everyone — purely additive (exit 0).',
    baseline: flag('checkout-redesign', 'Checkout Redesign', 30, []),
    flag: flag('checkout-redesign', 'Checkout Redesign', 100, []),
    story: {
      title: 'Ship to everyone',
      summary: 'The new checkout is live for 30% of users. This change takes it to 100%.',
      caught: 'Additive — users gain the new checkout, none lose it. Safe to ship.',
    },
    users: checkoutUsers,
  },
  conflict: {
    id: 'conflict',
    feature: 'Checkout Redesign',
    label: 'Conflict',
    description: 'Add a rule that excludes free-tier users — those users lose the checkout they have (exit 1).',
    baseline: flag('checkout-redesign', 'Checkout Redesign', 100, []),
    flag: flag('checkout-redesign', 'Checkout Redesign', 100, [
      { type: 'plan_tier', operator: 'not_equals', value: 'free' },
    ]),
    story: {
      title: 'Limit to paying customers',
      summary: 'The new checkout is live for everyone. This change limits it to pro and enterprise plans.',
      caught: 'Free-tier users who use the new checkout today would lose it. CI blocks the deploy until you confirm.',
    },
    users: checkoutUsers,
  },
  warning: {
    id: 'warning',
    feature: 'Checkout Redesign',
    label: 'Warning',
    description: 'Layer a region rule on top of the paid rule — users matching only one rule need review and are not eligible yet (exit 2).',
    baseline: flag('checkout-redesign', 'Checkout Redesign', 100, [
      { type: 'plan_tier', operator: 'in_list', value: ['pro', 'enterprise'] },
    ]),
    flag: flag('checkout-redesign', 'Checkout Redesign', 100, [
      { type: 'plan_tier', operator: 'in_list', value: ['pro', 'enterprise'] },
      { type: 'region', operator: 'in_list', value: ['NA', 'EU'] },
    ]),
    story: {
      title: 'Add a region requirement',
      summary: 'The new checkout is live for all paid customers. This change also requires region NA or EU.',
      caught: 'Paid customers in APAC and LATAM match only some rules, so they are not eligible until the targeting is reviewed.',
    },
    users: checkoutUsers,
  },
};

// ── Premium Tier — demographic targeting (income_band + age_band) ───────────
const premiumUsers: MockUser[] = [
  user(1, { income_band: 'low', age_band: '25-34' }),
  user(2, { income_band: 'low', age_band: '25-34' }),
  user(3, { income_band: 'mid', age_band: '25-34' }),
  user(4, { income_band: 'mid', age_band: '35-49' }),
  user(5, { income_band: 'high', age_band: '35-49' }),
  user(6, { income_band: 'high', age_band: '50+' }),
  user(7, { income_band: 'mid', age_band: '18-24' }),
  user(8, { income_band: 'low', age_band: '35-49' }),
];

const PREMIUM: Record<SituationId, Scenario> = {
  'all-clear': {
    id: 'all-clear',
    feature: 'Premium Tier',
    label: 'All clear',
    description: 'Take the premium upsell from a 50% test to everyone — purely additive (exit 0).',
    baseline: flag('premium-tier', 'Premium Tier Upsell', 50, []),
    flag: flag('premium-tier', 'Premium Tier Upsell', 100, []),
    story: {
      title: 'Ship to everyone',
      summary: 'The premium upsell is live for 50% of users. This change takes it to 100%.',
      caught: 'Additive — users gain the upsell, none lose it. Safe to ship.',
    },
    users: premiumUsers,
  },
  conflict: {
    id: 'conflict',
    feature: 'Premium Tier',
    label: 'Conflict',
    description: 'Restrict the upsell to high-income users — everyone else loses it (exit 1).',
    baseline: flag('premium-tier', 'Premium Tier Upsell', 100, []),
    flag: flag('premium-tier', 'Premium Tier Upsell', 100, [
      { type: 'income_band', operator: 'equals', value: 'high' },
    ]),
    story: {
      title: 'Target high-income users',
      summary: 'The premium upsell is live for everyone. This change restricts it to high-income users.',
      caught: 'Low- and mid-income users who see the upsell today would lose it. CI blocks the deploy until you confirm.',
    },
    users: premiumUsers,
  },
  warning: {
    id: 'warning',
    feature: 'Premium Tier',
    label: 'Warning',
    description: 'Layer an age rule on top of the income rule — users matching only one rule need review and are not eligible yet (exit 2).',
    baseline: flag('premium-tier', 'Premium Tier Upsell', 100, [
      { type: 'income_band', operator: 'in_list', value: ['mid', 'high'] },
    ]),
    flag: flag('premium-tier', 'Premium Tier Upsell', 100, [
      { type: 'income_band', operator: 'in_list', value: ['mid', 'high'] },
      { type: 'age_band', operator: 'in_list', value: ['25-34', '35-49'] },
    ]),
    story: {
      title: 'Add an age requirement',
      summary: 'The premium upsell is live for all mid- and high-income users. This change also requires a prime age band.',
      caught: 'Users outside the 25–49 age bands match only some rules, so they are not eligible until the targeting is reviewed.',
    },
    users: premiumUsers,
  },
};

export const FEATURES: FeatureDef[] = [
  {
    id: 'dark-mode',
    label: 'Dark Mode',
    description: 'A UI theme flag — identity and geography targeting.',
    situations: SCENARIOS,
  },
  {
    id: 'checkout-redesign',
    label: 'Checkout Redesign',
    description: 'A revenue surface — financial targeting by plan and region.',
    situations: CHECKOUT,
  },
  {
    id: 'premium-tier',
    label: 'Premium Tier',
    description: 'An upsell surface — demographic targeting by income and age.',
    situations: PREMIUM,
  },
];

export const FEATURE_IDS = FEATURES.map((f) => f.id) as FeatureId[];

const FEATURES_BY_ID: Record<FeatureId, FeatureDef> = Object.fromEntries(
  FEATURES.map((f) => [f.id, f]),
) as Record<FeatureId, FeatureDef>;

/** Resolve one (feature × situation) pair to its Scenario. */
export function getScenario(featureId: FeatureId, situationId: SituationId): Scenario {
  return FEATURES_BY_ID[featureId].situations[situationId];
}

/** True if the string is a known feature id. */
export function isFeatureId(v: string): v is FeatureId {
  return (FEATURE_IDS as readonly string[]).includes(v);
}
