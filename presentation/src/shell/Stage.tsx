/**
 * Right stage — the live demo. Top bar: scenario picker (sets the engine seed
 * so all surfaces reflect the same deterministic run) + restart, and the
 * CLI / Dashboard / SDK surface switcher. Below: the active surface renders
 * real and interactive, with a numbered pin overlay when a principle is
 * selected from the notes panel.
 */
import { RotateCw } from 'lucide-react';
import { SCENARIOS, SCENARIO_IDS, type ScenarioId, type SimulationResult } from '@jikken/shared';
import { CliSurface, type CliInject } from './surfaces/CliSurface';
import { SdkSurface } from './surfaces/SdkSurface';
import { DashboardSurface } from './surfaces/DashboardSurface';
import type { Surface, Principle } from './types';

const SURFACES: { id: Surface; label: string }[] = [
  { id: 'cli', label: 'CLI' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'sdk', label: 'SDK' },
];

// Shared chip base — the single visual family for the Situation row (here) and
// the "Try a command" run row (CliSurface). Situation chips are sticky (the
// active one is filled); the run-row chips reuse the same base but are momentary.
const CHIP_BASE = {
  padding: '0.3rem 0.7rem',
  borderRadius: '999px',
  border: '1px solid var(--portfolio-border)',
  fontSize: '0.72rem',
  fontFamily: 'var(--font-mono)',
  lineHeight: 1.2,
  cursor: 'pointer',
} as const;

// Reused micro-label pattern (matches CliSurface's "Try a command").
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
  scenario,
  onScenarioChange,
  onRestart,
  cliInject,
  onCliResult,
  activePrinciple,
  restartNonce,
}: {
  surface: Surface;
  onSurfaceChange: (s: Surface) => void;
  scenario: ScenarioId | null;
  onScenarioChange: (s: ScenarioId) => void;
  onRestart: () => void;
  cliInject: CliInject | null;
  onCliResult: (r: SimulationResult, scenario: string | null) => void;
  activePrinciple: Principle | null;
  restartNonce: number;
}) {
  const showPin = activePrinciple !== null && activePrinciple.surface === surface;

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
          background: 'var(--portfolio-bg-card)',
          flexWrap: 'wrap',
        }}
      >
        {/* Situation row — sticky/selectable chips (one per scenario) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span
            title="The shared situation. Sets the same deterministic input for the CLI, Dashboard, and SDK at once."
            style={{ ...MICRO_LABEL, cursor: 'help' }}
          >
            Situation
          </span>
          {SCENARIO_IDS.map((id) => {
            const active = id === scenario;
            return (
              <button
                key={id}
                onClick={() => onScenarioChange(id)}
                title={SCENARIOS[id].description}
                style={{
                  ...CHIP_BASE,
                  background: active ? 'var(--portfolio-text-primary)' : 'transparent',
                  color: active ? '#fff' : 'var(--portfolio-text-secondary)',
                  borderColor: active ? 'var(--portfolio-text-primary)' : 'var(--portfolio-border)',
                  fontWeight: active ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                }}
              >
                {SCENARIOS[id].label}
              </button>
            );
          })}
          <span style={{ fontSize: '0.7rem', color: 'var(--portfolio-text-muted)', marginLeft: '0.15rem' }}>
            Feature: {SCENARIOS[SCENARIO_IDS[0]].feature}
          </span>
          {scenario === null && (
            <span style={{ fontSize: '0.7rem', color: 'var(--portfolio-text-faint)', fontStyle: 'italic' }}>
              Pick a situation to begin
            </span>
          )}
          <button
            onClick={onRestart}
            disabled={scenario === null}
            aria-label="Replay the current surface"
            title={scenario === null ? 'Pick a situation first' : 'Replay this surface'}
            style={{
              display: 'flex',
              padding: '0.35rem',
              borderRadius: '0.4rem',
              border: '1px solid var(--portfolio-border)',
              background: 'transparent',
              color: 'var(--portfolio-text-muted)',
              cursor: scenario === null ? 'not-allowed' : 'pointer',
              opacity: scenario === null ? 0.4 : 1,
            }}
          >
            <RotateCw size={13} />
          </button>
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
            <DashboardSurface key={restartNonce} />
          </div>
        )}
        {surface === 'sdk' && (
          <div style={{ position: 'absolute', inset: 0 }}>
            {scenario === null ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--portfolio-text-faint)', fontSize: '0.85rem' }}>
                Pick a situation to begin
              </div>
            ) : (
              <SdkSurface key={restartNonce} scenario={scenario} />
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
