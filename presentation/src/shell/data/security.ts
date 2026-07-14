/**
 * Security tab — the "what a surface won't let you do" side of the design.
 * Same shape as the Tech tab (bold name + one-line "why"), framed for a
 * governance audience: least privilege, tamper-evident audit, bounded inputs.
 */
import type { TechItem } from '../types';

export const SECURITY: TechItem[] = [
  {
    name: 'Authenticated is not trusted',
    why: 'Row-level security grants read and append, never client-side delete; the feature catalog is read-only. A shared demo account can explore everything and corrupt nothing.',
  },
  {
    name: 'Tamper-evident audit trail',
    why: 'Every simulation row is bound to the caller who ran it (created_by = auth.uid()) — a decision can’t be forged onto another user. The History surface is the governance record.',
  },
  {
    name: 'Guardrails at the boundary',
    why: 'The evaluation Edge Function caps the audience payload, so no single request can exhaust the engine or flood the live feed. Validate before you compute.',
  },
  {
    name: 'Constant-time secret checks',
    why: 'The machine API key is compared with a timing-safe digest, not a plain string equality — the check’s duration doesn’t leak how much of the key matched.',
  },
  {
    name: 'Least-privilege pipeline',
    why: 'The CI token is scoped to read-only. The gate blocks unsafe deploys without ever holding write access to the repository.',
  },
  {
    name: 'Secrets stay server-side',
    why: 'Service-role keys live only in the Edge Function; the browser holds just the public anon key. Verified by a full git-history secret scan before the repo opened up.',
  },
];
