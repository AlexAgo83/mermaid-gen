## item_059_establish_shared_i18n_readiness_for_product_ui - Establish shared i18n readiness for product UI

> From version: 0.4.0
> Schema version: 1.0
> Status: Done
> Understanding: 90%
> Confidence: 85%
> Progress: 100%
> Complexity: High
> Theme: Operator workflow and runtime integration
> Reminder: Update status/understanding/confidence/progress and linked request/task references when you edit this doc.

# Problem

Establish an English source-only shared i18n contract for the React application shell and dialogs.
Route new and progressively migrated interface copy through stable semantic keys.
Keep diagram source, generated content, provider output, changelog content, and user input outside translation catalogs.

# Scope

- In:
  - one coherent delivery slice from the source request
- Out:
  - unrelated sibling slices that should stay in separate backlog items instead of widening this doc

# Acceptance criteria

- AC1: A valid English source-only i18n v1 contract declares a repository-contained JSON catalog.
- AC2: Shell/header and shared modal-action copy use stable semantic keys with unchanged visible wording and behavior.
- AC3: Diagram, prompt, generated, provider, changelog, and user content remain outside the catalog.
- AC4: Missing keys fall back deterministically and are visible during development.
- AC5: New static UI copy follows documented namespaces and contract validation passes.
- AC6: The viewer exposes the catalog and existing focused tests, lint, typecheck, and build remain green.

# AC Traceability

- request-AC1 -> This backlog slice. Proof: AC1: A valid English source-only i18n v1 contract declares a repository-contained JSON catalog.
- request-AC2 -> This backlog slice. Proof: AC2: Shell/header and shared modal-action copy use stable semantic keys with unchanged visible wording and behavior.
- request-AC3 -> This backlog slice. Proof: AC3: Diagram, prompt, generated, provider, changelog, and user content remain outside the catalog.
- request-AC4 -> This backlog slice. Proof: AC4: Missing keys fall back deterministically and are visible during development.
- request-AC5 -> This backlog slice. Proof: AC5: New static UI copy follows documented namespaces and contract validation passes.
- request-AC6 -> This backlog slice. Proof: AC6: The viewer exposes the catalog and existing focused tests, lint, typecheck, and build remain green.

# Decision framing

- Product framing: Not needed
- Product signals: (none detected)
- Product follow-up: No product brief follow-up is expected based on current signals.
- Architecture framing: Not needed
- Architecture signals: (none detected)
- Architecture follow-up: No architecture decision follow-up is expected based on current signals.

# Links

- Product brief(s): (none yet)
- Architecture decision(s): (none yet)
- Request: `req_024_establish_shared_i18n_readiness_for_product_ui`
- Primary task(s): `task_010_establish_shared_i18n_readiness_for_product_ui`

# AI Context

- Summary: Establish shared i18n readiness for product UI
- Keywords: backlog-groom, request, establish shared i18n readiness for product ui, bounded slice
- Use when: Use when implementing or reviewing the delivery slice for Establish shared i18n readiness for product UI.
- Skip when: Skip when the change is unrelated to this delivery slice or its linked request.

# Priority

- Priority: Medium
- Rationale: Default until groomed.

# Notes

- Hybrid rationale: Derived from request `req_024_establish_shared_i18n_readiness_for_product_ui` and kept bounded to one coherent delivery slice.
- Source file: `logics/request/req_024_establish_shared_i18n_readiness_for_product_ui.md`.
- Generated locally by logics-manager.
- Task `task_010_establish_shared_i18n_readiness_for_product_ui` was finished via `logics-manager flow finish task` on 2026-07-13.

# Tasks

- `task_010_establish_shared_i18n_readiness_for_product_ui`
