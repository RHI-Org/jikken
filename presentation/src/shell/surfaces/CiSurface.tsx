/**
 * CI surface — the governance layer, made visible. A pipeline window runs
 * build → tests → the jikken gate → deploy against the current situation,
 * using the SAME shared engine as every other surface. On exit 1 the deploy
 * step is refused on screen — governance as a moment you watch, not a claim.
 *
 * The gate's colors are the canonical COLORS hexes, so the red that blocks
 * the deploy here is byte-for-byte the red the CLI prints for [FAIL].
 */
import { useEffect, useState } from 'react';
import { Check, X, AlertTriangle, Loader2, CircleDashed, Ban, RotateCcw } from 'lucide-react';
import { COLORS, EXIT_CODE_MESSAGES, diffSimulations, type Scenario } from '@jikken/shared';
import { TerminalWindow } from '../TerminalWindow';

const STEP_DELAYS = [500, 1100, 1900, 2700]; // build, tests, gate, deploy
const BANNER_DELAY = 3200;

type StepState = 'pending' | 'running' | 'done';

function useStagedRun(key: string) {
  // How many steps have resolved (0–4), plus whether the banner has landed.
  const [resolved, setResolved] = useState(0);
  const [showBanner, setShowBanner] = useState(false);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    setResolved(0);
    setShowBanner(false);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setResolved(4);
      setShowBanner(true);
      return;
    }
    const timers = STEP_DELAYS.map((ms, i) => window.setTimeout(() => setResolved(i + 1), ms));
    timers.push(window.setTimeout(() => setShowBanner(true), BANNER_DELAY));
    return () => timers.forEach(clearTimeout);
  }, [key, runId]);

  return { resolved, showBanner, rerun: () => setRunId((n) => n + 1) };
}

function StepIcon({ state, tone }: { state: StepState; tone: 'ok' | 'warn' | 'fail' | 'blocked' }) {
  if (state === 'pending') return <CircleDashed size={15} style={{ color: 'var(--portfolio-text-faint)' }} />;
  if (state === 'running') return <Loader2 size={15} className="jk-spin" style={{ color: 'var(--portfolio-text-muted)' }} />;
  if (tone === 'ok') return <Check size={15} style={{ color: COLORS.RECEIVE.hex }} strokeWidth={2.6} />;
  if (tone === 'warn') return <AlertTriangle size={15} style={{ color: COLORS.PARTIAL.hex }} />;
  if (tone === 'blocked') return <Ban size={15} style={{ color: COLORS.EXCLUDE.hex }} strokeWidth={2.4} />;
  return <X size={15} style={{ color: COLORS.EXCLUDE.hex }} strokeWidth={2.6} />;
}

