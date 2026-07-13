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

/** The deterministic demo story: Dark Mode -> exclude employees -> deploy blocked. */
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
      id: 'open-commands',
      anchor: 'commands-tab',
      title: 'Start with the shared inputs',
      body: 'Open Commands. Every Jikken surface uses the same feature and scenario.',
      placement: 'right',
      advanceOn: TUTORIAL_EVENTS.commandsOpened,
    },
    {
      id: 'choose-feature',
      anchor: 'feature-select',
      title: 'Choose Dark Mode',
      body: 'This is the feature whose proposed targeting change we want to inspect.',
      placement: 'right',
      advanceOn: TUTORIAL_EVENTS.darkModeSelected,
    },
    {
      id: 'choose-scenario',
      anchor: 'scenario-select',
      title: 'Exclude employees',
      body: 'Model a rule change that removes internal accounts from the audience.',
      placement: 'right',
      advanceOn: TUTORIAL_EVENTS.excludeEmployeesSelected,
    },
    {
      id: 'run-cli',
      anchor: 'cli-output',
      title: 'Compare the proposed change',
      body: 'Jikken is comparing the proposal with the live audience and finding who loses access.',
      placement: 'left',
      advanceOn: TUTORIAL_EVENTS.cliRunComplete,
    },
    {
      id: 'open-dashboard',
      anchor: 'surface-dashboard',
      title: 'Open the Dashboard',
      body: 'The same simulation becomes a reviewable record for product and governance teams.',
      placement: 'bottom',
      advanceOn: TUTORIAL_EVENTS.dashboardOpened,
    },
    {
      id: 'open-history',
      anchor: 'dashboard-frame',
      title: 'Review the audit trail',
      body: 'History preserves the input, impact, and verdict instead of leaving them in terminal output.',
      placement: 'left',
      advanceOn: TUTORIAL_EVENTS.historyOpened,
    },
    {
      id: 'open-sdk',
      anchor: 'surface-sdk',
      title: 'Use the same contract in code',
      body: 'Open the SDK surface to see how an automated integration asks the same question.',
      placement: 'bottom',
      advanceOn: TUTORIAL_EVENTS.sdkOpened,
    },
    {
      id: 'run-sdk',
      anchor: 'sdk-run',
      title: 'Run the SDK check',
      body: 'Integrations receive the same affected users, verdict, and machine-readable result.',
      placement: 'left',
      advanceOn: TUTORIAL_EVENTS.sdkRunComplete,
    },
    {
      id: 'open-ci',
      anchor: 'surface-ci',
      title: 'Send it to the CI gate',
      body: 'The pipeline turns that shared result into an enforceable deployment decision.',
      placement: 'bottom',
      advanceOn: TUTORIAL_EVENTS.ciOpened,
    },
    {
      id: 'ci-verdict',
      anchor: 'ci-verdict',
      title: 'Deployment blocked',
      body: 'Exit 1 stops the rollout before three employees lose access. The risky change never ships.',
      placement: 'left',
      advanceOn: TUTORIAL_EVENTS.ciVerdictVisible,
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
