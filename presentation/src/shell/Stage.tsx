/**
 * Right stage — the live demo. Top bar: a fixed feature chip + a situation
 * dropdown (sets the same deterministic input across every surface), and the
 * CLI / Dashboard / SDK surface switcher. Below: the active surface renders
 * real and interactive, with a numbered pin overlay when a principle is
 * selected from the notes panel.
 */
import { FEATURES, SCENARIO_IDS, type FeatureId, type ScenarioId, type SimulationResult } from '@jikken/shared';
import { CliSurface, type CliInject } from './surfaces/CliSurface';
import { SdkSurface } from './surfaces/SdkSurface';
import { DashboardSurface } from './surfaces/DashboardSurface';
import type { Surface, Principle } from './types';

const SURFACES: { id: Surface; label: string }[] = [
  { id: 'cli', label: 'CLI' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'sdk', label: 'SDK' },
];

// Reused micro-label pattern (matches CliSurface's "Quickstart" label).
const MICRO_LABEL = {
  fontSize: '0.62rem',
  fontWeight: 'var(--font-weight-bold)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--portfolio-text-faint)',
} as const;

export function Stage({
  surface,
  onSurfaceChange,
  feature,
  onFeatureChange,
  scenario,
  onScenarioChange,
  cliInject,
  onCliResult,
  activePrinciple,
}: {
  surface: Surface;
  onSurfaceChange: (s: Surface) => void;
  feature: FeatureId;
  onFeatureChange: (f: FeatureId) => void;
  scenario: ScenarioId | null;
  onScenarioChange: (s: ScenarioId) => void;
  cliInject: CliInject | null;
  onCliResult: (r: SimulationResult, scenario: string | null) => void;
  activePrinciple: Principle | null;
}) {
  const showPin = activePrinciple !== null && activePrinciple.surface === surface;
  // The selected feature drives the Situation menu's labels/descriptions, since
  // each feature frames the same three archetypes in its own domain language.
  const featureDef = FEATURES.find((f) => f.id === feature) ?? FEATURES[0];

  return (
    <div style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--portfolio-page-bg)' }}>
      {/* Top bar */}
      <div
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
        {/* Situation controls — the feature is fixed (a permanent, selected-looking
            chip); the situation is a compact dropdown so the bar doesn't crowd. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          {/* Feature — dropdown selector (the product surface the flag gates) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span
              title="The product surface the flag gates. Each feature targets on different attributes — identity, plan, or demographics."
              style={{ ...MICRO_LABEL, cursor: 'help' }}
            >
              Feature
            </span>
            <select
              value={feature}
              onChange={(e) => onFeatureChange(e.target.value as FeatureId)}
              aria-label="Choose a feature"
              title={featureDef.description}
              style={{
                padding: '0.32rem 0.55rem',
                borderRadius: '0.4rem',
                border: '1px solid var(--portfolio-border)',
                background: 'var(--portfolio-bg-card)',
                color: 'var(--portfolio-text-primary)',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
              }}
            >
              {FEATURES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Situation — dropdown selector (placeholder shows until one is picked) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span
              title="The shared situation. Sets the same deterministic input for the CLI, Dashboard, and SDK at once."
              style={{ ...MICRO_LABEL, cursor: 'help' }}
            >
              Situation
            </span>
            <select
              value={scenario ?? ''}
              onChange={(e) => e.target.value && onScenarioChange(e.target.value as ScenarioId)}
              aria-label="Choose a situation"
              title={scenario ? featureDef.situations[scenario].description : 'Pick a situation to begin'}
              style={{
                padding: '0.32rem 0.55rem',
                borderRadius: '0.4rem',
                border: '1px solid var(--portfolio-border)',
                background: 'var(--portfolio-bg-card)',
                color: scenario ? 'var(--portfolio-text-primary)' : 'var(--portfolio-text-muted)',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: scenario ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                cursor: 'pointer',
              }}
            >
              <option value="" disabled>
                Pick a situation…
              </option>
              {SCENARIO_IDS.map((id) => (
                <option key={id} value={id}>
                  {featureDef.situations[id].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Surface switcher */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          {SURFACES.map((s) => {
            const active = s.id === surface;
            return (
              <button
                key={s.id}
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
        </div>
      </div>

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
            {scenario === null ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--portfolio-text-faint)', fontSize: '0.85rem' }}>
                Pick a situation to begin
              </div>
            ) : (
              <SdkSurface scenario={scenario} />
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
