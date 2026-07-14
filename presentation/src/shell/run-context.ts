import type { Environment, FeatureId, ScenarioId, SimulationResult } from '@jikken/shared';

export type RunProvenance = 'local-replay' | 'live-persisted';

export interface RunRecord {
  environment: Environment;
  feature: FeatureId;
  provenance: RunProvenance;
  result: SimulationResult;
  scenario: ScenarioId | null;
}

export function runMatchesSelection(
  run: RunRecord | null,
  feature: FeatureId | null,
  scenario: ScenarioId | null,
): run is RunRecord {
  return run !== null && run.feature === feature && run.scenario === scenario;
}

export function dashboardHistoryUrl(baseUrl: string, simulationId: string): string {
  const fallbackOrigin = typeof window === 'undefined' ? 'http://localhost/' : window.location.href;
  const url = new URL(baseUrl, fallbackOrigin);
  const basePath = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
  url.pathname = `${basePath}flags/history`.replace(/\/+/g, '/');
  url.search = '';
  url.searchParams.set('simulation', simulationId);
  url.hash = '';
  return url.toString();
}
