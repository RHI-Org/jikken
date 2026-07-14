/**
 * Right stage — the live demo. Top bar is just the CLI / Dashboard / SDK /
 * CI gate surface switcher; choosing the shared Feature × Situation input
 * lives in the notes panel's Commands tab instead, alongside an explanation
 * of what the two menus mean. Below: the active surface renders real and
 * interactive, with a numbered pin overlay when a principle is selected from
 * the notes panel.
 */
import { useState } from 'react';
import { LogOut, PanelLeftOpen } from 'lucide-react';
import { SCENARIO_IDS, SCENARIO_NAMES, type FeatureDef, type FeatureId, type ScenarioId, type SimulationResult } from '@jikken/shared';
import { CliSurface, type CliInject } from './surfaces/CliSurface';
import { SdkSurface } from './surfaces/SdkSurface';
import { DashboardSurface } from './surfaces/DashboardSurface';
import { CiSurface } from './surfaces/CiSurface';
import { RunContextBar } from './RunContextBar';
import type { RunProvenance, RunRecord } from './run-context';
import type { Surface, Principle } from './types';
import { useAuth } from '@/contexts/AuthContext';

const SURFACES: { id: Surface; label: string }[] = [
  { id: 'cli', label: 'CLI' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'sdk', label: 'SDK' },
  { id: 'ci', label: 'CI gate' },
];

const MICRO_LABEL = {
  fontSize: '0.62rem',
  fontWeight: 'var(--font-weight-bold)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--portfolio-text-faint)',
} as const;

