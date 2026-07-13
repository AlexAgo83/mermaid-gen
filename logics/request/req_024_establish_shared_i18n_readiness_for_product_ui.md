## req_024_establish_shared_i18n_readiness_for_product_ui - Establish shared i18n readiness for product UI

> From version: 0.4.0
> Schema version: 1.0
> Status: Done
> Understanding: 100
> Confidence: 99
> Complexity: Medium
> Theme: Internationalization readiness
> Reminder: Update status/understanding/confidence and linked backlog/task references when you edit this doc.

# Needs

- Establish an English source-only shared i18n contract for the React application shell and dialogs.
- Route new and progressively migrated interface copy through stable semantic keys.
- Keep diagram source, generated content, provider output, changelog content, and user input outside translation catalogs.

# Context

- Static UI copy is concentrated in `App.tsx`, the shell header, settings, onboarding, export, changelog, and preview components.
- The project has no detected locale catalog or translation adapter.
- Generated Mermaid diagrams and AI/provider responses are user content, not application translation values.
- The repository has unrelated pending workflow-runtime cleanup that this request must not modify.
- The shared i18n contract and lifecycle commands are delivery dependencies.

# Scope

- In:
  - inventory static app-owned shell, navigation, modal, preview, export, and error copy;
  - initialize an English source-only i18n v1 contract and JSON catalog;
  - add a minimal local semantic-key adapter with named placeholders and deterministic fallback;
  - migrate shell/header and shared modal actions as the first bounded slice;
  - define namespaces for remaining surfaces and require semantic keys for new static UI copy;
  - expose the catalog through the viewer and document later locale addition.
- Out:
  - translate diagram text, prompts, generated responses, provider names, changelog entries, or user input;
  - add a second locale or translation service;
  - redesign workspace, modal, export, provider, or preview behavior;
  - include or reverse unrelated pending worktree changes.

# Acceptance criteria

- AC1: A valid English source-only i18n v1 contract declares a repository-contained JSON catalog.
- AC2: Shell/header and shared modal-action copy use stable semantic keys with unchanged visible wording and behavior.
- AC3: Diagram, prompt, generated, provider, changelog, and user content remain outside the catalog.
- AC4: Missing keys fall back deterministically and are visible during development.
- AC5: New static UI copy follows documented namespaces and contract validation passes.
- AC6: The viewer exposes the catalog and existing focused tests, lint, typecheck, and build remain green.

# Definition of Ready (DoR)

- [x] Problem statement is explicit and user impact is clear.
- [x] Scope boundaries (in/out) are explicit.
- [x] Acceptance criteria are testable.
- [x] Dependencies and known risks are listed.

# Dependencies and risks

- Depends on the shared i18n v1 schema and lifecycle commands.
- Text inventory must distinguish product chrome from diagram and generated content.
- Existing unrelated worktree changes must remain outside the request commit.

# Companion docs

- Product brief(s): (none yet)
- Architecture decision(s): (none yet)

# References

- `src/App.tsx`
- `src/components/shell/AppHeader.tsx`
- `src/components/modals/modal-shared.css`
- `src/components/modals/SettingsModal.tsx`
- `src/components/modals/OnboardingModal.tsx`
- `src/components/modals/ExportModal.tsx`
- `src/components/workspace/PreviewPanel.tsx`

# AI Context

- Summary: Introduce an English source-only catalog for product chrome while excluding diagrams and generated content.
- Keywords: i18n-readiness, source-only, semantic-keys, react
- Use when: Planning initial contract adoption independently of pending workflow cleanup.
- Skip when: Translating diagram, prompt, provider, changelog, or user content.

# Backlog

- `item_059_establish_shared_i18n_readiness_for_product_ui`

- none
