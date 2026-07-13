/**
 * Application Routing
 *
 * Maps URLs to page components.
 *
 * Design Principle: Consistency across surfaces.
 * Design Principle: Graceful failure is a feature.
 */
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import FlagList from './pages/FlagList';
import FlagEditor from './pages/FlagEditor';
import SimulationView from './pages/SimulationView';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import {
  connectTutorialBridge,
  emitTutorialEvent,
  TUTORIAL_ANCHORS,
} from './tutorial/bridge';

function TutorialBridge() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => connectTutorialBridge(navigate), [navigate]);

  useEffect(() => {
    if (location.pathname === '/flags/history') {
      emitTutorialEvent({ type: 'jikken:tutorial:event', event: 'history-opened' });
    }
  }, [location.pathname]);

  return null;
}

// Left-hand nav column — Flags / History / Settings stacked vertically,
// instead of a top bar, so the dashboard reads as a two-column app.
function NavBar() {
  const location = useLocation();
  const isActive = (prefix: string) => location.pathname.startsWith(prefix);

  const linkClass = (active: boolean) =>
    `block px-3 py-2 rounded text-sm font-medium ${
      active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <nav className="w-48 shrink-0 bg-white border-r border-gray-200 flex flex-col">
      <Link to="/flags" className="font-semibold text-lg text-gray-900 px-4 py-4 border-b border-gray-200">
        Jikken
      </Link>
      <div className="flex flex-col gap-1 p-3">
        <Link to="/flags" className={linkClass(isActive('/flags') && !isActive('/flags/history'))}>
          Flags
        </Link>
        <Link
          to="/flags/history"
          className={linkClass(isActive('/flags/history'))}
          data-tutorial={TUTORIAL_ANCHORS.historyNav}
          onClick={() => emitTutorialEvent({
            type: 'jikken:tutorial:event',
            event: 'user-action',
            anchor: TUTORIAL_ANCHORS.historyNav,
          })}
        >
          History
        </Link>
        <Link to="/settings" className={linkClass(isActive('/settings'))}>
          Settings
        </Link>
      </div>
    </nav>
  );
}

function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-gray-800 mb-2">Page Not Found</h1>
        <p className="text-gray-600 mb-4">The page you&rsquo;re looking for doesn&rsquo;t exist.</p>
        <Link to="/flags" className="text-blue-600 hover:text-blue-800 underline">
          Go to Flags
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <div className="h-screen bg-gray-50 flex">
        <TutorialBridge />
        <NavBar />
        <Toaster position="top-right" />
        <main className="flex-1 min-w-0 overflow-y-auto">
          <Routes>
            {/* Default route */}
            <Route path="/" element={<FlagList />} />

            {/* Flag workflows */}
            <Route path="/flags" element={<FlagList />} />
            <Route path="/flags/history" element={<HistoryPage />} />
            <Route path="/flags/edit/:id" element={<FlagEditor />} />
            <Route path="/flags/simulate/:id" element={<SimulationView />} />

            {/* Settings */}
            <Route path="/settings" element={<SettingsPage />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
