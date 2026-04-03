export const ONBOARDING_STATE_STORAGE_KEY = "mermaid-gen.onboarding-state";

export const ONBOARDING_STEPS = [
  {
    title: "Welcome",
    body: "Mermaid Generator keeps the whole diagram loop in one browser workspace: write or describe, review the result, then export a clean asset.",
    detail:
      "The preview stays primary so you can judge structure quickly without losing the underlying Mermaid source.",
  },
  {
    title: "Code editor",
    body: "The Mermaid source remains the artifact you control. Paste existing Mermaid or refine generated output directly in the editor.",
    detail:
      "Every preview and export comes from this source, so manual edits stay first-class.",
  },
  {
    title: "Prompt",
    body: "Use the prompt panel when you want a first draft from text. Pick a provider in Settings, save its key locally, then generate Mermaid without leaving the app.",
    detail:
      "The generated output is still editable, so AI stays a starting point rather than a black box.",
  },
  {
    title: "Preview",
    body: "Review the diagram in the large preview stage. Fit the diagram, zoom, pan, or switch into preview focus when you want a cleaner review surface.",
    detail:
      "Hold Shift while scrolling to zoom and drag the stage to move around larger diagrams.",
  },
  {
    title: "Export",
    body: "When the diagram is ready, open Export to choose SVG or PNG and, for PNG, the raster scale before downloading.",
    detail:
      "Exports always use the full rendered diagram rather than the current zoom position.",
  },
] as const;

export function loadOnboardingState() {
  if (typeof window === "undefined") {
    return "pending" as const;
  }

  const storedValue = window.localStorage.getItem(ONBOARDING_STATE_STORAGE_KEY);

  if (
    storedValue === "dismissed" ||
    storedValue === "completed" ||
    storedValue === "pending"
  ) {
    return storedValue;
  }

  return "pending" as const;
}

export function loadIsMobileHeader() {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }

  return window.matchMedia("(max-width: 920px)").matches;
}
