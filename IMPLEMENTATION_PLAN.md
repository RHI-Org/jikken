# Jikken Project Implementation Plan (Ecosystem-First Edition)

## 🎯 Objective
Build a high-fidelity, multi-surface "Feature Flag Lifecycle" demo that proves "Cross-Surface Coherence." The project must demonstrate that a single design intent (colors, terminology, logic) can be seamlessly expressed across a CLI (Engineers), a Dashboard (PMs), and an SDK (Pipelines).

**Goal:** A "Portfolio-Grade" interactive experience that feels like a single, living product.

## 🏗 Architecture: The Monorepo Ecosystem
Using npm/pnpm workspaces to enforce a "Single Source of Truth" (SSoT).

### Directory Structure
- `packages/shared`: **The Authority.** Contains TypeScript types, `ExitCode` enums, and the `DesignSystem` (exact hex codes for Green/Red/Yellow, terminology mappings).
- `packages/api`: **The Engine.** A Node.js/Supabase-backed simulation engine capable of "Scenario-based" deterministic playback.
- `packages/cli`: **The Engineer Surface.** Built with Commander.js, using `shared` for ANSI color-matched output.
- `packages/dashboard`: **The PM Surface.** React/Vite/Tailwind app using `shared` for design-system-matched UI.
- `packages/sdk`: **The Pipeline Surface.** A "Developer-Empathy" first client with structured error objects and suggestion logic.
- `packages/presentation`: **The Stage.** A dedicated "Portfolio Wrapper" app featuring a split-screen view: Design Thesis (Left) and Tabbed Live Demo (Right).
- `data/`: Scenario definitions and mock datasets.

---

## 🚀 Implementation Phases

### Phase 1: The Unified Core (The "Single Source of Truth")
**Goal:** Establish the design DNA and the workspace.
1.  **Workspace Setup:** Initialize monorepo and package scaffolding.
2.  **The Design Registry (`packages/shared`):** 
    - Define `ExitCode` (0-6) and `DecisionStatus` (RECEIVE, EXCLUDE, PARTIAL).
    - Define `DesignSystem` constants: `COLOR_MAP` (mapping status to both ANSI and Tailwind hex).
    - Define core interfaces: `Flag`, `User`, `SimulationResult`.
3.  **Data Engine:** Create `data/scenarios/` to define deterministic simulation runs.
4.  **Presentation Shell:** Scaffold `packages/presentation` with the Sidebar + Tabbed View architecture to provide immediate visual progress.

### Phase 2: The Simulation Engine (The "Brain")
**Goal:** Build the logic that powers all surfaces.
1.  **API/Edge Function:** Implement the `simulate` endpoint.
2.  **Scenario Logic:** The engine must accept a `scenario_id` to return deterministic results, allowing the Presentation UI to "play back" specific edge cases (e.g., "The High-Conflict Scenario").
3.  **Supabase Integration:** Real-time storage for flag configurations and audit logs.

### Phase 3: Synchronized Surface Development
**Goal:** Build the three tools in lockstep to ensure coherence.
1.  **The CLI:** Focus on "Scannability" and "Exit-Code-First" design.
2.  **The Dashboard:** Focus on "Progressive Disclosure" and "Visual Decision Tracing."
3.  **The SDK:** Focus on "Developer Empathy" (e.g., `error.getFirstSuggestion()`).

### Phase 4: The "Portfolio" Polish
**Goal:** Transform the code into a world-class demonstration.
1.  **Integration Testing:** Automated verification that a color change in `shared` reflects in all three surfaces.
2.  **Presentation Orchestration:** Connect the `presentation` app to the `api` so the tabs feel like a real, interactive demo.
3.  **CI/CD:** GitHub Actions for automated deployment of the Dashboard and Presentation surfaces.

---

## 🛠 Tech Stack Summary
- **Language/Runtime:** TypeScript, Node.js.
- **Frontend:** React, Vite, Tailwind CSS.
- **Backend/DB:** Supabase (PostgreSQL, Auth, Edge Functions, Realtime).
- **CLI:** Commander.js, Chalk.
- **Tooling:** npm/pnpm workspaces, Vitest, GitHub Actions.

## 🧪 Success Metrics (The "Thesis" Proof)
1.  **Color Parity:** The Green in the CLI terminal is identical to the Green in the Dashboard.
2.  **Terminology Parity:** "Excluded" in the CLI is "Excluded" in the Dashboard and `status: 'EXCLUDE'` in the SDK.
3.  **Scenario Coherence:** Running `scenario: 'conflict'` produces the same outcome across all three surfaces simultaneously.
