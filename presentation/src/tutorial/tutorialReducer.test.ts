import { describe, expect, it } from 'vitest';
import { initialTutorialState, tutorialReducer } from './tutorialReducer';

describe('tutorialReducer', () => {
  it('starts a fresh running session at the first step', () => {
    const started = tutorialReducer(initialTutorialState, { type: 'START' });

    expect(started).toEqual({ currentIndex: 0, session: 1, status: 'running' });
  });

  it('advances while running and clamps to the final step', () => {
    const running = { currentIndex: 1, session: 2, status: 'running' } as const;

    expect(tutorialReducer(running, { type: 'ADVANCE', totalSteps: 4 }).currentIndex).toBe(2);
    expect(tutorialReducer(
      { ...running, currentIndex: 3 },
      { type: 'ADVANCE', totalSteps: 4 },
    ).currentIndex).toBe(3);
  });

  it('ignores advance outside a running tutorial or with no steps', () => {
    expect(tutorialReducer(initialTutorialState, {
      type: 'ADVANCE',
      totalSteps: 4,
    })).toBe(initialTutorialState);

    const running = { currentIndex: 0, session: 1, status: 'running' } as const;
    expect(tutorialReducer(running, { type: 'ADVANCE', totalSteps: 0 })).toBe(running);
  });

  it('moves back without going below the first step', () => {
    const running = { currentIndex: 2, session: 1, status: 'running' } as const;

    expect(tutorialReducer(running, { type: 'BACK' }).currentIndex).toBe(1);
    expect(tutorialReducer({ ...running, currentIndex: 0 }, { type: 'BACK' }).currentIndex).toBe(0);
  });

  it('completes in place and restart resets progress with a new session', () => {
    const running = { currentIndex: 7, session: 3, status: 'running' } as const;
    const completed = tutorialReducer(running, { type: 'COMPLETE' });

    expect(completed).toEqual({ currentIndex: 7, session: 3, status: 'completed' });
    expect(tutorialReducer(completed, { type: 'START' })).toEqual({
      currentIndex: 0,
      session: 4,
      status: 'running',
    });
  });
});
