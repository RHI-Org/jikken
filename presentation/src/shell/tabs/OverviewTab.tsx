/**
 * Overview tab — a concise operating guide for the live application.
 */
import { INTRO, PRODUCT_SECTIONS, HOWTO } from '../data/overview';
import { ArrowRight, Play, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const microLabel: React.CSSProperties = {
  fontSize: '0.65rem',
  fontWeight: 'var(--font-weight-bold)',
  letterSpacing: '0.08em',
  color: 'var(--portfolio-text-faint)',
  textTransform: 'uppercase',
};

export function OverviewTab({
  onStartTutorial,
  onOpenCommands,
}: {
  onStartTutorial: () => void;
  onOpenCommands: () => void;
}) {
  const [videoOpen, setVideoOpen] = useState(false);

  useEffect(() => {
    if (!videoOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setVideoOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [videoOpen]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      <div>
        <div style={microLabel}>WHAT IT IS</div>
        <p style={{ margin: '0.55rem 0 0', fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--portfolio-text-primary)' }}>
          {INTRO}
        </p>
      </div>

      <section style={{ padding: '1rem', border: '1px solid #bfdbfe', borderRadius: '0.65rem', background: '#eff6ff', boxShadow: '0 1px 3px rgba(37, 99, 235, 0.12)' }}>
        <div style={{ ...microLabel, color: '#1d4ed8' }}>Choose your walkthrough</div>
        <div style={{ marginTop: '0.35rem', fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: 'var(--font-weight-semibold)', color: 'var(--portfolio-text-primary)' }}>
          Follow one risky change end to end
        </div>
        <p style={{ margin: '0.35rem 0 0.85rem', fontSize: '0.78rem', lineHeight: 1.55, color: 'var(--portfolio-text-secondary)' }}>
          Watch the 83-second recording or explore the CLI, Dashboard, SDK, and CI gate yourself.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <button type="button" onClick={() => setVideoOpen(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.7rem 0.6rem', border: 0, borderRadius: '0.45rem', background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 'var(--font-weight-semibold)' }}>
            <Play size={13} fill="currentColor" />
            Watch video
          </button>
          <button type="button" onClick={onStartTutorial} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.7rem 0.6rem', border: '1px solid #93c5fd', borderRadius: '0.45rem', background: '#fff', color: '#1d4ed8', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 'var(--font-weight-semibold)' }}>
            <ArrowRight size={13} />
            Interactive tour
          </button>
        </div>
      </section>

      {videoOpen && (
        <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setVideoOpen(false); }} style={{ position: 'fixed', inset: 0, zIndex: 20_000, display: 'grid', placeItems: 'center', padding: '1.5rem', background: 'rgba(250, 250, 249, 0.88)', backdropFilter: 'blur(8px)' }}>
          <div role="dialog" aria-modal="true" aria-labelledby="walkthrough-video-title" style={{ width: 'min(1100px, 94vw, calc((92vh - 64px) * 353 / 270))', overflow: 'hidden', border: '1px solid var(--portfolio-border)', borderRadius: '0.75rem', background: '#fff', boxShadow: '0 24px 80px rgba(28, 25, 23, 0.24)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0.65rem 0.75rem', color: 'var(--portfolio-text-primary)', background: '#fff', borderBottom: '1px solid var(--portfolio-border-muted)' }}>
              <div id="walkthrough-video-title" style={{ fontSize: '0.85rem', fontWeight: 'var(--font-weight-semibold)' }}>Jikken product walkthrough · 83 sec</div>
              <button type="button" autoFocus onClick={() => setVideoOpen(false)} aria-label="Close walkthrough video" style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, padding: 0, border: '1px solid var(--portfolio-border)', borderRadius: '0.4rem', background: 'var(--portfolio-bg-card-alt)', color: 'var(--portfolio-text-primary)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
            <video autoPlay controls playsInline preload="metadata" poster="/media/jikken-walkthrough-poster-upscaled.png" style={{ display: 'block', width: '100%', aspectRatio: '353 / 270', objectFit: 'contain', background: '#fff' }} aria-label="Narrated Jikken product walkthrough">
              <source src="/media/jikken-walkthrough.mp4" type="video/mp4" />
              Your browser does not support embedded video. <a href="/media/jikken-walkthrough.mp4">Open the walkthrough video</a>.
            </video>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onOpenCommands}
        style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: 0, border: 0, background: 'none', color: 'var(--portfolio-text-muted)', cursor: 'pointer', fontSize: '0.74rem', textDecoration: 'underline', textUnderlineOffset: 3 }}
      >
        Explore freely instead
        <ArrowRight size={12} aria-hidden="true" />
      </button>

      {PRODUCT_SECTIONS.map((section) => (
        <div key={section.label} style={{ borderTop: '1px solid var(--portfolio-border-muted)', paddingTop: '0.85rem' }}>
          <div style={microLabel}>{section.label}</div>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.82rem', lineHeight: 1.65, color: 'var(--portfolio-text-secondary)' }}>
            {section.body}
          </p>
        </div>
      ))}

      <div style={{ borderTop: '1px solid var(--portfolio-border-muted)', paddingTop: '0.85rem' }}>
        <div style={{ ...microLabel, marginBottom: '0.85rem' }}>OPTIONAL · FREE EXPLORATION</div>
        <ol style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', margin: 0, padding: 0, listStyle: 'none' }}>
        {HOWTO.map((step, index) => (
          <li key={step.title} style={{ display: 'grid', gridTemplateColumns: '1.45rem 1fr', gap: '0.65rem' }}>
            <span
              style={{
                display: 'grid',
                placeItems: 'center',
                width: '1.45rem',
                height: '1.45rem',
                borderRadius: '999px',
                background: 'var(--portfolio-text-primary)',
                color: '#fff',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                fontWeight: 'var(--font-weight-bold)',
              }}
            >
              {index + 1}
            </span>
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 'var(--font-weight-semibold)', color: 'var(--portfolio-text-primary)' }}>
                {step.title}
              </div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', lineHeight: 1.55, color: 'var(--portfolio-text-muted)' }}>
                {index === 0 ? (
                  <>
                    <button
                      type="button"
                      onClick={onOpenCommands}
                      style={{ display: 'inline', padding: 0, border: 0, background: 'none', color: 'var(--portfolio-text-primary)', cursor: 'pointer', font: 'inherit', fontWeight: 'var(--font-weight-semibold)', textDecoration: 'underline', textUnderlineOffset: '2px' }}
                    >
                      Open the Commands tab
                    </button>
                    {step.body.slice('Open the Commands tab'.length)}
                  </>
                ) : step.body}
              </p>
            </div>
          </li>
        ))}
        </ol>
      </div>
    </div>
  );
}
