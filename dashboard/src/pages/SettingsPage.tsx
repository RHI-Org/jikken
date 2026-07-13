/**
 * SettingsPage Component
 *
 * API configuration and environment reference.
 *
 * Design Principle: Transparent reasoning — the page explains where auth comes from.
 */
import { useEffect, useState } from 'react';
import type { Environment } from '@jikken/shared';

const API_BASE_KEY = 'jikken-api-base-url';
const ENVIRONMENTS: Environment[] = ['development', 'staging', 'production'];

export default function SettingsPage() {
  const [apiBase, setApiBase] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setApiBase(localStorage.getItem(API_BASE_KEY) ?? '');
  }, []);

  const handleSave = () => {
    localStorage.setItem(API_BASE_KEY, apiBase);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <section>
        <h2 className="text-lg font-semibold mb-2">Environments</h2>
        <p className="text-sm text-gray-500 mb-3">
          Every flag is scoped to exactly one of these environments.
        </p>
        <ul className="flex space-x-2">
          {ENVIRONMENTS.map((env) => (
            <li
              key={env}
              className="px-3 py-1 bg-gray-100 rounded text-sm font-mono text-gray-700"
            >
              {env}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">API Base URL</h2>
        <p className="text-sm text-gray-500 mb-3">
          Used when the dashboard is wired to a live API instead of local storage.
        </p>
        <div className="flex space-x-3">
          <input
            type="text"
            value={apiBase}
            onChange={(e) => setApiBase(e.target.value)}
            placeholder="https://api.example.com"
            className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Authentication</h2>
        <p className="text-sm text-gray-500">
          Auth is handled by SSO — a session cookie shared across every Jikken and
          Experience Plus surface. There is nothing to configure here.
        </p>
      </section>
    </div>
  );
}
