# Jikken — Implementation Plan (v3)

**Product:** **Jikken** (実験, "experiment") — a feature-flag lifecycle tool
built as a cross-surface UX demonstration.
**Spec:** `2026-07-12-spec` (v1.0 Final) is the source of truth for product
behavior — data model, CLI, Dashboard, SDK, CI/CD, tests. This plan is the
build order, the presentation-shell design, and the decision log from the
2026-07-13 design review.

## 🎯 Objective

Prove **cross-surface coherence**: one design intent (colors, terminology,
exit codes) expressed identically across a CLI (engineers), a Dashboard (PMs),
and an SDK (pipelines) — presented in a portfolio-grade shell modeled on the
Retailor demo (`portfolio.experienceplus.ai/retailor-demo`): **split screen,
live demo on the right, collapsible project-notes panel on the left.**

## ✅ Decision Log (design review, 2026-07-13)

| Decision | Choice | Notes |
|---|---|---|
| Backend | **Supabase** (org project) | Real persistence beats the spec's mock API. Must be the existing org project (`bsfngnjvmostukrfhoxx`) — the `.experienceplus.ai` SSO cookie is tied to it. Tables prefixed `jikken_`. |
| Deployment | **jk.experienceplus.ai** + SSO | Own Vercel project; behind the shared SSO cookie like rt./lv./ts./r. Folio links to it. Two-letter subdomain from the Jikken brand, matching the rt. → Retailor pattern. |
| CLI in presentation | **Real engine in browser** | xterm.js terminal runs the actual shared simulation engine — same code path as the installed CLI. Preset command chips + free typing. |
| Dashboard scope | **All five pages** (per spec §5.1) | FlagList, FlagEditor, SimulationView, History, Settings. History is real Supabase audit data. |
| Product brand | **Jikken** | Masthead, CLI, SDK scope. The CLI binary becomes `jikken` (not `flagsim`) — a product whose thesis is terminology parity can't have a CLI named differently from its brand. npm scope `@jikken/*`. |
| Headline demo moment | **Realtime hand-off, centerpiece** | Run a simulation in the CLI tab → the Dashboard tab's history updates instantly via Supabase Realtime, with a pulse highlight on the arriving row. Staged as its own pinned moment in the notes panel. |

Kept from earlier revisions: npm workspaces monorepo, `shared/` as the single
source of truth, **seeded deterministic scenario engine** (replaces the spec's
`Math.random()` simulator stub so every demo run is reproducible).

## 🏗 Architecture

npm workspaces monorepo:

```
jikken/
├── shared/            # THE AUTHORITY — types.ts, constants.ts (spec §3),
│                      #   engine.ts (seeded simulation engine — isomorphic:
│                      #   runs in browser, Node CLI, and Deno Edge Function)
├── cli/               # `jikken` binary — Commander.js, exit codes 0–6 (spec §4)
├── dashboard/         # React/Vite/Tailwind — 5 pages (spec §5)
├── sdk/               # @jikken/sdk — FlagClient + FlagApiError (spec §6)
├── presentation/      # THE STAGE — Retailor-style shell (§Shell below)
├── supabase/
│   ├── functions/simulate/   # Edge Function: runs shared engine, writes audit
│   └── migrations/           # jikken_flags, jikken_simulations (+ RLS)
├── flags/             # dark-mode.json sample (spec §7.2)
├── data/              # mock-users.json, scenarios/ (seeded runs)
├── tests/integration/ # cross-surface consistency tests (spec §8.4)
└── .github/workflows/ # flag-validation.yml (spec §7.1)
```

### The engine runs in three places, identically

`shared/engine.ts` is pure, dependency-free, seeded TypeScript:

1. **Browser** — the presentation's CLI tab executes it directly (no backend
   exec surface), then persists the result to Supabase with the user's session.
