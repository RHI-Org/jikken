/**
 * SDK Client for Feature Flag Validation
 *
 * Machine-to-machine interface for CI/CD pipelines.
 *
 * Design Principle: Exit codes are the real product.
 * Design Principle: Graceful failure is a feature.
 * Design Principle: Suggestions beat diagnoses (even for machines).
 */
import type { SimulationResult, SimulationRequest } from '@jikken/shared';
import { FlagApiError } from './errors';

export interface ClientConfig {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
}

export class FlagClient {
  private apiKey: string;
  private baseUrl: string;
  private timeoutMs: number;

  constructor(config: ClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'http://localhost:8080';
    this.timeoutMs = config.timeoutMs || 5000;
  }

  /**
   * Run a flag simulation
   * @returns Promise<SimulationResult>
   * @throws FlagApiError on failure
   */
  async simulate(request: SimulationRequest): Promise<SimulationResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/api/simulate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new FlagApiError(
          error.code || 'UNKNOWN_ERROR',
          error.message || 'Simulation failed',
          error.details || []
        );
      }

      return response.json();
    } catch (err) {
      if (err instanceof FlagApiError) throw err;

      if ((err as Error).name === 'AbortError') {
        throw new FlagApiError(
          'TIMEOUT',
          `Timed out after ${this.timeoutMs}ms`,
          [{ field: 'timeout', suggestion: 'Increase timeoutMs in client config' }]
        );
      }

      throw new FlagApiError(
        'CONNECTION_FAILURE',
        'Cannot reach simulation service',
        [{ field: 'baseUrl', suggestion: `Verify ${this.baseUrl} is reachable` }]
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Convenience method for CI/CD pipelines
   * Returns true if safe to deploy, false if conflicts detected
   */
  async isSafeToDeploy(request: SimulationRequest): Promise<boolean> {
    const result = await this.simulate(request);
    return result.exit_code === 0 || result.exit_code === 2;
  }
}
