/**
 * Output Formatters
 *
 * Consistent styling between text and JSON output — the same terminology
 * and colors as the Dashboard and SDK, imported from @jikken/shared.
 *
 * Design Principle: Output scannable in 3 seconds.
 * Design Principle: Colors functional, not decorative.
 */
import type { SimulationResult } from '@jikken/shared';
import { ANSI_RESET, COLORS, EXIT_CODE_MESSAGES } from '@jikken/shared';

export function formatOutput(
  result: SimulationResult,
  format: 'text' | 'json',
  quiet: boolean,
): string {
  if (format === 'json') {
    return JSON.stringify(result, null, 2);
  }

  let output = '\n';
  output += 'FLAG SIMULATION RESULT\n';
  output += '='.repeat(60) + '\n';
  output += '\n';
  output += `Flag: ${result.flag_id}\n`;
  output += `Evaluated: ${result.evaluated_at}\n`;
  output += '\n';
  output += 'SUMMARY\n';
  output += '-'.repeat(40) + '\n';
  output += `  Received:  ${COLORS.RECEIVE.ansi}${result.summary.passed}${ANSI_RESET}\n`;
  output += `  Excluded:  ${COLORS.EXCLUDE.ansi}${result.summary.conflicted}${ANSI_RESET}\n`;
  output += `  Partial:   ${COLORS.PARTIAL.ansi}${result.summary.warned}${ANSI_RESET}\n`;
  output += `  Total:     ${result.summary.total}\n`;
  output += '\n';
  output += `Exit code: ${result.exit_code} — ${EXIT_CODE_MESSAGES[result.exit_code as keyof typeof EXIT_CODE_MESSAGES]}\n`;

  if (!quiet) {
    output += '\n';
    output += 'DECISION TRACE\n';
    output += '-'.repeat(40) + '\n';

    const decisionsToDisplay = result.decisions.slice(0, 5);
    for (const d of decisionsToDisplay) {
      const color =
        d.decision === 'receive'
          ? COLORS.RECEIVE
          : d.decision === 'exclude'
            ? COLORS.EXCLUDE
            : COLORS.PARTIAL;

      output += `  ${color.ansi}[${d.decision.toUpperCase()}]${ANSI_RESET} ${d.user_id}\n`;
      output += `    Reason: ${d.reason}\n`;
    }

    if (result.decisions.length > 5) {
      const remaining = result.decisions.length - 5;
      output += '\n';
      output += `  ... and ${remaining} more\n`;
    }
  }

  return output;
}
