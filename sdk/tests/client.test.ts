/**
 * SDK Client Tests
 *
 * Tests API integration, error handling, and retry logic.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FlagClient } from '../lib/client';
import { FlagApiError } from '../lib/errors';
import type { SimulationResult } from '@jikken/shared';

const mockResult: SimulationResult = {
  flag_id: 'dark-mode',
  simulation_id: 'sim_123',
  result: 'all_clear',
  summary: { passed: 25, conflicted: 0, warned: 0, total: 25 },
  decisions: [],
  exit_code: 0,
  evaluated_at: '2026-07-13T14:23:01Z',
  total_latency_ms: 4.2,
};

describe('FlagClient', () => {
  let client: FlagClient;

  beforeEach(() => {
    client = new FlagClient({ apiKey: 'test_key' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('simulate()', () => {
    it('calls the correct endpoint', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResult,
      });
      vi.stubGlobal('fetch', fetchMock);

      await client.simulate({
        flag_id: 'dark-mode',
        mock_users: [],
        environment: 'staging',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8080/api/simulate',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: 'Bearer test_key',
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('throws FlagApiError on failure', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          json: async () => ({ code: 'FLAG_NOT_FOUND', message: 'Flag not registered' }),
        })
      );

      await expect(
        client.simulate({ flag_id: 'missing', mock_users: [], environment: 'staging' })
      ).rejects.toThrow(FlagApiError);
    });

    it('attaches suggestion to error object', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          json: async () => ({
            code: 'FLAG_NOT_FOUND',
            message: 'Flag not registered',
            details: [{ field: 'flag_id', suggestion: 'Check registered flags' }],
          }),
        })
      );

      expect.assertions(1);
      try {
        await client.simulate({ flag_id: 'missing', mock_users: [], environment: 'staging' });
      } catch (error) {
        expect((error as FlagApiError).getFirstSuggestion()).toBe('Check registered flags');
      }
    });

    it('rejects with TIMEOUT when the request exceeds timeoutMs', async () => {
      // fetch that never resolves on its own; only settles when aborted.
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation((_url: string, init: { signal: AbortSignal }) => {
          return new Promise((_resolve, reject) => {
            init.signal.addEventListener('abort', () => {
              const err = new Error('Aborted');
              err.name = 'AbortError';
              reject(err);
            });
          });
        })
      );

      const timeoutClient = new FlagClient({ apiKey: 'test_key', timeoutMs: 50 });

      await expect(
        timeoutClient.simulate({ flag_id: 'dark-mode', mock_users: [], environment: 'staging' })
      ).rejects.toMatchObject({ code: 'TIMEOUT' });
    });

    it('rejects with CONNECTION_FAILURE on network error', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockRejectedValue(new Error('network down'))
      );

      await expect(
        client.simulate({ flag_id: 'dark-mode', mock_users: [], environment: 'staging' })
      ).rejects.toMatchObject({ code: 'CONNECTION_FAILURE' });
    });
  });

  describe('isSafeToDeploy()', () => {
    it('returns true when exit_code is 0', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({ ...mockResult, exit_code: 0 }),
        })
      );

      const result = await client.isSafeToDeploy({
        flag_id: 'dark-mode',
        mock_users: [],
        environment: 'staging',
      });

      expect(result).toBe(true);
    });

    it('returns false when exit_code is 1', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({ ...mockResult, exit_code: 1 }),
        })
      );

      const result = await client.isSafeToDeploy({
        flag_id: 'dark-mode',
        mock_users: [],
        environment: 'staging',
      });

      expect(result).toBe(false);
    });

    it('returns true when exit_code is 2 (warning, still deployable)', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({ ...mockResult, exit_code: 2 }),
        })
      );

      const result = await client.isSafeToDeploy({
        flag_id: 'dark-mode',
        mock_users: [],
        environment: 'staging',
      });

      expect(result).toBe(true);
    });
  });

  describe('Error Retry Logic', () => {
    it('marks TIMEOUT as retryable', () => {
      const error = new FlagApiError('TIMEOUT', 'Request timed out', []);
      expect(error.isRetryable()).toBe(true);
    });

    it('marks CONNECTION_FAILURE as retryable', () => {
      const error = new FlagApiError('CONNECTION_FAILURE', 'Cannot reach service', []);
      expect(error.isRetryable()).toBe(true);
    });

    it('marks FLAG_NOT_FOUND as non-retryable', () => {
      const error = new FlagApiError('FLAG_NOT_FOUND', 'Flag not registered', []);
      expect(error.isRetryable()).toBe(false);
    });

    it('calculates exponential backoff delays', () => {
      const error = new FlagApiError('TIMEOUT', 'Request timed out', []);

      expect(error.getRetryDelay(1)).toBe(1000);
      expect(error.getRetryDelay(2)).toBe(2000);
      expect(error.getRetryDelay(3)).toBe(4000);
      expect(error.getRetryDelay(10)).toBe(10000); // Capped
    });

    it('returns 0 delay for non-retryable errors', () => {
      const error = new FlagApiError('FLAG_NOT_FOUND', 'Flag not registered', []);
      expect(error.getRetryDelay(1)).toBe(0);
    });
  });
});
