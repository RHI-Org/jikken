/**
 * SimulationView Component
 *
 * Displays simulated audience distribution with expandable decision trace.
 * Includes Copy to Clipboard and Export PDF functionality.
 *
 * Design Principle: Output scannable in 3 seconds.
 * Design Principle: Progressive disclosure.
 * Design Principle: Consistency — same colors as CLI.
 * Design Principle: Transparent reasoning — every decision explained.
 */
import { ChevronDown, ChevronRight, Copy, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { SimulationResult } from '@jikken/shared';
import { COLORS } from '@jikken/shared';
import { flagStore } from '@/store/flagStore';
import { exportToPDF, formatResultForClipboard } from '@/utils/export';

interface SimulationViewProps {
  simulationResult?: SimulationResult;
}

const styleMap = {
  receive: COLORS.RECEIVE,
  exclude: COLORS.EXCLUDE,
  partial: COLORS.PARTIAL,
} as const;

export default function SimulationView({ simulationResult: providedResult }: SimulationViewProps) {
  const params = useParams<{ id: string }>();
  const flagId = params.id;

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<SimulationResult | undefined>(providedResult);
  const [running, setRunning] = useState(false);

  const runSimulation = () => {
    if (!flagId) return;
    setRunning(true);
    flagStore
      .runSimulation(flagId)
      .then((sim) => setResult(sim))
      .finally(() => setRunning(false));
  };

  useEffect(() => {
    if (providedResult) return;
    if (!flagId) return;
    runSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flagId]);

  const toggleExpand = (userId: string) => {
    const next = new Set(expanded);
    if (next.has(userId)) {
      next.delete(userId);
    } else {
      next.add(userId);
    }
    setExpanded(next);
  };

  const handleCopy = async () => {
    if (!result) return;
    const text = formatResultForClipboard(result);
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Results copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleExportPDF = () => {
    if (!result) return;
    exportToPDF({
      title: `Flag Simulation: ${result.flag_id}`,
      meta: result,
      summary: result.summary,
      decisions: result.decisions,
    });
    toast.success('Report exported to PDF');
  };

  if (!result) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-gray-500">{running ? 'Running simulation...' : 'No simulation yet.'}</p>
      </div>
    );
  }

  const { summary, decisions, flag_id } = result;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Summary Card — always visible first */}
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">Simulation Summary</h3>
            <p className="text-xs text-gray-500 font-mono">{flag_id}</p>
          </div>

          {/* Export / Copy buttons */}
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={runSimulation}
              className="flex items-center px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700"
              title="Re-run simulation"
            >
              Re-run simulation
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700"
              title="Copy results to clipboard"
            >
              <Copy className="w-4 h-4 mr-1" />
              Copy
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              className="flex items-center px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700"
              title="Export report as PDF"
            >
              <Download className="w-4 h-4 mr-1" />
              PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">{summary.passed}</div>
            <div className="text-sm text-gray-600">Would Receive</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{summary.conflicted}</div>
            <div className="text-sm text-gray-600">Excluded</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">{summary.warned}</div>
            <div className="text-sm text-gray-600">Partial Match</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-600">{summary.total}</div>
            <div className="text-sm text-gray-600">Total Mock Users</div>
          </div>
        </div>
      </div>

      {/* Decision Trace Tree */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Audience Distribution</h3>
        <div className="space-y-2">
          {decisions.map((dec) => {
            const style = styleMap[dec.decision];
            const isExpanded = expanded.has(dec.user_id);

            return (
              <div
                key={dec.user_id}
                className={`border-l-4 pl-4 py-3 ${style.bg} ${style.border} rounded-r`}
              >
                <div
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => toggleExpand(dec.user_id)}
                >
                  <div>
                    <div className="font-medium">{dec.user_id}</div>
                    <div className="text-xs text-gray-500">
                      {dec.matched_rules.join(' • ') || 'No rules matched'}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${style.bg} ${style.text}`}>
                      {dec.decision.toUpperCase()}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-sm">
                      <strong className="text-gray-700">Reason:</strong>{' '}
                      <span className="text-gray-600">{dec.reason}</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 font-mono">
                      Rules: {dec.rule_sources.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
