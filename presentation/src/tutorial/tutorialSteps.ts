import type { TutorialStep } from './types';

export const TUTORIAL_EVENTS = {
  commandsOpened: 'notes:commands-opened',
  darkModeSelected: 'feature:dark-mode-selected',
  excludeEmployeesSelected: 'scenario:exclude-employees-selected',
  cliRunComplete: 'cli:run-complete',
  dashboardOpened: 'surface:dashboard-opened',
  historyOpened: 'dashboard:history-opened',
  sdkOpened: 'surface:sdk-opened',
  sdkRunComplete: 'sdk:run-complete',
  ciOpened: 'surface:ci-opened',
  ciVerdictVisible: 'ci:verdict-visible',
} as const;

export type TutorialEvent = (typeof TUTORIAL_EVENTS)[keyof typeof TUTORIAL_EVENTS];

export interface TutorialPreparation {
  resetDemo?: () => void | Promise<void>;
}

/** The deterministic demo story: type a Dark Mode diff -> inspect it -> block deploy. */
export function createJikkenTutorialSteps(
  preparation: TutorialPreparation = {},
): readonly TutorialStep[] {
  return [
    {
      id: 'welcome',
      title: 'Catch a risky change before it ships',
      body: 'Follow one Dark Mode change from the command line to a blocked deployment.',
      placement: 'center',
      allowNext: true,
      nextLabel: 'Start walkthrough',
      prepare: preparation.resetDemo,
    },
    {
      id: 'type-cli-command',
      anchor: 'cli-output',
      title: 'Run the check in the CLI',
      body: 'Click the terminal and type: jikken diff --feature dark-mode --scenario conflict — then press Enter. Or click Next and the demo will run it for you.',
      placement: 'left',
      allowNext: true,
    },
    {
      id: 'inspect-cli-result',
      anchor: 'cli-output',
      title: 'See who would lose access',
      body: 'The diff catches three employees who have Dark Mode today but would be excluded by the proposed rule.',
      placement: 'left',
      allowNext: true,
    },
    {
      id: 'open-dashboard',
      anchor: 'surface-dashboard',
      title: 'Open the Dashboard',
      body: 'The same simulation becomes a reviewable record for product and governance teams.',
      placement: 'bottom',
      allowNext: true,
    },
    {
      id: 'open-history',
      anchor: 'dashboard-frame',
      title: 'Review the audit trail',
      body: 'History preserves the input, impact, and verdict instead of leaving them in terminal output.',
      placement: 'left',
      allowNext: true,
    },
    {
      id: 'open-sdk',
      anchor: 'surface-sdk',
      title: 'Use the same contract in code',
      body: 'Open the SDK surface to see how an automated integration asks the same question.',
      placement: 'bottom',
      allowNext: true,
    },
    {
      id: 'run-sdk',
      anchor: 'sdk-run',
      title: 'Run the SDK check',
      body: 'Integrations receive the same affected users, verdict, and machine-readable result.',
      placement: 'left',
      allowNext: true,
    },
    {
      id: 'open-ci',
      anchor: 'surface-ci',
      title: 'Send it to the CI gate',
      body: 'The pipeline turns that shared result into an enforceable deployment decision.',
      placement: 'bottom',
      allowNext: true,
    },
    {
      id: 'ci-verdict',
      anchor: 'ci-verdict',
      title: 'Deployment blocked',
      body: 'Exit 1 stops the rollout before three employees lose access. The risky change never ships.',
      placement: 'left',
      allowNext: true,
    },
    {
      id: 'complete',
      title: 'One input. Four surfaces. One contract.',
      body: 'Jikken makes audience impact visible to developers, product teams, integrations, and CI.',
      placement: 'center',
      allowNext: true,
      nextLabel: 'Finish',
    },
  ];
}

export const jikkenTutorialSteps = createJikkenTutorialSteps();
