/** Workspace configuration reference — only shows settings the app actually uses. */
import { Database, LockKeyhole, Server } from 'lucide-react';
import type { Environment } from '@jikken/shared';
import { hasSupabase } from '@/integrations/supabase/client';

const ENVIRONMENTS: Array<{ id: Environment; description: string }> = [
  { id: 'development', description: 'Local work and early validation' },
  { id: 'staging', description: 'Pre-production review and testing' },
  { id: 'production', description: 'Live customer traffic' },
];

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Workspace configuration used by this dashboard.</p>
      </header>

      <section className="rounded-lg bg-white p-5 shadow">
        <div className="flex items-start gap-3">
          <Database className="mt-0.5 h-5 w-5 text-blue-600" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold text-gray-900">Data source</h2>
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${hasSupabase ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {hasSupabase ? 'Connected' : 'Demo mode'}
              </span>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-gray-500">
              {hasSupabase
                ? 'Flags and simulation history are stored in Supabase. History updates in real time across surfaces.'
                : 'Supabase is not configured, so flags and simulations are stored in this browser for the demo.'}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-lg bg-white p-5 shadow">
        <div className="mb-4 flex items-start gap-3">
          <Server className="mt-0.5 h-5 w-5 text-blue-600" aria-hidden="true" />
          <div>
            <h2 className="font-semibold text-gray-900">Environments</h2>
            <p className="mt-1 text-sm text-gray-500">Every flag belongs to one deployment environment.</p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {ENVIRONMENTS.map((environment) => (
            <div key={environment.id} className="rounded-md border border-gray-200 p-3">
              <div className="font-mono text-xs font-semibold capitalize text-gray-800">{environment.id}</div>
              <div className="mt-1 text-xs leading-relaxed text-gray-500">{environment.description}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg bg-white p-5 shadow">
        <div className="flex items-start gap-3">
          <LockKeyhole className="mt-0.5 h-5 w-5 text-blue-600" aria-hidden="true" />
          <div>
            <h2 className="font-semibold text-gray-900">Authentication</h2>
            <p className="mt-1 text-sm leading-relaxed text-gray-500">
              Access is managed by the shared organization SSO session. There are no dashboard-specific credentials to configure.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
