## item_060_migrate_editor_prompt_preview_and_accessibility_chrome - Migrate editor, prompt, preview, and accessibility chrome

> From version: 0.4.0
> Schema version: 1.0
> Status: Ready
> Understanding: 90%
> Confidence: 85%
> Progress: 0%
> Complexity: Medium
> Theme: Internationalization contract adoption
> Reminder: Update status/understanding/confidence/progress and linked request/task references when you edit this doc.

# Problem

- The core editing workflow still embeds product labels, guidance, warnings, errors, rendering states, zoom controls, and assistive descriptions in components.
- Those strings surround authored and generated diagram content that must never be translated.

# Scope

- In:
  - Migrate editor headings, prompt labels and guidance, placeholders, warnings, error framing, help text, preview states, zoom controls, actions, and accessibility attributes.
  - Use named placeholders for line or parse references, counts, zoom values, timing, and generation or rendering results.
  - Keep source text, prompts, generated diagram syntax, parser excerpts, and user-selected content as runtime data.
  - Add state-focused UI and accessibility tests for both locales.
- Out:
  - Translation or modification of diagram source, prompts, generated output, or parser-provided excerpts.
  - Changes to editing, generation, or rendering behavior.

# Acceptance criteria

- AC1: Core editor and preview product chrome is fully catalog-driven.
- AC2: Dynamic feedback uses named placeholders and locale-aware formatting.
- AC3: Authored and generated content remains byte-for-byte identical across locale switches.
- AC4: UI and accessibility tests cover idle, generating, rendering, warning, and error states.

# AC Traceability

- request-AC1 -> This backlog slice. Proof: AC1: Core editor and preview product chrome is fully catalog-driven.
- request-AC2 -> This backlog slice. Proof: AC2: Dynamic feedback uses named placeholders and locale-aware formatting.
- request-AC3 -> This backlog slice. Proof: AC3: Authored and generated content remains byte-for-byte identical across locale switches.
- request-AC5 -> This backlog slice. Proof: AC4: UI and accessibility tests cover idle, generating, rendering, warning, and error states.

# Decision framing

- Product framing: Not needed
- Architecture framing: Not needed

# Links

- Product brief(s): `prod_001_complete_localized_diagram_editing_experience`
- Architecture decision(s): (none yet)
- Request: `req_025_complete_semantic_i18n_adoption_across_editor_and_supporting_dialogs`
- Primary task(s): `task_011_orchestrate_completion_of_editor_localization`

# AI Context

- Summary: Migrate editor, prompt, preview, and accessibility chrome
- Keywords: scaffolded-backlog, migrate editor, prompt, preview, and accessibility chrome, implementation-ready
- Use when: Implementing the scaffolded slice for Migrate editor, prompt, preview, and accessibility chrome.
- Skip when: The change belongs to another backlog slice.

# Priority

- Priority: High
- Rationale: Set by scaffold input or defaulted for grooming.
