/**
 * Commands tab — the CLI command shortcuts, moved here from the terminal's
 * bottom bar. Clicking one runs it in the terminal (switching to the CLI
 * surface first via the Shell), the same inject path the scenario picker uses.
 */
import { ArrowRight } from 'lucide-react';
import { PRESET_COMMANDS } from '../cli-runtime';

export function CommandsTab({ onRunCommand }: { onRunCommand: (command: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <p style={{ margin: '0 0 0.6rem', fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--portfolio-text-secondary)' }}>
        Run a command in the terminal — the same engine and output as the
        installed <code style={{ fontFamily: 'var(--font-mono)' }}>jikken</code> binary.
      </p>
      {PRESET_COMMANDS.map((c) => (
        <button
          key={c.label}
          onClick={() => onRunCommand(c.command)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.7rem',
            textAlign: 'left',
            padding: '0.65rem 0.7rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--portfolio-border)',
            background: 'var(--portfolio-bg-card)',
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.76rem',
              color: 'var(--portfolio-text-primary)',
              lineHeight: 1.3,
              wordBreak: 'break-word',
            }}
          >
            {c.label}
          </span>
          <ArrowRight size={14} style={{ flexShrink: 0, color: 'var(--portfolio-text-faint)' }} />
        </button>
      ))}
    </div>
  );
}
