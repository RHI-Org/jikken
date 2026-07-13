/**
 * Right stage — the live demo. Top bar is just the CLI / Dashboard / SDK /
 * CI gate surface switcher; choosing the shared Feature × Situation input
 * lives in the notes panel's Commands tab instead, alongside an explanation
 * of what the two menus mean. Below: the active surface renders real and
 * interactive, with a numbered pin overlay when a principle is selected from
 * the notes panel.
 */
import { CliSurface, type CliInject } from './surfaces/CliSurface';
import { SdkSurface } from './surfaces/SdkSurface';
import { DashboardSurface } from './surfaces/DashboardSurface';
import { CiSurface } from './surfaces/CiSurface';
import type { FeatureDef, FeatureId, ScenarioId, SimulationResult } from '@jikken/shared';
import type { Surface, Principle } from './types';

const SURFACES: { id: Surface; label: string }[] = [
  { id: 'cli', label: 'CLI' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'sdk', label: 'SDK' },
  { id: 'ci', label: 'CI gate' },
];

export function Stage({
  surface,
  onSurfaceChange,
  features,
  feature,
  scenario,
  cliInject,
  onCliResult,
  activePrinciple,
}: {
  surface: Surface;
  onSurfaceChange: (s: Surface) => void;
  features: FeatureDef[];
  feature: FeatureId;
  scenario: ScenarioId | null;
  cliInject: CliInject | null;
  onCliResult: (r: SimulationResult, scenario: string | null) => void;
  activePrinciple: Principle | null;
}) {
  const showPin = activePrinciple !== null && activePrinciple.surface === surface;
  // The selected feature drives each surface's situation lookup, since each
  // feature frames the same three archetypes in its own domain language.
  const featureDef = features.find((f) => f.id === feature) ?? features[0];

  return (
    <div style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--portfolio-page-bg)' }}>
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '1rem',
          padding: '0.7rem 1.1rem',
          borderBottom: '1px solid var(--portfolio-border)',
          background: 'var(--portfolio-bg-muted)',
          flexWrap: 'wrap',
        }}
      >
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
        {surface === 'ci' && (
          <div style={{ position: 'absolute', inset: 0 }}>
            {scenario === null ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--portfolio-text-faint)', fontSize: '0.85rem' }}>
                Pick a situation to begin
              </div>
            ) : (
              <CiSurface scenario={featureDef.situations[scenario]} />
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
