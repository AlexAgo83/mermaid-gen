## task_010_establish_shared_i18n_readiness_for_product_ui - Establish shared i18n readiness for product UI

> From version: 0.4.0
> Schema version: 1.0
> Status: Done
> Understanding: 90%
> Confidence: 85%
> Progress: 100%
> Complexity: Medium
> Theme: Implementation delivery
> Reminder: Update status/understanding/confidence/progress and linked request/backlog references when you edit this doc.
> Owner: codex

# Definition of Done (DoD)

- [x] The backlog scope is implemented.
- [x] Acceptance criteria are covered.
- [x] Validation passes.
- [x] Meaningful waves followed ADR 009: affected docs updated and the repo left commit-ready without automatic commits.

# Backlog

- `item_059_establish_shared_i18n_readiness_for_product_ui`

# Acceptance criteria

- AC1: A valid English source-only i18n v1 contract declares a repository-contained JSON catalog.
- AC2: Shell/header and shared modal-action copy use stable semantic keys with unchanged visible wording and behavior.
- AC3: Diagram, prompt, generated, provider, changelog, and user content remain outside the catalog.
- AC4: Missing keys fall back deterministically and are visible during development.
- AC5: New static UI copy follows documented namespaces and contract validation passes.
- AC6: The viewer exposes the catalog and existing focused tests, lint, typecheck, and build remain green.

# Validation

- Shared contract validation, typecheck, lint, all 46 coverage tests, production build, and PWA artifact validation passed.
- contract validation, typecheck, lint, 46 tests, production build, and PWA validation passed
- Finish workflow executed on 2026-07-13.
- Linked backlog/request close verification passed.

# Report

- Implementation complete.
- Finished on 2026-07-13.
- Linked backlog item(s): `item_059_establish_shared_i18n_readiness_for_product_ui`
- Related request(s): `req_024_establish_shared_i18n_readiness_for_product_ui`

# AI Context

- Summary: Implement establish shared i18n readiness for product ui.
- Keywords: task, implementation, backlog, runtime, python
- Use when: You need a bounded implementation task for a backlog item.
- Skip when: The work is still at the request or backlog shaping stage.

# Links

- Request: `req_024_establish_shared_i18n_readiness_for_product_ui`
- Product brief(s): (none yet)
- Architecture decision(s): (none yet)

# AC Traceability

- request-AC1 -> This task. Proof: the valid English source-only contract declares `src/i18n/en.json`.
- request-AC2 -> This task. Proof: desktop/mobile header and shared settings, onboarding, export, and changelog actions resolve semantic keys.
- request-AC3 -> This task. Proof: diagrams, prompts, generated/provider/changelog content, and user input remain runtime values.
- request-AC4 -> This task. Proof: the adapter exposes bracketed keys in development and deterministic keys in production.
- request-AC5 -> This task. Proof: common, header, settings, onboarding, and export namespaces validate under the shared contract.
- request-AC6 -> This task. Proof: viewer contract validation, typecheck, lint, 46 tests, build, and PWA checks passed.