// Empty state for surfaces that need a situation before they render anything —
// the picker itself lives here (feature select + situation chips), so there's
// no click-through to another tab to get started.
function NoSituationYet({
  features,
  feature,
  featureDef,
  onFeatureChange,
  onScenarioChange,
}: {
  features: FeatureDef[];
  feature: FeatureId | null;
  featureDef: FeatureDef;
  onFeatureChange: (f: FeatureId) => void;
  onScenarioChange: (s: ScenarioId) => void;
}) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.1rem', padding: '2rem' }}>
      <span style={{ color: 'var(--portfolio-text-muted)', fontSize: '0.85rem' }}>Pick a feature and scenario to begin</span>

      <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
        <span style={MICRO_LABEL}>Feature</span>
        <select
          value={feature ?? ''}
          onChange={(e) => e.target.value && onFeatureChange(e.target.value as FeatureId)}
          aria-label="Choose a feature"
          style={{
            padding: '0.4rem 0.6rem',
            borderRadius: '0.4rem',
            border: '1px solid var(--portfolio-border)',
            background: 'var(--portfolio-bg-card)',
            color: 'var(--portfolio-text-primary)',
            fontSize: '0.78rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 'var(--font-weight-semibold)',
            cursor: 'pointer',
          }}
        >
          <option value="" disabled>Pick a feature…</option>
          {features.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
      </label>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <span style={MICRO_LABEL}>Scenario</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem', maxWidth: '26rem' }}>
          {SCENARIO_IDS.map((id) => (
            <button
              key={id}
              disabled={!feature}
              onClick={() => onScenarioChange(id)}
              title={featureDef.situations[id].description}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: '999px',
                border: '1px solid var(--portfolio-border)',
                background: 'var(--portfolio-bg-card)',
                color: 'var(--portfolio-text-primary)',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: feature ? 'pointer' : 'not-allowed',
                opacity: feature ? 1 : 0.5,
              }}
            >
              {SCENARIO_NAMES[id]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Stage({
  surface,
  onSurfaceChange,
  features,
  feature,
  onFeatureChange,
  scenario,
  onScenarioChange,
  cliInject,
  onCliResult,
  onSurfaceResult,
  run,
  activePrinciple,
  panelOpen,
  onOpenPanel,
  tutorialCompleted,
  onStartTutorial,
}: {
  surface: Surface;
  onSurfaceChange: (s: Surface) => void;
  features: FeatureDef[];
  feature: FeatureId | null;
  onFeatureChange: (f: FeatureId) => void;
  scenario: ScenarioId | null;
  onScenarioChange: (s: ScenarioId) => void;
  cliInject: CliInject | null;
  onCliResult: (r: SimulationResult, scenario: ScenarioId | null) => void;
  onSurfaceResult: (r: SimulationResult, provenance: RunProvenance) => void;
  run: RunRecord | null;
  activePrinciple: Principle | null;
  panelOpen: boolean;
  onOpenPanel: () => void;
  tutorialCompleted: boolean;
  onStartTutorial: () => void;
}) {
  const { signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const showPin = activePrinciple !== null && activePrinciple.surface === surface;
  // The selected feature drives each surface's situation lookup, since each
  // feature frames the same three archetypes in its own domain language.
  const featureDef = features.find((f) => f.id === feature) ?? features[0];

  return (
    <div className="jk-stage" style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--portfolio-page-bg)' }}>
      {/* Top bar */}
      <div
        className="jk-stage-topbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '0.7rem 1.1rem',
          borderBottom: '1px solid var(--portfolio-border)',
          background: 'var(--portfolio-bg-muted)',
          flexWrap: 'wrap',
        }}
      >
        <div className="jk-stage-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
          {!panelOpen && (
            <button
              onClick={onOpenPanel}
              aria-label="Open project notes"
              title="Project notes"
              style={{
                display: 'flex',
                padding: '0.3rem',
                border: '1px solid var(--portfolio-border)',
                borderRadius: '0.35rem',
                background: 'var(--portfolio-bg-card)',
                color: 'var(--portfolio-text-secondary)',
                cursor: 'pointer',
              }}
            >
              <PanelLeftOpen size={14} />
            </button>
          )}
          <span
            style={{
              fontSize: '0.62rem',
              fontWeight: 'var(--font-weight-bold)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--portfolio-text-faint)',
            }}
          >
            Product Demo
          </span>
          {tutorialCompleted && (
            <button
              type="button"
              onClick={onStartTutorial}
              style={{ padding: 0, border: 0, background: 'none', color: 'var(--portfolio-text-muted)', cursor: 'pointer', fontSize: '0.68rem', textDecoration: 'underline' }}
            >
              Replay walkthrough
            </button>
          )}
        </div>

        {/* Surface switcher */}
        <div className="jk-stage-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {SURFACES.map((s) => {
            const active = s.id === surface;
            return (
              <button
                key={s.id}
                data-tutorial={`surface-${s.id}`}
                onClick={() => onSurfaceChange(s.id)}
                style={{
                  padding: '0.25rem 0',
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${active ? 'var(--portfolio-text-primary)' : 'transparent'}`,
                  fontSize: '0.82rem',
                  fontWeight: active ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                  color: active ? 'var(--portfolio-text-primary)' : 'var(--portfolio-text-faint)',
                  cursor: 'pointer',
                }}
              >
                {s.label}
              </button>
            );
          })}
          <span className="jk-stage-divider" aria-hidden="true" style={{ width: 1, height: '1.1rem', background: 'var(--portfolio-border)' }} />
          <button
            type="button"
            disabled={signingOut}
            onClick={async () => {
              setSigningOut(true);
              try {
                await signOut();
              } finally {
                setSigningOut(false);
              }
            }}
            aria-label="Log out of demo"
            title="Log out of demo"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0', border: 0, background: 'none', color: 'var(--portfolio-text-muted)', cursor: signingOut ? 'default' : 'pointer', fontSize: '0.75rem', fontWeight: 'var(--font-weight-medium)', opacity: signingOut ? 0.6 : 1 }}
          >
            <LogOut size={13} />
            <span className="jk-logout-label">{signingOut ? 'Logging out…' : 'Log out of demo'}</span>
          </button>
        </div>
      </div>

      <RunContextBar
        features={features}
        feature={feature}
        scenario={scenario}
        run={run}
      />

      {/* Surface stage (pin overlay lives here) */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {/* Keep the CLI mounted across surface switches so terminal history and
            the injected hand-off run aren't lost; just hide it. */}
        <div style={{ position: 'absolute', inset: 0, display: surface === 'cli' ? 'block' : 'none' }}>
          <CliSurface inject={cliInject} onResult={onCliResult} />
        </div>
        {surface === 'dashboard' && (
          <div style={{ position: 'absolute', inset: 0 }}>
            <DashboardSurface />
          </div>
        )}
        {surface === 'sdk' && (
          <div style={{ position: 'absolute', inset: 0 }}>
            {feature === null || scenario === null ? (
              <NoSituationYet
                features={features}
                feature={feature}
                featureDef={featureDef}
                onFeatureChange={onFeatureChange}
                onScenarioChange={onScenarioChange}
              />
            ) : (
              <SdkSurface
                scenario={featureDef.situations[scenario]}
                onResult={onSurfaceResult}
              />
            )}
          </div>
        )}
        {surface === 'ci' && (
          <div style={{ position: 'absolute', inset: 0 }}>
            {feature === null || scenario === null ? (
              <NoSituationYet
                features={features}
                feature={feature}
                featureDef={featureDef}
                onFeatureChange={onFeatureChange}
                onScenarioChange={onScenarioChange}
              />
            ) : (
              <CiSurface
                scenario={featureDef.situations[scenario]}
                onResult={(result) => onSurfaceResult(result, 'local-replay')}
              />
            )}
          </div>
        )}

        {showPin && activePrinciple && (
          <div
            style={{
              position: 'absolute',
              left: `${activePrinciple.pin.x}%`,
              top: `${activePrinciple.pin.y}%`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              zIndex: 20,
            }}
          >
            <span className="jk-pin-pulse" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '1.7rem',
              height: '1.7rem',
              borderRadius: '999px',
              background: 'var(--portfolio-text-primary)',
              color: '#fff',
              fontSize: '0.78rem',
              fontWeight: 'var(--font-weight-bold)',
              boxShadow: '0 0 0 4px rgba(28,25,23,0.18)',
            }}>
              {activePrinciple.number}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
