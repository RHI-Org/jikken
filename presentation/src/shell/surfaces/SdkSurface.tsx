/**
 * SDK surface — the machine-to-machine story. Shows the real @jikken/sdk usage
 * and a Run affordance that calls the live jikken-simulate Edge Function with
 * the current scenario, then prints the result beneath it. Same engine as the
 * CLI tab, so the exit_code shown here equals the CLI's exit code.
 */
import { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { EXIT_CODE_MESSAGES, type ScenarioId, type SimulationResult } from '@jikken/shared';
import { supabase } from '@/integrations/supabase/client';

function codeSample(scenario: ScenarioId): string {
  return `import { FlagClient } from '@jikken/sdk';

const flags = new FlagClient({
  apiKey: process.env.JIKKEN_API_KEY!,
  timeoutMs: 5000,
});

// Gate a deploy on the flag simulation — exit codes are the contract.
const safe = await flags.isSafeToDeploy({ scenario: '${scenario}' });
if (!safe) process.exit(1); // CONFLICT — stop the pipeline`;
}

export function SdkSurface({ scenario }: { scenario: ScenarioId }) {
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
    }
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '1.4rem 1.6rem' }}>
      <pre
        style={{
          margin: 0,
          padding: '1.1rem 1.2rem',
          borderRadius: '0.6rem',
          background: '#1c1917',
          color: '#e7e5e4',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.78rem',
          lineHeight: 1.6,
          overflowX: 'auto',
          whiteSpace: 'pre',
        }}
      >
        {codeSample(scenario)}
      </pre>

      <button
        onClick={run}
        disabled={running}
        style={{
          marginTop: '1rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.55rem 1rem',
          borderRadius: '0.5rem',
          border: 'none',
          background: 'var(--portfolio-text-primary)',
          color: '#fff',
          fontSize: '0.82rem',
          fontWeight: 'var(--font-weight-semibold)',
          cursor: running ? 'default' : 'pointer',
          opacity: running ? 0.7 : 1,
        }}
      >
        {running ? <Loader2 size={14} className="jk-spin" /> : <Play size={14} />}
        {running ? 'Calling Edge Function…' : 'Run against live Edge Function'}
      </button>

      {error && (
        <div
          style={{
            marginTop: '1rem',
            padding: '0.85rem 1rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--portfolio-border)',
            background: 'var(--portfolio-bg-muted)',
            fontSize: '0.8rem',
            color: 'var(--portfolio-text-secondary)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 'var(--font-weight-bold)', letterSpacing: '0.06em', color: 'var(--portfolio-text-faint)', textTransform: 'uppercase' }}>
            Live result — exit code {result.exit_code}
          </div>
          <div style={{ marginTop: '0.35rem', fontSize: '0.82rem', color: 'var(--portfolio-text-secondary)' }}>
            {EXIT_CODE_MESSAGES[result.exit_code as keyof typeof EXIT_CODE_MESSAGES]}{' '}
            <span style={{ color: 'var(--portfolio-text-muted)' }}>
              ({result.summary.passed} received · {result.summary.conflicted} excluded · {result.summary.warned} partial)
            </span>
          </div>
          <pre
            style={{
              marginTop: '0.7rem',
              padding: '1rem 1.1rem',
              borderRadius: '0.6rem',
              background: '#1c1917',
              color: '#e7e5e4',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              lineHeight: 1.55,
              overflowX: 'auto',
            }}
          >
            {JSON.stringify(
              { simulation_id: result.simulation_id, result: result.result, exit_code: result.exit_code, summary: result.summary },
              null,
              2,
            )}
          </pre>
        </div>
      )}
    </div>
  );
}
