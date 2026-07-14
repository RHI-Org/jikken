# AI-simulated UX review: Jikken portfolio page

> **Research status: AI-simulated synthetic research — not real-user research.**
>
> No human participants were interviewed or observed. The reactions and task outcomes below are model-generated hypotheses from a structured cognitive walkthrough of the portfolio page. Validate consequential findings with real participants before treating them as evidence.

- **Study date:** July 14, 2026
- **Page reviewed:** `jikken.experienceplus.ai`
- **Method:** source inspection and task-based cognitive walkthrough

## Synthetic panel

| Perspective | Goal | Time pressure |
| --- | --- | --- |
| Technical hiring reviewer | Establish authorship, judgment, and implementation depth | Five-minute portfolio screen |
| Product designer | Understand the problem, intervention, and evidence | Wants a coherent case-study arc |
| Platform engineer | Verify that the multi-surface claim is technically credible | Skeptical of staged screenshots |
| Accessibility-focused user | Navigate, read, and understand without animation dependence | Reduced motion, keyboard, or narrow viewport |

## Executive summary

The page communicates a distinctive systems-UX thesis and uses real product evidence well. The animated mesh gives the case study an identifiable presentation layer without spending the product's semantic decision colors as decoration. The main predicted risk is evaluation cost: the reviewer must infer Ryan's exact contribution, choose among several plausible entry points, and pass eight walkthrough beats before reaching the strongest architecture proof.

The accessibility walkthrough found two concrete risks. The looping terminal was marked as a live region, which could repeatedly announce decorative demo output to assistive technology. On small screens the terminal was removed entirely, withholding one of the clearest human/machine contract examples.

## Findings

### F1 — The fastest proof path is not singular

**Severity:** High for portfolio review  
**Observed:** “Explore the product” and “Read the case study” have similar prominence; the short narrated walkthrough is not offered in the hero.  
**Predicted:** a time-constrained reviewer may enter the authenticated product or begin a long scroll and miss the complete end-to-end proof.  
**Response shipped:** the primary hero action now opens the 83-second walkthrough; the case study remains secondary.

### F2 — Authorship and scope are implied

**Severity:** High  
**Observed:** the page shows product and engineering depth but does not state the creator's role until the footer attribution.  
**Predicted:** a hiring reviewer may not know which research, design, or engineering work belongs to Ryan.  
**Response shipped:** an explicit role, scope, and contribution strip now follows the opening results.

### F3 — The walkthrough is credible but long

**Severity:** Medium  
**Observed:** eight alternating screenshot sections repeat the same layout before architecture and design rationale appear.  
**Predicted:** reviewers may skim later beats or leave before reaching the executable coherence tests.  
**Possible next test:** compare the current narrative with a four-beat summary plus expandable detail. Measure whether participants can still explain CLI → Dashboard → SDK → CI continuity.

### F4 — The animated console should not repeatedly announce itself

**Severity:** High for screen-reader experience  
**Observed:** the looping console used `aria-live`, causing each replay to be eligible for announcement.  
**Predicted:** repeated non-user-initiated announcements would be distracting and obscure navigation.  
**Response shipped:** removed the live-region behavior and supplied a stable accessible label describing the example's outcome.

### F5 — Mobile removed a primary proof point

**Severity:** Medium  
**Observed:** below 560px the terminal was hidden.  
**Predicted:** mobile reviewers would see the claim without the immediate exit-code demonstration.  
**Response shipped:** retained a compact terminal on mobile with smaller type and reduced vertical space.

### F6 — Research provenance needs to be visible

**Severity:** Medium  
**Observed:** the repository labels its research as AI-simulated, while the portfolio page mentions AI-native delivery without stating the validation limit.  
**Predicted:** readers could over-credit synthetic findings as human validation.  
**Response shipped:** added an explicit research-status disclosure and linked this report.

## What to validate with people

Recruit five to seven participants: two technical hiring reviewers, two platform engineers, one product designer, and one accessibility specialist. Give them the URL without explanation. Measure:

1. time to explain what Jikken does;
2. time to identify Ryan's role and contribution;
3. whether they reach the architecture proof within five minutes;
4. whether they can explain how one decision crosses four surfaces;
5. keyboard, reduced-motion, 200% zoom, and mobile task completion;
6. whether the eight-beat walkthrough feels useful or repetitive.

## Limitations

Synthetic personas do not experience genuine confusion, fatigue, assistive technology, organizational pressure, or trust. Source inspection can identify implementation risks but cannot measure comprehension or preference. These findings are design hypotheses and prioritization inputs—not user quotes, prevalence estimates, or validation.
