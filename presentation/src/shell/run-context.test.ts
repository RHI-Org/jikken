import { describe, expect, it } from 'vitest';
import type { RunRecord } from './run-context';
import { dashboardHistoryUrl, runMatchesSelection } from './run-context';

const run = {
  feature: 'dark-mode',
  scenario: 'conflict',
} as RunRecord;

describe('run context helpers', () => {
  it('only presents a verdict for the currently selected input', () => {
    expect(runMatchesSelection(run, 'dark-mode', 'conflict')).toBe(true);
    expect(runMatchesSelection(run, 'dark-mode', 'warning')).toBe(false);
    expect(runMatchesSelection(run, 'checkout-redesign', 'conflict')).toBe(false);
    expect(runMatchesSelection(null, 'dark-mode', 'conflict')).toBe(false);
  });

  it('builds a Dashboard History deep link without retaining stale URL state', () => {
    expect(dashboardHistoryUrl('https://demo.example/dashboard/?old=1#x', 'sim_123')).toBe(
      'https://demo.example/dashboard/flags/history?simulation=sim_123',
    );
  });
});
