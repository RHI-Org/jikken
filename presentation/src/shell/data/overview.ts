/**
 * Content for the Overview operating guide and Design narrative tabs.
 */
import type { OverviewSection, OverviewStat, HowToStep } from '../types';

// The product, stated first: who it's for and what it does for them.
export const INTRO =
  'Jikken lets a non-technical teammate — usually a product manager — preview what happens when you turn a feature flag on, off, or narrow who gets it. Before anything ships, it estimates the impact on real users: who gains access, and who loses it. No engineering ticket, no guesswork. And if a change would cut off users it should not, the same check can halt the rollout in CI, before it reaches anyone. Self-serve, but never ungoverned.';

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
    body: 'Open the Commands tab and choose a feature and scenario. This sets the deterministic input shared by every surface.',
  },
  {
    title: 'Switch surfaces',
    body: 'Use the CLI, Dashboard, SDK, and CI gate tabs to see the same evaluation expressed for each audience.',
  },
  {
    title: 'Run or inspect the result',
    body: 'The default run diffs the change against what is live — who gains access and who loses it. Use the dashboard simulation or the SDK example too; each uses the same evaluation engine.',
  },
  {
    title: 'Watch governance work',
    body: 'Open the CI gate with a risky scenario selected. The same check the PM ran blocks the deploy — that is the governance layer, live.',
  },
  {
    title: 'Explore the guided details',
    body: 'Open UX for the product rationale, or its Principles list to jump directly to a specific behavior on the live stage.',
  },
];

export const STATS: OverviewStat[] = [
  { value: "4", label: "surfaces" },
  { value: "10", label: "principles" },
  { value: "7", label: "exit codes" },
  { value: "1", label: "source of truth" },
];

export const SECTIONS: OverviewSection[] = [
  {
    label: "THE PROBLEM",
    body: "Most dev tools feel like four different products. The CLI, Dashboard, SDK, and CI gate use different words for the same thing, different colors for the same state, and different rules for the same input. People relearn the tool on every surface.",
  },
  {
    label: "THE APPROACH",
    body: "One source of truth — types, colors, terminology, exit codes — imported by all four surfaces. Green means included in the CLI and Dashboard; the SDK and CI gate enforce the same decision. \"Excluded\" and \"Needs Review\" mean the same thing everywhere. Learn it once, know it everywhere.",
  },
];

export const HANDOFF = {
  label: "The hand-off",
  body: "Run a simulation in the CLI, then watch the CI gate pick it up — same run, same engine. A clean change ships; a risky one is blocked before deploy, live. The whole thesis in one click.",
} as const;
