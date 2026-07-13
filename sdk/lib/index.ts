/**
 * SDK Public Exports
 *
 * Machine-to-machine interface for CI/CD pipelines.
 */
export { FlagClient } from './client';
export type { ClientConfig } from './client';
export { FlagApiError } from './errors';
export type { SimulationResult, SimulationRequest, FlagConfig } from '@jikken/shared';
export { EXIT_CODES, COLORS, SEVERITY } from '@jikken/shared';
