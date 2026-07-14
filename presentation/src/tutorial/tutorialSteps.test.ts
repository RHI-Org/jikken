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

  it('discloses the synthetic-research basis at the first walkthrough step', () => {
    const [welcome] = createJikkenTutorialSteps();

    expect(welcome.researchNote).toContain('AI-simulated synthetic UX research');
    expect(welcome.researchNote).toContain('rapid multi-persona testing');
    expect(welcome.researchNote).toContain('v1.1 improvements');
    expect(welcome.researchNote).not.toContain('not real-user validation');
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

  it('keeps the CI gate visible throughout steps 14–15', () => {
    const steps = createJikkenTutorialSteps();
    const visibleSteps = ['ci-verdict', 'complete'];

    expect(steps.filter((step) => visibleSteps.includes(step.id)).every((step) => step.dimBackground === false)).toBe(true);
  });
});
