import { describe, expect, it } from 'vitest';
import { closestMatch } from '../src/suggest';

describe('closestMatch', () => {
  it('suggests the nearest ID for a transposition typo', () => {
    expect(closestMatch('drak-mode', ['dark-mode', 'beta-banner'])).toBe('dark-mode');
  });

  it('returns an exact match unchanged', () => {
    expect(closestMatch('dark-mode', ['dark-mode'])).toBe('dark-mode');
  });

  it('returns null when nothing is close enough', () => {
    expect(closestMatch('zzzzzz', ['dark-mode', 'beta-banner'])).toBe(null);
  });

  it('returns null for an empty candidate list', () => {
    expect(closestMatch('dark-mode', [])).toBe(null);
  });

  it('breaks ties by candidate order', () => {
    expect(closestMatch('ab', ['ax', 'ay'])).toBe('ax');
  });

  it('is case-sensitive', () => {
    expect(closestMatch('DARK-MODE', ['dark-mode'])).toBe(null);
  });

  it('respects the length-scaled threshold', () => {
    expect(closestMatch('new-checkout-flow-x', ['new-checkout-flow'])).toBe('new-checkout-flow');
    expect(closestMatch('abcdef', ['zzzzzz'])).toBe(null);
  });
});