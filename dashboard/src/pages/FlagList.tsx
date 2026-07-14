/**
 * FlagList Component
 *
 * Landing page — shows all flags with status badges.
 *
 * Design Principle: Output scannable in 3 seconds.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { FEATURES, type FlagConfig } from '@jikken/shared';
import { flagStore } from '@/store/flagStore';

function FlagPortfolioCharts({ flags }: { flags: FlagConfig[] }) {
  const active = flags.filter((flag) => flag.enabled).length;
  const inactive = flags.length - active;
  const averageRollout = Math.round(
    flags.reduce((sum, flag) => sum + flag.rollout_percentage, 0) / flags.length,
  );
  const circumference = 2 * Math.PI * 38;
  const activeLength = (active / flags.length) * circumference;

  return (
    <section className="mb-6" aria-labelledby="portfolio-overview-title">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 id="portfolio-overview-title" className="text-sm font-semibold text-gray-900">Portfolio overview</h2>
          <p className="mt-0.5 text-xs text-gray-500">Current flag status and rollout exposure.</p>
        </div>
        <span className="text-xs text-gray-500">{averageRollout}% average rollout</span>
      </div>

      <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg bg-white p-4 shadow">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Flag status</h3>
          <div className="mt-3 flex items-center gap-5">
            <div className="relative h-28 w-28 shrink-0">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" role="img" aria-label={`${active} active flags and ${inactive} inactive flags`}>
                <circle cx="50" cy="50" r="38" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="12"
                  strokeDasharray={`${activeLength} ${circumference - activeLength}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold text-gray-900">{flags.length}</span>
                <span className="text-[10px] uppercase tracking-wide text-gray-500">flags</span>
              </div>
            </div>
            <div className="min-w-0 flex-1 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-gray-600"><span className="h-2.5 w-2.5 rounded-sm bg-blue-600" />Active</span>
                <span className="font-mono font-semibold text-gray-900">{active}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-gray-600"><span className="h-2.5 w-2.5 rounded-sm bg-gray-200" />Inactive</span>
                <span className="font-mono font-semibold text-gray-900">{inactive}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Rollout by flag</h3>
          <div className="mt-4 space-y-3">
            {flags.map((flag) => (
              <div key={flag.id}>
                <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                  <span className="truncate font-medium text-gray-700">{flag.name}</span>
                  <span className="shrink-0 font-mono text-gray-600">{flag.rollout_percentage}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${flag.enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                    style={{ width: `${flag.rollout_percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function filterFlags(flags: FlagConfig[], query: string): FlagConfig[] {
  const normalizedQuery = query.trim().toLowerCase();
  return flags.filter((flag) =>
    [
      flag.name,
      flag.id,
      flag.description ?? '',
      flag.environment,
      flag.enabled ? 'active' : 'inactive',
    ].some((value) => value.toLowerCase().includes(normalizedQuery)),
  );
}

export default function FlagList() {
  const [flags, setFlags] = useState<FlagConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    flagStore.listFlags().then((result) => {
      if (cancelled) return;
      setFlags(result);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredFlags = filterFlags(flags, query);
  const catalogFlagIds = new Set<string>(FEATURES.map((feature) => feature.id));

  return (
    <div className="max-w-4xl mx-auto px-8 pt-10 pb-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Feature Flags</h1>
        <Link
          to="/flags/edit/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          New Flag
        </Link>
      </div>

      {!loading && flags.length > 0 && (
        <div className="relative mb-6">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search flags by name, ID, environment, or status"
            aria-label="Search feature flags"
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-10 text-sm text-gray-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear flag search" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : flags.length === 0 ? (
        <p className="text-gray-500">No flags yet. Create your first one.</p>
      ) : (
        <>
          <FlagPortfolioCharts flags={flags} />
          {filteredFlags.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
              No flags match “{query}”.
            </div>
          ) : <div className="space-y-3">
            {filteredFlags.map((flag) => (
              <Link
                key={flag.id}
                to={`/flags/simulate/${flag.id}${catalogFlagIds.has(flag.id) ? '?scenario=conflict' : ''}`}
                className="block p-4 bg-white rounded-lg shadow hover:shadow-md transition"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-lg">{flag.name}</div>
                    <div className="text-sm text-gray-500 font-mono">{flag.id}</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs uppercase tracking-wide text-gray-500">
                      {flag.environment}
                    </span>
                    <span className="text-sm text-gray-600">{flag.rollout_percentage}%</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        flag.enabled ? 'bg-green-200 text-green-700' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {flag.enabled ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>}
        </>
      )}
    </div>
  );
}
