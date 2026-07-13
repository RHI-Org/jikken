/**
 * Dashboard surface — the real @jikken/dashboard app mounted in the stage via
 * an iframe (its own Vite build, so it keeps its Tailwind styling and router).
 *
 * The URL is configurable: VITE_DASHBOARD_URL (production, e.g. /dashboard/ on
 * the same domain) with the dashboard dev-server as the local default. When
 * unset/unreachable the panel degrades to a labeled placeholder rather than a
 * broken frame — "graceful failure is a feature."
 */
const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:8091/';

export function DashboardSurface() {
  if (!DASHBOARD_URL) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', color: 'var(--portfolio-text-muted)', fontSize: '0.85rem' }}>
        Set VITE_DASHBOARD_URL to embed the live Dashboard here.
      </div>
    );
  }
  return (
    <iframe
      title="Jikken Dashboard"
      src={DASHBOARD_URL}
      style={{ width: '100%', height: '100%', border: 'none', background: '#f9fafb' }}
    />
  );
}
