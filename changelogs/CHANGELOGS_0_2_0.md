# Changelog (`0.1.0 -> 0.2.0`)

## Major Highlights

- Expanded the provider catalog with direct `Grok`, `Mistral`, and `Gemini` support in the browser-side BYOK flow.
- Added an in-app changelog history modal with improved rendering, collapsible sections, and stronger resilience against malformed or legacy changelog data.
- Hardened the workspace delivery package around Render guidance, Mermaid rendering safety, and project metadata readiness for the next public release.

## Product and Workspace

- Add direct `Grok` and `Mistral` provider support through the normalized provider layer.
- Add direct `Gemini` provider support through Google’s OpenAI-compatible API.
- Rework provider settings so the expanded catalog remains manageable with local key storage and active-provider switching.
- Add an in-app changelog history modal accessible from the app shell and mobile navigation.
- Improve changelog rendering with structured Markdown parsing and default-expanded `Major Highlights`.

## Delivery and Hardening

- Clarify the Render deployment contract, release workflow, and rollback guidance.
- Reduce the PWA precache footprint while preserving the static hosting model.
- Harden Mermaid preview rendering and SVG injection boundaries.
- Split the app shell into smaller header, modal, and workspace modules to reduce concentration risk.

## Documentation

- Refresh the README badges, provider list, live demo metadata, contribution guidance, and license references.
- Add root `LICENSE` and `CONTRIBUTING.md` files.
- Add Logics request, backlog, and orchestration docs for Gemini provider delivery.

## Validation and Regression Evidence

- `python3 logics/skills/logics-doc-linter/scripts/logics_lint.py`
- `npm run ci:local`
- `npm run test:e2e`
- Release workflow dry-run:
  `python3 /Users/alexandreagostini/Documents/cdx-logics-vscode/logics/skills/logics-version-release-manager/scripts/publish_version_release.py --dry-run --version 0.2.0 --notes-file changelogs/CHANGELOGS_0_2_0.md --title "Stable v0.2.0"`
