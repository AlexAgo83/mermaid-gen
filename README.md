# Mermaid Generator

<p align="center">
  <img src="assets/branding/app-icon.svg" alt="Mermaid Generator icon" width="132" height="132" />
</p>

<p align="center">
  <img src="assets/branding/readme-hero.svg" alt="Mermaid Generator hero banner" width="100%" />
</p>

<p align="center">
  A focused workspace for turning rough ideas into polished Mermaid diagrams.
</p>

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/status-planning-0E7380?style=for-the-badge" />
  <img alt="Live preview" src="https://img.shields.io/badge/live%20preview-mermaid%20first-12A6A3?style=for-the-badge" />
  <img alt="Export" src="https://img.shields.io/badge/export-SVG%20%7C%20PNG-FFB65A?style=for-the-badge" />
  <img alt="AI" src="https://img.shields.io/badge/AI-OpenAI%20ready-0A3440?style=for-the-badge" />
  <img alt="Hosting" src="https://img.shields.io/badge/hosting-Render%20Static-0B3442?style=for-the-badge" />
  <img alt="Installable" src="https://img.shields.io/badge/PWA-targeted-FFF3C0?style=for-the-badge&labelColor=0B3442" />
</p>

## Why Mermaid Generator

Mermaid Generator is being built for a simple reason: diagram work is usually fragmented.

You write Mermaid in one place, sanity-check it in another, open an AI tool somewhere else to get a first draft, then spend extra time exporting something presentable. This project compresses that into one loop:

- paste Mermaid and refine it visually;
- describe a diagram in plain language and generate a first draft;
- preview immediately;
- export a clean asset when the diagram is ready.

## What The Product Promises

```mermaid
flowchart LR
    Context[Text context] --> Draft[AI Mermaid draft]
    Snippet[Existing Mermaid code] --> Draft
    Draft --> Editor[Editable Mermaid source]
    Editor --> Preview[Live preview]
    Preview --> Export[SVG and PNG export]
    Export --> Share[Docs reviews and deliverables]
```

- One focused workspace instead of three disconnected tools.
- Mermaid remains the editable source of truth.
- AI helps users start faster without hiding the underlying diagram code.
- Export is part of the main experience, not an afterthought.

## Two Main Entry Points

### 1. Start From Existing Mermaid

Paste Mermaid source, edit it, and watch the preview update as you refine the structure.

### 2. Start From Plain Language

Describe the system, process, or flow you want to visualize. Mermaid Generator turns that prompt into a first diagram draft you can inspect and edit directly.

## What Makes It Different

- It is intentionally narrow: Mermaid authoring, not a general-purpose whiteboard.
- It is intended to stay static-host friendly and PWA-eligible.
- It is designed so the future app can align with the proven delivery patterns already used in the author's other projects.

## Product Snapshot

```mermaid
flowchart TD
    A[Paste code] --> D[Preview instantly]
    B[Write prompt] --> C[Generate draft]
    C --> E[Edit Mermaid]
    E --> D
    D --> F[Export asset]
```

## Planned Release Flow

The project will use a gated release path rather than deploying every development commit directly to production.

```mermaid
flowchart LR
    Main[Develop on main] --> Prep[Prepare version and changelog]
    Prep --> LocalCI[Run local CI]
    LocalCI --> Release[Promote to release branch]
    Release --> Tag[Create release tag]
    Tag --> Push[Push branch and tag]
    Push --> RemoteCI[Validate GitHub CI]
    RemoteCI --> Publish[Publish GitHub release]
    Publish --> Render[Render deploys release]
```

## Repository Direction

This repository is currently in the early planning and bootstrap phase.

- Core product framing: [request](logics/request/req_000_launch_mermaid_generator_web_app.md)
- Brand, README, and release-doc slice: [request](logics/request/req_001_create_branding_assets_marketing_readme_and_release_workflow_docs.md)
- Static app direction: [ADR](logics/architecture/adr_000_choose_a_static_pwa_architecture_for_mermaid_generator.md)
- Release branch deployment workflow: [ADR](logics/architecture/adr_001_define_static_deployment_and_release_branch_workflow.md)

## Early Asset Inventory

- App icon: [`assets/branding/app-icon.svg`](assets/branding/app-icon.svg)
- Favicon base: [`assets/branding/favicon.svg`](assets/branding/favicon.svg)
- README hero banner: [`assets/branding/readme-hero.svg`](assets/branding/readme-hero.svg)

## Later, Once The MVP Exists

The next README iteration can add:

- a real CI badge once the GitHub repository is live;
- a production badge once the Render static site is connected;
- screenshots of the editor and generated preview flow;
- developer setup steps once the stack bootstrap is committed.
