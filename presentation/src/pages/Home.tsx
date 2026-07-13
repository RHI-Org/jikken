/**
 * Placeholder protected landing page.
 *
 * Replaced by the real presentation shell in Phase 6 — this just proves the
 * auth gate works end to end (login → session → protected route → sign out).
 */
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Home: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
      <div style={{ fontWeight: 'var(--font-weight-bold)', fontSize: '1.4rem' }}>Jikken</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--portfolio-text-muted)' }}>
        Signed in as {user?.email}
      </div>
      <button
        onClick={signOut}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          marginTop: '0.5rem',
          padding: '0.5rem 0.9rem',
          borderRadius: '0.5rem',
          border: '1px solid var(--portfolio-border)',
          backgroundColor: 'transparent',
          fontSize: '0.85rem',
          cursor: 'pointer',
          color: 'var(--portfolio-text-secondary)',
        }}
      >
        <LogOut size={14} />
        Sign out
      </button>
    </div>
  );
};

export default Home;
