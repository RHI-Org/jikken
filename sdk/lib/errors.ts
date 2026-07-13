/**
 * SDK Error Classes
 *
 * Design Principle: Errors teach, they don't just fail.
 * Every error includes a recovery path.
 */
export class FlagApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details: Array<{ field: string; suggestion: string }> = []
  ) {
    super(message);
    this.name = 'FlagApiError';
  }

  /**
   * Returns the first suggestion for quick recovery
   */
  getFirstSuggestion(): string | null {
    return this.details.length > 0 ? this.details[0].suggestion : null;
  }

  /**
   * Checks if this error is retryable
   */
  isRetryable(): boolean {
    return this.code === 'TIMEOUT' || this.code === 'CONNECTION_FAILURE';
  }

  /**
   * Returns retry delay in milliseconds (exponential backoff, capped at 10s)
   *
   * NOTE: The spec's prose formula (§6.3) reads
   * `Math.min(1000 * Math.pow(2, attempt), 10000)`, but its own test table
   * (§8.3) expects attempt=1 -> 1000, attempt=2 -> 2000, attempt=3 -> 4000,
   * attempt=10 -> 10000 (capped). That only holds with a `2^(attempt-1)`
   * exponent (attempt is 1-indexed: first retry = base delay). We match the
   * test expectations here since they are the concrete, checkable contract.
   */
  getRetryDelay(attempt: number): number {
    if (!this.isRetryable()) return 0;
    return Math.min(1000 * Math.pow(2, attempt - 1), 10000);
  }
}
