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
      id: 'app-overview',
      title: 'What this app is',
      body: 'Jikken is a feature-flag governance simulator. Before a change ships, it shows who gains access, who loses it, and whether policy should allow, hold, or review the rollout. The same decision then carries through the CLI, Dashboard, SDK, and CI gate.',
      researchNote: 'AI synthetic UX research made rapid multi-persona testing possible, surfaced friction, and turned those hypotheses into the v1.1 improvements you will see in this walkthrough.',
      placement: 'center',
      allowNext: true,
      nextLabel: 'See the workflow',
      prepare: preparation.resetDemo,
    },
    {
      id: 'welcome',
      title: 'Catch a risky change before it ships',
      body: 'Follow one Dark Mode change from the command line to a blocked deployment.',
      placement: 'center',
      allowNext: true,
      nextLabel: 'Start walkthrough',
    },
    {
      id: 'type-cli-command',
      anchor: 'cli-output',
      title: 'Run the check in the CLI',
      body: 'Click the terminal and type: jikken diff --feature dark-mode --scenario conflict — then press Enter. Or click Next and the demo will run it for you.',
      copyText: 'jikken diff --feature dark-mode --scenario conflict',
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
      id: 'dashboard-scenario',
      anchor: 'dashboard-frame',
      title: 'What change are we reviewing?',
      body: 'Dark Mode is live for everyone. The proposal excludes @internal.company.com accounts — a governance decision with real users at risk.',
      placement: 'left',
      allowNext: true,
    },
    {
      id: 'dashboard-impact',
      anchor: 'dashboard-frame',
      title: 'Read the impact at a glance',
      body: 'The Dashboard expresses the same CLI result for a product audience: seven keep access and three would be excluded.',
      placement: 'left',
      allowNext: true,
    },
    {
      id: 'dashboard-decision',
      anchor: 'dashboard-frame',
      title: 'See exactly who is affected',
      body: 'Open decision reasoning names the excluded user, the matched rule, and its source — governance without a black box.',
      placement: 'left',
      allowNext: true,
    },
    {
      id: 'dashboard-history',
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
      id: 'sdk-contract',
      anchor: 'sdk-code',
      title: 'The SDK turns policy into a contract',
      body: 'FlagClient sends the same conflict scenario to the shared engine. isSafeToDeploy translates the result into a decision automation can enforce.',
      placement: 'left',
      allowNext: true,
      dimBackground: false,
    },
    {
      id: 'run-sdk',
      anchor: 'sdk-run',
      title: 'Run the SDK check',
      body: 'Call the Edge Function from code. It evaluates the scenario and returns the shared result shape.',
      placement: 'left',
      allowNext: true,
      dimBackground: false,
    },
    {
      id: 'sdk-result',
      anchor: 'sdk-result',
      title: 'Read the machine response',
      body: 'The response carries the simulation ID, conflict verdict, exit 1, and audience summary. CI can act on it without parsing presentation text.',
      placement: 'left',
      allowNext: true,
      dimBackground: false,
    },
    {
      id: 'open-ci',
      anchor: 'surface-ci',
      title: 'Send it to the CI gate',
      body: 'The pipeline turns that shared result into an enforceable deployment decision.',
      securityNote: 'The CI token is read-only: the gate can block an unsafe deploy without holding repository write access. Service-role secrets stay inside the Edge Function, never in the browser.',
      placement: 'bottom',
      allowNext: true,
      dimBackground: false,
    },
    {
      id: 'ci-verdict',
      anchor: 'ci-verdict',
      title: 'Deployment blocked',
      body: 'Exit 1 stops the rollout before three employees lose access. The risky change never ships.',
      placement: 'left',
      allowNext: true,
      dimBackground: false,
      spotlightVerticalPadding: 2,
      spotlightOffsetY: -7,
    },
    {
      id: 'complete',
      title: 'One input. Four surfaces. One contract.',
      body: 'Jikken makes audience impact visible to developers, product teams, integrations, and CI.',
      placement: 'center',
      allowNext: true,
      nextLabel: 'Finish',
      dimBackground: true,
    },
  ];
}

export const jikkenTutorialSteps = createJikkenTutorialSteps();
