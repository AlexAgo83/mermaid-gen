# Changelog (`0.3.0 -> 0.4.0`)

## Major Highlights

- Closed the full post-`0.3.0` quality wave across workflow tooling, coverage visibility, CSS maintainability, cross-browser validation, and accessibility automation.
- Added pre-commit formatting and lint guardrails so the local workflow now catches style issues before they hit CI.
- Expanded the browser matrix to Chromium, Firefox, and WebKit, then added automated axe checks to keep serious accessibility regressions out of the release line.

## Developer Workflow And Test Visibility

- Added `husky`, `lint-staged`, Prettier, and `eslint-config-prettier`, with a tracked `pre-commit` hook and `format` / `format:check` scripts.
- Established a baseline formatting pass so the repository is consistently Prettier-managed going forward.
- Enabled Vitest V8 coverage reporting with enforced global thresholds on `npm run test`.
- Added dedicated render tests for `AppHeader`, `SettingsModal`, `ExportModal`, and `PreviewPanel`.

## CSS Maintainability

- Replaced the monolithic `src/styles/header.css` with co-located app-shell and header styles.
- Replaced the monolithic `src/styles/modals.css` with shared modal styles plus per-modal stylesheet ownership.
- Preserved the validated workspace layout while making header and modal styling easier to reason about and maintain.

## Cross-Browser And Accessibility

- Stabilized the CI suite by hardening the lazy modal test timing and ensuring Playwright installs every browser the suite actually exercises.
- Added WebKit to the Playwright project matrix and the CI install step.
- Added `@axe-core/playwright` checks for the main workspace, settings modal, and export modal.
- Fixed the serious accessibility issues surfaced during rollout instead of suppressing them, including textarea labeling and low-contrast footer and tooltip text.
- Kept a deliberate failing axe scenario in the E2E suite so accessibility regression detection remains provably active.

## Code Hygiene

- Extracted the Anthropic API version into `ANTHROPIC_API_VERSION` in `src/lib/llm.ts` so future API-version updates stay single-source.

## Validation And Regression Evidence

- `python3 logics/skills/logics-doc-linter/scripts/logics_lint.py`
- `npx prettier --check .`
- `npm run ci:local`
- `npm run test:e2e`
- `python3 /Users/alexandreagostini/Documents/cdx-logics-vscode/logics/skills/logics-version-release-manager/scripts/publish_version_release.py --dry-run --version 0.4.0 --notes-file changelogs/CHANGELOGS_0_4_0.md --title "Stable v0.4.0"`
