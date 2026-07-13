## item_061_migrate_settings_and_provider_control_product_copy - Migrate settings and provider-control product copy

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

- Settings controls embed headings, instructions, statuses, credential actions, confirmations, and accessibility labels.
- Provider metadata and credentials require a strict boundary from catalog-owned product copy.

# Scope

- In:
  - Migrate settings headings, field labels, guidance, provider-state framing, credential visibility and removal actions, confirmations, errors, and accessibility attributes.
  - Use named placeholders for provider references and status results while passing provider metadata as data.
  - Keep provider names and descriptions configurable and never catalog credentials, API keys, endpoints, or user-entered values.
  - Add tests for missing, configured, revealed, hidden, invalid, and removed credential states without exposing secret values.
- Out:
  - Changes to credential storage or provider integration.
  - Translation of provider brands, configured descriptions, endpoints, or secrets.

# Acceptance criteria

- AC1: Settings product chrome uses semantic keys in every locale.
- AC2: Provider statuses use named placeholders without turning provider metadata into keys.
- AC3: No credential value is added to a catalog, log, fixture snapshot, or translation diagnostic.
- AC4: Settings state tests pass in all supported locales.

# AC Traceability

- request-AC1 -> This backlog slice. Proof: AC1: Settings product chrome uses semantic keys in every locale.
- request-AC2 -> This backlog slice. Proof: AC2: Provider statuses use named placeholders without turning provider metadata into keys.
- request-AC3 -> This backlog slice. Proof: AC3: No credential value is added to a catalog, log, fixture snapshot, or translation diagnostic.
- request-AC5 -> This backlog slice. Proof: AC4: Settings state tests pass in all supported locales.

# Decision framing

- Product framing: Not needed
- Architecture framing: Not needed

# Links

- Product brief(s): `prod_001_complete_localized_diagram_editing_experience`
- Architecture decision(s): (none yet)
- Request: `req_025_complete_semantic_i18n_adoption_across_editor_and_supporting_dialogs`
- Primary task(s): `task_011_orchestrate_completion_of_editor_localization`

# AI Context

- Summary: Migrate settings and provider-control product copy
- Keywords: scaffolded-backlog, migrate settings and provider-control product copy, implementation-ready
- Use when: Implementing the scaffolded slice for Migrate settings and provider-control product copy.
- Skip when: The change belongs to another backlog slice.

# Priority

- Priority: High
- Rationale: Set by scaffold input or defaulted for grooming.
