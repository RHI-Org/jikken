/**
 * Fuzzy ID suggestions — "Suggestions beat diagnoses."
 *
 * Cross-surface behavior: the Node CLI, the browser CLI runtime, and any
 * future surface must suggest the same nearest known ID for the same typo,
 * so the logic lives in shared/. Pure, dependency-free, deterministic.
 */

/** Levenshtein edit distance (insert/delete/substitute, cost 1) — two-row DP. */
function levenshtein(a: string, b: string): number {
  if (a.length < b.length) return levenshtein(b, a);
  if (b.length === 0) return a.length;

  let prevRow: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);
  let currRow: number[] = new Array<number>(b.length + 1).fill(0);

  for (let i = 1; i <= a.length; i++) {
    currRow[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currRow[j] = Math.min(currRow[j - 1] + 1, prevRow[j] + 1, prevRow[j - 1] + cost);
    }
    [prevRow, currRow] = [currRow, prevRow];
  }
  return prevRow[b.length];
}

/**
 * The candidate nearest to `input`, or null when nothing is plausibly a typo.
 * Threshold scales with input length (max(2, len/3)); ties keep the first
 * candidate in array order; comparison is case-sensitive — callers pass
 * already-normalized lowercase IDs.
 */
export function closestMatch(input: string, candidates: readonly string[]): string | null {
  if (candidates.length === 0) return null;

  for (const candidate of candidates) {
    if (input === candidate) return candidate;
  }

  let bestCandidate: string | null = null;
  let minDistance = Infinity;
  for (const candidate of candidates) {
    const distance = levenshtein(input, candidate);
    if (distance < minDistance) {
      minDistance = distance;
      bestCandidate = candidate;
    }
  }

  const threshold = Math.max(2, Math.floor(input.length / 3));
  return bestCandidate !== null && minDistance <= threshold ? bestCandidate : null;
}
