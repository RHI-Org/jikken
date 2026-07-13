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
import { JikkenMark } from './components/JikkenMark';
import { Bell, UserCircle } from 'lucide-react';
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

// Full-width product header. Navigation lives in the persistent sidebar below,
// leaving this row for identity and account-level utilities.
function TopBar() {
  return (
    <header className="h-16 w-full shrink-0 bg-white border-b border-gray-200 flex items-center px-5">
      <Link to="/flags" className="flex items-center gap-2 font-semibold text-lg text-gray-900">
        <JikkenMark size={20} />
        <span>Jikken</span>
      </Link>
      <div className="ml-auto flex items-center gap-3 text-gray-500">
        <button type="button" aria-label="Notifications" title="Notifications coming soon" className="relative grid place-items-center w-9 h-9 rounded-full hover:bg-gray-100">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-blue-600" />
        </button>
        <div className="h-6 w-px bg-gray-200" />
        <button type="button" aria-label="User menu" title="User menu coming soon" className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-gray-100">
          <UserCircle size={25} />
          <span className="text-xs font-medium text-gray-700">Demo user</span>
        </button>
      </div>
    </header>
  );
}

function SideNav() {
  const location = useLocation();
  const isActive = (prefix: string) => location.pathname.startsWith(prefix);

  const linkClass = (active: boolean) =>
    `block px-3 py-2 rounded-md text-sm font-medium ${
      active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <aside className="w-48 shrink-0 bg-white border-r border-gray-200 px-3 py-5">
      <div className="px-3 pb-3 text-[0.65rem] font-semibold uppercase tracking-wider text-gray-400">Workspace</div>
      <nav className="flex flex-col gap-1" aria-label="Dashboard navigation">
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
      </nav>
    </aside>
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
      <div className="h-screen bg-gray-50 flex flex-col">
        <TutorialBridge />
        <TopBar />
        <Toaster position="top-right" />
        <div className="flex flex-1 min-h-0">
          <SideNav />
          <main className="flex-1 min-h-0 min-w-0 overflow-y-auto">
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
      </div>
    </Router>
  );
}
