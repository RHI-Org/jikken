/**
 * Content for the Overview operating guide and Design narrative tabs.
 */
import type { OverviewSection, OverviewStat, HowToStep } from '../types';

// What the app is and how to operate the live demo.
export const INTRO =
  'Jikken lets you test the same feature-flag scenario through three working interfaces: a CLI, a dashboard, and an SDK. Use the controls above the stage to set the scenario, then explore how each surface reports the same result.';

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
    body: 'Run a CLI command, use the dashboard simulation, or execute the SDK example. Each uses the same evaluation engine.',
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
