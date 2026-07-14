/**
 * Security tab — governance-minded product decisions. Leads with a one-line
 * framing, then the same bold-name + "why" rows as the Tech tab.
 */
import { SECURITY } from '../data/security';

export function SecurityTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
      <p
        style={{
          margin: 0,
          fontSize: '0.78rem',
          lineHeight: 1.6,
          color: 'var(--portfolio-text-muted)',
        }}
      >
        Security is a design surface here: what a tool <em>won’t</em> let you do is part of
        the experience. These are UX-level guardrails, not just backend policy.
      </p>
      {SECURITY.map((s) => (
        <div key={s.name} style={{ borderTop: '1px solid var(--portfolio-border-muted)', paddingTop: '0.9rem' }}>
          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--portfolio-text-primary)',
            }}
          >
            {s.name}
          </div>
          <div
            style={{
              marginTop: '0.25rem',
              fontSize: '0.78rem',
              lineHeight: 1.55,
              color: 'var(--portfolio-text-muted)',
            }}
          >
            {s.why}
          </div>
        </div>
      ))}
    </div>
  );
}
