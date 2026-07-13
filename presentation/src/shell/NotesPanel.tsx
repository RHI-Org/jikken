/**
 * Left panel — project notes. Overview / Design / Principles / Tech text tabs, a
 * collapse button, and (when collapsed) a vertical "PROJECT NOTES" edge tab
 * to re-open — the Retailor standalone pattern, not a floating hamburger.
 */
import { PanelLeftClose } from 'lucide-react';
import { OverviewTab } from './tabs/OverviewTab';
import { DesignTab } from './tabs/DesignTab';
import { PrinciplesTab } from './tabs/PrinciplesTab';
import { TechTab } from './tabs/TechTab';
import type { Principle } from './types';

export type NotesTab = 'overview' | 'design' | 'principles' | 'tech';

const TABS: { id: NotesTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'design', label: 'Design' },
  { id: 'principles', label: 'Principles (10)' },
  { id: 'tech', label: 'Tech' },
];

export function EdgeTab({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      aria-label="Open project notes"
      style={{
        position: 'absolute',
        left: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        writingMode: 'vertical-rl',
        padding: '1rem 0.5rem',
        border: '1px solid var(--portfolio-border)',
        borderLeft: 'none',
        borderRadius: '0 0.5rem 0.5rem 0',
        background: 'var(--portfolio-bg-muted)',
        color: 'var(--portfolio-text-secondary)',
        fontSize: '0.7rem',
        fontWeight: 'var(--font-weight-bold)',
        letterSpacing: '0.12em',
        cursor: 'pointer',
        zIndex: 10,
      }}
    >
      PROJECT NOTES
    </button>
  );
}

export function NotesPanel({
  tab,
  onTabChange,
  onClose,
  activePrinciple,
  onSelectPrinciple,
  onHandoff,
}: {
  tab: NotesTab;
  onTabChange: (t: NotesTab) => void;
  onClose: () => void;
  activePrinciple: number | null;
  onSelectPrinciple: (p: Principle) => void;
  onHandoff: () => void;
}) {
  return (
    <aside
      style={{
        width: 'min(440px, 40%)',
        minWidth: 320,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--portfolio-bg-muted)',
        borderRight: '1px solid var(--portfolio-border)',
      }}
    >
      {/* Header */}
      <div style={{ padding: '1.25rem 1.4rem 1rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'var(--font-weight-bold)', lineHeight: 1.1 }}>
            Jikken
          </div>
          <div style={{ marginTop: '0.3rem', fontSize: '0.78rem', color: 'var(--portfolio-text-muted)' }}>
            Let PMs ship features. Keep governance.
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Collapse notes"
          style={{
            flexShrink: 0,
            display: 'flex',
            padding: '0.4rem',
            borderRadius: '0.4rem',
            border: '1px solid var(--portfolio-border-muted)',
            background: 'transparent',
            color: 'var(--portfolio-text-muted)',
            cursor: 'pointer',
          }}
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.8rem', padding: '0 1.4rem', borderBottom: '1px solid var(--portfolio-border-muted)' }}>
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              style={{
                padding: '0.55rem 0',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${active ? 'var(--portfolio-text-primary)' : 'transparent'}`,
                marginBottom: -1,
                fontSize: '0.76rem',
                fontWeight: active ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                color: active ? 'var(--portfolio-text-primary)' : 'var(--portfolio-text-faint)',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.3rem 1.4rem 2rem' }}>
        {tab === 'overview' && <OverviewTab />}
        {tab === 'design' && <DesignTab onHandoff={onHandoff} />}
        {tab === 'principles' && (
          <PrinciplesTab activeNumber={activePrinciple} onSelect={onSelectPrinciple} />
        )}
        {tab === 'tech' && <TechTab />}
      </div>
    </aside>
  );
}
