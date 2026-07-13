/**
 * Single source of truth for feature flag types shared across CLI, Dashboard, and SDK.
 */

export type Environment = 'development' | 'staging' | 'production';

export interface FlagConfig {
  /** Unique identifier (e.g., 'dark-mode') */
  id: string;
  /** Display name */
  name: string;
  /** Optional description of the flag's purpose */
  description?: string;
  /** Whether the flag is globally active */
  enabled: boolean;
  /** 0-100 */
  rollout_percentage: number;
  /** Rules defining which users see the flag */
  audience_rules?: AudienceRule[];
  /** The target environment for this configuration */
  environment: Environment;
  /** ISO 8601 */
  created_at: string;
  /** ISO 8601 */
  updated_at: string;
}

export interface AudienceRule {
  /**
   * The category of the rule. The first four target identity/geography; the
   * financial + demographic types (plan_tier / income_band / age_band / region)
   * let a rule gate on who a user *is* commercially, not just where they are.
   */
  type:
    | 'segment'
    | 'country'
    | 'email_domain'
    | 'user_id'
    | 'plan_tier'
    | 'income_band'
    | 'age_band'
    | 'region';
  /** The comparison logic to apply */
  operator: 'equals' | 'not_equals' | 'contains' | 'in_list';
  /** The value or list of values to compare against */
  value: string | string[];
}

export interface SimulationRequest {
  /** The ID of the flag to simulate */
  flag_id: string;
  /** A list of users to evaluate against the flag */
  mock_users: MockUser[];
  /** The environment context for the simulation */
  environment: Environment;
}

export interface MockUser {
  /** Unique user identifier */
  user_id: string;
  /** User's email address */
  email?: string;
  /** User's country code */
  country?: string;
  /** User's assigned segment */
  segment?: string;
  /** Commercial plan the user is on (financial targeting). */
  plan_tier?: 'free' | 'pro' | 'enterprise';
  /** Coarse income band (financial targeting). */
  income_band?: 'low' | 'mid' | 'high';
  /** Coarse age band (demographic targeting). */
  age_band?: '18-24' | '25-34' | '35-49' | '50+';
  /** Sales/marketing region (demographic + geographic targeting). */
  region?: 'NA' | 'EU' | 'APAC' | 'LATAM';
  /** Additional key-value metadata for the user */
  attributes?: Record<string, string>;
}

export interface SimulationResult {
  /** The ID of the flag simulated */
  flag_id: string;
  /** Unique identifier for this simulation run */
  simulation_id: string;
  /** The overall outcome of the simulation */
  result: 'all_clear' | 'conflict' | 'warning';
  /** Aggregated counts of the simulation outcomes */
  summary: { passed: number; conflicted: number; warned: number; total: number };
  /** Individual decisions made for each user */
  decisions: FlagDecision[];
  /** The process exit code for CLI usage */
  exit_code: number;
  /** ISO 8601 timestamp of completion */
  evaluated_at: string;
  /** Total time taken for the simulation in milliseconds */
  total_latency_ms: number;
}

export interface FlagDecision {
  /** The user being evaluated */
  user_id: string;
  /** The resulting flag state for the user */
  decision: 'receive' | 'exclude' | 'partial';
  /** List of rule IDs that were triggered */
  matched_rules: string[];
  /** Human-readable explanation of the decision */
  reason: string;
  /** The origins or sources of the applied rules */
  rule_sources: string[];
}

export interface UserDelta {
  user_id: string;
  before: 'receive' | 'exclude' | 'partial';
  after: 'receive' | 'exclude' | 'partial';
  /** The after-decision's human reason (why it changed). */
  reason: string;
}

export interface SimulationDiff {
  flag_id: string;
  before: SimulationResult;
  after: SimulationResult;
  /** Users who did NOT receive before but receive after. */
  gained: UserDelta[];
  /** Users who received before but do NOT receive after (the regression the tool catches). */
  lost: UserDelta[];
  /** after.summary.passed - before.summary.passed */
  net_receivers: number;
  /** = after.exit_code — drives the CI gate. */
  exit_code: number;
}

export interface ConflictDetail {
  /** The identifier of the first conflicting rule */
  rule_a: string;
  /** The identifier of the second conflicting rule */
  rule_b: string;
  /** The nature of the conflict detected */
  conflict_type: 'overlap' | 'mutual_exclusion' | 'circular_dependency';
  /** Number of users impacted by this conflict */
  affected_users: number;
}