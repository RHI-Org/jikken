# Jikken — Implementation Plan (v2)

**Project:** Feature Flag Lifecycle Tool — a cross-surface UX demonstration.
**Spec:** `2026-07-12-spec` (v1.0 Final) is the source of truth for all product
behavior — data model, CLI, Dashboard, SDK, CI/CD, and tests. This plan is the
build order and the presentation-shell design that wraps it.

## 🎯 Objective

Prove **cross-surface coherence**: one design intent (colors, terminology,
exit codes) expressed identically across a CLI (engineers), a Dashboard (PMs),
and an SDK (pipelines) — and present it in a portfolio-grade shell modeled on
the Retailor demo (`portfolio.experienceplus.ai/retailor-demo`): **split
screen, live demo on the right, collapsible project-notes panel on the left.**

## 📝 Changes from v1 of this plan

| v1 said | v2 says | Why |
|---|---|---|
| Supabase backend (Postgres, Realtime, Edge Functions) | **Mock API server** (`mock-api-server/index.js`, localhost:8080) | Spec §2 decision table: "Real backend not needed. Focus on UX patterns, not infrastructure." Supabase is a stretch goal, not a phase. |
| Generic "Sidebar + Tabbed View" presentation shell | **Retailor-demo shell** (detailed below) | Matches the established portfolio pattern; the shell is now a first-class deliverable with its own spec section. |
| `packages/api` simulation engine w/ scenario playback | Deterministic **scenario engine inside the mock API** | Same capability (seeded, replayable runs), far less machinery. |
| Vague phase goals | Phases keyed to spec sections + the spec's own hour estimates (§10.9) | Traceability. |

Kept from v1: npm workspaces monorepo, `shared/` as the single source of truth,
scenario-based deterministic playback (the spec's `Math.random()` simulator
stub is replaced with a seeded engine so the demo is reproducible).

## 🏗 Architecture

npm workspaces monorepo. Structure follows spec §2 with one addition
(`presentation/` is promoted to a full app):

```
jikken/
├── shared/            # THE AUTHORITY — types.ts, constants.ts (spec §3)
├── mock-api-server/   # Express, localhost:8080 — seeded scenario engine (spec §2)
├── cli/               # flagsim — Commander.js, exit codes 0–6 (spec §4)
├── dashboard/         # React/Vite/Tailwind — 5 pages (spec §5)
├── sdk/               # FlagClient + FlagApiError, TS (spec §6)
├── presentation/      # THE STAGE — Retailor-style shell (this doc, §Shell)
├── flags/             # dark-mode.json sample (spec §7.2)
├── data/              # mock-users.json, mock-flags.json, scenarios/
├── tests/integration/ # cross-surface consistency tests (spec §8.4)
└── .github/workflows/ # flag-validation.yml (spec §7.1)
```

**Two design systems, deliberately:**
- **The product** (CLI/Dashboard/SDK) uses the spec's functional palette —
  green = receive, red = exclude, yellow = partial (spec §3.2 `COLORS`).
  That palette *is* the thesis; do not stone-ify it.
- **The shell** (presentation app) uses the portfolio language: stone palette,
  white panel, Swiss/typographic (no decorative cards), IBM Plex, blue
  `#2f6fed` reserved for numbered pins/markers only — exactly like
  `RetailorDemo.tsx` in the folio repo.

## 🖥 The Presentation Shell (replaces spec §9 layout)

Reference implementation: `folio/src/pages/RetailorDemo.tsx`. Reproduce its
anatomy, not just its idea:

```
┌─────────────────────┬──────────────────────────────────────────────┐
│ Flag Lifecycle   [⇤]│              [CLI] [Dashboard] [SDK]         │
│ One design, three   │                                              │
│ surfaces            │                                              │
│─────────────────────│                                              │
│ Overview│Principles │        LIVE DEMO STAGE                       │
│         │(10)│Tech  │        (active surface renders here,        │
│─────────────────────│         real and interactive — not          │
│ ▸ THE PROBLEM       │         screenshots)                        │
│ ▸ THE APPROACH      │                                              │
│ ① Scannable in 3s → │                                              │
│ ② Functional color →│                                              │
│ ③ Exit codes      → │                                              │
│ ...                 │                                              │
└─────────────────────┴──────────────────────────────────────────────┘
   collapsed → vertical "PROJECT NOTES" edge tab at mid-left
```

### Left panel — project notes (collapsible)

- White bg, `border-r border-stone-200`, width `min(440px, 40%)`.
- **Header:** bold title (~1.2rem) + one-line muted subtitle +
  `PanelLeftClose` button. Collapsed state re-opens via a vertical edge tab
  (`writing-mode: vertical-rl`, "PROJECT NOTES") like Retailor standalone —
  not a floating hamburger.
