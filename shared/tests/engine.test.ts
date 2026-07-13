import { describe, expect, it } from 'vitest';
import { COLORS, EXIT_CODES, evaluateFlag, rolloutBucket, SCENARIOS, SCENARIO_IDS } from '../src/index';

describe('scenario outcomes are exactly their names', () => {
  it('all-clear → exit 0, everyone receives', () => {
    const s = SCENARIOS['all-clear'];
    const r = evaluateFlag(s.flag, s.users);
    expect(r.exit_code).toBe(EXIT_CODES.ALL_CLEAR);
    expect(r.result).toBe('all_clear');
    expect(r.summary.passed).toBe(s.users.length);
    expect(r.summary.conflicted).toBe(0);
    expect(r.summary.warned).toBe(0);
  });

  it('conflict → exit 1, internal users excluded', () => {
    const s = SCENARIOS.conflict;
    const r = evaluateFlag(s.flag, s.users);
    expect(r.exit_code).toBe(EXIT_CODES.CONFLICT);
    expect(r.result).toBe('conflict');
    expect(r.summary.conflicted).toBe(2);
    expect(r.summary.passed).toBe(5);
    const excluded = r.decisions.filter((d) => d.decision === 'exclude').map((d) => d.user_id);
    expect(excluded).toEqual(['user_004', 'user_005']);
  });

  it('warning → exit 2, partial matches flagged but nothing excluded', () => {
    const s = SCENARIOS.warning;
    const r = evaluateFlag(s.flag, s.users);
    expect(r.exit_code).toBe(EXIT_CODES.WARNING);
    expect(r.result).toBe('warning');
    expect(r.summary.warned).toBe(2);
    expect(r.summary.conflicted).toBe(0);
    expect(r.summary.passed).toBe(4);
  });
});

describe('determinism — the coherence guarantee', () => {
  it('same inputs give identical decisions and simulation_id every run', () => {
    for (const id of SCENARIO_IDS) {
      const s = SCENARIOS[id];
      const a = evaluateFlag(s.flag, s.users);
      const b = evaluateFlag(s.flag, s.users);
      expect(a.decisions).toEqual(b.decisions);
      expect(a.simulation_id).toBe(b.simulation_id);
      expect(a.exit_code).toBe(b.exit_code);
    }
  });

  it('rollout bucketing is stable per user and uniform-ish', () => {
    expect(rolloutBucket('dark-mode', 'user_001')).toBe(rolloutBucket('dark-mode', 'user_001'));
    const buckets = Array.from({ length: 1000 }, (_, i) => rolloutBucket('dark-mode', `u${i}`));
    const inQuarter = buckets.filter((b) => b < 25).length;
    expect(inQuarter).toBeGreaterThan(150); // ~250 expected; loose bounds, zero flake
    expect(inQuarter).toBeLessThan(350);
  });

  it('partial rollout excludes by bucket, deterministically', () => {
    const s = SCENARIOS['all-clear'];
    const flag = { ...s.flag, rollout_percentage: 50 };
    const a = evaluateFlag(flag, s.users);
    const b = evaluateFlag(flag, s.users);
    expect(a.summary).toEqual(b.summary);
    expect(a.summary.passed + a.summary.conflicted).toBe(s.users.length);
    for (const d of a.decisions.filter((x) => x.decision === 'exclude')) {
      expect(rolloutBucket(flag.id, d.user_id)).toBeGreaterThanOrEqual(50);
    }
  });
});

describe('edge cases', () => {
  it('disabled flag excludes everyone', () => {
    const s = SCENARIOS['all-clear'];
    const r = evaluateFlag({ ...s.flag, enabled: false }, s.users);
    expect(r.summary.conflicted).toBe(s.users.length);
    expect(r.exit_code).toBe(EXIT_CODES.CONFLICT);
    expect(r.decisions[0].reason).toMatch(/disabled/i);
  });

  it('no audience rules → rollout percentage alone decides', () => {
    const s = SCENARIOS['all-clear'];
    const r = evaluateFlag({ ...s.flag, audience_rules: [] }, s.users);
    expect(r.summary.passed).toBe(s.users.length);
    expect(r.decisions[0].matched_rules).toEqual(['rollout:percentage']);
  });

  it('every decision carries a reason and a rule source', () => {
    for (const id of SCENARIO_IDS) {
      const s = SCENARIOS[id];
      for (const d of evaluateFlag(s.flag, s.users).decisions) {
        expect(d.reason.length).toBeGreaterThan(0);
        expect(d.rule_sources[0]).toMatch(/^flags\/dark-mode\.json:\d+$/);
      }
    }
  });
});

describe('constants integrity', () => {
  it('ANSI codes are real escape sequences', () => {
    expect(COLORS.RECEIVE.ansi).toBe('\u001b[32m');
    expect(COLORS.EXCLUDE.ansi).toBe('\u001b[31m');
    expect(COLORS.PARTIAL.ansi).toBe('\u001b[33m');
  });

  it('every status carries a canonical hex for the parity test', () => {
    for (const c of Object.values(COLORS)) {
      expect(c.hex).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
