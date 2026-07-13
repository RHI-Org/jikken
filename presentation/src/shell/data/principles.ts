/**
 * The 10 design principles (spec §11.1), made clickable.
 *
 * Each principle commands the stage: clicking it switches to `surface` and
 * drops a numbered pin at `pin` (percent coords) on the exact UI element that
 * demonstrates it. Titles/whys are the spec §11.1 index; the surface/pin
 * mapping is the presentation wiring.
 */
import type { Principle } from '../types';

export const PRINCIPLES: Principle[] = [
  {
    number: 1,
    title: 'Output scannable in 3 seconds',
    why: 'Top-level verdict visible before any scrolling — the CLI summary block.',
    surface: 'cli',
    pin: { x: 22, y: 30 },
  },
  {
    number: 2,
    title: 'Colors functional, not decorative',
    why: 'Green = receive, red = exclude, yellow = partial. Same hex on every surface.',
    surface: 'dashboard',
    pin: { x: 30, y: 34 },
  },
  {
    number: 3,
    title: 'Exit codes are the real product',
    why: 'Machines read exit codes, humans read output — the CLI serves both.',
    surface: 'cli',
    pin: { x: 20, y: 52 },
  },
  {
    number: 4,
    title: 'Suggestions beat diagnoses',
    why: '"Did you mean dark-mode?" instead of "Error: invalid input".',
    surface: 'cli',
    pin: { x: 30, y: 40 },
  },
  {
    number: 5,
    title: 'Consistency is the hardest feature',
    why: 'Same field names, colors, and exit codes across all three surfaces.',
    surface: 'sdk',
    pin: { x: 50, y: 55 },
  },
  {
    number: 6,
    title: 'Transparent reasoning beats black boxes',
    why: 'Every decision explains why — the CLI decision trace names the rule.',
    surface: 'cli',
    pin: { x: 25, y: 70 },
  },
  {
    number: 7,
    title: 'Design for explicit role division',
    why: 'Three surfaces for three audiences — type, click, automate.',
    surface: 'dashboard',
    pin: { x: 50, y: 10 },
  },
  {
    number: 8,
    title: 'Intentional restraint',
    why: 'Show less by default. Collapsed nodes, disabled save, --quiet flag.',
    surface: 'dashboard',
    pin: { x: 70, y: 45 },
  },
  {
    number: 9,
    title: 'Validate before you compute',
    why: 'Bad input caught client-side — it never reaches the API.',
    surface: 'dashboard',
    pin: { x: 45, y: 60 },
  },
  {
    number: 10,
    title: 'Graceful failure is a feature',
    why: 'Every failure mode has a defined, tested outcome — retry, timeout, redirect.',
    surface: 'sdk',
    pin: { x: 55, y: 75 },
  },
];
