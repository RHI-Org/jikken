# Jikken (実験)

[![Flag Validation](https://github.com/RHI-Org/jikken/actions/workflows/flag-validation.yml/badge.svg)](https://github.com/RHI-Org/jikken/actions/workflows/flag-validation.yml)

One design intent, three surfaces. A feature-flag lifecycle tool built as a cross-surface UX demonstration.

Developer tooling can keep one coherent design language across every surface it touches. Green means "receives the flag" everywhere. Red means "excluded" everywhere. Yellow means "needs review" everywhere. The field is spelled `rollout_percentage` on every surface. Exit code 1 means the same conflict in the CLI, the SDK, and the CI pipeline. The hard part is not building one good interface — it is building three that feel like they came from the same mind.

## Three surfaces, one mind

| Surface | Audience | Tech Stack | Key Features |
| :--- | :--- | :--- | :--- |
| CLI (`jikken`) | Engineers | Commander.js | `simulate`, `validate`, `diff` commands |
| Dashboard | Product Managers | React, Vite, Tailwind | Flag editor, simulation tree, live history |
| SDK (`@jikken/sdk`) | Pipelines | TypeScript | `FlagClient`, `FlagApiError` with suggestions |

## The thesis is executable
The `tests/integration/coherence.test.ts` suite enforces design consistency through code:

1. **Color parity**: Canonical hex codes in shared constants must match the Tailwind palette values used in the Dashboard.
2. **Exit-code parity**: The CLI process exit code and JSON output must equal the in-process engine result for the same scenario.
3. **Vendor drift**: Edge Function engine copies must be byte-identical to `shared/src`.
4. **Terminology parity**: `rollout_percentage` must be spelled identically across all surfaces; variant spellings fail the build.

## One engine, three runtimes
`shared/src/engine.ts` is a pure, dependency-free, seeded TypeScript engine. It runs identically in three environments:
- **The browser**: Executed directly by the presentation's CLI tab.
- **Node**: Executed by the installed `jikken` CLI.
- **Supabase Edge Function**: Handles POST requests for the SDK and CI.

The engine does not read clocks, randomness, or environment variables for decisions. Same inputs produce bit-identical decisions and exit codes everywhere. Three deterministic scenarios (`all-clear`, `conflict`, `warning`) evaluate the same seeded user population to ensure cross-surface consistency.

## Exit codes
Defined in `shared/src/constants.ts`.

| Code | Constant | Meaning |
| :--- | :--- | :--- |
| 0 | `ALL_CLEAR` | All checks passed |
| 1 | `CONFLICT` | Rule conflicts detected, stop deployment |
| 2 | `WARNING` | Non-blocking issues, proceed with caution |
| 3 | `INVALID_INPUT` | Bad request, fix and retry |
| 4 | `CONNECTION_FAILURE` | API unreachable, retryable |
| 5 | `DEPRECATED` | Flag uses a deprecated config pattern |
| 6 | `QUOTA_EXCEEDED` | Rate limit hit |

## Quick start
Node 20+ required.

```bash
npm install
npm run cli -- simulate --scenario conflict     # exits 1: conflicts detected
npm run cli -- simulate --flag dark-mode --rollout 25
npm run dashboard                               # dashboard dev server
npm run present                                 # presentation shell dev server
npm test                                        # unit suites, every workspace
npm run test:integration                        # the coherence suite
```

## Repository layout
```text
jikken/
├── shared/          # the authority — types, constants, seeded engine, scenarios
├── cli/             # `jikken` binary — Commander.js, exit codes 0–6
├── dashboard/       # React/Vite/Tailwind — five pages
├── sdk/             # @jikken/sdk — FlagClient + FlagApiError
├── presentation/    # the stage — guided demo shell with a live terminal (xterm.js)
├── supabase/        # Edge Function (simulate) + migrations
├── flags/           # sample flag JSON
├── data/            # seeded mock users
└── tests/integration/  # cross-surface coherence tests
```

## Live demo
https://jk.experienceplus.ai
A guided walkthrough shell with the real CLI running in the browser and the real dashboard mounted beside it. Ten clickable design principles drop pins on the exact UI elements demonstrating them. Sign-in required.

## CI as a consumer
`.github/workflows/flag-validation.yml` runs all unit and coherence suites. The pipeline's pass/fail status is determined by the CLI's own exit code, run against the shared engine.

## How this was built
This project used an AI-native workflow: a written product spec (2026-07-12-spec) led to an implementation plan and design review (`IMPLEMENTATION_PLAN.md`). Claude Code acted as architect, delegating boilerplate to a smaller open model via `scripts/gemma.mjs`. Every delegated artifact was reviewed and typechecked before integration. Total time from spec to deployed product was roughly one working day.

## Design principles
Ten principles guide the UX: scannable in 3 seconds; colors functional, not decorative; exit codes are the real product; suggestions beat diagnoses; consistency is the hardest feature; transparent reasoning; explicit role division; intentional restraint; validate before you compute; graceful failure is a feature.