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
import { useCallback, useEffect, useRef } from 'react';
import { TerminalWindow } from '../TerminalWindow';
import { TUTORIAL_EVENTS, useTutorial } from '@/tutorial';

const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:8091/';

export function DashboardSurface() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const tutorial = useTutorial();
  const dashboardOrigin = new URL(DASHBOARD_URL, window.location.href).origin;

  const highlightHistory = useCallback(() => {
    if (tutorial.currentStep?.id !== 'open-history') return;
    frameRef.current?.contentWindow?.postMessage(
      { type: 'jikken:tutorial:highlight', anchor: 'history-nav' },
      dashboardOrigin,
    );
  }, [dashboardOrigin, tutorial.currentStep?.id]);

  useEffect(() => {
    const receive = (event: MessageEvent<unknown>) => {
      if (event.source !== frameRef.current?.contentWindow || event.origin !== dashboardOrigin) return;
      if (!event.data || typeof event.data !== 'object') return;
      const message = event.data as { type?: string; event?: string; anchor?: string };
      if (message.type !== 'jikken:tutorial:event') return;
      if (message.event === 'history-opened' || (message.event === 'user-action' && message.anchor === 'history-nav')) {
        tutorial.emit(TUTORIAL_EVENTS.historyOpened);
      }
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [dashboardOrigin, tutorial]);

  useEffect(highlightHistory, [highlightHistory]);

  return (
    <div data-tutorial="dashboard-frame" style={{ height: '100%', minHeight: 0, padding: '2rem', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <TerminalWindow title="">
        {DASHBOARD_URL ? (
          <iframe
            ref={frameRef}
            title="Jikken Dashboard"
            src={DASHBOARD_URL}
            onLoad={highlightHistory}
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
