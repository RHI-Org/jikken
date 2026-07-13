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
  /**
   * Title treatment: 'title' (default) renders plain centered mono text;
   * 'url' wraps it in a browser-style address pill — used when the window
   * plays a browser rather than a terminal or editor.
   */
  variant?: 'title' | 'url';
  /**
   * Override for the title bar's background. Defaults to the stone
   * --portfolio-bg-muted token; pass a plain CSS color to break from the
   * stone palette for a specific window (e.g. the CLI's neutral grey bar).
   */
  titleBarBg?: string;
}

export function TerminalWindow({ title, children, footer, style, variant = 'title', titleBarBg }: TerminalWindowProps) {
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
          background: titleBarBg ?? 'var(--portfolio-bg-muted)',
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
          {[
            { fill: '#ff5f56', ring: '#e0443e' }, // close  — red
            { fill: '#ffbd2e', ring: '#dea123' }, // minimize — yellow
            { fill: '#27c93f', ring: '#1aab29' }, // zoom   — green
          ].map((c, i) => (
            <span
              key={i}
              style={{
                width: '0.7rem',
                height: '0.7rem',
                borderRadius: '999px',
                background: c.fill,
                border: `1px solid ${c.ring}`,
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
            ...(variant === 'url'
              ? {
                  padding: '0.22rem 1.4rem',
                  borderRadius: '999px',
                  border: '1px solid var(--portfolio-border)',
                  background: 'var(--portfolio-bg-card)',
                  fontWeight: 'var(--font-weight-regular)',
                }
              : {}),
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
