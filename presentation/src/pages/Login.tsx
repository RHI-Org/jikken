/**
 * Login Page — Supabase Authentication.
 *
 * Split-screen pattern matching folio: the sign-in form on the left, an
 * on-brand panel on the right. A session created here is a session created
 * anywhere on .experienceplus.ai, and vice versa — no separate Jikken account.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AsciiAnimation from '@/components/AsciiAnimation';
import { JikkenMark } from '@/components/JikkenMark';

const inputStyle: React.CSSProperties = {
  padding: '0.65rem 0.85rem',
  borderRadius: '0.5rem',
  border: '1px solid var(--portfolio-border)',
  fontSize: '0.9rem',
  fontFamily: 'var(--font-sans)',
  backgroundColor: '#fff',
  color: 'var(--portfolio-text-primary)',
};

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

  const { user, signIn, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  if (loading) return null;
  if (user) {
    const from = (location.state as { from?: Location })?.from;
    return <Navigate to={from?.pathname ?? '/'} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);
    if (error) {
      setError('Invalid email or password.');
      emailInputRef.current?.focus();
    }
  };

  return (
    <div className="jk-login">
      {/* Left — sign-in form */}
      <div className="jk-login__form">
        <div style={{ width: 'min(360px, 100%)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem', fontWeight: 'var(--font-weight-bold)', fontSize: '2.25rem', letterSpacing: '0.01em', color: 'var(--portfolio-text-primary)' }}>
              <JikkenMark size={34} />
              <span>Jikken</span>
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.9rem', margin: '1.1rem 0' }}>
              <div style={{ width: '5rem', height: '1px', background: 'var(--portfolio-border)' }} />
              <Lock size={20} style={{ color: 'var(--portfolio-text-faint)' }} />
              <div style={{ width: '5rem', height: '1px', background: 'var(--portfolio-border)' }} />
            </div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--portfolio-text-muted)' }}>
              Feature Flag Lifecycle Tool
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input
              ref={emailInputRef}
              type="email"
              required
              autoFocus
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              style={inputStyle}
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              style={inputStyle}
            />

            {error && <div style={{ fontSize: '0.8rem', color: '#b91c1c' }}>{error}</div>}

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.65rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: 'var(--portfolio-btn-bg)',
                color: 'var(--portfolio-btn-text)',
                fontSize: '0.9rem',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: isLoading ? 'default' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? <Loader2 size={16} className="jk-spin" /> : null}
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Legal notices — same as folio */}
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <p style={{ margin: '0 0 0.4rem', fontSize: '0.7rem', color: 'var(--portfolio-text-faint)' }}>
              © {new Date().getFullYear()} Ryan Hanau, Inc., All Rights Reserved
            </p>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.7rem', color: 'var(--portfolio-text-faint)' }}>
              We use limited cookies as described in our Privacy Policy.
            </p>
            <div style={{ fontSize: '0.7rem' }}>
              <a href="https://www.ryanh.com/terms-and-conditions" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--portfolio-text-subtle)', textDecoration: 'none' }}>
                Terms of Use/Notices
              </a>
              <span style={{ color: 'var(--portfolio-text-faint)', margin: '0 0.6rem' }}>·</span>
              <a href="https://www.ryanh.com/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--portfolio-text-subtle)', textDecoration: 'none' }}>
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Right — same ASCII animation as Folio's login. */}
      <aside className="jk-login__aside">
        <AsciiAnimation />
      </aside>
    </div>
  );
};

export default Login;
