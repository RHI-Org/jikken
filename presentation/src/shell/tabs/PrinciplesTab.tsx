/**
 * Principles tab — the 10 spec §11.1 principles as numbered, clickable items.
 * Clicking one commands the stage: switch surface + drop the matching pin.
 * Ported from Retailor's Changes list (blue pin circle + text + ArrowRight).
 */
import { ArrowRight } from 'lucide-react';
import { PRINCIPLES } from '../data/principles';
import type { Principle } from '../types';

export function PrinciplesTab({
  activeNumber,
  onSelect,
}: {
  activeNumber: number | null;
  onSelect: (p: Principle) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {PRINCIPLES.map((p) => {
        const active = p.number === activeNumber;
        return (
          <button
            key={p.number}
            onClick={() => onSelect(p)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.7rem',
              textAlign: 'left',
              padding: '0.7rem 0.6rem',
              borderRadius: '0.5rem',
              border: '1px solid',
              borderColor: active ? 'var(--portfolio-text-primary)' : 'transparent',
              background: active ? 'var(--portfolio-bg-muted)' : 'transparent',
              cursor: 'pointer',
              transition: 'background 0.12s, border-color 0.12s',
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.background = 'var(--portfolio-bg)';
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.background = 'transparent';
            }}
          >
            <span
              style={{
                flexShrink: 0,
                width: '1.4rem',
                height: '1.4rem',
                borderRadius: '999px',
                background: active ? 'var(--portfolio-text-primary)' : 'var(--portfolio-bg-muted)',
                color: active ? '#fff' : 'var(--portfolio-text-secondary)',
                fontSize: '0.72rem',
                fontWeight: 'var(--font-weight-bold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {p.number}
            </span>
            <span style={{ flex: 1 }}>
              <span
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--portfolio-text-primary)',
                }}
              >
                {p.title}
              </span>
              <span
                style={{
                  display: 'block',
                  marginTop: '0.2rem',
                  fontSize: '0.74rem',
                  lineHeight: 1.5,
                  color: 'var(--portfolio-text-muted)',
                }}
              >
                {p.why}
              </span>
            </span>
            <ArrowRight
              size={14}
              style={{
                flexShrink: 0,
                marginTop: '0.15rem',
                color: 'var(--portfolio-text-faint)',
                opacity: active ? 1 : 0.5,
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
