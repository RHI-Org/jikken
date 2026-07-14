import { useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import {
  COLORS,
  SCENARIO_NAMES,
  type FeatureDef,
  type FeatureId,
  type ScenarioId,
} from '@jikken/shared';
import { dashboardHistoryUrl, runMatchesSelection, type RunRecord } from './run-context';

const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:8091/';

const LABEL_STYLE = {
  color: 'var(--portfolio-text-faint)',
  fontSize: '0.58rem',
  fontWeight: 'var(--font-weight-bold)',
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
} as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span style={{ alignItems: 'baseline', display: 'inline-flex', gap: '0.35rem', minWidth: 0 }}>
      <span style={LABEL_STYLE}>{label}</span>
      <span style={{ color: 'var(--portfolio-text-secondary)', fontSize: '0.7rem', fontWeight: 'var(--font-weight-semibold)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {children}
      </span>
    </span>
  );
}

export function RunContextBar({
  features,
  feature,
  scenario,
  run,
}: {
  features: FeatureDef[];
  feature: FeatureId | null;
  scenario: ScenarioId | null;
  run: RunRecord | null;
}) {
  const [copied, setCopied] = useState(false);
  const featureDef = features.find((candidate) => candidate.id === feature);
  const selectedScenario = featureDef && scenario ? featureDef.situations[scenario] : null;
  const currentRun = runMatchesSelection(run, feature, scenario) ? run : null;
  const result = currentRun?.result;
  const verdictColor = result?.result === 'all_clear'
    ? COLORS.RECEIVE.hex
    : result?.result === 'warning'
      ? COLORS.PARTIAL.hex
      : result?.result === 'conflict'
        ? COLORS.EXCLUDE.hex
        : 'var(--portfolio-text-faint)';
  const provenance = currentRun?.provenance === 'live-persisted'
    ? 'Live persisted run'
    : currentRun
      ? 'Deterministic local replay'
      : feature && scenario
        ? 'Selection ready · not run'
        : 'Choose feature + scenario';

  const copySimulationId = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.simulation_id);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div
      aria-label="Current run context"
      style={{ alignItems: 'center', background: 'var(--portfolio-bg-card)', borderBottom: '1px solid var(--portfolio-border-muted)', display: 'flex', flexWrap: 'wrap', gap: '0.55rem 1rem', minHeight: '2.25rem', padding: '0.38rem 1.1rem' }}
    >
      <Field label="Feature">{featureDef?.label ?? '—'}</Field>
      <Field label="Scenario">{scenario ? SCENARIO_NAMES[scenario] : '—'}</Field>
      <Field label="Environment">{selectedScenario?.flag.environment ?? '—'}</Field>
      <Field label="Verdict">
        <span style={{ color: verdictColor, textTransform: 'uppercase' }}>
          {result ? result.result.replace('_', ' ') : 'Not run'}
        </span>
      </Field>
      <span style={{ border: '1px solid var(--portfolio-border)', borderRadius: '999px', color: currentRun?.provenance === 'live-persisted' ? COLORS.RECEIVE.text : 'var(--portfolio-text-muted)', fontSize: '0.62rem', fontWeight: 'var(--font-weight-semibold)', padding: '0.18rem 0.5rem' }}>
        {provenance}
      </span>
      {result && (
        <span style={{ alignItems: 'center', display: 'inline-flex', gap: '0.3rem', marginLeft: 'auto', minWidth: 0 }}>
          <span style={LABEL_STYLE}>Simulation</span>
          {currentRun.provenance === 'live-persisted' ? (
            <a
              href={dashboardHistoryUrl(DASHBOARD_URL, result.simulation_id)}
              target="_blank"
              rel="noopener noreferrer"
              title="Open this persisted run in Dashboard History"
              style={{ alignItems: 'center', color: 'var(--portfolio-text-secondary)', display: 'inline-flex', fontFamily: 'var(--font-mono)', fontSize: '0.67rem', gap: '0.2rem', maxWidth: '13rem', textDecoration: 'underline' }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.simulation_id}</span>
              <ExternalLink aria-hidden="true" size={11} />
            </a>
          ) : (
            <span title="Local replay ID (not stored in Dashboard History)" style={{ color: 'var(--portfolio-text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.67rem', maxWidth: '13rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {result.simulation_id}
            </span>
          )}
          <button
            type="button"
            aria-label={copied ? 'Simulation ID copied' : 'Copy simulation ID'}
            onClick={() => void copySimulationId()}
            style={{ alignItems: 'center', background: 'none', border: 0, color: 'var(--portfolio-text-muted)', cursor: 'pointer', display: 'inline-flex', padding: 2 }}
          >
            {copied ? <Check aria-hidden="true" size={12} /> : <Copy aria-hidden="true" size={12} />}
          </button>
        </span>
      )}
    </div>
  );
}
