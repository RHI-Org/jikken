/**
 * Login Page — Supabase Authentication
 *
 * Same email/password flow as folio. A session created here is a session
 * created anywhere on .experienceplus.ai, and vice versa — no separate
 * Jikken account.
 */
import React, { useState, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

  const { user, signIn, loading } = useAuth();
  const location = useLocation();

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--portfolio-page-bg)' }}>
      <div style={{ width: 'min(360px, 90vw)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontWeight: 'var(--font-weight-bold)', fontSize: '1.4rem', letterSpacing: '0.02em', color: 'var(--portfolio-text-primary)' }}>
            Jikken
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--portfolio-text-muted)', marginTop: '0.25rem' }}>
            Feature Flag Lifecycle Tool
          </div>
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
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--portfolio-border)',
              fontSize: '0.9rem',
              fontFamily: 'var(--font-sans)',
              backgroundColor: '#fff',
            }}
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--portfolio-border)',
              fontSize: '0.9rem',
              fontFamily: 'var(--font-sans)',
              backgroundColor: '#fff',
            }}
          />

          {error && (
            <div style={{ fontSize: '0.8rem', color: '#b91c1c' }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoading}
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
            {isLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Lock size={14} />}
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
