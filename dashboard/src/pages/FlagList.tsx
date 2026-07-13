/**
 * FlagList Component
 *
 * Landing page — shows all flags with status badges.
 *
 * Design Principle: Output scannable in 3 seconds.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { FlagConfig } from '@jikken/shared';
import { flagStore } from '@/store/flagStore';

export default function FlagList() {
  const [flags, setFlags] = useState<FlagConfig[]>([]);
  const [loading, setLoading] = useState(true);

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

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : flags.length === 0 ? (
        <p className="text-gray-500">No flags yet. Create your first one.</p>
      ) : (
        <div className="space-y-3">
          {flags.map((flag) => (
            <Link
              key={flag.id}
              to={`/flags/simulate/${flag.id}`}
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
        </div>
      )}
    </div>
  );
}
