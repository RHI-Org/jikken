/**
 * Output Formatters
 *
 * Consistent styling between text and JSON output — the same terminology
 * and colors as the Dashboard and SDK, imported from @jikken/shared.
 *
 * Design Principle: Output scannable in 3 seconds.
 * Design Principle: Colors functional, not decorative.
 */
import type { SimulationResult, SimulationDiff } from '@jikken/shared';
import { ANSI_RESET, COLORS, EXIT_CODE_MESSAGES } from '@jikken/shared';

export function formatOutput(
  result: SimulationResult,
  format: 'text' | 'json',
  quiet: boolean,
): string {
  if (format === 'json') {
    return JSON.stringify(result, null, 2);
  }

  const HEADER = "\u001b[1m\u001b[38;5;232m"; // bold dark — section headers
  const LABEL  = "\u001b[38;5;244m";           // mid grey — field labels
  const FAINT  = "\u001b[38;5;250m";           // faint grey — separator rules
  const VALUE  = "\u001b[38;5;238m";           // near-black — values

  let output = '\n';
  output += `${HEADER}FLAG SIMULATION RESULT${ANSI_RESET}\n`;
  output += `${FAINT}${'='.repeat(60)}${ANSI_RESET}\n`;
  output += '\n';
  output += `${LABEL}Flag:${ANSI_RESET} ${VALUE}${result.flag_id}${ANSI_RESET}\n`;
  output += `${LABEL}Evaluated:${ANSI_RESET} ${VALUE}${result.evaluated_at}${ANSI_RESET}\n`;
  output += '\n';
  output += `${HEADER}SUMMARY${ANSI_RESET}\n`;
  output += `${FAINT}${'-'.repeat(40)}${ANSI_RESET}\n`;
  output += `  ${LABEL}Received:${ANSI_RESET}  ${COLORS.RECEIVE.ansi}${result.summary.passed}${ANSI_RESET}\n`;
  output += `  ${LABEL}Excluded:${ANSI_RESET}  ${COLORS.EXCLUDE.ansi}${result.summary.conflicted}${ANSI_RESET}\n`;
  output += `  ${LABEL}Partial:${ANSI_RESET}   ${COLORS.PARTIAL.ansi}${result.summary.warned}${ANSI_RESET}\n`;
  output += `  ${LABEL}Total:${ANSI_RESET}     ${VALUE}${result.summary.total}${ANSI_RESET}\n`;
  output += '\n';
  output += `${LABEL}Exit code:${ANSI_RESET} ${VALUE}${result.exit_code} — ${EXIT_CODE_MESSAGES[result.exit_code as keyof typeof EXIT_CODE_MESSAGES]}${ANSI_RESET}\n`;

  if (!quiet) {
    output += '\n';
    output += `${HEADER}DECISION TRACE${ANSI_RESET}\n`;
    output += `${FAINT}${'-'.repeat(40)}${ANSI_RESET}\n`;

    const decisionsToDisplay = result.decisions.slice(0, 5);
    for (const d of decisionsToDisplay) {
      const color =
        d.decision === 'receive'
          ? COLORS.RECEIVE
          : d.decision === 'exclude'
            ? COLORS.EXCLUDE
            : COLORS.PARTIAL;

      output += `  ${color.ansi}[${d.decision.toUpperCase()}]${ANSI_RESET} ${VALUE}${d.user_id}${ANSI_RESET}\n`;
      output += `    ${LABEL}Reason:${ANSI_RESET} ${d.reason}\n`;
    }

    if (result.decisions.length > 5) {
      const remaining = result.decisions.length - 5;
      output += '\n';
      output += `  ${VALUE}... and ${remaining} more${ANSI_RESET}\n`;
    }
  }

  return output;
}

export function formatDiff(diff: SimulationDiff, format: 'text' | 'json', quiet: boolean): string {
  if (format === 'json') {
    return JSON.stringify(diff, null, 2);
  }

  const HEADER = "\u001b[1m\u001b[38;5;232m";
  const LABEL = "\u001b[38;5;244m";
  const FAINT = "\u001b[38;5;250m";
  const VALUE = "\u001b[38;5;238m";

  let out = "\n";
  out += `${HEADER}CHANGE IMPACT${ANSI_RESET}\n`;
  out += `${FAINT}${"=".repeat(60)}${ANSI_RESET}\n\n`;
  out += `${LABEL}Flag:${ANSI_RESET} ${VALUE}${diff.flag_id}${ANSI_RESET}\n`;

  const netSign = diff.net_receivers >= 0 ? "+" : "";
  const netColor = diff.net_receivers >= 0 ? COLORS.RECEIVE.ansi : COLORS.EXCLUDE.ansi;
  out += `${LABEL}Receiving:${ANSI_RESET} ${VALUE}${diff.before.summary.passed} -> ${diff.after.summary.passed}${ANSI_RESET} ${netColor}(${netSign}${diff.net_receivers})${ANSI_RESET}\n\n`;

  out += `${HEADER}GAINED ACCESS (${diff.gained.length})${ANSI_RESET}\n`;
  out += `${FAINT}${"-".repeat(40)}${ANSI_RESET}\n`;
  if (diff.gained.length === 0) {
    out += `${LABEL}  (none)${ANSI_RESET}\n`;
  } else if (!quiet) {
    for (const g of diff.gained) {
      out += `  ${COLORS.RECEIVE.ansi}+ ${g.user_id}${ANSI_RESET}  ${VALUE}${g.reason}${ANSI_RESET}\n`;
    }
  }

  out += "\n";
  out += `${HEADER}LOST ACCESS (${diff.lost.length})${ANSI_RESET}\n`;
  out += `${FAINT}${"-".repeat(40)}${ANSI_RESET}\n`;
  if (diff.lost.length === 0) {
    out += `${LABEL}  (none)${ANSI_RESET}\n`;
  } else if (!quiet) {
    for (const l of diff.lost) {
      out += `  ${COLORS.EXCLUDE.ansi}- ${l.user_id}${ANSI_RESET}  ${VALUE}${l.before} -> ${l.after}: ${l.reason}${ANSI_RESET}\n`;
    }
  }

  out += "\n";
  const exitMsg = EXIT_CODE_MESSAGES[diff.exit_code as keyof typeof EXIT_CODE_MESSAGES];
  out += `${LABEL}Exit code:${ANSI_RESET} ${VALUE}${diff.exit_code} — ${exitMsg}${ANSI_RESET}\n`;

  return out;
}