/**
 * Tech stack overview for the presentation shell.
 * Contains descriptions of the core technologies used.
 */
import type { TechItem } from '../types';

export const TECH: TechItem[] = [
  { name: "Shared isomorphic engine", why: "One seeded TypeScript engine runs in the browser, Node CLI, and Deno Edge Function — identical exit codes everywhere." },
  { name: "Commander.js", why: "Parses the CLI, powers 'Did you mean?' suggestions and exit codes 0–6." },
  { name: "React + Vite + Tailwind", why: "The Dashboard and this presentation shell; Tailwind tokens resolve to the same hex the CLI prints." },
  { name: "Supabase", why: "Postgres, Realtime, Edge Functions, and the shared .experienceplus.ai SSO cookie." },
  { name: "GitHub Actions", why: "flag-validation.yml runs the SDK against the Edge Function on every flag change." }
];