2. **Node** — the installed `jikken` CLI runs it locally, same persistence.
3. **Edge Function** — `POST /functions/v1/simulate` for the SDK and CI/CD,
   authenticated by an API key (stored as a Supabase secret; spec §6 Bearer
   pattern). Same engine, so exit codes and summaries are bit-identical.

### Supabase (org project — shared with the portfolio)

- **Tables:** `jikken_flags` (flag configs), `jikken_simulations` (every run:
  who/where/result — this *is* the History page and the audit story).
  RLS: authenticated users read/write; Edge Function uses service role.
- **Realtime:** Dashboard subscribes to `jikken_simulations` inserts — powers
  the centerpiece hand-off.
- **Auth/SSO:** vendor the chunked-cookie storage adapter from
  `RHI-Org/components/lib/auth-storage.ts` (same as folio);
  `@supabase/supabase-js` pinned `^2.93.2` per org rule. Login redirects to
  the shared login; the cookie carries over from any `.experienceplus.ai` app.

### Two design systems, deliberately

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
│ Jikken           [⇤]│   scenario: [all-clear|conflict|warning] ⟳   │
│ One design, three   │              [CLI] [Dashboard] [SDK]         │
│ surfaces            │                                              │
│─────────────────────│                                              │
│ Overview│Principles │        LIVE DEMO STAGE                       │
│         │(10)│Tech  │        (active surface renders here,        │
│─────────────────────│         real and interactive — not          │
│ ▸ THE PROBLEM       │         screenshots)                        │
│ ▸ THE APPROACH      │                                              │
│ ★ The hand-off      │                                              │
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
     ChevronRight rotating 90°). Plus **★ The hand-off** — a featured item
     that stages the Realtime centerpiece: it runs a simulation in the CLI
     tab, then auto-switches to the Dashboard tab as the Realtime row lands
     with a pulse highlight. One click, whole thesis.
  2. **Principles (10)** — the spec §11.1 design principles as **numbered,
     clickable items** (blue pin circle + text + ArrowRight affordance),
     ported from Retailor's Changes list: clicking a principle **commands the
     demo** — switches the right stage to the surface that demonstrates it
     and drops a matching numbered pin/marker on the exact UI element
     (e.g. ② "Functional color" → Dashboard, pin on the summary card;
     ③ "Exit codes" → CLI, pin on the exit-code line). Each principle
     carries `{ surface, target, pin: [x%, y%] }`.
  3. **Tech** — stack list in Retailor's format (bold name + one-line "why"
     per row): shared isomorphic engine, Commander.js, React/Vite/Tailwind,
     Supabase (Postgres/Realtime/Edge Functions/SSO), GitHub Actions.
- Small type throughout (0.7–0.9rem), generous line-height, no cards.

### Right stage — the live demo

- **Scenario picker** (all-clear / conflict / warning) + restart in the top
  bar: sets the engine seed so all three tabs reflect the same deterministic
  run — demonstrating success metric #3 live.
- Surface switcher: **CLI / Dashboard / SDK** text tabs.
- **CLI tab:** xterm.js terminal running the real shared engine in-browser.
  Preset command chips (`jikken simulate --flag dark-mode --rollout 25`,
  `--format json`, an invalid flag ID to show "Did you mean?") plus free
  typing. Every run persists to `jikken_simulations`. On-screen ANSI colors
  must equal the Dashboard hex values — success metric #1.
- **Dashboard tab:** the real dashboard app mounted in the stage (scaled to
  fit) — not mock JSX previews like spec §9.2. Live Realtime subscription;
  arriving simulation rows pulse.
- **SDK tab:** code sample with a "Run" affordance that calls the real Edge
  Function and prints the live result beneath it.
- Desktop-first; ≤1024px the panel hides behind the edge tab (dashboard
  targets desktop admins per spec §11.5 — no mobile chrome-drop needed).

## 🚀 Phases

