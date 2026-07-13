## item_062_migrate_export_and_changelog_dialog_chrome - Migrate export and changelog dialog chrome

> From version: 0.4.0
> Schema version: 1.0
> Status: Done
> Understanding: 90%
> Confidence: 85%
> Progress: 100%
> Complexity: Low
> Theme: Internationalization contract adoption
> Reminder: Update status/understanding/confidence/progress and linked request/task references when you edit this doc.

# Problem

- Export and changelog dialogs still contain product headings, format and scale labels, actions, help, loading, and empty states.
- Export values and changelog entry bodies are content or data and must remain separate from stable dialog framing.

# Scope

- In:
  - Migrate export headings, format and scale controls, share guidance, actions, success and error framing, changelog headings, loading and empty states, and accessibility attributes.
  - Use named placeholders for formats, scales, dimensions, file names, versions, and export results.
  - Keep diagram output, file names, configured format identifiers, generated links, version numbers, and changelog entry bodies as data.
  - Add dialog tests for representative export and changelog states.
- Out:
  - Translation of exported diagram content or changelog entry bodies.
  - Changes to export or sharing behavior.

# Acceptance criteria

- AC1: Export and changelog product chrome is fully catalog-driven.
- AC2: Dynamic summaries use named placeholders.
- AC3: Exported and versioned content remains unchanged across locales.
- AC4: Dialog UI and accessibility tests pass in all locales.

# AC Traceability

- request-AC1 -> This backlog slice. Proof: AC1: Export and changelog product chrome is fully catalog-driven.
- request-AC2 -> This backlog slice. Proof: AC2: Dynamic summaries use named placeholders.
- request-AC3 -> This backlog slice. Proof: AC3: Exported and versioned content remains unchanged across locales.
- request-AC5 -> This backlog slice. Proof: AC4: Dialog UI and accessibility tests pass in all locales.

# Decision framing

- Product framing: Not needed
- Architecture framing: Not needed

# Links

- Product brief(s): `prod_001_complete_localized_diagram_editing_experience`
- Architecture decision(s): (none yet)
- Request: `req_025_complete_semantic_i18n_adoption_across_editor_and_supporting_dialogs`
- Primary task(s): `task_011_orchestrate_completion_of_editor_localization`

# AI Context

- Summary: Migrate export and changelog dialog chrome
- Keywords: scaffolded-backlog, migrate export and changelog dialog chrome, implementation-ready
- Use when: Implementing the scaffolded slice for Migrate export and changelog dialog chrome.
- Skip when: The change belongs to another backlog slice.

# Priority

- Priority: High
- Rationale: Set by scaffold input or defaulted for grooming.

# Tasks

- `task_011_orchestrate_completion_of_editor_localization`

# Notes

- Task `task_011_orchestrate_completion_of_editor_localization` was finished via `logics-manager flow finish task` on 2026-07-13.
