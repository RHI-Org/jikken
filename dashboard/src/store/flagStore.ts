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

export interface FlagStore {
  listFlags(): Promise<FlagConfig[]>;
  getFlag(id: string): Promise<FlagConfig | null>;
  saveFlag(config: FlagConfig): Promise<void>;
  deleteFlag(id: string): Promise<void>;
  runSimulation(flagId: string, users?: MockUser[]): Promise<SimulationResult>;
  listSimulations(): Promise<SimulationResult[]>;
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
}

export const flagStore: FlagStore = new LocalStorageFlagStore();
