/**
 * HistoryPage Component
 *
 * Past simulations — real audit trail for engineers/auditors.
 *
 * Design Principle: Consistency — same result colors as CLI and SimulationView.
 */
import { useEffect, useState } from 'react';
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

  useEffect(() => {
    let cancelled = false;
    flagStore.listSimulations().then((result) => {
      if (cancelled) return;
      setSims([...result].reverse());
      setLoading(false);
    });
    return () => {
      cancelled = true;
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
                return (
                  <tr key={sim.simulation_id}>
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
