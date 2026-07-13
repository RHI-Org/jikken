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
import type { SimulationResult } from '@jikken/shared';
import { COLORS } from '@jikken/shared';
import { flagStore } from '@/store/flagStore';

const RESULT_STYLE: Record<SimulationResult['result'], { bg: string; text: string; label: string }> = {
  all_clear: { bg: COLORS.RECEIVE.bg, text: COLORS.RECEIVE.text, label: 'ALL CLEAR' },
  conflict: { bg: COLORS.EXCLUDE.bg, text: COLORS.EXCLUDE.text, label: 'CONFLICT' },
  warning: { bg: COLORS.PARTIAL.bg, text: COLORS.PARTIAL.text, label: 'WARNING' },
};

export default function HistoryPage() {
  const [sims, setSims] = useState<SimulationResult[]>([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Simulation History</h1>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : sims.length === 0 ? (
        <p className="text-gray-500">No simulations have been run yet.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-2">Simulation</th>
                <th className="px-4 py-2">Flag</th>
                <th className="px-4 py-2">Result</th>
                <th className="px-4 py-2">Passed / Conflicted / Warned</th>
                <th className="px-4 py-2">Evaluated At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sims.map((sim) => {
                const style = RESULT_STYLE[sim.result];
                const isPulsing = pulsing.has(sim.simulation_id);
                return (
                  <tr
                    key={sim.simulation_id}
                    className={isPulsing ? 'jk-row-pulse' : undefined}
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
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${style.bg} ${style.text}`}>
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
