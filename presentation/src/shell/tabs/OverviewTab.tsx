/**
 * Overview tab — a concise operating guide for the live application.
 */
import { INTRO, PRODUCT_SECTIONS, HOWTO } from '../data/overview';
import { Play } from 'lucide-react';

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

      <button
        type="button"
        onClick={onStartTutorial}
        style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.65rem 0.9rem', border: 0, borderRadius: '0.45rem', background: '#2563eb', boxShadow: '0 1px 2px rgba(37, 99, 235, 0.3)', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'var(--font-weight-semibold)' }}
      >
        <Play size={14} fill="currentColor" />
        Start 90-second walkthrough
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
        <div style={{ ...microLabel, marginBottom: '0.85rem' }}>HOW TO EXPLORE THIS DEMO</div>
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
