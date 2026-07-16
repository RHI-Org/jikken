import { describe, expect, it, vi } from 'vitest';
import { createJikkenTutorialSteps } from './tutorialSteps';

describe('Jikken tutorial contract', () => {
  it('defines a stable, unique sequence from overview through completion', () => {
    const steps = createJikkenTutorialSteps();

    expect(steps[0].id).toBe('app-overview');
    expect(steps[1].id).toBe('welcome');
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

  it('prepares the deterministic demo when entering step zero', async () => {
    const resetDemo = vi.fn();
    const [overview] = createJikkenTutorialSteps({ resetDemo });

    await overview.prepare?.();

    expect(resetDemo).toHaveBeenCalledOnce();
  });

  it('discloses the synthetic-research basis at the first walkthrough step', () => {
    const [overview] = createJikkenTutorialSteps();

    expect(overview.title).toBe('What this app is');
    expect(String(overview.body)).toContain('feature-flag governance simulator');
    expect(overview.researchNote).toContain('AI synthetic UX research');
    expect(overview.researchNote).toContain('rapid multi-persona testing');
    expect(overview.researchNote).toContain('v1.1 improvements');
    expect(overview.researchNote).not.toContain('not real-user validation');
  });

  it('explains least-privilege security when the walkthrough reaches CI', () => {
    const steps = createJikkenTutorialSteps();
    const ciTransition = steps.find((step) => step.id === 'open-ci');

    expect(ciTransition?.securityNote).toContain('read-only');
    expect(ciTransition?.securityNote).toContain('without holding repository write access');
    expect(ciTransition?.securityNote).toContain('never in the browser');
  });

  it('keeps the SDK visible throughout steps 10–13', () => {
    const steps = createJikkenTutorialSteps();
    const visibleSteps = ['sdk-contract', 'run-sdk', 'sdk-result', 'open-ci'];

    expect(steps.filter((step) => visibleSteps.includes(step.id)).every((step) => step.dimBackground === false)).toBe(true);
  });

  it('keeps the CI verdict visible, then restores the completion overlay', () => {
    const steps = createJikkenTutorialSteps();
    const ciVerdict = steps.find((step) => step.id === 'ci-verdict');
    const complete = steps.find((step) => step.id === 'complete');

    expect(ciVerdict?.dimBackground).toBe(false);
    expect(complete?.dimBackground).toBe(true);
    expect(ciVerdict?.spotlightVerticalPadding).toBe(2);
    expect(ciVerdict?.spotlightOffsetY).toBe(-7);
  });
});
