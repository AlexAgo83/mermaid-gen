## item_051_add_webkit_to_playwright_browser_matrix - Add WebKit to Playwright browser matrix

> From version: 0.3.0
> Schema version: 1.0
> Status: Done
> Understanding: 95%
> Confidence: 95%
> Progress: 100%
> Complexity: Small
> Theme: Quality
> Reminder: Update status/understanding/confidence/progress and linked task references when you edit this doc.

# Problem

- Playwright is configured for Chromium and Firefox only.
- Safari (WebKit) accounts for roughly 18% of global web traffic and has known rendering and API differences (clipboard, service worker, CSS).
- Cross-browser regressions affecting Safari users are invisible to the current E2E suite.

# Scope

- In:
  - add a WebKit project entry to `playwright.config.ts`
  - update the CI workflow (`.github/workflows/ci.yml`) to install WebKit alongside Chromium and Firefox
  - run the full E2E suite on WebKit and fix or skip-annotate any platform-specific failures
- Out:
  - adding mobile Safari viewports (desktop WebKit is sufficient for coverage)
  - rewriting existing tests to accommodate WebKit — prefer targeted skip annotations with comments
  - adding Safari-specific E2E scenarios

```mermaid
%% logics-kind: backlog
%% logics-signature: backlog|add-webkit-to-playwright-browser-matrix|req-022-strengthen-developer-tooling-tes|playwright-is-configured-for-chromium-an|ac1-playwright-config-ts-includes-a-webk
flowchart LR
    Request[req 022 cross-browser] --> Problem[Safari absent from E2E matrix]
    Problem --> Scope[Add WebKit to Playwright config + CI]
    Scope --> Acceptance[AC1–AC3 met]
    Acceptance --> Task[task 008]
```

# Acceptance criteria

- AC1: `playwright.config.ts` includes a WebKit project entry alongside Chromium and Firefox.
- AC2: The CI workflow installs WebKit and runs E2E tests on all three browsers.
- AC3: E2E tests pass on WebKit, with any platform-specific failures either fixed or skip-annotated with a comment.

# AC Traceability

- AC1 -> Scope: WebKit config entry. Proof: `playwright.config.ts` contains `webkit` project.
- AC2 -> Scope: CI update. Proof: CI workflow installs `webkit` and test job runs on three browsers.
- AC3 -> Scope: test pass or skip-annotate. Proof: `npm run test:e2e` green on Chromium, Firefox, and WebKit.

# Decision framing

- Product framing: Not required
- Product signals: cross-browser coverage
- Product follow-up: None.
- Architecture framing: Not required
- Architecture signals: none
- Architecture follow-up: None.

# Links

- Product brief(s): `prod_000_mermaid_generator_product_direction`
- Request: `req_022_strengthen_developer_tooling_test_visibility_and_css_maintainability`
- Primary task(s): `task_008_orchestrate_post_030_developer_tooling_and_quality_wave`

# AI Context

- Summary: Add WebKit to the Playwright browser matrix and CI workflow so E2E tests cover Safari in addition to Chromium and Firefox.
- Keywords: playwright, webkit, safari, cross-browser, E2E, CI, browser matrix
- Use when: Use when touching `playwright.config.ts`, CI workflow, or cross-browser testing.
- Skip when: Skip when the work concerns unit tests, Vitest configuration, or mobile viewports.

# Priority

- Impact: Medium
- Urgency: Low

# Notes

- Derived from `req_022`, cross-browser theme, AC5.
- Delivered in Wave 3 by adding a `webkit` project based on `Desktop Safari` to `playwright.config.ts`.
- CI now installs `chromium firefox webkit`, and the full Playwright smoke suite passes on all three browsers.
