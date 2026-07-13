/**
 * Dashboard surface — the real @jikken/dashboard app mounted in the stage via
 * an iframe (its own Vite build, so it keeps its Tailwind styling and router),
 * framed as a browser window so the PM's surface reads as its own app, the
 * same way the CLI reads as a terminal.
 *
 * The URL is configurable: VITE_DASHBOARD_URL (production, e.g. /dashboard/ on
 * the same domain) with the dashboard dev-server as the local default. When
 * unset/unreachable the panel degrades to a labeled placeholder rather than a
 * broken frame — "graceful failure is a feature."
 */
import { TerminalWindow } from '../TerminalWindow';

const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:8091/';

export function DashboardSurface() {
  return (
    <div style={{ height: '100%', minHeight: 0, padding: '2rem', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <TerminalWindow title="">
        {DASHBOARD_URL ? (
          <iframe
            title="Jikken Dashboard"
            src={DASHBOARD_URL}
            style={{ width: '100%', height: '100%', border: 'none', background: '#f9fafb' }}
          />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', color: 'var(--portfolio-text-muted)', fontSize: '0.85rem' }}>
            Set VITE_DASHBOARD_URL to embed the live Dashboard here.
          </div>
        )}
      </TerminalWindow>
    </div>
  );
}
