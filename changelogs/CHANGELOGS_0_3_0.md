# Changelog (`0.2.0 -> 0.3.0`)

## Major Highlights

- Closed the full post-`0.2.0` audit wave across bug fixes, tests, structure, delivery hardening, and accessibility.
- Reduced `App.tsx` from over one thousand lines to a smaller shell backed by dedicated preview, export, and changelog hooks.
- Added Firefox to the Playwright smoke matrix, PNG PWA icons for installability, and keyboard navigation for settings/export radiogroups.

## Quality And Hardening

- Made changelog tests release-agnostic so adding a new versioned changelog file no longer forces brittle assertion updates.
- Added explicit Anthropic browser warning copy and provider-specific network failure messaging for the known CORS limitation.
- Fixed the exporter asymmetry by removing the spurious SVG `async` wrapper and revoking PNG Blob URLs on both success and failure paths.
- Updated the smoke suite so the footer version assertion stays release-resilient.
- Added dedicated unit coverage for SVG and PNG exporters, including the error-path cleanup behavior.

## Structural Improvements

- Extracted preview zoom, pan, fit, wheel-zoom, and ResizeObserver logic into `usePreviewInteraction`.
- Extracted export orchestration into `useExport` and changelog loading into `useChangelog`.
- Unified duplicated app-header action button implementations behind a single `ActionButton`.
- Added the `@/` TypeScript and Vite alias across the codebase to simplify imports and reduce move fragility.

## Delivery And Accessibility

- Added a route-wide Render `Content-Security-Policy` that keeps `script-src 'self'`, blocks `unsafe-eval`, and restricts outbound requests to the supported provider APIs.
- Generated and shipped `192x192` and `512x512` PNG icons alongside the existing SVG icon in the PWA manifest.
- Implemented roving `tabIndex` and arrow-key navigation for provider, export-format, and PNG-scale radiogroups.
- Added E2E coverage for the radiogroup keyboard interaction on both Chromium and Firefox.

## Validation And Regression Evidence

- `python3 logics/skills/logics-doc-linter/scripts/logics_lint.py`
- `npm run ci:local`
- `npm run test:e2e`
- `python3 /Users/alexandreagostini/Documents/cdx-logics-vscode/logics/skills/logics-version-release-manager/scripts/publish_version_release.py --dry-run --version 0.3.0 --notes-file changelogs/CHANGELOGS_0_3_0.md --title "Stable v0.3.0"`
