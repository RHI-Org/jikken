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
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import type { SimulationResult } from '@jikken/shared';
import { COLORS } from '@jikken/shared';
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
                return (
                  <tr
                    key={sim.simulation_id}
                    className={isPulsing ? 'jk-row-pulse' : undefined}
                    data-tutorial={index === 0 ? TUTORIAL_ANCHORS.latestHistoryRow : undefined}
                    onClick={index === 0 ? () => emitTutorialEvent({
                      type: 'jikken:tutorial:event',
                      event: 'user-action',
                      anchor: TUTORIAL_ANCHORS.latestHistoryRow,
                    }) : undefined}
                  >
                    <td className="px-4 py-2 font-mono text-xs text-gray-600">{sim.simulation_id}</td>
                    <td className="px-4 py-2">
                      <Link
                        to={`/flags/simulate/${sim.flag_id}`}
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
                      {new Date(sim.evaluated_at).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
