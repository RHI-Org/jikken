/**
 * Commands tab — two things a viewer does to drive the demo, both moved here
 * out of the stage's top bar so the stage stays focused on the surfaces
 * themselves: choosing the shared input (Feature × Situation), and running a
 * command shortcut in the terminal.
 */
import { useState } from 'react';
import { ArrowRight, Check, Copy, Info } from 'lucide-react';
import { SCENARIO_IDS, SCENARIO_NAMES, type FeatureDef, type FeatureId, type ScenarioId } from '@jikken/shared';
import { PRESET_COMMANDS } from '../cli-runtime';

const COMMAND_GROUPS = [
  { id: 'workflow', label: 'Workflow' },
  { id: 'output', label: 'Output' },
  { id: 'guidance', label: 'Help & errors' },
] as const;

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

function InfoTip({ label, text }: { label: string; text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        style={{ display: 'grid', placeItems: 'center', width: '1.35rem', height: '1.35rem', padding: 0, border: 0, borderRadius: '999px', background: 'transparent', color: 'var(--portfolio-text-muted)', cursor: 'help' }}
      >
        <Info size={12} aria-hidden="true" />
      </button>
      {open && (
        <span role="tooltip" style={{ position: 'absolute', right: 0, bottom: 'calc(100% + 0.45rem)', zIndex: 30, width: '15rem', padding: '0.55rem 0.65rem', borderRadius: '0.4rem', background: 'var(--portfolio-text-primary)', color: 'var(--portfolio-btn-text)', boxShadow: '0 8px 24px rgba(28,25,23,0.2)', fontSize: '0.7rem', fontWeight: 'var(--font-weight-regular)', lineHeight: 1.45, letterSpacing: 0, textTransform: 'none' }}>
          {text}
        </span>
      )}
    </span>
  );
}

function CopyButton({ label, text, disabled = false }: { label: string; text: string; disabled?: boolean }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (disabled) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <button
      type="button"
      aria-label={copied ? 'Copied to clipboard' : label}
      title={copied ? 'Copied' : label}
      disabled={disabled}
      onClick={copy}
      style={{ display: 'grid', placeItems: 'center', width: '1.35rem', height: '1.35rem', flexShrink: 0, padding: 0, border: 0, background: 'transparent', color: copied ? 'var(--portfolio-text-primary)' : 'var(--portfolio-text-muted)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.35 : 1 }}
    >
      {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
    </button>
  );
}

export function CommandsTab({
  features,
  feature,
  onFeatureChange,
  scenario,
  onScenarioChange,
  onRunCommand,
}: {
  features: FeatureDef[];
  feature: FeatureId | null;
  onFeatureChange: (f: FeatureId) => void;
  scenario: ScenarioId | null;
  onScenarioChange: (s: ScenarioId) => void;
  onRunCommand: (command: string) => void;
}) {
  const featureDef = features.find((f) => f.id === feature) ?? features[0];
  const scenarioMap = SCENARIO_IDS.map(
    (id) => `${SCENARIO_NAMES[id]} (--scenario ${id})`,
  ).join('; ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem' }}>
      {/* Choose your input — the shared deterministic seed every surface reads */}
      <section>
        <div style={{ ...MICRO_LABEL, color: 'var(--portfolio-text-primary)', paddingBottom: '0.2rem' }}>
          Choose your input
        </div>
        <p style={{ margin: '0.5rem 0 0.8rem', fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--portfolio-text-secondary)' }}>
          A <strong>feature</strong> is the product surface a flag gates; a{' '}
          <strong>scenario</strong> is the targeting change being made to it. Pick
          both and every surface — CLI, Dashboard, SDK, CI gate — evaluates the
          exact same input.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label htmlFor="feature-menu" style={MICRO_LABEL}>Feature</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <select
                id="feature-menu"
                data-tutorial="feature-select"
                value={feature ?? ''}
                onChange={(e) => e.target.value && onFeatureChange(e.target.value as FeatureId)}
                aria-label="Choose a feature"
                title={featureDef.description}
                style={{ ...SELECT_STYLE, minWidth: 0, flex: 1 }}
              >
                <option value="" disabled>Pick a feature…</option>
                {features.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
              <CopyButton label="Copy feature simulation command" text={feature ? `jikken simulate --flag ${feature}` : ''} disabled={!feature} />
              <InfoTip label="About the Feature menu" text="Choose the product capability controlled by the flag. Each feature carries its own audience attributes and scenarios." />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label htmlFor="scenario-menu" style={MICRO_LABEL}>Scenario</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <select
                id="scenario-menu"
                data-tutorial="scenario-select"
                value={scenario ?? ''}
                onChange={(e) => e.target.value && onScenarioChange(e.target.value as ScenarioId)}
                disabled={!feature}
                aria-label="Choose a scenario"
                title={scenario ? featureDef.situations[scenario].description : 'Pick a scenario to begin'}
                style={{ ...SELECT_STYLE, minWidth: 0, flex: 1, color: scenario ? 'var(--portfolio-text-primary)' : 'var(--portfolio-text-muted)', cursor: feature ? 'pointer' : 'not-allowed', opacity: feature ? 1 : 0.65 }}
              >
                <option value="" disabled>
                  Pick a scenario…
                </option>
                {SCENARIO_IDS.map((id) => (
                  <option key={id} value={id}>
                    {SCENARIO_NAMES[id]}
                  </option>
                ))}
              </select>
              <CopyButton label="Copy scenario simulation command" text={feature && scenario ? `jikken simulate --feature ${feature} --scenario ${scenario}` : ''} disabled={!feature || !scenario} />
              <InfoTip label="About the Scenario menu" text={`Choose the proposed targeting change to evaluate. Menu names map directly to CLI values: ${scenarioMap}.`} />
            </div>
          </div>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {COMMAND_GROUPS.map((group) => (
            <div key={group.id}>
              <div style={{ ...MICRO_LABEL, marginBottom: '0.4rem' }}>{group.label}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {PRESET_COMMANDS.filter((command) => command.group === group.id).map((c) => (
                  <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ minWidth: 0, flex: 1, padding: '0.25rem 0.35rem 0.25rem 0.7rem', borderRadius: '0.5rem', border: '1px solid var(--portfolio-border)', background: 'var(--portfolio-bg-card)' }}>
                      <button
                        data-tutorial={c.command.includes('diff') && c.command.includes('conflict') ? 'run-conflict-command' : undefined}
                        onClick={() => onRunCommand(c.command)}
                        style={{ width: '100%', minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.7rem', padding: '0.4rem 0', border: 0, background: 'none', cursor: 'pointer', textAlign: 'left' }}
                      >
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--portfolio-text-primary)', lineHeight: 1.3, wordBreak: 'break-word' }}>
                          {c.label}
                        </span>
                        <ArrowRight size={14} style={{ flexShrink: 0, color: 'var(--portfolio-text-faint)' }} />
                      </button>
                    </div>
                    <CopyButton label={`Copy ${c.label} command`} text={c.command} />
                    <InfoTip label={`About ${c.label}`} text={c.description} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
