# Changelog (`start -> 0.1.0`)

## Major Highlights

- Initial public release of Mermaid Generator.
- Ships a browser-first Mermaid workspace with editable source, live preview, SVG and PNG export, and prompt-to-Mermaid generation through local provider keys.
- Includes compact header controls, preview focus mode, first-run onboarding, mobile navigation, modal standardization, and shareable Mermaid URLs from the export flow.
- Hardens generated Mermaid validation and replaces raw Mermaid parser failures with app-owned preview error copy.

## Generated Commit Summary

## Product and Workspace

- Build Mermaid workspace and export flow
- Add local OpenAI settings and prompt gating
- Validate generated Mermaid before replacing source
- Replace Mermaid raw fallback with app-owned errors
- Refactor App component styling and minor package update
- Fix CI lint issue and simplify footer link

## Interaction and UI Polish

- Update workspace responsiveness and add multi-provider LLM support
- Update README and refactor Mermaid generator for better UX
- Align preview panel header spacing
- Move preview controls into a compact desktop header
- Add mobile burger navigation for header actions
- Make preview focus a header-plus-canvas layout
- Standardize modal internal scrolling
- Standardize modal overlay coverage
- Add Escape dismissal for settings modal
- Add shared Mermaid URL hydration
- Add export modal share link flow
- Polish mobile navigation and preview interactions

## Foundations, Docs, and Delivery

- Bootstrap Logics kit and initialize workflow docs
- update bootstrap
- Bootstrap React PWA foundation
- Finalize MVP validation and task closure
- Clarify focus mode docs around header-only shell
- Plan modal standardization and Mermaid sharing backlog
- Update .gitignore and README.md
- Fix readme
- Close task 003 delivery and refresh docs
- Close task 004 and refresh modal sharing docs

## Validation and Regression Evidence

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run test:e2e`
- Release workflow dry-run:
  `python3 /Users/alexandreagostini/Documents/cdx-logics-vscode/logics/skills/logics-version-release-manager/scripts/publish_version_release.py --dry-run`
