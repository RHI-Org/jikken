import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy } from 'lucide-react';
import { useTutorial } from './TutorialProvider';
import type { TutorialPlacement } from './types';

interface Box {
  height: number;
  left: number;
  top: number;
  width: number;
}

const EMPTY_BOX: Box = { height: 0, left: 0, top: 0, width: 0 };
const CALLOUT_GAP = 16;
const VIEWPORT_GAP = 16;
const ACCENT = '#2563eb';
const ACCENT_DARK = '#1d4ed8';
const ACCENT_SOFT = '#dbeafe';

function findAnchor(anchor: string): HTMLElement | null {
  const escaped = typeof CSS !== 'undefined' && CSS.escape
    ? CSS.escape(anchor)
    : anchor.replace(/["\\]/g, '\\$&');
  return document.querySelector<HTMLElement>(`[data-tutorial="${escaped}"]`);
}

function boxFromRect(rect: DOMRect): Box {
  return { height: rect.height, left: rect.left, top: rect.top, width: rect.width };
}

function positionCallout(
  anchor: Box | null,
  callout: Box,
  placement: TutorialPlacement,
): { left: number; top: number } {
  const width = callout.width || Math.min(360, window.innerWidth - VIEWPORT_GAP * 2);
  const height = callout.height || 220;
  if (!anchor || placement === 'center') {
    return {
      left: Math.max(VIEWPORT_GAP, (window.innerWidth - width) / 2),
      top: Math.max(VIEWPORT_GAP, (window.innerHeight - height) / 2),
    };
  }

  let left = anchor.left + (anchor.width - width) / 2;
  let top = anchor.top + anchor.height + CALLOUT_GAP;
  if (placement === 'top') top = anchor.top - height - CALLOUT_GAP;
  if (placement === 'left') {
    left = anchor.left - width - CALLOUT_GAP;
    top = anchor.top + (anchor.height - height) / 2;
  }
  if (placement === 'right') {
    left = anchor.left + anchor.width + CALLOUT_GAP;
    top = anchor.top + (anchor.height - height) / 2;
  }

  return {
    left: Math.min(Math.max(VIEWPORT_GAP, left), window.innerWidth - width - VIEWPORT_GAP),
    top: Math.min(Math.max(VIEWPORT_GAP, top), window.innerHeight - height - VIEWPORT_GAP),
  };
}

export function TutorialOverlay() {
  const { active, back, currentIndex, currentStep, finish, next, reducedMotion, skip, totalSteps } =
    useTutorial();
  const [anchorBox, setAnchorBox] = useState<Box | null>(null);
  const [calloutBox, setCalloutBox] = useState<Box>(EMPTY_BOX);
  const [copied, setCopied] = useState(false);
  const calloutRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const centered = !currentStep?.anchor || currentStep.placement === 'center';

  const measure = useCallback(() => {
    if (!currentStep?.anchor) {
      setAnchorBox(null);
      return;
    }
    const target = findAnchor(currentStep.anchor);
    setAnchorBox(target ? boxFromRect(target.getBoundingClientRect()) : null);
  }, [currentStep?.anchor]);

  useLayoutEffect(() => {
    if (!active) return;
    measure();
    const callout = calloutRef.current;
    if (callout) setCalloutBox(boxFromRect(callout.getBoundingClientRect()));
  }, [active, currentStep?.id, measure]);

  useEffect(() => setCopied(false), [currentStep?.id]);

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const scheduleMeasure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const mutationObserver = new MutationObserver(scheduleMeasure);
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    const resizeObserver = new ResizeObserver(scheduleMeasure);
    const target = currentStep?.anchor ? findAnchor(currentStep.anchor) : null;
    if (target) resizeObserver.observe(target);
    window.addEventListener('resize', scheduleMeasure);
    window.addEventListener('scroll', scheduleMeasure, true);
    return () => {
      cancelAnimationFrame(frame);
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
      window.removeEventListener('scroll', scheduleMeasure, true);
    };
  }, [active, currentStep?.anchor, measure]);

  useEffect(() => {
    if (active) {
      previousFocus.current ??= document.activeElement as HTMLElement | null;
      return;
    }
    previousFocus.current?.focus();
    previousFocus.current = null;
  }, [active]);

  useEffect(() => {
    if (!active || !centered) return;
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !calloutRef.current) return;
      const focusable = Array.from(
        calloutRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', trapFocus);
    return () => window.removeEventListener('keydown', trapFocus);
  }, [active, centered, currentStep?.id]);

  if (!active || !currentStep || typeof document === 'undefined') return null;

  const placement = currentStep.placement ?? (currentStep.anchor ? 'bottom' : 'center');
  const calloutPosition = positionCallout(anchorBox, calloutBox, placement);
  const lastStep = currentIndex === totalSteps - 1;
  const showNext = currentStep.allowNext === true;
  const dimBackground = currentStep.dimBackground !== false;

  return createPortal(
    <div
      aria-label="Jikken walkthrough"
      style={{ inset: 0, pointerEvents: 'none', position: 'fixed', zIndex: 10_000 }}
    >
      {centered && dimBackground ? (
        <div style={{ background: 'rgba(12, 10, 9, 0.72)', inset: 0, position: 'absolute' }} />
      ) : anchorBox ? (
        <div
          aria-hidden="true"
          style={{
            border: `2px solid ${ACCENT}`,
            borderRadius: 8,
            boxShadow: dimBackground
              ? '0 0 0 9999px rgba(12, 10, 9, 0.72)'
              : '0 0 0 4px rgba(37, 99, 235, 0.18)',
            height: anchorBox.height + 12,
            left: anchorBox.left - 6,
            pointerEvents: 'none',
            position: 'fixed',
            top: anchorBox.top - 6,
            transition: reducedMotion ? 'none' : 'all 180ms ease-out',
            width: anchorBox.width + 12,
          }}
        />
      ) : dimBackground ? (
        <div style={{ background: 'rgba(12, 10, 9, 0.58)', inset: 0, position: 'absolute' }} />
      ) : null}

      <div
        aria-describedby={`tutorial-body-${currentStep.id}`}
        aria-labelledby={`tutorial-title-${currentStep.id}`}
        aria-modal={centered || undefined}
        ref={calloutRef}
        role={centered ? 'dialog' : 'group'}
        style={{
          background: 'var(--portfolio-bg-card, #f5f5f4)',
          border: `1px solid ${ACCENT_SOFT}`,
          borderTop: `3px solid ${ACCENT}`,
          borderRadius: 10,
          boxShadow: '0 18px 48px rgba(12, 10, 9, 0.28)',
          boxSizing: 'border-box',
          color: 'var(--portfolio-text-primary, #1c1917)',
          left: calloutPosition.left,
          maxWidth: 'calc(100vw - 32px)',
          padding: '1rem',
          pointerEvents: 'auto',
          position: 'fixed',
          top: calloutPosition.top,
          transition: reducedMotion ? 'none' : 'left 180ms ease-out, top 180ms ease-out',
          width: 360,
        }}
      >
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ color: ACCENT_DARK, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {currentIndex + 1} of {totalSteps}
          </span>
          <button
            aria-label="Exit walkthrough"
            onClick={skip}
            style={{ background: 'transparent', border: 0, color: 'var(--portfolio-text-muted, #57534e)', cursor: 'pointer', fontSize: 12, padding: 4 }}
            type="button"
          >
            Skip
          </button>
        </div>
        <h2 id={`tutorial-title-${currentStep.id}`} style={{ fontFamily: 'var(--font-serif, Georgia, serif)', fontSize: 20, lineHeight: 1.25, margin: '0 0 8px' }}>
          {currentStep.title}
        </h2>
        <div id={`tutorial-body-${currentStep.id}`} style={{ color: 'var(--portfolio-text-secondary, #44403c)', fontSize: 14, lineHeight: 1.55 }}>
          {currentStep.body}
        </div>
        {currentStep.copyText && (
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(currentStep.copyText!);
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
            aria-label={copied ? 'Command copied' : 'Copy command to clipboard'}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 12, padding: '0.6rem 0.7rem', border: `1px solid ${copied ? ACCENT : ACCENT_SOFT}`, borderRadius: 6, background: copied ? '#eff6ff' : 'var(--portfolio-bg-card-alt, #fafaf9)', color: copied ? ACCENT_DARK : 'var(--portfolio-text-primary, #1c1917)', cursor: 'pointer', textAlign: 'left' }}
          >
            <code style={{ minWidth: 0, overflow: 'hidden', fontFamily: 'var(--font-mono, monospace)', fontSize: 11, textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentStep.copyText}
            </code>
            {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
          </button>
        )}
        {!currentStep.allowNext && currentStep.anchor && !anchorBox && (
          <p style={{ color: 'var(--portfolio-text-subtle, #78716c)', fontSize: 12, margin: '10px 0 0' }}>
            Getting this part of the demo ready…
          </p>
        )}
        <div style={{ alignItems: 'center', display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          {currentIndex === 0 && (
            <span style={{ marginRight: 'auto', color: 'var(--portfolio-text-subtle, #78716c)', fontFamily: 'var(--font-mono, monospace)', fontSize: 10 }}>
              ← → navigate
            </span>
          )}
          {currentIndex > 0 && (
            <button onClick={back} style={{ background: 'transparent', border: '1px solid var(--portfolio-border, #d6d3d1)', borderRadius: 6, color: 'inherit', cursor: 'pointer', padding: '7px 11px' }} type="button">
              Back
            </button>
          )}
          {showNext && (
            <button
              autoFocus={centered}
              onClick={lastStep ? finish : next}
              style={{ background: ACCENT, border: 0, borderRadius: 6, boxShadow: '0 1px 2px rgba(37, 99, 235, 0.3)', color: '#fff', cursor: 'pointer', fontWeight: 600, padding: '8px 12px' }}
              type="button"
            >
              {currentStep.nextLabel ?? (lastStep ? 'Finish' : 'Next')}
            </button>
          )}
        </div>
      </div>

      <div aria-live="polite" aria-atomic="true" style={{ height: 1, margin: -1, overflow: 'hidden', padding: 0, position: 'absolute', width: 1, clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>
        Step {currentIndex + 1} of {totalSteps}: {currentStep.title}
      </div>
    </div>,
    document.body,
  );
}
