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
import { useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { SimulationResult } from '@jikken/shared';
import { COLORS, DECISION_LABELS, SCENARIOS, evaluateFlag, type ScenarioId } from '@jikken/shared';
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

function AudienceCharts({ summary }: { summary: SimulationResult['summary'] }) {
  const total = Math.max(summary.total, 1);
  const segments = [
    { label: 'Included', value: summary.passed, color: COLORS.RECEIVE.hex },
    { label: 'Excluded', value: summary.conflicted, color: COLORS.EXCLUDE.hex },
    { label: 'Needs Review', value: summary.warned, color: COLORS.PARTIAL.hex },
  ];
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const includedPercent = Math.round((summary.passed / total) * 100);
  const heldPercent = Math.round(((summary.conflicted + summary.warned) / total) * 100);

  return (
    <div className="grid gap-4 md:grid-cols-2" aria-label="Audience charts">
      <section className="rounded-lg bg-white p-4 shadow" aria-labelledby="decision-mix-title">
        <h3 id="decision-mix-title" className="text-sm font-semibold text-gray-900">Decision mix</h3>
        <p className="mt-1 text-xs text-gray-500">How the evaluated audience is classified.</p>
        <div className="mt-4 flex items-center gap-5">
          <div className="relative h-32 w-32 shrink-0">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" role="img" aria-label={`${summary.passed} included, ${summary.conflicted} excluded, ${summary.warned} need review`}>
              <circle cx="50" cy="50" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="12" />
              {segments.map((segment) => {
                const length = (segment.value / total) * circumference;
                const circle = (
                  <circle
                    key={segment.label}
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke={segment.color}
                    strokeWidth="12"
                    strokeDasharray={`${length} ${circumference - length}`}
                    strokeDashoffset={-offset}
                  />
                );
                offset += length;
                return circle;
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold text-gray-900">{summary.total}</span>
              <span className="text-[10px] uppercase tracking-wide text-gray-500">users</span>
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            {segments.map((segment) => (
              <div key={segment.label} className="flex items-center justify-between gap-3 text-xs">
                <span className="flex min-w-0 items-center gap-2 text-gray-600">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: segment.color }} />
                  {segment.label}
                </span>
                <span className="font-mono font-semibold text-gray-900">{segment.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-lg bg-white p-4 shadow" aria-labelledby="eligibility-title">
        <h3 id="eligibility-title" className="text-sm font-semibold text-gray-900">Governance signal</h3>
        <p className="mt-1 text-xs text-gray-500">Who can proceed versus who is held by policy.</p>
        <div className="mt-6 space-y-5">
          <div>
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="text-gray-600">Eligible</span>
              <span className="font-mono font-semibold text-gray-900">{includedPercent}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full" style={{ width: `${includedPercent}%`, backgroundColor: COLORS.RECEIVE.hex }} />
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="text-gray-600">Held by governance</span>
              <span className="font-mono font-semibold text-gray-900">{heldPercent}%</span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full" style={{ width: `${(summary.conflicted / total) * 100}%`, backgroundColor: COLORS.EXCLUDE.hex }} />
              <div className="h-full" style={{ width: `${(summary.warned / total) * 100}%`, backgroundColor: COLORS.PARTIAL.hex }} />
            </div>
          </div>
          <p className="rounded bg-gray-50 p-2.5 text-xs leading-relaxed text-gray-600">
            Excluded users are blocked. Needs Review users remain ineligible until targeting is approved.
          </p>
        </div>
      </section>
    </div>
  );
}

export default function SimulationView({ simulationResult: providedResult }: SimulationViewProps) {
  const params = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const flagId = params.id;
  const scenarioParam = searchParams.get('scenario');
  const demoScenario = scenarioParam && scenarioParam in SCENARIOS
    ? SCENARIOS[scenarioParam as ScenarioId]
    : null;

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<SimulationResult | undefined>(providedResult);
  const [running, setRunning] = useState(false);

  const runSimulation = () => {
    if (!flagId) return;
    setRunning(true);
    if (demoScenario) {
      setResult(evaluateFlag(demoScenario.flag, demoScenario.users));
      setRunning(false);
      return;
    }
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
  }, [flagId, scenarioParam]);

  useEffect(() => {
    if (!demoScenario || !result) return;
    const firstExcluded = result.decisions.find((decision) => decision.decision === 'exclude');
    if (firstExcluded) setExpanded(new Set([firstExcluded.user_id]));
  }, [demoScenario, result?.simulation_id]);

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
      {demoScenario && (
        <div data-tutorial="scenario-context" className="p-4 bg-gray-900 text-white rounded-lg shadow">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Proposed targeting change</div>
          <div className="mt-1 text-lg font-semibold">{demoScenario.story.title}</div>
          <p className="mt-1 text-sm text-gray-300">{demoScenario.story.summary}</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded bg-white/10 p-3">
              <div className="text-xs uppercase tracking-wide text-gray-400">Live</div>
              <div className="mt-1">Dark Mode is available to everyone.</div>
            </div>
            <div className="rounded bg-red-500/15 p-3">
              <div className="text-xs uppercase tracking-wide text-red-300">Proposed</div>
              <div className="mt-1">Exclude @internal.company.com accounts.</div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Card — always visible first */}
      <div data-tutorial="simulation-summary" className="p-4 bg-white rounded-lg shadow">
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
            <div className="text-sm text-gray-600">Included</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{summary.conflicted}</div>
            <div className="text-sm text-gray-600">Excluded</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">{summary.warned}</div>
            <div className="text-sm text-gray-600">Needs Review</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-600">{summary.total}</div>
            <div className="text-sm text-gray-600">Total Mock Users</div>
          </div>
        </div>
      </div>

      <AudienceCharts summary={summary} />

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
                data-tutorial={dec.decision === 'exclude' && decisions.find((item) => item.decision === 'exclude')?.user_id === dec.user_id ? 'excluded-decision' : undefined}
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
                      {DECISION_LABELS[dec.decision]}
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
