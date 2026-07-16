import { ArrowRight, Github } from 'lucide-react';
import { Link } from 'react-router-dom';
import { JikkenMark } from '@/components/JikkenMark';

/** Public, shareable product-film page. Authentication is intentionally not required. */
export default function Walkthrough() {
  return (
    <main style={{ minHeight: '100dvh', boxSizing: 'border-box', padding: 'clamp(1.25rem, 4vw, 3.5rem)', background: 'var(--stone-50)', color: 'var(--portfolio-text-primary)' }}>
      <div style={{ width: 'min(1120px, 100%)', margin: '0 auto' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: 'clamp(2rem, 5vw, 4.5rem)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '1.15rem', fontWeight: 'var(--font-weight-bold)' }}>
            <JikkenMark size={22} />
            <span>Jikken</span>
          </div>
          <a href="https://github.com/RHI-Org/jikken" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--portfolio-text-secondary)', fontSize: '0.78rem', fontWeight: 'var(--font-weight-semibold)', textDecoration: 'none' }}>
            <Github size={15} />
            View repository
          </a>
        </header>

        <section style={{ maxWidth: 760, marginBottom: '1.75rem' }}>
          <div style={{ color: '#1d4ed8', fontSize: '0.68rem', fontWeight: 'var(--font-weight-bold)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Product walkthrough · 82 seconds
          </div>
          <h1 style={{ margin: '0.65rem 0 0', fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem, 5vw, 4rem)', lineHeight: 1.05, letterSpacing: '-0.025em' }}>
            See a risky change before it ships.
          </h1>
          <p style={{ margin: '1rem 0 0', maxWidth: 690, color: 'var(--portfolio-text-secondary)', fontSize: 'clamp(0.95rem, 1.7vw, 1.15rem)', lineHeight: 1.65 }}>
            Follow one feature-flag decision through the CLI, Dashboard, SDK, and CI gate—from audience impact to enforceable governance.
          </p>
        </section>

        <div style={{ padding: 'clamp(0.45rem, 1vw, 0.75rem)', border: '1px solid var(--portfolio-border)', borderRadius: '0.9rem', background: '#1c1917', boxShadow: '0 24px 70px rgba(28, 25, 23, 0.18)' }}>
          <video controls playsInline preload="metadata" poster="/media/jikken-walkthrough-poster-upscaled.png" style={{ display: 'block', width: '100%', aspectRatio: '353 / 270', objectFit: 'contain', borderRadius: '0.55rem', background: '#000' }} aria-label="Narrated Jikken product walkthrough">
            <source src="/media/jikken-walkthrough.mp4?v=2" type="video/mp4" />
            Your browser does not support embedded video. <a href="/media/jikken-walkthrough.mp4?v=2">Open the walkthrough video</a>.
          </video>
        </div>

        <footer style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem', paddingBottom: '1rem' }}>
          <span style={{ color: 'var(--portfolio-text-muted)', fontSize: '0.78rem' }}>
            Designed and built by Ryan Hanau
          </span>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 0.9rem', borderRadius: '0.45rem', background: 'var(--portfolio-text-primary)', color: '#fff', fontSize: '0.78rem', fontWeight: 'var(--font-weight-semibold)', textDecoration: 'none' }}>
            Open Jikken
            <ArrowRight size={14} />
          </Link>
        </footer>
      </div>
    </main>
  );
}
