import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  FormEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from "react";
import "./App.css";
import { downloadDiagramAsPng, downloadDiagramAsSvg } from "./lib/exporters";
import {
  generateMermaidFromPrompt,
  PROVIDER_IDS,
  PROVIDERS,
  type ProviderId,
} from "./lib/llm";
import {
  DEFAULT_MERMAID_SOURCE,
  extractSvgMetrics,
  normalizeGeneratedMermaid,
  renderMermaidDiagram,
  type SvgMetrics,
} from "./lib/mermaid";

type Viewport = {
  scale: number;
  x: number;
  y: number;
};

type RenderState =
  | {
      status: "loading";
      error: null;
      svg: string;
      metrics: SvgMetrics | null;
    }
  | {
      status: "ready";
      error: null;
      svg: string;
      metrics: SvgMetrics;
    }
  | {
      status: "error";
      error: string;
      svg: string;
      metrics: null;
    };

type ProviderKeyStore = Record<ProviderId, string>;

type ProviderSettings = {
  activeProviderId: ProviderId;
  providerKeys: ProviderKeyStore;
};

type HelpTopic = "source" | "prompt" | "preview" | null;
type ExportFormat = "svg" | "png";
type OnboardingState = "pending" | "dismissed" | "completed";
type SourceOrigin = "manual" | "generated";

const MIN_SCALE = 0.35;
const MAX_SCALE = 2.4;
const PROVIDER_SETTINGS_STORAGE_KEY = "mermaid-gen.provider-settings";
const ONBOARDING_STATE_STORAGE_KEY = "mermaid-gen.onboarding-state";
const LEGACY_OPENAI_STORAGE_KEY = "mermaid-gen.openai-key";

const HELP_COPY: Record<Exclude<HelpTopic, null>, string> = {
  source:
    "Paste Mermaid directly or keep refining the current draft. This source stays canonical, so preview and export always derive from it.",
  prompt:
    "Turn a short brief into Mermaid with your selected provider. The selected provider returns Mermaid that replaces the current editor content.",
  preview:
    "Use preview as the review surface. Hold Shift while scrolling to zoom, drag to pan, and export the full diagram rather than the current viewport framing.",
};

