import { describe, expect, it, vi } from 'vitest';
import { createJikkenTutorialSteps } from './tutorialSteps';

describe('Jikken tutorial contract', () => {
  it('defines a stable, unique sequence from welcome through completion', () => {
    const steps = createJikkenTutorialSteps();

    expect(steps[0].id).toBe('welcome');
    expect(steps.at(-1)?.id).toBe('complete');
    expect(new Set(steps.map((step) => step.id)).size).toBe(steps.length);
  });

  it('lets every step advance manually so the demo cannot deadlock', () => {
    const steps = createJikkenTutorialSteps();
    expect(steps.every((step) => step.allowNext)).toBe(true);
  });

  it('teaches the real CLI command instead of routing through command shortcuts', () => {
    const steps = createJikkenTutorialSteps();
    const cliStep = steps.find((step) => step.id === 'type-cli-command');

    expect(String(cliStep?.body)).toContain('jikken diff --feature dark-mode --scenario conflict');
    expect(cliStep?.copyText).toBe('jikken diff --feature dark-mode --scenario conflict');
    expect(steps.some((step) => step.id === 'open-commands')).toBe(false);
  });

  it('prepares the deterministic demo when entering the welcome step', async () => {
    const resetDemo = vi.fn();
    const [welcome] = createJikkenTutorialSteps({ resetDemo });

    await welcome.prepare?.();

    expect(resetDemo).toHaveBeenCalledOnce();
  });
});