- **Tabs** (text tabs, 2px bottom border on active, stone-900/stone-400):
  1. **Overview** — 4-stat grid (`3 surfaces · 10 principles · 7 exit codes ·
     1 source of truth`), THE PROBLEM / THE APPROACH as collapsible sections
     with uppercase micro-labels (0.65rem, bold, tracked, stone-400,
     ChevronRight rotating 90°).
  2. **Principles (10)** — the spec §11.1 design principles as **numbered,
     clickable items** (blue pin circle + text + ArrowRight affordance).
     This is the signature interaction, ported from Retailor's Changes list:
     clicking a principle **commands the demo** — switches the right stage to
     the surface that demonstrates it and drops a matching numbered pin/marker
     on the exact UI element (e.g. ② "Functional color" → Dashboard tab,
     pin on the summary card; ③ "Exit codes" → CLI tab, pin on the exit-code
     line). Each principle carries `{ surface, target, pin: [x%, y%] }`.
  3. **Tech** — stack list in Retailor's format (bold name + one-line "why"
     per row, bullet dots): shared types, Commander.js, React/Vite/Tailwind,
     seeded scenario engine, GitHub Actions.
- Small type throughout (0.7–0.9rem), generous line-height, no cards.

### Right stage — the live demo

- Surface switcher: **CLI / Dashboard / SDK** text tabs in the top bar.
- **CLI tab:** an *interactive* terminal emulation (xterm.js or a faithful
  styled pane) that actually runs `flagsim` commands against the mock API —
  with 3–4 preset command chips (`simulate --rollout 25`, `--format json`,
  invalid flag ID to show the "Did you mean?" suggestion). ANSI colors must
  match the Dashboard hex values on screen — that's success metric #1.
- **Dashboard tab:** the real dashboard app mounted in the stage (direct mount
  or iframe), scaled to fit — not mock JSX previews like spec §9.2 has.
- **SDK tab:** code sample with a "Run" affordance that executes the snippet
  against the mock API and prints the live result beneath it.
- A **scenario picker** (all-clear / conflict / warning) above the stage sets
  the seeded scenario on the mock API, so all three tabs reflect the same
  deterministic run — demonstrating success metric #3 live.
- Restart control resets scenario + pins, like Retailor's session restart.
- Desktop-first; ≤1024px the panel is hidden behind the edge tab (dashboard
  targets desktop admins per spec §11.5 — no mobile chrome-drop needed).

## 🚀 Phases

### Phase 1 — Shared core + mock API (~5h) · spec §2, §3
1. npm workspaces scaffold, root scripts (`npm run api|cli|dashboard|present|test`).
2. `shared/types.ts` + `shared/constants.ts` verbatim from spec §3.
3. Mock API server with **seeded scenario engine**: `POST /api/simulate`
   accepts `scenario` (`all-clear` | `conflict` | `warning`) and returns
   deterministic `SimulationResult`s. Replaces the spec's random stub.
4. `data/mock-users.json`, `data/mock-flags.json`, `data/scenarios/`.

### Phase 2 — CLI (~6h) · spec §4
1. `flagsim simulate` + `flagsim validate` exactly per spec §4.2 (flags,
   validation, "Did you mean?" suggestions, exit codes 0–6).
2. Formatter per §4.3; point the simulator service at the mock API instead of
   inlining random logic.
3. Test suite per §8.1 (exit codes, JSON output, `--quiet`, error paths).

### Phase 3 — Dashboard (~12h) · spec §5
1. Five pages per §5.1: FlagList, FlagEditor (progressive disclosure,
   live validation with suggestions), SimulationView (decision-trace tree,
   copy + PDF export), History, Settings.
2. API layer + `FlagApiError.getSuggestion()` per §5.7.
3. Component tests per §8.2.

### Phase 4 — SDK (~4h) · spec §6
1. `FlagClient` (timeout via AbortController), `FlagApiError`
   (`getFirstSuggestion`, `isRetryable`, `getRetryDelay`), `isSafeToDeploy()`.
2. Tests per §8.3 including backoff math.

### Phase 5 — CI/CD + integration (~3h) · spec §7, §8.4
1. `.github/workflows/flag-validation.yml` on `flags/*.json` changes.
2. Cross-surface integration tests: same scenario → same exit code and same
   summary counts from CLI, Dashboard API layer, and SDK.
3. **Color-parity test:** assert the hex behind each ANSI code equals the
   Tailwind token hex in `shared/constants.ts` (guards the core thesis).

### Phase 6 — Presentation shell + polish (~6h) · this doc §Shell
1. Build the Retailor-style shell (panel, tabs, edge tab, pins).
2. Wire principle-clicks → surface/tab/pin commands; scenario picker.
3. README (quick start per spec §10.8), deploy the presentation + dashboard.

**Total: ~36h (3.5–4.5 days).** Shell adds ~3h over the spec's §10.9 estimate.

## 🧪 Definition of done (spec §1 + §11.4)

1. **Color parity** — CLI green is the Dashboard green (automated test).
2. **Terminology parity** — `rollout_percentage`, "Excluded", exit-code names
   identical across surfaces (enforced by importing only from `shared/`).
3. **Scenario coherence** — picking "conflict" in the shell produces the same
   outcome in all three tabs simultaneously.
4. **Every one of the 10 principles is clickable** in the notes panel and
   lands a pin on real UI that demonstrates it.
5. All test suites pass at spec §8.5 coverage minimums.

## 🙅 Out of scope (spec §10.7 / §11.5)

Auth, real database, deployment infra (K8s/Terraform), i18n, mobile
responsive dashboard, formal threat model. **Stretch (post-v1):** swap the
mock API for Supabase to add realtime audit-log streaming to the History page.
