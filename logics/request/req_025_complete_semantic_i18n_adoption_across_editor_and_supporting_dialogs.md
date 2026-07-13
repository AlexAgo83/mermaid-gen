## req_025_complete_semantic_i18n_adoption_across_editor_and_supporting_dialogs - Complete semantic i18n adoption across editor and supporting dialogs

> From version: 0.4.0
> Schema version: 1.0
> Status: Done
> Understanding: 90%
> Confidence: 85%
> Complexity: Medium
> Theme: Internationalization contract adoption
> Reminder: Update status/understanding/confidence and linked backlog/task references when you edit this doc.

# Needs

- All remaining editor, preview, settings, export, and changelog product copy must use stable semantic catalog keys.
- Dynamic warnings, errors, rendering states, export summaries, and provider states must use named placeholders.
- Diagram source, prompts, generated diagrams, provider identity and credentials, file names, and changelog entry bodies must remain data.
- The repository must enforce locale and placeholder parity and prevent new hardcoded product copy.

# Context

- An initial convention slice established the repository i18n contract and migrated representative navigation copy.
- The main editor still contains hardcoded labels, prompt guidance, placeholders, warnings, errors, and accessibility help.
- Preview controls expose hardcoded rendering, zoom, and help states.
- Settings, export, and changelog dialogs contain product headings, controls, statuses, confirmations, and accessibility attributes.
- Provider names and descriptions may be configured or supplied externally; API keys and credentials are sensitive data; diagram source, prompts, generated output, and changelog entries are content rather than catalog copy.

# Acceptance criteria

- AC1: Editor, preview, settings, export, and changelog surfaces render all product-owned visible and accessibility copy from stable semantic keys with locale parity.
- AC2: Dynamic messages use named placeholders and locale-aware formatting with no sentence-shaped or rendered-value keys.
- AC3: Diagram source, prompts, generated output, provider data, credentials, file names, and changelog entry content remain untranslated and are covered by boundary tests.
- AC4: A static inventory and guard detect newly hardcoded product copy outside a narrow reviewed allowlist.
- AC5: Contract validation, unit and UI tests, type checks, and production build pass for every supported locale.

# Definition of Ready (DoR)

- [x] Problem statement is explicit and user impact is clear.
- [x] Scope boundaries (in/out) are explicit.
- [x] Acceptance criteria are testable.
- [x] Dependencies and known risks are listed.

# Companion docs

- Product brief(s): `prod_001_complete_localized_diagram_editing_experience`
- Architecture decision(s): (none yet)

# References

- src/App.tsx
- src/components/PreviewPanel.tsx
- src/components/SettingsModal.tsx
- src/components/ExportModal.tsx
- src/components/ChangelogModal.tsx

# AI Context

- Summary: Complete semantic i18n adoption across editor and supporting dialogs
- Keywords: request-chain-scaffold, complete semantic i18n adoption across editor and supporting dialogs, development-ready
- Use when: You need to implement or review the scaffolded workflow for Complete semantic i18n adoption across editor and supporting dialogs.
- Skip when: The change is unrelated to this scaffolded request chain.

# Backlog

- `item_060_migrate_editor_prompt_preview_and_accessibility_chrome`
- `item_061_migrate_settings_and_provider_control_product_copy`
- `item_062_migrate_export_and_changelog_dialog_chrome`
- `item_063_enforce_catalog_coverage_and_close_the_editor_migration`
