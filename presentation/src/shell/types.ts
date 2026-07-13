/**
 * Presentation shell — the integration contract.
 *
 * The data files (principles/tech/overview) implement these shapes; the shell
 * components consume them. Kept here so a principle click can command the
 * stage (switch surface + drop a pin) through one typed vocabulary.
 */
import type { ScenarioId } from '@jikken/shared';

export type { ScenarioId };

/** The three demo surfaces, each mapped to one audience. */
export type Surface = 'cli' | 'dashboard' | 'sdk';

/**
 * A pin dropped on the live stage when a principle is selected: normalized
 * [x, y] as percentages of the stage box (0–100), plus the numbered label.
 */
export interface Pin {
  x: number;
  y: number;
}

/** One of the 10 spec §11.1 design principles, made clickable. */
export interface Principle {
  /** 1-indexed order shown in the panel and on the pin. */
  number: number;
  /** Short principle name (spec §11.1 left column). */
  title: string;
  /** One-line "how it appears" (spec §11.1 right column), skim-friendly. */
  why: string;
  /** Which surface the click drives the stage to. */
  surface: Surface;
  /** Pin placement on that surface's stage (percent coords). */
  pin: Pin;
}

/** A row in the Tech tab: bold name + one-line "why". */
export interface TechItem {
  name: string;
  why: string;
}

/** A collapsible prose block in the Overview tab. */
export interface OverviewSection {
  /** Uppercase micro-label, e.g. "THE PROBLEM". */
  label: string;
  /** Body copy (skim-friendly, low reading level). */
  body: string;
}

/** A single stat in the Overview 4-up grid. */
export interface OverviewStat {
  value: string;
  label: string;
}
