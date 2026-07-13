/**
 * SDK surface — the machine-to-machine story, framed as an editor window.
 * Shows the real @jikken/sdk usage with line numbers and a quiet, monochrome
 * syntax treatment (type carries the hierarchy, not color), plus a Run
 * affordance in the window footer that calls the live jikken-simulate Edge
 * Function with the current scenario. Same engine as the CLI tab, so the
 * exit_code shown here equals the CLI's exit code.
 */
import { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { EXIT_CODE_MESSAGES, COLORS, type ScenarioId, type SimulationResult } from '@jikken/shared';
import { supabase } from '@/integrations/supabase/client';
import { TerminalWindow } from '../TerminalWindow';
import { TUTORIAL_EVENTS, useTutorial } from '@/tutorial';

// ── Monochrome editor tokens (dark stone; hierarchy from weight, not hue) ──
const T = {
  base: { color: '#d6d3d1' },                                    // stone-300
  kw: { color: '#fafaf9', fontWeight: 600 },                     // stone-50 bold
  str: { color: '#e7e5e4' },                                     // stone-200
  comment: { color: '#78716c', fontStyle: 'italic' as const },   // stone-500
  punct: { color: '#a8a29e' },                                   // stone-400
} as const;

function CodeLine({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: '1.1rem', lineHeight: 1.75 }}>
      <span style={{ width: '1.4rem', textAlign: 'right', color: '#57534e', userSelect: 'none', flexShrink: 0 }}>{n}</span>
      <span style={{ whiteSpace: 'pre-wrap' }}>{children}</span>
    </div>
  );
}

function CodeSample({ scenario }: { scenario: ScenarioId }) {
  return (
    <div
      style={{
        padding: '1.2rem 1.3rem 1.4rem',
        background: '#1c1917',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.78rem',
        ...T.base,
      }}
    >
      <CodeLine n={1}><span style={T.kw}>import</span> <span style={T.punct}>{'{'}</span> FlagClient <span style={T.punct}>{'}'}</span> <span style={T.kw}>from</span> <span style={T.str}>'@jikken/sdk'</span>;</CodeLine>
      <CodeLine n={2}>{' '}</CodeLine>
      <CodeLine n={3}><span style={T.kw}>const</span> flags = <span style={T.kw}>new</span> FlagClient(<span style={T.punct}>{'{'}</span></CodeLine>
      <CodeLine n={4}>{'  '}apiKey: process.env.JIKKEN_API_KEY!,</CodeLine>
      <CodeLine n={5}>{'  '}timeoutMs: <span style={T.str}>5000</span>,</CodeLine>
      <CodeLine n={6}><span style={T.punct}>{'}'}</span>);</CodeLine>
      <CodeLine n={7}>{' '}</CodeLine>
      <CodeLine n={8}><span style={T.comment}>{'// Gate a deploy on the flag simulation — exit codes are the contract.'}</span></CodeLine>
      <CodeLine n={9}><span style={T.kw}>const</span> safe = <span style={T.kw}>await</span> flags.isSafeToDeploy(<span style={T.punct}>{'{'}</span> scenario: <span style={T.str}>'{scenario}'</span> <span style={T.punct}>{'}'}</span>);</CodeLine>
      <CodeLine n={10}><span style={T.kw}>if</span> (!safe) process.exit(<span style={T.str}>1</span>); <span style={T.comment}>{'// CONFLICT — stop the pipeline'}</span></CodeLine>
    </div>
  );
}

export function SdkSurface({ scenario }: { scenario: ScenarioId }) {
  const tutorial = useTutorial();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setRunning(true);
    setResult(null);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('jikken-simulate', {
        body: { scenario, surface: 'sdk' },
      });
      if (fnError) throw fnError;
      setResult(data as SimulationResult);
    } catch (e) {
      setError(
        e instanceof Error
          ? `${e.message} — the Edge Function may not be deployed yet (CONNECTION_FAILURE).`
          : 'Simulation failed.',
      );
    } finally {
      setRunning(false);
      // The walkthrough must remain operable when the optional live function
      // is unavailable; the visible error still demonstrates graceful failure.
      tutorial.emit(TUTORIAL_EVENTS.sdkRunComplete);
    }
  };

  // Exit-code → the shared semantic hex (the same value the CLI's ANSI theme
  // and the Dashboard's Tailwind classes resolve to — the parity thesis).
  const resultHex =
    result === null ? undefined : result.exit_code === 0 ? COLORS.RECEIVE.hex : result.exit_code === 2 ? COLORS.PARTIAL.hex : COLORS.EXCLUDE.hex;

  const footer = (
    <div style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.9rem', flexWrap: 'wrap' }}>
      <button
        data-tutorial="sdk-run"
        onClick={run}
        disabled={running}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.5rem 0.95rem',
          borderRadius: '0.5rem',
          border: 'none',
          background: 'var(--portfolio-text-primary)',
          color: '#fff',
          fontSize: '0.78rem',
          fontWeight: 'var(--font-weight-semibold)',
          cursor: running ? 'default' : 'pointer',
          opacity: running ? 0.7 : 1,
        }}
      >
        {running ? <Loader2 size={14} className="jk-spin" /> : <Play size={14} />}
        {running ? 'Calling Edge Function…' : 'Run against live Edge Function'}
      </button>
      {error && (
        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--portfolio-text-muted)' }}>{error}</span>
      )}
      {result && (
        <span data-tutorial="sdk-result" style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--portfolio-text-secondary)' }}>
          <span style={{ fontWeight: 'var(--font-weight-bold)', color: resultHex }}>exit {result.exit_code}</span>
          {' — '}
          {EXIT_CODE_MESSAGES[result.exit_code as keyof typeof EXIT_CODE_MESSAGES]}
        </span>
      )}
    </div>
  );

  return (
    <div style={{ height: '100%', minHeight: 0, padding: '2rem', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <TerminalWindow title="deploy-gate.ts — jikken sdk" footer={footer}>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: '#1c1917' }}>
          <CodeSample scenario={scenario} />
          {result && (
            <div style={{ padding: '0 1.3rem 1.3rem', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', lineHeight: 1.6 }}>
              <div style={{ color: '#78716c', paddingBottom: '0.3rem' }}>{'// live response'}</div>
              <pre style={{ margin: 0, color: '#d6d3d1', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(
                  { simulation_id: result.simulation_id, result: result.result, exit_code: result.exit_code, summary: result.summary },
                  null,
                  2,
                )}
              </pre>
            </div>
          )}
        </div>
      </TerminalWindow>
    </div>
  );
}
