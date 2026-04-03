# Contributing to Mermaid Generator

## Scope

Mermaid Generator is a focused browser-first workspace for editing, generating,
previewing, exporting, and sharing Mermaid diagrams.

Keep contributions aligned with that product shape:

- prefer changes that improve the Mermaid authoring and review loop
- preserve the static PWA and browser-first BYOK model unless a change
  explicitly redefines that architecture
- keep the UI coherent across desktop and mobile rather than adding isolated
  one-off surfaces

## Recommended workflow

1. Create a focused branch from `main`.
2. Keep the change scoped to one coherent slice when possible.
3. Update tests and docs whenever behavior changes.
4. Run the relevant validation locally before asking for review.
5. Open a reviewable pull request with a concise summary and validation notes.

Release note:

- `main` is the integration branch.
- `release` is the deployment branch used for Render.

## Local setup

Prerequisites:

- Node.js 20+
- npm
- Python 3 for Logics tooling
- Playwright browsers for E2E (`npx playwright install chromium firefox`)

Install dependencies:

```bash
npm ci
```

Run the app locally:

```bash
npm run dev
```

Preview the production build locally:

```bash
npm run build
npm run preview
```

## Validation

Run the checks that match your change.

Core validation:

```bash
python3 logics/skills/logics-doc-linter/scripts/logics_lint.py
npm run lint
npm run typecheck
npm run test
npm run build
npm run quality:pwa
```

End-to-end smoke tests:

```bash
npm run test:e2e
```

Full local CI mirror:

```bash
npm run ci:local
```

GitHub Actions runs the same main validation flow on pushes to `main` and
`release`, and on pull requests.

## Code expectations

- keep provider-specific behavior inside the provider layer when possible
- preserve the Mermaid source as the canonical editable state
- avoid introducing project-managed secrets in the frontend
- keep component and style changes modular instead of re-growing large monoliths
- prefer small, explicit changes over broad refactors unless the refactor is the
  purpose of the work

## UI expectations

- preserve the existing visual language unless the change explicitly targets UI
  redesign
- keep desktop and mobile behavior consistent
- ensure modals, tooltips, and overlays remain usable on short viewports
- avoid duplicating controls across several surfaces without a product reason

## Documentation expectations

- keep `README.md` aligned with the shipped behavior
- update `changelogs/` when preparing a release
- keep `logics/request`, `logics/backlog`, and `logics/tasks` in sync when the
  repository workflow requires it
- do not leave stale acceptance criteria or outdated product notes after a
  feature lands

## Pull requests

A good pull request should include:

- what changed
- why it changed
- user-facing impact
- validation run locally
- any follow-up or known limitation

## Collaboration

Use issues, requests, backlog items, or pull requests for substantive changes
so scope, rationale, and validation stay explicit and reviewable.
