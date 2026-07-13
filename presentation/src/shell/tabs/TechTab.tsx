/**
 * Tech tab — stack list in Retailor's format: bold name + one-line "why".
 */
import { TECH } from '../data/tech';

export function TechTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
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