### Phase 1 — Shared core + Supabase (~7h) · spec §2–3
1. npm workspaces scaffold, root scripts (`npm run cli|dashboard|present|test`).
2. `shared/types.ts` + `shared/constants.ts` verbatim from spec §3.
3. `shared/engine.ts` — seeded, pure, isomorphic simulation engine; scenario
   definitions in `data/scenarios/` (`all-clear`/`conflict`/`warning`).
4. Migrations: `jikken_flags`, `jikken_simulations` + RLS; seed dark-mode flag.
5. `simulate` Edge Function wrapping the engine (API-key auth, audit write).

### Phase 2 — CLI (~6h) · spec §4
1. `jikken simulate` + `jikken validate` per spec §4.2 (flags, validation,
   "Did you mean?" suggestions, exit codes 0–6) — engine from `shared/`.
2. Formatter per §4.3; persistence of runs to Supabase.
3. Test suite per §8.1 (exit codes, JSON output, `--quiet`, error paths).

### Phase 3 — Dashboard (~14h) · spec §5
1. All five pages per §5.1: FlagList, FlagEditor (progressive disclosure,
   live validation with suggestions), SimulationView (decision-trace tree,
   copy + PDF export), **History** (real `jikken_simulations` data, Realtime
   inserts with pulse), Settings.
2. Supabase data layer + `FlagApiError.getSuggestion()` per §5.7.
3. Component tests per §8.2.

### Phase 4 — SDK (~4h) · spec §6
1. `FlagClient` → Edge Function (timeout via AbortController), `FlagApiError`
   (`getFirstSuggestion`, `isRetryable`, `getRetryDelay`), `isSafeToDeploy()`.
2. Tests per §8.3 including backoff math.

### Phase 5 — CI/CD + integration (~3h) · spec §7, §8.4
1. `.github/workflows/flag-validation.yml` on `flags/*.json` changes, calling
   the SDK against the Edge Function.
2. Cross-surface integration tests: same scenario seed → identical exit code
   and summary from browser engine, Node CLI, and Edge Function.
3. **Color-parity test:** assert the hex behind each ANSI code equals the
   Tailwind token hex in `shared/constants.ts` (guards the core thesis).

### Phase 6 — Presentation shell + deploy (~8h) · §Shell above
1. Build the Retailor-style shell (panel, tabs, edge tab, pins).
2. Wire principle-clicks → surface/tab/pin commands; scenario picker;
   the ★ hand-off choreography (CLI run → auto-switch → Realtime pulse).
3. SSO integration (vendored auth-storage adapter, ProtectedRoute-equivalent).
4. New Vercel project + `jk.experienceplus.ai` (DNS **and** add the domain to
   the Vercel project — DNS alone won't serve SSL). README per spec §10.8.
   Link from folio.

**Total: ~42h (4–5 days).** Supabase + all-five-pages + Realtime choreography
add ~6h over the spec's §10.9 estimate — accepted in review.

## 🧪 Definition of done (spec §1 + §11.4 + review)

1. **Color parity** — CLI green is the Dashboard green (automated test).
2. **Terminology parity** — `rollout_percentage`, "Excluded", exit-code names
   identical across surfaces (enforced by importing only from `shared/`).
3. **Scenario coherence** — picking "conflict" in the shell produces the same
   outcome in all three tabs simultaneously.
4. **The hand-off works** — a CLI-tab run appears in the Dashboard tab via
   Realtime within ~1s, with the pulse highlight, every time.
5. **Every one of the 10 principles is clickable** in the notes panel and
   lands a pin on real UI that demonstrates it.
6. All test suites pass at spec §8.5 coverage minimums.
7. Live at `jk.experienceplus.ai` behind the shared SSO cookie.

## 🙅 Out of scope (spec §10.7 / §11.5)

Custom auth (SSO cookie covers it), deployment infra beyond Vercel + Supabase
(no K8s/Terraform), i18n, mobile-responsive dashboard, formal threat model.
