/**
 * HistoryPage Component
 *
 * Past simulations — the real audit trail, backed by jikken_simulations.
 * Subscribes to Realtime inserts so a run from ANY surface (a CLI-tab run,
 * an SDK call, a dashboard sim) lands here live, with a one-shot pulse on the
 * arriving row. This is the CLI→Dashboard hand-off centerpiece.
 *
 * Design Principle: Consistency — same result colors as CLI and SimulationView.
 * Design Principle: Transparent reasoning — the audit trail is always visible.
 */
import { Fragment, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react';
import type { SimulationResult } from '@jikken/shared';
import { COLORS, DECISION_LABELS } from '@jikken/shared';
import { flagStore } from '@/store/flagStore';
import {
  emitTutorialEvent,
  TUTORIAL_ANCHORS,
} from '@/tutorial/bridge';

const RESULT_STYLE: Record<SimulationResult['result'], { bg: string; text: string; label: string }> = {
  all_clear: { bg: COLORS.RECEIVE.bg, text: COLORS.RECEIVE.text, label: 'ALL CLEAR' },
  conflict: { bg: COLORS.EXCLUDE.bg, text: COLORS.EXCLUDE.text, label: 'CONFLICT' },
  warning: { bg: COLORS.PARTIAL.bg, text: COLORS.PARTIAL.text, label: 'NEEDS REVIEW' },
};

export function filterSimulations(simulations: SimulationResult[], query: string): SimulationResult[] {
  const normalizedQuery = query.trim().toLowerCase();
  return simulations.filter((simulation) => {
    const resultLabel = RESULT_STYLE[simulation.result].label;
    return [
      simulation.simulation_id,
      simulation.flag_id,
      simulation.result,
      resultLabel,
      new Date(simulation.evaluated_at).toLocaleString(),
    ].some((value) => value.toLowerCase().includes(normalizedQuery));
  });
}

export default function HistoryPage() {
  const [sims, setSims] = useState<SimulationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  // simulation_ids that just arrived via Realtime — drives the pulse class.
  const [pulsing, setPulsing] = useState<Set<string>>(new Set());
  const pulseTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    let cancelled = false;

    flagStore.listSimulations().then((result) => {
      if (cancelled) return;
      setSims([...result].reverse()); // newest first
      setLoading(false);
    });

    // Live inserts from any surface → prepend + pulse (dedupe by simulation_id).
    const unsubscribe = flagStore.subscribeSimulations((sim) => {
      setSims((prev) => {
        if (prev.some((s) => s.simulation_id === sim.simulation_id)) return prev;
        return [sim, ...prev];
      });
      setPulsing((prev) => new Set(prev).add(sim.simulation_id));
      const t = setTimeout(() => {
        setPulsing((prev) => {
          const next = new Set(prev);
          next.delete(sim.simulation_id);
          return next;
        });
        pulseTimers.current.delete(sim.simulation_id);
      }, 2200);
      pulseTimers.current.set(sim.simulation_id, t);
    });

    const timers = pulseTimers.current;
    return () => {
      cancelled = true;
      unsubscribe();
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  useEffect(() => {
    if (!loading && sims.length > 0) {
      emitTutorialEvent({ type: 'jikken:tutorial:event', event: 'history-row-visible' });
    }
  }, [loading, sims.length]);

  const filteredSims = filterSimulations(sims, query);

  const toggleExpanded = (simulationId: string, isTutorialRow: boolean) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(simulationId)) next.delete(simulationId);
      else next.add(simulationId);
      return next;
    });
    if (isTutorialRow) {
      emitTutorialEvent({
        type: 'jikken:tutorial:event',
        event: 'user-action',
        anchor: TUTORIAL_ANCHORS.latestHistoryRow,
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Simulation History</h1>

      {!loading && sims.length > 0 && (
        <div className="relative mb-5">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by flag, simulation ID, result, or date"
            aria-label="Search simulation history"
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-10 text-sm text-gray-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear history search" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : sims.length === 0 ? (
        <p className="text-gray-500">No simulations have been run yet.</p>
      ) : filteredSims.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
          No simulations match “{query}”.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-2">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-2">Simulation</th>
                <th className="px-4 py-2">Flag</th>
                <th className="px-4 py-2">Result</th>
                <th className="px-4 py-2">Included / Excluded / Needs Review</th>
                <th className="px-4 py-2">Evaluated At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSims.map((sim, index) => {
                const style = RESULT_STYLE[sim.result];
                const isPulsing = pulsing.has(sim.simulation_id);
                const isExpanded = expanded.has(sim.simulation_id);
                return (
                  <Fragment key={sim.simulation_id}>
                    <tr
                      className={`${isPulsing ? 'jk-row-pulse ' : ''}cursor-pointer outline-none hover:bg-gray-50 focus-visible:bg-blue-50`}
                      data-tutorial={index === 0 ? TUTORIAL_ANCHORS.latestHistoryRow : undefined}
                      onClick={() => toggleExpanded(sim.simulation_id, index === 0)}
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter' && event.key !== ' ') return;
                        event.preventDefault();
                        toggleExpanded(sim.simulation_id, index === 0);
                      }}
                      tabIndex={0}
                      aria-expanded={isExpanded}
                    >
                      <td className="px-4 py-2 font-mono text-xs text-gray-600">{sim.simulation_id}</td>
                      <td className="px-4 py-2">
                        <Link
                          to={`/flags/simulate/${sim.flag_id}`}
                          onClick={(event) => event.stopPropagation()}
                          className="text-blue-600 hover:text-blue-800 font-mono"
                        >
                          {sim.flag_id}
                        </Link>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`inline-flex whitespace-nowrap px-2 py-1 rounded text-xs font-medium ${style.bg} ${style.text}`}>
                          {style.label}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-600">
                        {sim.summary.passed} / {sim.summary.conflicted} / {sim.summary.warned}
                      </td>
                      <td className="px-4 py-2 text-gray-500">
                        <div className="flex items-center justify-between gap-3 whitespace-nowrap">
                          {new Date(sim.evaluated_at).toLocaleString()}
                          {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" /> : <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-gray-50/80">
                        <td colSpan={5} className="px-4 pb-4 pt-2">
                          <div className="rounded-lg border border-gray-200 bg-white p-4">
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                              <div><div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Exit code</div><div className="mt-1 font-mono text-sm text-gray-800">{sim.exit_code}</div></div>
                              <div><div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Latency</div><div className="mt-1 font-mono text-sm text-gray-800">{sim.total_latency_ms.toFixed(1)} ms</div></div>
                              <div><div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Audience</div><div className="mt-1 font-mono text-sm text-gray-800">{sim.summary.total} users</div></div>
                              <div><div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Evaluated</div><div className="mt-1 break-all font-mono text-xs text-gray-800">{sim.evaluated_at}</div></div>
                            </div>
                            <div className="mt-4 border-t border-gray-100 pt-3">
                              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Decision details</div>
                              {sim.decisions.length === 0 ? (
                                <p className="text-xs text-gray-500">No per-user decisions were recorded.</p>
                              ) : (
                                <div className="space-y-2">
                                  {sim.decisions.slice(0, 5).map((decision) => (
                                    <div key={decision.user_id} className="grid gap-1 text-xs sm:grid-cols-[7rem_7rem_1fr] sm:gap-3">
                                      <span className="font-mono text-gray-700">{decision.user_id}</span>
                                      <span className={`font-semibold ${decision.decision === 'receive' ? COLORS.RECEIVE.text : decision.decision === 'exclude' ? COLORS.EXCLUDE.text : COLORS.PARTIAL.text}`}>{DECISION_LABELS[decision.decision]}</span>
                                      <span className="text-gray-500">{decision.reason}</span>
                                    </div>
                                  ))}
                                  {sim.decisions.length > 5 && <p className="text-xs text-gray-400">+ {sim.decisions.length - 5} more decisions</p>}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
