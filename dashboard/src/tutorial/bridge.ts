export const TUTORIAL_ANCHORS = {
  historyNav: 'history-nav',
  latestHistoryRow: 'latest-history-row',
  scenarioContext: 'scenario-context',
  simulationSummary: 'simulation-summary',
  excludedDecision: 'excluded-decision',
} as const;

export type TutorialAnchor = (typeof TUTORIAL_ANCHORS)[keyof typeof TUTORIAL_ANCHORS];

type TutorialCommand =
  | { type: 'jikken:tutorial:navigate'; path: TutorialPath }
  | { type: 'jikken:tutorial:highlight'; anchor: TutorialAnchor };

export type TutorialEvent =
  | { type: 'jikken:tutorial:event'; event: 'history-opened' }
  | { type: 'jikken:tutorial:event'; event: 'history-row-visible' }
  | { type: 'jikken:tutorial:event'; event: 'user-action'; anchor: TutorialAnchor };

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);
const HISTORY_PATH = '/flags/history';
const SIMULATION_PATH = '/flags/simulate/dark-mode?scenario=conflict';
type TutorialPath = typeof HISTORY_PATH | typeof SIMULATION_PATH;
let trustedParentOrigin: string | null = null;
let clearHighlight: (() => void) | null = null;

function asUrl(origin: string): URL | null {
  try {
    return new URL(origin);
  } catch {
    return null;
  }
}

/**
 * Production embeds are same-origin. Cross-origin messages are accepted only
 * between loopback hosts during local development, or from an explicitly
 * configured presentation origin.
 */
export function isAllowedTutorialOrigin(origin: string): boolean {
  const candidate = asUrl(origin);
  const current = asUrl(window.location.origin);
  if (!candidate || !current) return false;
  if (candidate.origin === current.origin) return true;

  const configuredOrigin = import.meta.env.VITE_PRESENTATION_ORIGIN as string | undefined;
  if (configuredOrigin && asUrl(configuredOrigin)?.origin === candidate.origin) return true;

  return LOCAL_HOSTS.has(current.hostname) && LOCAL_HOSTS.has(candidate.hostname);
}

function parentOriginFromReferrer(): string | null {
  if (!document.referrer) return null;
  const referrer = asUrl(document.referrer)?.origin ?? null;
  return referrer && isAllowedTutorialOrigin(referrer) ? referrer : null;
}

function isTutorialCommand(value: unknown): value is TutorialCommand {
  if (!value || typeof value !== 'object') return false;
  const message = value as Record<string, unknown>;

  if (message.type === 'jikken:tutorial:navigate') {
    return message.path === HISTORY_PATH || message.path === SIMULATION_PATH;
  }

  if (message.type === 'jikken:tutorial:highlight') {
    return Object.values(TUTORIAL_ANCHORS).includes(message.anchor as TutorialAnchor);
  }

  return false;
}

function highlightAnchor(anchor: TutorialAnchor): void {
  clearHighlight?.();
  const element = document.querySelector<HTMLElement>(`[data-tutorial="${anchor}"]`);
  if (!element) return;

  const previousOutline = element.style.outline;
  const previousOutlineOffset = element.style.outlineOffset;
  element.style.outline = '3px solid #2563eb';
  element.style.outlineOffset = '3px';
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  clearHighlight = () => {
    element.style.outline = previousOutline;
    element.style.outlineOffset = previousOutlineOffset;
    clearHighlight = null;
  };
}

export function connectTutorialBridge(navigate: (path: string) => void): () => void {
  trustedParentOrigin = parentOriginFromReferrer();

  const receiveMessage = (event: MessageEvent<unknown>) => {
    if (event.source !== window.parent || !isAllowedTutorialOrigin(event.origin)) return;
    if (!isTutorialCommand(event.data)) return;

    trustedParentOrigin = event.origin;
    if (event.data.type === 'jikken:tutorial:navigate') {
      navigate(event.data.path);
    } else {
      highlightAnchor(event.data.anchor);
    }
  };

  window.addEventListener('message', receiveMessage);
  return () => {
    window.removeEventListener('message', receiveMessage);
    clearHighlight?.();
  };
}

export function emitTutorialEvent(message: TutorialEvent): void {
  if (window.parent === window) return;
  const targetOrigin = trustedParentOrigin ?? parentOriginFromReferrer();
  if (!targetOrigin) return;
  window.parent.postMessage(message, targetOrigin);
}
