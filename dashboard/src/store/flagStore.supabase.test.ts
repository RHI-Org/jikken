/**
 * Unit tests for SupabaseFlagStore — proves the Supabase data layer maps rows
 * correctly, builds the right insert payload, and wires the Realtime INSERT
 * handler, without touching a live database.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Fake Supabase client (hoisted so vi.mock's factory can see it) ──────────
const { state, fakeClient } = vi.hoisted(() => {
  const state = {
    flags: [] as unknown[],
    sims: [] as unknown[],
    inserted: [] as Record<string, unknown>[],
    upserted: [] as Record<string, unknown>[],
    deleted: [] as string[],
    realtimeHandler: null as ((payload: { new: unknown }) => void) | null,
    removed: 0,
  };

  const makeFrom = (table: string) => ({
    select() {
      return {
        order: () =>
          Promise.resolve({ data: table === 'jikken_flags' ? state.flags : state.sims, error: null }),
        eq: (_col: string, id: string) => ({
          maybeSingle: () =>
            Promise.resolve({
              data: (state.flags as { id: string }[]).find((f) => f.id === id) ?? null,
              error: null,
            }),
        }),
      };
    },
    upsert(payload: Record<string, unknown>) {
      state.upserted.push({ table, ...payload });
      return Promise.resolve({ error: null });
    },
    insert(payload: Record<string, unknown>) {
      state.inserted.push({ table, ...payload });
      return Promise.resolve({ error: null });
    },
    delete() {
      return { eq: (_c: string, id: string) => { state.deleted.push(id); return Promise.resolve({ error: null }); } };
    },
  });

  const fakeClient = {
    from: (table: string) => makeFrom(table),
    auth: { getUser: () => Promise.resolve({ data: { user: { id: 'user-uuid' } } }) },
    channel: () => {
      const chan = {
        on: (_evt: string, _filter: unknown, handler: (p: { new: unknown }) => void) => {
          state.realtimeHandler = handler;
          return chan;
        },
        subscribe: () => chan,
      };
      return chan;
    },
    removeChannel: () => { state.removed += 1; return Promise.resolve('ok'); },
  };

  return { state, fakeClient };
});

vi.mock('@/integrations/supabase/client', () => ({
  hasSupabase: true,
  supabase: fakeClient,
}));

import { SupabaseFlagStore } from './flagStore';

const SIM_ROW = {
  simulation_id: 'sim_abc123',
  flag_id: 'dark-mode',
  result: 'conflict',
  exit_code: 1,
  summary: { passed: 5, conflicted: 2, warned: 0, total: 7 },
  decisions: [{ user_id: 'user_001', decision: 'exclude', matched_rules: [], reason: 'x', rule_sources: [] }],
  evaluated_at: '2026-07-13T10:00:00.000Z',
  total_latency_ms: 3,
};

describe('SupabaseFlagStore', () => {
  let store: SupabaseFlagStore;
  beforeEach(() => {
    state.flags = [
      { id: 'dark-mode', name: 'Dark Mode Toggle', enabled: true, rollout_percentage: 100,
        audience_rules: [{ type: 'segment', operator: 'equals', value: 'early_adopter' }],
        environment: 'staging', created_at: 'T0', updated_at: 'T0' },
    ];
    state.sims = [SIM_ROW];
    state.inserted = [];
    state.upserted = [];
    state.deleted = [];
    state.realtimeHandler = null;
    state.removed = 0;
    store = new SupabaseFlagStore();
  });

  it('lists flags from jikken_flags', async () => {
    const flags = await store.listFlags();
    expect(flags).toHaveLength(1);
    expect(flags[0].id).toBe('dark-mode');
  });

  it('maps jikken_simulations rows to SimulationResult', async () => {
    const sims = await store.listSimulations();
    expect(sims).toEqual([
      {
        flag_id: 'dark-mode',
        simulation_id: 'sim_abc123',
        result: 'conflict',
        summary: { passed: 5, conflicted: 2, warned: 0, total: 7 },
        decisions: SIM_ROW.decisions,
        exit_code: 1,
        evaluated_at: '2026-07-13T10:00:00.000Z',
        total_latency_ms: 3,
      },
    ]);
  });

  it('saveFlag upserts the wire columns (audience_rules defaulted)', async () => {
    await store.saveFlag({
      id: 'new-checkout', name: 'New Checkout', enabled: true, rollout_percentage: 10,
      environment: 'production', created_at: 'x', updated_at: 'x',
    });
    const up = state.upserted[0];
    expect(up.id).toBe('new-checkout');
    expect(up.audience_rules).toEqual([]);
    expect(up.description).toBeNull();
  });

  it('runSimulation evaluates with the shared engine and inserts an audit row', async () => {
    const result = await store.runSimulation('dark-mode');
    // dark-mode all-100 scenario → all users receive → exit 0
    expect(result.flag_id).toBe('dark-mode');
    expect(state.inserted).toHaveLength(1);
    const row = state.inserted[0];
    expect(row.table).toBe('jikken_simulations');
    expect(row.surface).toBe('dashboard');
    expect(row.simulation_id).toBe(result.simulation_id);
    expect(row.created_by).toBe('user-uuid');
  });

  it('throws when the flag is missing', async () => {
    await expect(store.runSimulation('does-not-exist')).rejects.toThrow(/not found/i);
  });

  it('subscribeSimulations wires an INSERT handler that maps rows, and unsubscribes', () => {
    const seen: string[] = [];
    const unsub = store.subscribeSimulations((sim) => seen.push(sim.simulation_id));
    expect(state.realtimeHandler).toBeTypeOf('function');
    state.realtimeHandler!({ new: SIM_ROW });
    expect(seen).toEqual(['sim_abc123']);
    unsub();
    expect(state.removed).toBe(1);
  });
});
