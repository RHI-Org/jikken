import { describe, expect, it, vi } from 'vitest';
import { createJikkenTutorialSteps, TUTORIAL_EVENTS } from './tutorialSteps';

describe('Jikken tutorial contract', () => {
  it('defines a stable, unique sequence from welcome through completion', () => {
    const steps = createJikkenTutorialSteps();

    expect(steps[0].id).toBe('welcome');
    expect(steps.at(-1)?.id).toBe('complete');
    expect(new Set(steps.map((step) => step.id)).size).toBe(steps.length);
  });

  it('keeps interaction steps event-gated and dialogs manually advanceable', () => {
    const steps = createJikkenTutorialSteps();
    const interactions = steps.slice(1, -1);

    expect(interactions.every((step) => step.advanceOn && !step.allowNext)).toBe(true);
    expect(steps[0].allowNext).toBe(true);
    expect(steps.at(-1)?.allowNext).toBe(true);
  });

  it('uses each tutorial event exactly once', () => {
    const eventNames = createJikkenTutorialSteps()
      .map((step) => step.advanceOn)
      .filter((event): event is string => Boolean(event));

    expect(eventNames).toEqual(Object.values(TUTORIAL_EVENTS));
    expect(new Set(eventNames).size).toBe(eventNames.length);
  });

  it('prepares the deterministic demo when entering the welcome step', async () => {
    const resetDemo = vi.fn();
    const [welcome] = createJikkenTutorialSteps({ resetDemo });

    await welcome.prepare?.();

    expect(resetDemo).toHaveBeenCalledOnce();
  });
});
