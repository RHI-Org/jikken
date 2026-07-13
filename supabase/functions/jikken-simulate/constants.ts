// AUTO-GENERATED from shared/src/constants.ts by scripts/sync-edge-shared.mjs — do not edit.
/**
 * Shared Constants Across Surfaces
 *
 * Colors, exit codes, severities — all surfaces use these.
 * Single source of truth: if a color or code changes here, the CLI's ANSI
 * output, the Dashboard's Tailwind classes, and the SDK's data all follow.
 */

/**
 * Exit codes — machines read these.
 */
export const EXIT_CODES = {
  ALL_CLEAR: 0,          // All checks passed
  CONFLICT: 1,           // Rule conflicts detected — stop deployment
  WARNING: 2,            // Non-blocking issues — proceed with caution
  INVALID_INPUT: 3,      // Bad request — fix and retry
  CONNECTION_FAILURE: 4, // API unreachable — retryable
  DEPRECATED: 5,         // Flag uses deprecated config pattern
  QUOTA_EXCEEDED: 6,     // Rate limit hit
} as const;

export type ExitCode = (typeof EXIT_CODES)[keyof typeof EXIT_CODES];

/**
 * Human-readable interpretation of each exit code — shared so the CLI
 * footer and the Dashboard status line always say the same thing.
 */
export const EXIT_CODE_MESSAGES: Record<ExitCode, string> = {
  [EXIT_CODES.ALL_CLEAR]: 'All checks passed.',
  [EXIT_CODES.CONFLICT]: 'Conflicts detected. Fix before deploying.',
  [EXIT_CODES.WARNING]: 'Partial matches. Proceed with caution.',
  [EXIT_CODES.INVALID_INPUT]: 'Invalid input. Check flag ID and rules.',
  [EXIT_CODES.CONNECTION_FAILURE]: 'Service unavailable. Retry later.',
  [EXIT_CODES.DEPRECATED]: 'Flag uses deprecated config pattern.',
  [EXIT_CODES.QUOTA_EXCEEDED]: 'Rate limit exceeded. Wait and retry.',
};

/**
 * Severity levels for messages.
 */
export const SEVERITY = {
  FATAL: 'fatal',     // Stops execution
  WARNING: 'warning', // Continues but alerts
  INFO: 'info',       // Nice-to-have notice
} as const;

/**
 * Color semantics — consistent across surfaces.
 *
 * `hex` is the canonical value: the Dashboard's Tailwind text classes and
 * the presentation terminal's ANSI theme both resolve to exactly this hex,
 * which is what the color-parity integration test asserts.
 */
export const COLORS = {
  RECEIVE: {
    bg: 'bg-green-200',
    border: 'border-green-500',
    text: 'text-green-700',
    ansi: '\u001b[32m',
    hex: '#15803d', // Tailwind green-700
  },
  EXCLUDE: {
    bg: 'bg-red-200',
    border: 'border-red-500',
    text: 'text-red-700',
    ansi: '\u001b[31m',
    hex: '#b91c1c', // Tailwind red-700
  },
  PARTIAL: {
    bg: 'bg-yellow-200',
    border: 'border-yellow-500',
    text: 'text-yellow-700',
    ansi: '\u001b[33m',
    hex: '#a16207', // Tailwind yellow-700
  },
} as const;

export const ANSI_RESET = '\u001b[0m';

/**
 * Validation patterns.
 */
export const PATTERNS = {
  FLAG_ID: /^[a-z0-9-]+$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  COUNTRY_CODE: /^[A-Z]{2}$/,
} as const;
