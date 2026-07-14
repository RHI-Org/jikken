# AI-simulated UX research: Jikken

> **Research status: AI-simulated synthetic research — not real-user research.**
>
> No customers, job candidates, Dome Systems employees, or other human participants were interviewed or observed. The personas, reactions, and task outcomes below are model-generated hypotheses based on a cognitive walkthrough of the repository, product screenshots, and public Dome Systems materials. Validate consequential findings with real participants before treating them as evidence.

- **Study date:** July 14, 2026
- **Product reviewed:** Jikken presentation shell, CLI, Dashboard, SDK, CI gate, README, and recent strategic changes
- **Case-study context:** [Dome Systems — Product Engineer (UX)](https://www.domesystems.ai/careers/c0399272-d83e-43d4-a57b-c49123c9d1ec)
**Related product context:** [Dome Platform](https://www.domesystems.ai/platform) and [Dome Systems](https://www.domesystems.ai/)

## Executive summary

Jikken is a strong, role-relevant case study because it demonstrates interaction design across graphical and programmatic surfaces, not merely visual polish. Its clearest idea is that one governed decision should retain the same terminology, colors, reasons, and machine contract from simulation through deployment.

The synthetic panel predicts that the core thesis will land with technical evaluators. Recent strategic improvements strengthen that outcome: the README now frames feature flags as a stand-in for a governance lifecycle, the app exposes Security as a design surface, and the API documentation shows a recoverable error contract. These choices closely match Dome's public emphasis on coherent multi-surface operations, simulation before shipping, authorization, and immutable audit.

The largest remaining risk is proof, not concept. Jikken says the same run crosses four surfaces, but a reviewer must infer continuity because the selected feature, scenario, verdict, and simulation ID are not persistently visible together across the entire handoff. A second risk is evaluation cost: the overview, commands, walkthrough, UX rationale, and surface navigation offer several valid entry points without making one recommended first path dominant enough for a time-constrained portfolio reviewer.

## Method

This study used an AI-generated persona panel and a structured cognitive walkthrough. Each persona was assigned realistic goals, prior knowledge, and time pressure. The review considered:

- whether the product's purpose is understandable without explanation;
- whether the next action is discoverable;
- whether terms and results remain coherent across CLI, Dashboard, SDK, and CI;
- whether governance is demonstrated through decisions and constraints rather than asserted in prose;
- whether errors explain recovery;
- whether a hiring reviewer can find evidence of product judgment and AI-native delivery quickly.

Evidence came from the current source, tests, screenshots, README, recent commits, and Dome's public role and platform pages. No telemetry, usability recordings, production analytics, or human interviews were available.

### Interpretation scale

- **Observed:** directly present in the interface, source, documentation, or test suite.
- **Predicted:** a synthetic persona's likely interpretation or behavior.
- **Confidence:** confidence that the hypothesis is worth testing, not proof that real users will behave this way.

## Synthetic personas

### 1. Maya — product manager

- **Goal:** understand whether a targeting change will remove access from existing users.
- **Knowledge:** comfortable with feature flags and dashboards; avoids terminals.
- **Pressure:** wants an answer in under two minutes without an engineering ticket.
- **Primary path:** Overview → Commands → Dashboard detail → History.

### 2. Alex — platform engineer

- **Goal:** validate that the same policy result can be consumed reliably by automation.
- **Knowledge:** fluent in CLI, TypeScript, APIs, and CI exit codes.
- **Pressure:** skeptical of demos that present hard-coded screens as an integrated system.
- **Primary path:** CLI → SDK response → CI gate → API contract and tests.

### 3. Priya — security and governance operator

- **Goal:** determine why a change was blocked, who was affected, and whether the record can be trusted.
- **Knowledge:** policy evaluation, audit trails, least privilege, approval workflows.
- **Pressure:** needs explainability during review or incident response.
- **Primary path:** Dashboard simulation → History metadata → Security → CI verdict.

### 4. Jordan — Product Engineer (UX) hiring reviewer

- **Goal:** judge interaction-design depth, systems thinking, implementation ability, and AI-native working style.
- **Knowledge:** expert in technical-product UX; has limited portfolio-review time.
- **Pressure:** must distinguish a coherent product case from a polished frontend demo in roughly five minutes.
- **Primary path:** README → 90-second walkthrough → UX/Security/Tech → repository evidence.

## Synthetic task walkthrough

| Task | Predicted outcome | Friction hypothesis | Confidence |
| --- | --- | --- | --- |
| Explain Jikken after the first screen | Mostly successful | The tagline communicates preview and prevention, but the meaning of “Jikken” and the experiment metaphor live in the README rather than the app. | Medium |
| Select a feature and risky scenario | Successful with guidance | The brace and disabled scenario menu communicate dependency. Selecting either input also issues a command and moves the user to CLI, which may surprise a dashboard-oriented user. | Medium |
| Identify who loses access | Successful | CLI diff and Dashboard decision rows expose affected users and reasons. This is one of the clearest proof points. | High |
| Confirm the same evaluation crosses surfaces | Partially successful | Shared values and exit codes match, but no persistent context or run identifier visibly binds the four screens together. | High |
| Understand why deployment is blocked | Successful | Exit code, affected-user count, pipeline state, and plain-language banner create a strong human/machine pairing. | High |
| Audit a prior decision | Mostly successful | Searchable, expandable History exposes metadata; ownership, policy version, approval state, and exception history are not yet visible. | High |
| Recover from bad CLI/API input | Successful in documented examples | Suggestions and typed errors are strong, but the live walkthrough emphasizes the success/conflict path more than recovery. | Medium |
| Assess AI-native product practice | Partially successful | The tool list, Gemma script, commit history, tests, and rapid iteration provide evidence, but the decision/evaluation loop is not summarized as a case-study artifact. | High |

## What is working well

### A coherent decision contract

**Observed:** canonical colors, terminology, result types, and exit codes are shared and tested. The SDK exposes machine-readable results, while the CI surface translates the same contract into a visible deployment decision.

**Predicted response:** Alex and Jordan are likely to recognize this as systems-level UX rather than screen-level consistency. It directly demonstrates the role requirement to design across dashboard, CLI, SDK, and API interactions.

### Governance is becoming the product story

**Observed:** the README explicitly reframes feature flags as a governance lifecycle; the Security tab explains guardrails such as read-only catalog access, bounded inputs, audit ownership, and least-privilege CI; the CI surface visibly refuses a risky deploy.

**Predicted response:** Priya is likely to find the refusal states more credible than a generic “secure” claim. The strongest moment is that the product shows what it will not permit.

### Human and machine explanations coexist

**Observed:** the Dashboard and CLI explain affected users and reasons, while exit codes and structured SDK/API results support automation.

**Predicted response:** this reduces the common tradeoff between readable output and dependable machine behavior. It is especially relevant to Dome's mix of graphical and programmatic interfaces.

### Strategic documentation improvements help evaluators

**Observed:** real screenshots replace stylized mockups; the README leads with the governance thesis; the API section documents auth, success, error, retry, and timeout behavior; planning artifacts are organized under `docs/`.

**Predicted response:** Jordan can find more evidence without reverse-engineering the repository. The case now presents product reasoning, security judgment, and implementation depth together.

## Findings and possible fixes

### F1 — Cross-surface continuity is asserted more clearly than it is shown

**Severity:** High

**Observed:** simulation IDs appear in SDK output and Dashboard History, while the CLI diff and CI gate emphasize outcomes. The currently selected feature and scenario live mainly in Commands or individual surfaces.

**Predicted:** Alex may wonder whether the screens represent one persisted run or several deterministic recomputations. This weakens the central “one input, four surfaces, one contract” proof.

**Possible fixes:**

1. Add a compact persistent run-context bar above every surface: feature, scenario, simulation ID, verdict, and environment.
2. Make the simulation ID copyable and use the same ID as a deep link into History.
3. Label whether a surface is showing a live persisted run, a deterministic replay, or a local fallback.
4. Add one integration test that traces a simulation ID from CLI persistence to Dashboard History and SDK/CI output.

**Success signal:** in moderated testing, 4 of 5 technical participants can explain how the screens are connected without opening the README.

### F2 — The first-run path has too many competing starts

**Severity:** High for portfolio evaluation; Medium for repeat use

**Observed:** a reviewer can read the overview, start the walkthrough, open Commands, switch surfaces, open UX rationale, or inspect Security/Tech.

**Predicted:** Jordan may explore laterally and miss the strongest end-to-end story within a short review window. Maya may read explanatory text instead of reaching the impact result quickly.

**Possible fixes:**

1. Make one primary action dominant: “Run the risky-change demo”; keep “Explore freely” secondary.
2. Add a three-beat preview under the CTA: choose change → inspect impact → enforce decision.
3. After the walkthrough, offer evidence-oriented next steps: “Inspect architecture,” “Review security decisions,” and “See research.”
4. Remember completion and default returning users to free exploration.

**Success signal:** at least 80% of first-time participants reach the blocked CI verdict within two minutes without facilitator help.

### F3 — Selecting inputs triggers an implicit surface change

**Severity:** Medium

**Observed:** issuing a command now opens CLI consistently, including a command generated by feature/scenario selection.

**Predicted:** this is coherent for command semantics but may violate Maya's expectation that menus configure shared context without navigating away. The interface describes selection as setting input for every surface, not explicitly as running a CLI command.

**Possible fixes:**

1. Separate “select shared input” from “run in CLI”; show a clear Run button after both selections.
2. If selection intentionally auto-runs, label the behavior near the controls: “Selecting runs the diff in CLI.”
3. Preserve the user's current surface when only changing shared context, then show a non-blocking “CLI result updated” notification with an Open action.

**Success signal:** users can predict what will happen before changing the scenario, and no participant describes the surface switch as unexpected.

### F4 — Governance explains enforcement but not the review decision

**Severity:** High for the Dome case

**Observed:** “Needs Review” is a state, History is append-oriented, and risky deployment is blocked. The demo does not model an approver, policy version, exception, justification, or resolution path.

**Predicted:** Priya may see strong policy evaluation but an incomplete governance lifecycle. The question “what happens after the hold?” remains unanswered.

**Possible fixes:**

1. Add an explicit review state machine: pending review → approved/denied → superseded.
2. Require a reason and actor for an exception; render both in History.
3. Show the policy/rule version that produced each decision and link it to the affected users.
4. Demonstrate forbid-wins behavior with two conflicting rules and explain precedence.

**Success signal:** governance participants can answer who decided, under which policy, why, and what changed afterward from a single history record.

### F5 — The scripted dataset limits credibility as a simulation product

**Severity:** Medium

**Observed:** deterministic personas and scenarios make cross-surface parity testable. The Dashboard exposes audience outcomes, but users cannot visibly define or import a cohort during the main flow.

**Predicted:** Maya may understand the demo but not how Jikken would represent her organization's audience. Alex may correctly identify the deterministic data as a demo fixture rather than production-scale proof.

**Possible fixes:**

1. Add a read-only “Audience source” summary with cohort size, attributes, freshness, and provenance.
2. Offer a small CSV/JSON import sandbox with validation and a hard demo limit.
3. Show which attributes were considered, ignored, or unavailable during evaluation.
4. Explain clearly that deterministic seed data exists to prove parity, not to claim production analytics.

**Success signal:** participants can distinguish the rule, the cohort, and the proposed change, and can describe how their own data would enter the workflow.

### F6 — Security claims are strong but separated from the moments they govern

**Severity:** Medium

**Observed:** Security is a dedicated notes tab. The governed surfaces do not consistently link back to the relevant guardrail.

**Predicted:** Priya may appreciate the content but treat it as portfolio commentary rather than product interaction design.

**Possible fixes:**

1. Place contextual security explanations beside restricted actions and audit metadata.
2. Demonstrate one denied mutation and its recovery path in the live UI.
3. Link CI token scope, API caller identity, and audit ownership to the exact result record.

**Success signal:** participants encounter and understand at least one security constraint through normal task completion, without visiting the Security tab.

### F7 — Responsive density may hide the strongest evidence

**Severity:** Medium

**Observed:** the notes panel has a 320px minimum and can occupy 40% of the viewport while Dashboard adds its own sidebar. Tutorial cards and highlights compete for the remaining stage.

**Predicted:** on a laptop-sized review window, Jordan may see a compressed Dashboard and spend effort managing panels rather than reading evidence.

**Possible fixes:**

1. Auto-collapse project notes when entering Dashboard on narrower widths, with an obvious restore control.
2. Add a presentation breakpoint that turns notes into a drawer.
3. Run screenshot and interaction checks at 1280×720, 1440×900, and 200% zoom.
4. Ensure tutorial focus never crops the target and respects reduced motion.

**Success signal:** all walkthrough targets remain visible and readable at the target laptop viewport and keyboard-only zoom conditions.

### F8 — AI-native execution is listed, but the judgment loop is under-explained

**Severity:** Medium for the job application; Low for product use

**Observed:** Anthropic, Codex, Claude Code, and Gemma are named; a Gemma delegation script, planning artifacts, tests, and iterative commits exist.

**Predicted:** Jordan can see AI use but may not immediately see where human product judgment corrected or rejected model output—the distinction emphasized by the role.

**Possible fixes:**

1. Add a short case-study section: intent specified → work delegated → output evaluated → defects found → refinements shipped.
2. Include two concrete before/after decisions, such as scenario naming and walkthrough state synchronization.
3. Report verification methods and limits, not just speed.
4. Link this AI-simulated study while explicitly distinguishing it from real-user research.

**Success signal:** a reviewer can identify the candidate's judgment, not only the tools used, after reading one short section.

## Prioritized fix list

| Priority | Possible fix | Why now | Relative effort |
| --- | --- | --- | --- |
| P0 | Add persistent run context and simulation-ID continuity across all four surfaces | Proves the central thesis rather than asking the reviewer to infer it | Medium |
| P0 | Make the recommended first-run path singular and measurable | Protects the case study under a five-minute portfolio review | Small |
| P1 | Model the governance resolution path with actor, reason, policy version, and immutable history | Better matches the target role and Dome's control-plane domain | Large |
| P1 | Clarify whether input selection configures context or immediately runs/navigates | Removes a likely interaction surprise | Small |
| P1 | Integrate security constraints into task moments | Converts commentary into demonstrated UX | Medium |
| P2 | Expose audience provenance and a bounded import sandbox | Increases simulation credibility without losing determinism | Medium |
| P2 | Improve narrow-screen panel behavior and test zoom/keyboard paths | Keeps evidence readable under realistic review conditions | Medium |
| P2 | Document the AI-native judgment loop with before/after examples | Makes role fit faster to evaluate | Small |

## Suggested real-user validation

This synthetic work should be treated as a recruiting and design-planning artifact, not validation. A lean follow-up would use five to seven people:

- two platform engineers;
- one product manager who operates feature flags;
- one security or governance operator;
- one developer-experience designer;
- one or two technical hiring reviewers unfamiliar with Jikken.

Give participants the live URL without explanation. Measure time to first simulation, time to identify affected users, ability to explain cross-surface continuity, ability to recover from one invalid command, and ability to describe the governance lifecycle. Ask participants to think aloud, then compare observed behavior with the hypotheses above. Preserve disconfirming evidence and revise priorities accordingly.

## Limitations

- AI personas do not have lived experience, organizational incentives, fatigue, accessibility needs, or genuine confusion.
- Source inspection can confirm implementation but cannot measure comprehension or trust.
- Screenshots and scripted walkthroughs do not reproduce all browser, latency, authentication, or responsive conditions.
- Alignment with a public job description can bias the review toward what the role values rather than what Jikken's eventual customers value.
- These findings are possible failure modes and design opportunities, not user quotes, prevalence estimates, or usability metrics.
