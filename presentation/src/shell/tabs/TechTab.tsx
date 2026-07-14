/**
 * Tech tab — stack list in Retailor's format: bold name + one-line "why".
 */
import { TECH } from '../data/tech';
import { ExternalLink, Github } from 'lucide-react';

export function TechTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
      <a
        href="https://github.com/RHI-Org/jikken"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open the Jikken source repository on GitHub"
        style={{ alignItems: 'center', background: 'var(--portfolio-text-primary)', borderRadius: '0.65rem', color: '#fff', display: 'flex', gap: '0.75rem', padding: '0.9rem 1rem', textDecoration: 'none' }}
      >
        <Github aria-hidden="true" size={24} />
        <span style={{ minWidth: 0, flex: 1 }}>
          <span style={{ display: 'block', fontSize: '0.88rem', fontWeight: 'var(--font-weight-bold)' }}>Explore the source on GitHub</span>
          <span style={{ display: 'block', marginTop: '0.2rem', fontFamily: 'var(--font-mono)', fontSize: '0.66rem', opacity: 0.72, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>RHI-Org/jikken</span>
        </span>
        <ExternalLink aria-hidden="true" size={16} />
      </a>
      {TECH.map((t) => (
        <div key={t.name} style={{ borderTop: '1px solid var(--portfolio-border-muted)', paddingTop: '0.9rem' }}>
          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--portfolio-text-primary)',
            }}
          >
            {t.name}
          </div>
          <div
            style={{
              marginTop: '0.25rem',
              fontSize: '0.78rem',
              lineHeight: 1.55,
              color: 'var(--portfolio-text-muted)',
            }}
          >
            {t.why}
          </div>
        </div>
      ))}
    </div>
  );
}
