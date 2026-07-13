/**
 * Overview tab — 4-stat grid, collapsible PROBLEM/APPROACH sections, and the
 * featured ★ hand-off item that stages the CLI→Dashboard centerpiece.
 */
import { useState } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import { STATS, SECTIONS, HANDOFF } from '../data/overview';

const microLabel: React.CSSProperties = {
  fontSize: '0.65rem',
  fontWeight: 'var(--font-weight-bold)',
  letterSpacing: '0.08em',
  color: 'var(--portfolio-text-faint)',
  textTransform: 'uppercase',
};

function Section({ label, body }: { label: string; body: string }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ borderTop: '1px solid var(--portfolio-border-muted)', paddingTop: '0.85rem' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          ...microLabel,
        }}
      >
        <ChevronRight
          size={11}
          style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}
        />
        {label}
      </button>
      {open && (
        <p
          style={{
            margin: '0.6rem 0 0',
            fontSize: '0.82rem',
            lineHeight: 1.65,
            color: 'var(--portfolio-text-secondary)',
          }}
        >
          {body}
        </p>
      )}
    </div>
  );
}

export function OverviewTab({ onHandoff }: { onHandoff: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      {/* 4-stat grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        {STATS.map((s) => (
          <div key={s.label}>
            <div
              style={{
                fontSize: '1.6rem',
                fontWeight: 'var(--font-weight-bold)',
                lineHeight: 1,
                color: 'var(--portfolio-text-primary)',
              }}
            >
              {s.value}
            </div>
            <div style={{ ...microLabel, marginTop: '0.2rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {SECTIONS.map((s) => (
        <Section key={s.label} label={s.label} body={s.body} />
      ))}

      {/* ★ The hand-off — featured centerpiece trigger */}
      <button
        onClick={onHandoff}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.6rem',
          textAlign: 'left',
          padding: '0.85rem',
          borderRadius: '0.6rem',
          border: '1px solid var(--portfolio-text-primary)',
          background: 'var(--portfolio-text-primary)',
          color: '#fff',
          cursor: 'pointer',
        }}
      >
        <Sparkles size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
        <span>
          <span style={{ fontWeight: 'var(--font-weight-bold)', fontSize: '0.85rem' }}>
            ★ {HANDOFF.label}
          </span>
          <span
            style={{
              display: 'block',
              marginTop: '0.3rem',
              fontSize: '0.78rem',
              lineHeight: 1.55,
              opacity: 0.85,
            }}
          >
            {HANDOFF.body}
          </span>
        </span>
      </button>
    </div>
  );
}
