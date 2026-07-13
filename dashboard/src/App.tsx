/**
 * Application Routing
 *
 * Maps URLs to page components.
 *
 * Design Principle: Consistency across surfaces.
 * Design Principle: Graceful failure is a feature.
 */
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import FlagList from './pages/FlagList';
import FlagEditor from './pages/FlagEditor';
import SimulationView from './pages/SimulationView';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';

function NavBar() {
  const location = useLocation();
  const isActive = (prefix: string) => location.pathname.startsWith(prefix);

  const linkClass = (active: boolean) =>
    `px-3 py-2 rounded text-sm font-medium ${
      active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link to="/flags" className="font-semibold text-lg text-gray-900">
          Jikken
        </Link>
        <div className="flex items-center space-x-1">
          <Link to="/flags" className={linkClass(isActive('/flags') && !isActive('/flags/history'))}>
            Flags
          </Link>
          <Link to="/flags/history" className={linkClass(isActive('/flags/history'))}>
            History
          </Link>
          <Link to="/settings" className={linkClass(isActive('/settings'))}>
            Settings
          </Link>
        </div>
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
    <Router>
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <Toaster position="top-right" />
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
      </div>
    </Router>
  );
}
