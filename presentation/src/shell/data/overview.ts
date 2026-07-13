/**
 * Overview data for the shell presentation.
 * Contains statistics, sections, and handoff details.
 */
import type { OverviewSection, OverviewStat } from '../types';

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