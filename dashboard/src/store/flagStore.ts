/**
 * FlagStore — the data seam.
 *
 * Every page talks to `flagStore`, never to localStorage or Supabase
 * directly. `LocalStorageFlagStore` is the Wave 1 implementation; Wave 2
 * swaps in a Supabase-backed implementation behind the same interface
 * with zero changes to the pages.
 */
import type { FlagConfig, MockUser, SimulationResult } from '@jikken/shared';
import { evaluateFlag, SCENARIOS, SCENARIO_IDS } from '@jikken/shared';
import { supabase, hasSupabase } from '@/integrations/supabase/client';

export interface FlagStore {
  listFlags(): Promise<FlagConfig[]>;
  getFlag(id: string): Promise<FlagConfig | null>;
  saveFlag(config: FlagConfig): Promise<void>;
  deleteFlag(id: string): Promise<void>;
  runSimulation(flagId: string, users?: MockUser[]): Promise<SimulationResult>;
  listSimulations(): Promise<SimulationResult[]>;
  /**
   * Subscribe to newly-inserted simulations (any surface). Powers the History
   * page's live hand-off pulse. Returns an unsubscribe function. The
   * LocalStorage implementation is a no-op (no cross-surface stream).
   */
  subscribeSimulations(onInsert: (sim: SimulationResult) => void): () => void;
}

const FLAGS_KEY = 'jikken-flags-v1';
const SIMS_KEY = 'jikken-sims-v1';

function now(): string {
  return new Date().toISOString();
}

/** 25 deterministic-ish mock users for flags with no scenario of their own. */
function generateMockUsers(): MockUser[] {
  const segments = ['early_adopter', 'standard', 'enterprise'];
  const countries = ['US', 'CA', 'DE', 'FR', 'GB'];
  return Array.from({ length: 25 }, (_, i) => {
    const n = i + 1;
    const id = `user_${String(n).padStart(3, '0')}`;
    return {
      user_id: id,
      email: `${id}@example.com`,
      country: countries[n % countries.length],
      segment: segments[n % segments.length],
    };
  });
}

