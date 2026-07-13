/**
 * Protected landing — the presentation shell (Phase 6). Auth is enforced by
 * ProtectedRoute upstream; the shared .experienceplus.ai SSO cookie carries
 * the session in, so there's no separate login step here.
 */
import { Shell } from '@/shell/Shell';
import { TutorialOverlay, TutorialProvider, jikkenTutorialSteps } from '@/tutorial';

const Home: React.FC = () => (
  <TutorialProvider steps={jikkenTutorialSteps}>
    <Shell />
    <TutorialOverlay />
  </TutorialProvider>
);

export default Home;
