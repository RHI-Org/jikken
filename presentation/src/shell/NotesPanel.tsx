/**
 * Left panel — project notes. Overview / Design / Principles / Tech text tabs, a
 * collapse button, and (when collapsed) a vertical "PROJECT NOTES" edge tab
 * to re-open — the Retailor standalone pattern, not a floating hamburger.
 */
import { useState } from 'react';
import { ChevronRight, PanelLeftClose } from 'lucide-react';
import type { FeatureDef, FeatureId, ScenarioId } from '@jikken/shared';
import { OverviewTab } from './tabs/OverviewTab';
import { DesignTab } from './tabs/DesignTab';
import { PrinciplesTab } from './tabs/PrinciplesTab';
import { TechTab } from './tabs/TechTab';
import { CommandsTab } from './tabs/CommandsTab';
import type { Principle } from './types';
import { JikkenMark } from '@/components/JikkenMark';

export type NotesTab = 'overview' | 'details' | 'commands';

const TABS: { id: NotesTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'commands', label: 'Commands' },
  { id: 'details', label: 'Details' },
];

// Collapsible section inside the merged Details tab (Design / Principles /
// Tech). Design starts open (it carries the product thesis + hand-off);
// Principles and Tech start collapsed — reference material, not the lead.
function DetailsSection({ label, defaultOpen = false, children }: { label: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: 0,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          fontSize: '0.62rem',
          fontWeight: 'var(--font-weight-bold)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--portfolio-text-primary)',
          paddingBottom: '0.2rem',
        }}
      >
        <ChevronRight size={12} style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
        {label}
      </button>
      {open && <div style={{ marginTop: '0.7rem' }}>{children}</div>}
    </div>
  );
}

export function NotesPanel({
  tab,
  onTabChange,
  onClose,
  activePrinciple,
  onSelectPrinciple,
  onHandoff,
  onRunCommand,
  features,
  feature,
  onFeatureChange,
  scenario,
  onScenarioChange,
  onStartTutorial,
}: {
  tab: NotesTab;
  onTabChange: (t: NotesTab) => void;
  onClose: () => void;
  activePrinciple: number | null;
  onSelectPrinciple: (p: Principle) => void;
  onHandoff: () => void;
  onRunCommand: (command: string) => void;
  features: FeatureDef[];
  feature: FeatureId;
  onFeatureChange: (f: FeatureId) => void;
  scenario: ScenarioId | null;
  onScenarioChange: (s: ScenarioId) => void;
  onStartTutorial: () => void;
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '1.2rem', fontWeight: 'var(--font-weight-bold)', lineHeight: 1.1 }}>
            <JikkenMark size={21} />
            <span>Jikken</span>
          </div>
          <div style={{ marginTop: '0.3rem', fontSize: '0.78rem', color: 'var(--portfolio-text-muted)' }}>
            Preview who a feature reaches — and stop risky changes before they ship.
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
              data-tutorial={`${t.id}-tab`}
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
        {tab === 'overview' && (
          <OverviewTab
            onStartTutorial={onStartTutorial}
            onOpenCommands={() => onTabChange('commands')}
          />
        )}
        {tab === 'details' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <DetailsSection label="Design" defaultOpen>
              <DesignTab onHandoff={onHandoff} />
            </DetailsSection>
            <DetailsSection label="Principles (10)">
              <PrinciplesTab activeNumber={activePrinciple} onSelect={onSelectPrinciple} />
            </DetailsSection>
            <DetailsSection label="Tech">
              <TechTab />
            </DetailsSection>
          </div>
        )}
        {tab === 'commands' && (
          <CommandsTab
            features={features}
            feature={feature}
            onFeatureChange={onFeatureChange}
            scenario={scenario}
            onScenarioChange={onScenarioChange}
            onRunCommand={onRunCommand}
          />
        )}
      </div>
    </aside>
  );
}