function seedFlags(): FlagConfig[] {
  const t = now();
  const scenarioFlags = SCENARIO_IDS.map((id) => SCENARIOS[id].flag);
  const seen = new Set<string>();
  const deduped: FlagConfig[] = [];
  for (const flag of scenarioFlags) {
    if (seen.has(flag.id)) continue;
    seen.add(flag.id);
    deduped.push(flag);
  }

  const extras: FlagConfig[] = [
    {
      id: 'new-checkout',
      name: 'New Checkout Flow',
      description: 'Redesigned checkout with fewer steps',
      enabled: true,
      rollout_percentage: 10,
      environment: 'production',
      created_at: t,
      updated_at: t,
    },
    {
      id: 'beta-dashboard',
      name: 'Beta Dashboard',
      description: 'Early-access analytics dashboard',
      enabled: false,
      rollout_percentage: 0,
      environment: 'development',
      created_at: t,
      updated_at: t,
    },
  ];

  for (const flag of extras) {
    if (seen.has(flag.id)) continue;
    seen.add(flag.id);
    deduped.push(flag);
  }

  return deduped;
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export class LocalStorageFlagStore implements FlagStore {
  private ensureSeeded(): FlagConfig[] {
    const existing = localStorage.getItem(FLAGS_KEY);
    if (existing) return readJSON<FlagConfig[]>(FLAGS_KEY, []);
    const seeded = seedFlags();
    writeJSON(FLAGS_KEY, seeded);
    return seeded;
  }

  async listFlags(): Promise<FlagConfig[]> {
    return this.ensureSeeded();
  }

  async getFlag(id: string): Promise<FlagConfig | null> {
    const flags = this.ensureSeeded();
    return flags.find((f) => f.id === id) ?? null;
  }

  async saveFlag(config: FlagConfig): Promise<void> {
    const flags = this.ensureSeeded();
    const idx = flags.findIndex((f) => f.id === config.id);
    const t = now();
    if (idx >= 0) {
      flags[idx] = { ...config, created_at: flags[idx].created_at, updated_at: t };
    } else {
      flags.push({ ...config, created_at: t, updated_at: t });
    }
    writeJSON(FLAGS_KEY, flags);
  }

  async deleteFlag(id: string): Promise<void> {
    const flags = this.ensureSeeded().filter((f) => f.id !== id);
    writeJSON(FLAGS_KEY, flags);
  }

  async runSimulation(flagId: string, users?: MockUser[]): Promise<SimulationResult> {
    const flag = await this.getFlag(flagId);
    if (!flag) {
      throw new Error(`Flag not found: ${flagId}`);
    }

    const scenario = SCENARIO_IDS.map((id) => SCENARIOS[id]).find(
      (s) => s.flag.id === flagId,
    );
    const mockUsers = users ?? scenario?.users ?? generateMockUsers();

    const result = evaluateFlag(flag, mockUsers);

    const sims = readJSON<SimulationResult[]>(SIMS_KEY, []);
    sims.push(result);
    writeJSON(SIMS_KEY, sims);

    return result;
  }

  async listSimulations(): Promise<SimulationResult[]> {
    return readJSON<SimulationResult[]>(SIMS_KEY, []);
  }

  // No cross-surface stream in LocalStorage mode — return a no-op unsubscribe.
  subscribeSimulations(): () => void {
    return () => {};
  }
}

/** Resolve the mock users for a flag: its matching scenario set, else generic. */
function usersForFlag(flagId: string, override?: MockUser[]): MockUser[] {
  if (override) return override;
  const scenario = SCENARIO_IDS.map((id) => SCENARIOS[id]).find((s) => s.flag.id === flagId);
  return scenario?.users ?? generateMockUsers();
}

/** Shape of a jikken_simulations row (subset we consume). */
interface SimulationRow {
  simulation_id: string;
  flag_id: string;
  result: SimulationResult['result'];
  exit_code: number;
  summary: SimulationResult['summary'];
  decisions: SimulationResult['decisions'];
  evaluated_at: string;
  total_latency_ms: number;
}

function rowToResult(row: SimulationRow): SimulationResult {
  return {
    flag_id: row.flag_id,
    simulation_id: row.simulation_id,
    result: row.result,
    summary: row.summary,
    decisions: row.decisions ?? [],
    exit_code: row.exit_code,
    evaluated_at: row.evaluated_at,
    total_latency_ms: row.total_latency_ms,
  };
}

/**
 * Supabase-backed store — the real Wave 2 data layer. Flags and the
 * simulation audit log live in jikken_flags / jikken_simulations; the same
 * shared engine evaluates runs (so a Dashboard run and a CLI/SDK run of the
 * same inputs are bit-identical), and History streams inserts via Realtime.
 */
export class SupabaseFlagStore implements FlagStore {
  private get db() {
    if (!supabase) throw new Error('Supabase client unavailable');
    return supabase;
  }

  async listFlags(): Promise<FlagConfig[]> {
    const { data, error } = await this.db
      .from('jikken_flags')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as FlagConfig[];
  }

  async getFlag(id: string): Promise<FlagConfig | null> {
    const { data, error } = await this.db.from('jikken_flags').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return (data as FlagConfig) ?? null;
  }

  async saveFlag(config: FlagConfig): Promise<void> {
    const { error } = await this.db.from('jikken_flags').upsert(
      {
        id: config.id,
        name: config.name,
        description: config.description ?? null,
        enabled: config.enabled,
        rollout_percentage: config.rollout_percentage,
        audience_rules: config.audience_rules ?? [],
        environment: config.environment,
        updated_at: now(),
      },
      { onConflict: 'id' },
    );
    if (error) throw new Error(error.message);
  }

  async deleteFlag(id: string): Promise<void> {
    const { error } = await this.db.from('jikken_flags').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  async runSimulation(flagId: string, users?: MockUser[]): Promise<SimulationResult> {
    const flag = await this.getFlag(flagId);
    if (!flag) throw new Error(`Flag not found: ${flagId}`);

    const result = evaluateFlag(flag, usersForFlag(flagId, users));

    const { data: auth } = await this.db.auth.getUser();
    const { error } = await this.db.from('jikken_simulations').insert({
      simulation_id: result.simulation_id,
      flag_id: result.flag_id,
      surface: 'dashboard',
      result: result.result,
      exit_code: result.exit_code,
      summary: result.summary,
      decisions: result.decisions,
      evaluated_at: result.evaluated_at,
      total_latency_ms: result.total_latency_ms,
      created_by: auth.user?.id ?? null,
    });
    if (error) throw new Error(error.message);

    return result;
  }

  async listSimulations(): Promise<SimulationResult[]> {
    const { data, error } = await this.db
      .from('jikken_simulations')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => rowToResult(row as SimulationRow));
  }

  subscribeSimulations(onInsert: (sim: SimulationResult) => void): () => void {
    const channel = this.db
      .channel('jikken_simulations_inserts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'jikken_simulations' },
        (payload) => onInsert(rowToResult(payload.new as SimulationRow)),
      )
      .subscribe();
    return () => {
      void this.db.removeChannel(channel);
    };
  }
}

export const flagStore: FlagStore = hasSupabase
  ? new SupabaseFlagStore()
  : new LocalStorageFlagStore();
