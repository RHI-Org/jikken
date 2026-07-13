import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  connectTutorialBridge,
  isAllowedTutorialOrigin,
  TUTORIAL_ANCHORS,
} from './bridge';

describe('dashboard tutorial bridge', () => {
  const cleanups: Array<() => void> = [];
  const scrollIntoView = vi.fn();

  beforeEach(() => {
    scrollIntoView.mockReset();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    });
  });

  afterEach(() => {
    cleanups.splice(0).forEach((cleanup) => cleanup());
    document.body.replaceChildren();
  });

  function connect(navigate = vi.fn()) {
    cleanups.push(connectTutorialBridge(navigate));
    return navigate;
  }

  function send(data: unknown, origin = window.location.origin) {
    window.dispatchEvent(new MessageEvent('message', {
      data,
      origin,
      source: window,
    }));
  }

  it('accepts same-origin and loopback development origins', () => {
    expect(isAllowedTutorialOrigin(window.location.origin)).toBe(true);
    expect(isAllowedTutorialOrigin('http://127.0.0.1:8090')).toBe(true);
  });

  it('rejects malformed and foreign origins', () => {
    expect(isAllowedTutorialOrigin('not an origin')).toBe(false);
    expect(isAllowedTutorialOrigin('https://attacker.example')).toBe(false);
  });

  it('navigates only to allowlisted tutorial screens from the parent', () => {
    const navigate = connect();

    send({ type: 'jikken:tutorial:navigate', path: '/flags/history' });
    send({ type: 'jikken:tutorial:navigate', path: '/flags/simulate/dark-mode?scenario=conflict' });
    send({ type: 'jikken:tutorial:navigate', path: '/settings' });
    send(
      { type: 'jikken:tutorial:navigate', path: '/flags/history' },
      'https://attacker.example',
    );

    expect(navigate).toHaveBeenCalledTimes(2);
    expect(navigate).toHaveBeenNthCalledWith(1, '/flags/history');
    expect(navigate).toHaveBeenNthCalledWith(2, '/flags/simulate/dark-mode?scenario=conflict');
  });

  it('highlights a known anchor and restores its styles on cleanup', () => {
    const row = document.createElement('div');
    row.dataset.tutorial = TUTORIAL_ANCHORS.latestHistoryRow;
    row.style.outline = '1px dashed purple';
    row.style.outlineOffset = '1px';
    document.body.append(row);

    const cleanup = connectTutorialBridge(vi.fn());
    send({
      type: 'jikken:tutorial:highlight',
      anchor: TUTORIAL_ANCHORS.latestHistoryRow,
    });

    expect(row.style.outline).toBe('3px solid #2563eb');
    expect(row.style.outlineOffset).toBe('3px');
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });

    cleanup();
    expect(row.style.outline).toBe('1px dashed purple');
    expect(row.style.outlineOffset).toBe('1px');
  });
});
