/**
 * Protected landing — the presentation shell (Phase 6). Auth is enforced by
 * ProtectedRoute upstream; the shared .experienceplus.ai SSO cookie carries
 * the session in, so there's no separate login step here.
 */
import { Shell } from '@/shell/Shell';

const Home: React.FC = () => <Shell />;

export default Home;
