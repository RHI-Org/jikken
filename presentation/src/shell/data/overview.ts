/**
 * Content for the Overview operating guide and Design narrative tabs.
 */
import type { OverviewSection, OverviewStat, HowToStep } from '../types';

// The product, stated first: who it's for and what it does for them.
export const INTRO =
  'Jikken shows a product manager what a targeting change actually does to real users — who gains access, and who loses it — before it ships. No engineering ticket, no guesswork. And if a change would cut off users it should not, the same check can halt the rollout in CI, before it reaches anyone. Self-serve, but never ungoverned.';

// The product problem/approach — the front-door story (persona + governance),
// distinct from the craft thesis (cross-surface coherence) in the Design tab.
export const PRODUCT_SECTIONS: OverviewSection[] = [
  {
    label: 'THE PROBLEM',
    body: "Non-engineers now own feature releases, but they can't see what a change will do. Edit a targeting rule and you find out in production — after some users quietly lose access they used to have.",
  },
  {
    label: 'THE APPROACH',
    body: 'Show the change, not just the current state. Pick a scenario and Jikken diffs the proposed edit against what is live: who gains access, and who loses it. A clean change ships; a risky one fails the CI gate and stops before it reaches real users.',
  },
];

// A short, ordered guide to operating the application.
export const HOWTO: HowToStep[] = [
  {
    title: 'Pick a scenario',
    body: 'Choose all-clear, conflict, or warning in the top bar. This sets the deterministic input shared by every surface.',
  },
  {
    title: 'Switch surfaces',
    body: 'Use the CLI, Dashboard, and SDK tabs to see the same evaluation expressed for each audience.',
  },
  {
    title: 'Run or inspect the result',
    body: 'The default run diffs the change against what is live — who gains access and who loses it. Use the dashboard simulation or the SDK example too; each uses the same evaluation engine.',
  },
  {
    title: 'Explore the guided details',
    body: 'Open Design for the product rationale, or Principles to jump directly to a specific behavior on the live stage.',
  },
];

export const STATS: OverviewStat[] = [
  { value: "3", label: "surfaces" },
  { value: "10", label: "principles" },
  { value: "7", label: "exit codes" },
  { value: "1", label: "source of truth" },
];

export const SECTIONS: OverviewSection[] = [
  {
    label: "THE PROBLEM",
    body: "Most dev tools feel like three different products. The CLI, the dashboard, and the SDK use different words for the same thing, different colors for the same state, different rules for the same input. People relearn the tool on every surface.",
  },
  {
    label: "THE APPROACH",
    body: "One source of truth — types, colors, terminology, exit codes — imported by all three surfaces. Green means receive on the CLI and on the dashboard. \"Excluded\" means the same thing everywhere. Learn it once, know it everywhere.",
  },
];

export const HANDOFF = {
  label: "The hand-off",
  body: "Run a simulation in the CLI. Watch it land in the Dashboard's history a second later, live — same run, same result, two surfaces. The whole thesis in one click.",
} as const;
