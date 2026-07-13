/**
 * TerminalWindow — a framed "app window" chrome that wraps the live terminal.
 *
 * Pure presentation: a title bar (three monochrome stone dots + a centered
 * monospace title) over a body slot, with an optional footer slot for the
 * Quickstart controls. All color comes from the --portfolio-* / --stone-*
 * tokens so the frame matches the rest of the deck.
 */

import type { ReactNode, CSSProperties } from 'react';

export interface TerminalWindowProps {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  style?: CSSProperties;
}

export function TerminalWindow({ title, children, footer, style }: TerminalWindowProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        height: '100%',
        borderRadius: '0.7rem',
        border: '1px solid var(--portfolio-border)',
        background: 'var(--portfolio-bg-card)',
        boxShadow: '0 1px 2px rgba(28,25,23,0.04), 0 12px 32px -12px rgba(28,25,23,0.22)',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.55rem 0.85rem',
          borderBottom: '1px solid var(--portfolio-border)',
          background: 'var(--portfolio-bg-muted)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '0.4rem',
            alignItems: 'center',
          }}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: '0.7rem',
                height: '0.7rem',
                borderRadius: '999px',
                background: 'var(--stone-400)',
                border: '1px solid var(--stone-500)',
              }}
            />
          ))}
        </div>
        <span
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--portfolio-text-muted)',
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {title}
        </span>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>

      {footer && (
        <div
          style={{
            flexShrink: 0,
            borderTop: '1px solid var(--portfolio-border)',
            background: 'var(--portfolio-bg-muted)',
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
