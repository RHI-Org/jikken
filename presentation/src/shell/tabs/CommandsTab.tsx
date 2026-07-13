/**
 * Commands tab — two things a viewer does to drive the demo, both moved here
 * out of the stage's top bar so the stage stays focused on the surfaces
 * themselves: choosing the shared input (Feature × Situation), and running a
 * command shortcut in the terminal.
 */
import { ArrowRight } from 'lucide-react';
import { SCENARIO_IDS, type FeatureDef, type FeatureId, type ScenarioId } from '@jikken/shared';
import { PRESET_COMMANDS } from '../cli-runtime';

// Custom chevron (native carets can't be repositioned) — drawn in the same
// muted tone as the faint text, shifted 10px left of the default edge inset.
const CARET_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%2378716c' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";

const SELECT_STYLE = {
  width: '100%',
  padding: '0.45rem 1.9rem 0.45rem 0.6rem',
  borderRadius: '0.4rem',
  border: '1px solid var(--portfolio-border)',
  background: `var(--portfolio-bg-card) url("${CARET_SVG}") no-repeat right 1.15rem center`,
  color: 'var(--portfolio-text-primary)',
  fontSize: '0.78rem',
  fontFamily: 'var(--font-mono)',
  fontWeight: 'var(--font-weight-semibold)',
  cursor: 'pointer',
  appearance: 'none' as const,
  WebkitAppearance: 'none' as const,
  MozAppearance: 'none' as const,
} as const;

const MICRO_LABEL = {
  fontSize: '0.62rem',
  fontWeight: 'var(--font-weight-bold)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--portfolio-text-faint)',
} as const;

export function CommandsTab({
  features,
  feature,
  onFeatureChange,
  scenario,
  onScenarioChange,
  onRunCommand,
}: {
  features: FeatureDef[];
  feature: FeatureId;
  onFeatureChange: (f: FeatureId) => void;
  scenario: ScenarioId | null;
  onScenarioChange: (s: ScenarioId) => void;
  onRunCommand: (command: string) => void;
}) {
  const featureDef = features.find((f) => f.id === feature) ?? features[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem' }}>
      {/* Choose your input — the shared deterministic seed every surface reads */}
      <section>
        <div style={{ ...MICRO_LABEL, color: 'var(--portfolio-text-primary)', paddingBottom: '0.2rem' }}>
          Choose your input
        </div>
        <p style={{ margin: '0.5rem 0 0.8rem', fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--portfolio-text-secondary)' }}>
          A <strong>feature</strong> is the product surface a flag gates; a{' '}
          <strong>situation</strong> is the targeting change being made to it. Pick
          both and every surface — CLI, Dashboard, SDK, CI gate — evaluates the
          exact same input.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <span style={MICRO_LABEL}>Feature</span>
            <select
              value={feature}
              onChange={(e) => onFeatureChange(e.target.value as FeatureId)}
              aria-label="Choose a feature"
              title={featureDef.description}
              style={SELECT_STYLE}
            >
              {features.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <span style={MICRO_LABEL}>Situation</span>
            <select
              value={scenario ?? ''}
              onChange={(e) => e.target.value && onScenarioChange(e.target.value as ScenarioId)}
              aria-label="Choose a situation"
              title={scenario ? featureDef.situations[scenario].description : 'Pick a situation to begin'}
              style={{ ...SELECT_STYLE, color: scenario ? 'var(--portfolio-text-primary)' : 'var(--portfolio-text-muted)' }}
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
          </label>
        </div>
      </section>

      {/* Command shortcuts — run one directly in the terminal */}
      <section>
        <div style={{ ...MICRO_LABEL, color: 'var(--portfolio-text-primary)', paddingBottom: '0.2rem' }}>
          Commands
        </div>
        <p style={{ margin: '0.5rem 0 0.8rem', fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--portfolio-text-secondary)' }}>
          Run a command in the terminal — the same engine and output as the
          installed <code style={{ fontFamily: 'var(--font-mono)' }}>jikken</code> binary.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {PRESET_COMMANDS.map((c) => (
            <button
              key={c.label}
              onClick={() => onRunCommand(c.command)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.7rem',
                textAlign: 'left',
                padding: '0.65rem 0.7rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--portfolio-border)',
                background: 'var(--portfolio-bg-card)',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.76rem',
                  color: 'var(--portfolio-text-primary)',
                  lineHeight: 1.3,
                  wordBreak: 'break-word',
                }}
              >
                {c.label}
              </span>
              <ArrowRight size={14} style={{ flexShrink: 0, color: 'var(--portfolio-text-faint)' }} />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
