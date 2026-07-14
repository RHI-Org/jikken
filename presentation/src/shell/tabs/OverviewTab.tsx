/**
 * Overview tab — a concise operating guide for the live application.
 */
import { INTRO, PRODUCT_SECTIONS, HOWTO } from '../data/overview';
import { ArrowRight, FlaskConical, Play } from 'lucide-react';

const microLabel: React.CSSProperties = {
  fontSize: '0.65rem',
  fontWeight: 'var(--font-weight-bold)',
  letterSpacing: '0.08em',
  color: 'var(--portfolio-text-faint)',
  textTransform: 'uppercase',
};

export function OverviewTab({
  onStartTutorial,
  onOpenCommands,
}: {
  onStartTutorial: () => void;
  onOpenCommands: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      <div>
        <div style={microLabel}>WHAT IT IS</div>
        <p style={{ margin: '0.55rem 0 0', fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--portfolio-text-primary)' }}>
          {INTRO}
        </p>
      </div>

      <section aria-labelledby="first-run-heading" style={{ padding: '1rem', border: '1px solid #bfdbfe', borderRadius: '0.65rem', background: '#eff6ff', boxShadow: '0 1px 3px rgba(37, 99, 235, 0.12)' }}>
        <div style={{ ...microLabel, color: '#1d4ed8' }}>Recommended first run</div>
        <div id="first-run-heading" style={{ marginTop: '0.35rem', fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: 'var(--font-weight-semibold)', color: 'var(--portfolio-text-primary)' }}>
          Follow one risky change end to end
        </div>
        <p style={{ margin: '0.35rem 0 0.8rem', fontSize: '0.78rem', lineHeight: 1.55, color: 'var(--portfolio-text-secondary)' }}>
          The guided path connects the CLI, Dashboard, SDK, and CI gate in about 90 seconds.
        </p>
        <button
          type="button"
          onClick={onStartTutorial}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', padding: '0.72rem 0.9rem', border: 0, borderRadius: '0.45rem', background: '#2563eb', boxShadow: '0 1px 2px rgba(37, 99, 235, 0.3)', color: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 'var(--font-weight-semibold)' }}
        >
          <Play size={14} fill="currentColor" />
          Start guided walkthrough
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: '16px 1fr', gap: '0.45rem', marginTop: '0.7rem', color: '#1e40af', fontSize: '0.68rem', lineHeight: 1.45 }}>
          <FlaskConical size={14} aria-hidden="true" style={{ marginTop: 1 }} />
          <span><strong>Research note:</strong> This walkthrough came from AI-simulated synthetic UX research. It demonstrates iteration on synthetic data and hypotheses—not real-user validation.</span>
        </div>
      </section>

      <button
        type="button"
        onClick={onOpenCommands}
        style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: 0, border: 0, background: 'none', color: 'var(--portfolio-text-muted)', cursor: 'pointer', fontSize: '0.74rem', textDecoration: 'underline', textUnderlineOffset: 3 }}
      >
        Explore freely instead
        <ArrowRight size={12} aria-hidden="true" />
      </button>

      {PRODUCT_SECTIONS.map((section) => (
        <div key={section.label} style={{ borderTop: '1px solid var(--portfolio-border-muted)', paddingTop: '0.85rem' }}>
          <div style={microLabel}>{section.label}</div>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.82rem', lineHeight: 1.65, color: 'var(--portfolio-text-secondary)' }}>
            {section.body}
          </p>
        </div>
      ))}

      <div style={{ borderTop: '1px solid var(--portfolio-border-muted)', paddingTop: '0.85rem' }}>
        <div style={{ ...microLabel, marginBottom: '0.85rem' }}>OPTIONAL · FREE EXPLORATION</div>
        <ol style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', margin: 0, padding: 0, listStyle: 'none' }}>
        {HOWTO.map((step, index) => (
          <li key={step.title} style={{ display: 'grid', gridTemplateColumns: '1.45rem 1fr', gap: '0.65rem' }}>
            <span
              style={{
                display: 'grid',
                placeItems: 'center',
                width: '1.45rem',
                height: '1.45rem',
                borderRadius: '999px',
                background: 'var(--portfolio-text-primary)',
                color: '#fff',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                fontWeight: 'var(--font-weight-bold)',
              }}
            >
              {index + 1}
            </span>
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 'var(--font-weight-semibold)', color: 'var(--portfolio-text-primary)' }}>
                {step.title}
              </div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', lineHeight: 1.55, color: 'var(--portfolio-text-muted)' }}>
                {index === 0 ? (
                  <>
                    <button
                      type="button"
                      onClick={onOpenCommands}
                      style={{ display: 'inline', padding: 0, border: 0, background: 'none', color: 'var(--portfolio-text-primary)', cursor: 'pointer', font: 'inherit', fontWeight: 'var(--font-weight-semibold)', textDecoration: 'underline', textUnderlineOffset: '2px' }}
                    >
                      Open the Commands tab
                    </button>
                    {step.body.slice('Open the Commands tab'.length)}
                  </>
                ) : step.body}
              </p>
            </div>
          </li>
        ))}
        </ol>
      </div>
    </div>
  );
}