export function CiSurface({ scenario }: { scenario: Scenario }) {
  // Deterministic: the same engine call every surface makes.
  const diff = diffSimulations(scenario.baseline, scenario.flag, scenario.users);
  const exit = diff.exit_code;
  const outcome: 'ok' | 'warn' | 'fail' = exit === 0 ? 'ok' : exit === 2 ? 'warn' : 'fail';

  const { resolved, showBanner, rerun } = useStagedRun(`${scenario.feature}:${scenario.id}`);
  const stateAt = (i: number): StepState => (resolved > i ? 'done' : resolved === i ? 'running' : 'pending');

  const gateDetail =
    outcome === 'fail'
      ? `${diff.lost.length} user${diff.lost.length === 1 ? '' : 's'} would lose access`
      : outcome === 'warn'
        ? `${diff.after.summary.warned} users drop to partial access`
        : `${diff.gained.length} users gain access, nobody loses it`;

  const steps: { name: string; tone: 'ok' | 'warn' | 'fail' | 'blocked'; right: string; detail?: string }[] = [
    { name: 'Build', tone: 'ok', right: '2.1s' },
    { name: 'Unit tests', tone: 'ok', right: '4.8s' },
    {
      name: 'jikken gate',
      tone: outcome,
      right: `exit ${exit}`,
      detail: `${EXIT_CODE_MESSAGES[exit as 0 | 1 | 2]} ${gateDetail}.`,
    },
    {
      name: 'Deploy to production',
      tone: outcome === 'fail' ? 'blocked' : outcome,
      right: outcome === 'fail' ? 'Blocked' : outcome === 'warn' ? 'Deployed with caution' : 'Deployed',
    },
  ];

  const banner =
    outcome === 'fail'
      ? {
          bg: COLORS.EXCLUDE.hex,
          title: 'Halted before it reached anyone.',
          body: `This change would cut off ${diff.lost.length} users, so the pipeline refused it. Fix the rule and re-run — no ticket, no incident.`,
        }
      : outcome === 'warn'
        ? {
            bg: COLORS.PARTIAL.hex,
            title: 'Shipped, with a caution on record.',
            body: `${diff.after.summary.warned} users drop to partial access. The gate flags it and lets the team decide.`,
          }
        : {
            bg: '#1c1917',
            title: 'Shipped.',
            body: `Purely additive — ${diff.gained.length} users gain access and nobody loses it. The gate stays out of the way.`,
          };

  const footer = (
    <div style={{ padding: '0.7rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
      <button
        onClick={rerun}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.45rem 0.9rem',
          borderRadius: '0.5rem',
          border: '1px solid var(--portfolio-border)',
          background: 'var(--portfolio-bg-card)',
          color: 'var(--portfolio-text-secondary)',
          fontSize: '0.76rem',
          fontWeight: 'var(--font-weight-semibold)',
          cursor: 'pointer',
        }}
      >
        <RotateCcw size={13} />
        Re-run pipeline
      </button>
      <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--portfolio-text-faint)' }}>
        the contract: exit 0 ship · exit 2 caution · exit 1 block
      </span>
    </div>
  );

  return (
    <div style={{ height: '100%', minHeight: 0, padding: '2rem', boxSizing: 'border-box' }}>
      <TerminalWindow title="deploy.yml — pipeline" footer={footer}>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1.3rem 1.4rem' }}>
          {/* Trigger context */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
              paddingBottom: '1rem',
              marginBottom: '0.4rem',
              borderBottom: '1px solid var(--portfolio-border-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              color: 'var(--portfolio-text-muted)',
            }}
          >
            <span>
              on: <span style={{ color: 'var(--portfolio-text-primary)', fontWeight: 'var(--font-weight-semibold)' }}>pull_request → main</span>
            </span>
            <span>targeting change: {scenario.label.toLowerCase()}</span>
          </div>

          {/* Steps */}
          <div>
            {steps.map((s, i) => {
              const state = stateAt(i);
              const done = state === 'done';
              const isGate = i === 2;
              const isBlockedDeploy = i === 3 && done && s.tone === 'blocked';
              return (
                <div
                  key={s.name}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.15rem',
                    padding: '0.7rem 0.65rem',
                    borderRadius: '0.45rem',
                    background: isBlockedDeploy ? 'rgba(185,28,28,0.07)' : 'transparent',
                    opacity: state === 'pending' ? 0.45 : 1,
                    transition: 'opacity 0.25s ease, background 0.25s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                    <StepIcon state={state} tone={s.tone} />
                    <span
                      style={{
                        flex: 1,
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.82rem',
                        fontWeight: isGate || isBlockedDeploy ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                        color: 'var(--portfolio-text-primary)',
                      }}
                    >
                      {s.name}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.72rem',
                        fontWeight: done && (isGate || i === 3) ? 'var(--font-weight-bold)' : 'var(--font-weight-regular)',
                        color: !done
                          ? 'var(--portfolio-text-faint)'
                          : isGate || i === 3
                            ? s.tone === 'ok'
                              ? COLORS.RECEIVE.hex
                              : s.tone === 'warn'
                                ? COLORS.PARTIAL.hex
                                : COLORS.EXCLUDE.hex
                            : 'var(--portfolio-text-faint)',
                      }}
                    >
                      {done ? s.right : state === 'running' ? '…' : ''}
                    </span>
                  </div>
                  {s.detail && done && (
                    <div style={{ paddingLeft: '1.65rem', fontSize: '0.74rem', lineHeight: 1.5, color: 'var(--portfolio-text-muted)' }}>
                      {s.detail}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Verdict banner — the governance moment */}
          {showBanner && (
            <div
              className="jk-ci-banner"
              style={{
                marginTop: '1.1rem',
                padding: '1rem 1.2rem',
                borderRadius: '0.55rem',
                background: banner.bg,
                color: '#fff',
              }}
            >
              <div style={{ fontSize: '0.92rem', fontWeight: 'var(--font-weight-bold)' }}>{banner.title}</div>
              <div style={{ marginTop: '0.3rem', fontSize: '0.78rem', lineHeight: 1.55, opacity: 0.92 }}>{banner.body}</div>
            </div>
          )}
        </div>
      </TerminalWindow>
    </div>
  );
}