const ONBOARDING_STEPS = [
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

function clampScale(nextScale: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
}

function centerViewport(
  container: HTMLElement,
  metrics: SvgMetrics,
  scale: number,
): Viewport {
  const x = (container.clientWidth - metrics.width * scale) / 2;
  const y = (container.clientHeight - metrics.height * scale) / 2;

  return { scale, x, y };
}

function fitViewport(container: HTMLElement, metrics: SvgMetrics): Viewport {
  const widthScale = container.clientWidth / metrics.width;
  const heightScale = container.clientHeight / metrics.height;
  const scale = clampScale(Math.min(widthScale, heightScale) * 0.92);

  return centerViewport(container, metrics, scale);
}

function createEmptyProviderKeys(): ProviderKeyStore {
  return {
    openai: "",
    openrouter: "",
    anthropic: "",
  };
}

function normalizeProviderSettings(
  value: Partial<ProviderSettings> | null | undefined,
): ProviderSettings {
  const providerKeys = createEmptyProviderKeys();

  for (const providerId of PROVIDER_IDS) {
    const candidate = value?.providerKeys?.[providerId];
    providerKeys[providerId] = typeof candidate === "string" ? candidate : "";
  }

  const activeProviderId = PROVIDER_IDS.includes(
    value?.activeProviderId as ProviderId,
  )
    ? (value?.activeProviderId as ProviderId)
    : "openai";

  return {
    activeProviderId,
    providerKeys,
  };
}

function loadProviderSettings() {
  if (typeof window === "undefined") {
    return normalizeProviderSettings(null);
  }

  const storedSettings = window.localStorage.getItem(
    PROVIDER_SETTINGS_STORAGE_KEY,
  );

  if (storedSettings) {
    try {
      return normalizeProviderSettings(
        JSON.parse(storedSettings) as Partial<ProviderSettings>,
      );
    } catch {
      window.localStorage.removeItem(PROVIDER_SETTINGS_STORAGE_KEY);
    }
  }

  const legacyOpenAiKey =
    window.localStorage.getItem(LEGACY_OPENAI_STORAGE_KEY) ?? "";

  return normalizeProviderSettings({
    activeProviderId: "openai",
    providerKeys: {
      ...createEmptyProviderKeys(),
      openai: legacyOpenAiKey,
    },
  });
}

function loadOnboardingState(): OnboardingState {
  if (typeof window === "undefined") {
    return "pending";
  }

  const storedValue = window.localStorage.getItem(ONBOARDING_STATE_STORAGE_KEY);

  if (
    storedValue === "dismissed" ||
    storedValue === "completed" ||
    storedValue === "pending"
  ) {
    return storedValue;
  }

  return "pending";
}

function describeDiagramBalance(metrics: SvgMetrics) {
  const ratio = metrics.width / metrics.height;

  if (ratio > 3.4) {
    return "This generated diagram is very wide. Ask for grouped stages or shorter labels if you want a more balanced export.";
  }

  if (ratio < 0.38) {
    return "This generated diagram is very tall. Ask for fewer stacked levels or broader grouping if you want a more balanced export.";
  }

  return null;
}

function getProvider(providerId: ProviderId) {
  return PROVIDERS.find((provider) => provider.id === providerId)!;
}

function App() {
  const [source, setSource] = useState(DEFAULT_MERMAID_SOURCE);
  const [prompt, setPrompt] = useState("");
  const [isPreviewFocused, setIsPreviewFocused] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState<ProviderSettings>(
    loadProviderSettings,
  );
  const [providerSettings, setProviderSettings] =
    useState<ProviderSettings>(loadProviderSettings);
  const [isDraftKeyVisible, setIsDraftKeyVisible] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");
  const [exportScale, setExportScale] = useState(2);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [onboardingState, setOnboardingState] =
    useState<OnboardingState>(loadOnboardingState);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(
    () => loadOnboardingState() === "pending",
  );
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [helpTopic, setHelpTopic] = useState<HelpTopic>(null);
  const [isGenerationWarningOpen, setIsGenerationWarningOpen] = useState(false);
  const [isRendering, setIsRendering] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);
  const [sourceOrigin, setSourceOrigin] = useState<SourceOrigin>("manual");
  const [viewport, setViewport] = useState<Viewport>({
    scale: 1,
    x: 0,
    y: 0,
  });
  const [renderState, setRenderState] = useState<RenderState>({
    status: "loading",
    error: null,
    svg: "",
    metrics: null,
  });
  const deferredSource = useDeferredValue(source);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      PROVIDER_SETTINGS_STORAGE_KEY,
      JSON.stringify(providerSettings),
    );
    window.localStorage.removeItem(LEGACY_OPENAI_STORAGE_KEY);
  }, [providerSettings]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(ONBOARDING_STATE_STORAGE_KEY, onboardingState);
  }, [onboardingState]);

  useEffect(() => {
    let active = true;

    void renderMermaidDiagram(deferredSource)
      .then((svg) => {
        if (!active) {
          return;
        }

        const metrics = extractSvgMetrics(svg);
        setRenderState({
          status: "ready",
          error: null,
          svg,
          metrics,
        });
        setIsRendering(false);
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        const message =
          error instanceof Error ? error.message : "Unable to render Mermaid.";

        setRenderState({
          status: "error",
          error: message,
          svg: "",
          metrics: null,
        });
        setIsRendering(false);
      });

    return () => {
      active = false;
    };
  }, [deferredSource]);

  useEffect(() => {
    if (!isSettingsOpen) {
      setSettingsDraft(providerSettings);
      setIsDraftKeyVisible(false);
    }
  }, [providerSettings, isSettingsOpen]);

  useEffect(() => {
    if (renderState.status !== "ready" || !previewRef.current) {
      return;
    }

    const container = previewRef.current;
    const applyFit = () => {
      setViewport(fitViewport(container, renderState.metrics));
    };

    applyFit();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      applyFit();
    });

    observer.observe(container);
    return () => {
      observer.disconnect();
    };
  }, [renderState]);

  useEffect(() => {
    if (renderState.status !== "ready") {
      return;
    }

    if (sourceOrigin !== "generated") {
      setGenerationNotice(null);
      setIsGenerationWarningOpen(false);
      return;
    }

    setGenerationNotice(describeDiagramBalance(renderState.metrics));
  }, [renderState, sourceOrigin]);

  const canExport = renderState.status === "ready";
  const activeProvider = getProvider(providerSettings.activeProviderId);
  const activeProviderKey =
    providerSettings.providerKeys[providerSettings.activeProviderId].trim();
  const hasActiveProviderKey = activeProviderKey.length > 0;
  const activeDraftProvider = getProvider(settingsDraft.activeProviderId);
  const exportSize =
    renderState.status === "ready"
      ? {
          width: Math.round(renderState.metrics.width * exportScale),
          height: Math.round(renderState.metrics.height * exportScale),
        }
      : null;

  const previewTransform = useMemo(
    () =>
      `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
    [viewport],
  );

  const openSettings = () => {
    setHelpTopic(null);
    setSettingsDraft(providerSettings);
    setIsDraftKeyVisible(false);
    setIsSettingsOpen(true);
  };

  const handleZoom = (delta: number) => {
    if (renderState.status !== "ready" || !previewRef.current) {
      return;
    }

    const container = previewRef.current;
    const nextScale = clampScale(viewport.scale + delta);
    setViewport(centerViewport(container, renderState.metrics, nextScale));
  };

  const handleReset = () => {
    if (renderState.status !== "ready" || !previewRef.current) {
      return;
    }

    setViewport(centerViewport(previewRef.current, renderState.metrics, 1));
  };

  const handleFit = () => {
    if (renderState.status !== "ready" || !previewRef.current) {
      return;
    }

    setViewport(fitViewport(previewRef.current, renderState.metrics));
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (renderState.status !== "ready") {
      return;
    }

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: viewport.x,
      originY: viewport.y,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    setViewport((current) => ({
      ...current,
      x: drag.originX + deltaX,
      y: drag.originY + deltaY,
    }));
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (
      renderState.status !== "ready" ||
      !previewRef.current ||
      !event.shiftKey
    ) {
      return;
    }

    event.preventDefault();

    const rect = previewRef.current.getBoundingClientRect();
    const cursorX = event.clientX - rect.left;
    const cursorY = event.clientY - rect.top;
    const nextScale = clampScale(
      viewport.scale + (event.deltaY < 0 ? 0.12 : -0.12),
    );
    const ratio = nextScale / viewport.scale;
    const nextX = cursorX - (cursorX - viewport.x) * ratio;
    const nextY = cursorY - (cursorY - viewport.y) * ratio;

    setViewport({
      scale: nextScale,
      x: nextX,
      y: nextY,
    });
  };

  const handleSaveSettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProviderSettings(normalizeProviderSettings(settingsDraft));
    setIsSettingsOpen(false);
  };

  const handleExport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (renderState.status !== "ready") {
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      if (exportFormat === "svg") {
        await downloadDiagramAsSvg(renderState.svg, "mermaid-diagram");
      } else {
        await downloadDiagramAsPng(
          renderState.svg,
          renderState.metrics,
          "mermaid-diagram",
          {
            scale: exportScale,
          },
        );
      }

      setIsExportOpen(false);
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : "Unable to export the diagram.",
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerate = async () => {
    if (!hasActiveProviderKey || prompt.trim().length === 0) {
      return;
    }

    setIsGenerating(true);
    setPromptError(null);
    setGenerationNotice(null);
    setIsGenerationWarningOpen(false);

    try {
      const nextSource = await generateMermaidFromPrompt({
        providerId: providerSettings.activeProviderId,
        apiKey: activeProviderKey,
        prompt,
      });
      const normalizedSource = normalizeGeneratedMermaid(nextSource);

      setIsRendering(true);
      setSourceOrigin("generated");
      setSource(normalizedSource);
    } catch (error) {
      setPromptError(
        error instanceof Error
          ? error.message
          : "Unable to generate Mermaid from this prompt.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`app-shell${isPreviewFocused ? " is-preview-focused" : ""}`}>
      <header className="topbar">
        <div className="brand">
          <img className="brand-mark" src="/icon.svg" alt="" />
          <div className="brand-copy">
            <h1>Mermaid Generator</h1>
          </div>
        </div>
        <div className="topbar-actions">
          {isPreviewFocused ? <div className="focus-pill">Preview focus</div> : null}
          <button type="button" onClick={openSettings}>
            Settings
          </button>
        </div>
      </header>

      <main className="workspace-layout">
        <section className="left-rail">
          <div className="panel panel-editor">
            <div className="panel-header">
              <div className="panel-heading-group">
                <div className="title-row">
                  <h2>Mermaid source</h2>
                  <button
                    type="button"
                    className="help-trigger"
                    aria-label="Show Mermaid source help"
                    aria-expanded={helpTopic === "source"}
                    onClick={() => {
                      setHelpTopic((current) =>
                        current === "source" ? null : "source",
                      );
                    }}
                  >
                    i
                  </button>
                </div>
                {helpTopic === "source" ? (
                  <div className="help-popover" role="note">
                    {HELP_COPY.source}
                  </div>
                ) : null}
              </div>
              <span>{source.split("\n").length} lines</span>
            </div>
            <div className="editor-surface">
              <textarea
                className="editor-textarea"
                value={source}
                spellCheck="false"
                onChange={(event) => {
                  setIsRendering(true);
                  setSourceOrigin("manual");
                  setSource(event.target.value);
                }}
              />
            </div>
          </div>

          <div className="panel panel-prompt">
            <div className="panel-header">
              <div className="panel-heading-group">
                <div className="title-row">
                  <h2>Prompt draft</h2>
                  <button
                    type="button"
                    className="help-trigger"
                    aria-label="Show prompt help"
                    aria-expanded={helpTopic === "prompt"}
                    onClick={() => {
                      setHelpTopic((current) =>
                        current === "prompt" ? null : "prompt",
                      );
                    }}
                  >
                    i
                  </button>
                </div>
                {helpTopic === "prompt" ? (
                  <div className="help-popover" role="note">
                    {HELP_COPY.prompt}
                  </div>
                ) : null}
              </div>
              <span>
                {hasActiveProviderKey
                  ? `${activeProvider.label} ready`
                  : `Set up ${activeProvider.label}`}
              </span>
            </div>
            <textarea
              className="prompt-textarea"
              value={prompt}
              onChange={(event) => {
                setPrompt(event.target.value);
              }}
              placeholder="Describe a system, process, or architecture to generate Mermaid from text."
              disabled={!hasActiveProviderKey || isGenerating}
            />
            {hasActiveProviderKey ? (
              <div className="prompt-actions">
                <button
                  className="button-primary"
                  type="button"
                  onClick={() => {
                    void handleGenerate();
                  }}
                  disabled={prompt.trim().length === 0 || isGenerating}
                >
                  {isGenerating
                    ? "Generating…"
                    : `Generate with ${activeProvider.label}`}
                </button>
                <div className="prompt-feedback">
                  {generationNotice ? (
                    <div className="prompt-warning-wrap">
                      <button
                        type="button"
                        className="warning-trigger"
                        aria-label="Show generation warning"
                        aria-expanded={isGenerationWarningOpen}
                        onClick={() => {
                          setIsGenerationWarningOpen((current) => !current);
                        }}
                      >
                        !
                      </button>
                      {isGenerationWarningOpen ? (
                        <div className="warning-popover" role="note">
                          {generationNotice}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  {promptError ? (
                    <p className="prompt-error">{promptError}</p>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="prompt-locked">
                Add a {activeProvider.label} API key in Settings to unlock
                prompt-based generation on this device.
                <div className="prompt-locked-actions">
                  <button type="button" onClick={openSettings}>
                    Open Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="panel panel-preview">
          <div className="preview-header">
            <div className="panel-heading-group">
              <div className="title-row">
                <h2>Preview</h2>
                <button
                  type="button"
                  className="help-trigger"
                  aria-label="Show preview help"
                  aria-expanded={helpTopic === "preview"}
                  onClick={() => {
                    setHelpTopic((current) =>
                      current === "preview" ? null : "preview",
                    );
                  }}
                >
                  i
                </button>
              </div>
              {helpTopic === "preview" ? (
                <div className="help-popover" role="note">
                  {HELP_COPY.preview}
                </div>
              ) : null}
            </div>
          </div>

          <div className="preview-toolbar">
            <button type="button" onClick={() => handleZoom(-0.1)}>
              -
            </button>
            <button type="button" onClick={() => handleZoom(0.1)}>
              +
            </button>
            <button type="button" onClick={handleReset}>
              Reset
            </button>
            <button type="button" onClick={handleFit}>
              Fit
            </button>
            <button
              type="button"
              onClick={() => {
                setHelpTopic(null);
                setIsPreviewFocused((current) => !current);
              }}
            >
              {isPreviewFocused ? "Exit focus" : "Focus preview"}
            </button>
            <button
              className="button-primary"
              type="button"
              onClick={() => {
                if (canExport) {
                  setExportError(null);
                  setHelpTopic(null);
                  setIsExportOpen(true);
                }
              }}
              disabled={!canExport}
            >
              Export
            </button>
          </div>

          <div
            ref={previewRef}
            className={`preview-stage${
              renderState.status === "ready" ? " is-draggable" : ""
            }`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
          >
            {isRendering ? (
              <div className="preview-message">Rendering Mermaid preview…</div>
            ) : null}

            {renderState.status === "error" && !isRendering ? (
              <div className="preview-message preview-error">
                <h3>Unable to render this Mermaid source</h3>
                <p>{renderState.error}</p>
              </div>
            ) : null}

            {renderState.status === "ready" ? (
              <div
                className="preview-diagram"
                style={{
                  width: renderState.metrics.width,
                  height: renderState.metrics.height,
                  transform: previewTransform,
                }}
                dangerouslySetInnerHTML={{ __html: renderState.svg }}
              />
            ) : null}
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <a
          className="footer-link"
          href="https://github.com/AlexAgo83/mermaid-gen"
          target="_blank"
          rel="noreferrer"
        >
          Mermaid Generator © 2026
        </a>
      </footer>

      {isSettingsOpen ? (
        <div className="modal-backdrop" role="presentation">
          <div
            className="settings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
          >
            <div className="panel-header">
              <div>
                <h2 id="settings-title">Settings</h2>
                <p className="panel-subtitle">
                  Choose the active provider and keep keys local to this browser.
                </p>
              </div>
            </div>

            <form className="settings-form" onSubmit={handleSaveSettings}>
              <div className="provider-picker" role="radiogroup" aria-label="Provider">
                {PROVIDERS.map((provider) => {
                  const hasKey =
                    settingsDraft.providerKeys[provider.id].trim().length > 0;

                  return (
                    <button
                      key={provider.id}
                      type="button"
                      className={`provider-card${
                        settingsDraft.activeProviderId === provider.id
                          ? " is-active"
                          : ""
                      }`}
                      role="radio"
                      aria-checked={settingsDraft.activeProviderId === provider.id}
                      onClick={() => {
                        setSettingsDraft((current) => ({
                          ...current,
                          activeProviderId: provider.id,
                        }));
                        setIsDraftKeyVisible(false);
                      }}
                    >
                      <span className="provider-card-label">{provider.label}</span>
                      <span className="provider-card-copy">
                        {provider.description}
                      </span>
                      <span className="provider-card-status">
                        {hasKey ? "Key saved locally" : "No key saved"}
                      </span>
                    </button>
                  );
                })}
              </div>

              <label className="settings-field" htmlFor="provider-key">
                {activeDraftProvider.keyLabel}
              </label>
              <div className="settings-key-row">
                <input
                  id="provider-key"
                  className="settings-input"
                  type={isDraftKeyVisible ? "text" : "password"}
                  value={settingsDraft.providerKeys[settingsDraft.activeProviderId]}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setSettingsDraft((current) => ({
                      ...current,
                      providerKeys: {
                        ...current.providerKeys,
                        [current.activeProviderId]: nextValue,
                      },
                    }));
                  }}
                  placeholder={activeDraftProvider.keyPlaceholder}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsDraftKeyVisible((current) => !current);
                  }}
                >
                  {isDraftKeyVisible ? "Hide" : "Reveal"}
                </button>
              </div>
              <p className="settings-help">
                Keys stay on this device in local browser storage. You can keep
                multiple provider keys and switch the active provider without
                losing the others.
              </p>
              <div className="settings-actions">
                <div className="settings-actions-left">
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsDraft((current) => ({
                        ...current,
                        providerKeys: {
                          ...current.providerKeys,
                          [current.activeProviderId]: "",
                        },
                      }));
                    }}
                  >
                    Remove key
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingsOpen(false);
                      setOnboardingStep(0);
                      setIsOnboardingOpen(true);
                    }}
                  >
                    Reopen onboarding
                  </button>
                </div>
                <div className="settings-actions-right">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingsOpen(false);
                    }}
                  >
                    Close
                  </button>
                  <button className="button-primary" type="submit">
                    Save settings
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isExportOpen ? (
        <div className="modal-backdrop" role="presentation">
          <div
            className="settings-modal export-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-title"
          >
            <div className="panel-header">
              <div>
                <h2 id="export-title">Export diagram</h2>
                <p className="panel-subtitle">
                  Choose the output format and raster scale before downloading.
                </p>
              </div>
            </div>

            <form className="settings-form" onSubmit={handleExport}>
              <div className="export-options" role="radiogroup" aria-label="Export format">
                <button
                  type="button"
                  className={`provider-card${exportFormat === "svg" ? " is-active" : ""}`}
                  role="radio"
                  aria-checked={exportFormat === "svg"}
                  onClick={() => {
                    setExportFormat("svg");
                  }}
                >
                  <span className="provider-card-label">SVG</span>
                  <span className="provider-card-copy">
                    Vector export for docs and further editing.
                  </span>
                </button>
                <button
                  type="button"
                  className={`provider-card${exportFormat === "png" ? " is-active" : ""}`}
                  role="radio"
                  aria-checked={exportFormat === "png"}
                  onClick={() => {
                    setExportFormat("png");
                  }}
                >
                  <span className="provider-card-label">PNG</span>
                  <span className="provider-card-copy">
                    Raster export with selectable output scale.
                  </span>
                </button>
              </div>

              {exportFormat === "png" ? (
                <div className="scale-picker" role="radiogroup" aria-label="PNG scale">
                  {[1, 2, 3].map((scale) => (
                    <button
                      key={scale}
                      type="button"
                      className={`scale-chip${exportScale === scale ? " is-active" : ""}`}
                      role="radio"
                      aria-checked={exportScale === scale}
                      onClick={() => {
                        setExportScale(scale);
                      }}
                    >
                      {scale}x
                    </button>
                  ))}
                </div>
              ) : null}

              {renderState.status === "ready" ? (
                <p className="settings-help">
                  Source diagram: {Math.round(renderState.metrics.width)} x{" "}
                  {Math.round(renderState.metrics.height)} px
                  {exportSize && exportFormat === "png"
                    ? ` · PNG output: ${exportSize.width} x ${exportSize.height} px`
                    : ""}
                </p>
              ) : null}

              {exportError ? <p className="prompt-error">{exportError}</p> : null}

              <div className="settings-actions">
                <div />
                <div className="settings-actions-right">
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportOpen(false);
                    }}
                  >
                    Close
                  </button>
                  <button className="button-primary" type="submit" disabled={isExporting}>
                    {isExporting ? "Downloading…" : "Download"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isOnboardingOpen ? (
        <div className="modal-backdrop" role="presentation">
          <div
            className="settings-modal onboarding-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-title"
          >
            <div className="onboarding-kicker">
              Step {onboardingStep + 1} of {ONBOARDING_STEPS.length}
            </div>
            <div className="panel-header">
              <div>
                <h2 id="onboarding-title">{ONBOARDING_STEPS[onboardingStep].title}</h2>
                <p className="panel-subtitle">
                  {ONBOARDING_STEPS[onboardingStep].body}
                </p>
              </div>
            </div>
            <p className="onboarding-detail">
              {ONBOARDING_STEPS[onboardingStep].detail}
            </p>
            <div className="settings-actions">
              <button
                type="button"
                onClick={() => {
                  setOnboardingState("dismissed");
                  setIsOnboardingOpen(false);
                }}
              >
                Skip
              </button>
              <div className="settings-actions-right">
                {onboardingStep > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setOnboardingStep((current) => current - 1);
                    }}
                  >
                    Back
                  </button>
                ) : null}
                {onboardingStep < ONBOARDING_STEPS.length - 1 ? (
                  <button
                    className="button-primary"
                    type="button"
                    onClick={() => {
                      setOnboardingStep((current) => current + 1);
                    }}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    className="button-primary"
                    type="button"
                    onClick={() => {
                      setOnboardingState("completed");
                      setIsOnboardingOpen(false);
                    }}
                  >
                    Finish
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
