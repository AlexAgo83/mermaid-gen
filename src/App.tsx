import {
  lazy,
  Suspense,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import "./styles/header.css";
import "./styles/modals.css";
import "./App.css";
import { OnboardingModal } from "./components/modals/OnboardingModal";
import { AppHeader } from "./components/shell/AppHeader";
import { PreviewPanel } from "./components/workspace/PreviewPanel";
import type {
  OnboardingState,
  ProviderSettings,
  RenderErrorCopy,
  RenderState,
  SourceOrigin,
  Viewport,
} from "./lib/app-types";
import { loadChangelogEntries, type ChangelogEntry } from "./lib/changelog";
import { downloadDiagramAsPng, downloadDiagramAsSvg } from "./lib/exporters";
import {
  generateMermaidFromPrompt,
  PROVIDERS,
  type ProviderId,
} from "./lib/llm";
import {
  DEFAULT_MERMAID_SOURCE,
  extractSvgMetrics,
  prepareGeneratedMermaidSource,
  renderMermaidDiagram,
  type SvgMetrics,
} from "./lib/mermaid";
import {
  loadIsMobileHeader,
  loadOnboardingState,
  ONBOARDING_STATE_STORAGE_KEY,
} from "./lib/onboarding";
import {
  LEGACY_OPENAI_STORAGE_KEY,
  loadProviderSettings,
  normalizeProviderSettings,
  PROVIDER_SETTINGS_STORAGE_KEY,
} from "./lib/provider-settings";
import {
  buildSharedMermaidUrl,
  loadSharedMermaidSourceFromLocation,
} from "./lib/share";

const SettingsModal = lazy(async () => {
  const module = await import("./components/modals/SettingsModal");
  return { default: module.SettingsModal };
});

const ExportModal = lazy(async () => {
  const module = await import("./components/modals/ExportModal");
  return { default: module.ExportModal };
});

const ChangelogModal = lazy(async () => {
  const module = await import("./components/modals/ChangelogModal");
  return { default: module.ChangelogModal };
});

const MIN_SCALE = 0.35;
const MAX_SCALE = 2.4;

const HELP_COPY = {
  source:
    "Paste Mermaid directly or keep refining the current draft. This source stays canonical, so preview and export always derive from it.",
  prompt:
    "Turn a short brief into Mermaid with your selected provider. The selected provider returns Mermaid that replaces the current editor content.",
  preview:
    "Use preview as the review surface. Hold Shift while scrolling to zoom, drag to pan, and export the full diagram rather than the current viewport framing.",
} as const;

function loadInitialSource() {
  return loadSharedMermaidSourceFromLocation() ?? DEFAULT_MERMAID_SOURCE;
}

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

function hasSharedMermaidSourceInLocation() {
  return loadSharedMermaidSourceFromLocation() !== null;
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

function getRenderErrorCopy(sourceOrigin: SourceOrigin): RenderErrorCopy {
  if (sourceOrigin === "generated") {
    return {
      title: "Generated Mermaid needs another pass",
      message:
        "This generated draft could not be rendered. Refine the prompt or edit the source directly, then try again.",
    };
  }

  return {
    title: "Preview unavailable",
    message:
      "This Mermaid source could not be rendered. Review the editor content and correct the syntax to restore the preview.",
  };
}

function isEscapeDismissalKey(key: string, code: string) {
  return key === "Escape" || key === "Esc" || code === "Escape";
}

function isInteractivePreviewTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    target.closest("button, input, textarea, select, a") !== null
  );
}

function App() {
  const [source, setSource] = useState(loadInitialSource);
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
  const [exportFormat, setExportFormat] = useState<"svg" | "png">("png");
  const [exportScale, setExportScale] = useState(2);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isShareLinkCopying, setIsShareLinkCopying] = useState(false);
  const [shareToastMessage, setShareToastMessage] = useState<string | null>(null);
  const [onboardingState, setOnboardingState] =
    useState<OnboardingState>(loadOnboardingState);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(
    () => loadOnboardingState() === "pending" && !hasSharedMermaidSourceInLocation(),
  );
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [helpTopic, setHelpTopic] = useState<"source" | "prompt" | "preview" | null>(
    null,
  );
  const [isGenerationWarningOpen, setIsGenerationWarningOpen] = useState(false);
  const [isPromptErrorOpen, setIsPromptErrorOpen] = useState(false);
  const [isRendering, setIsRendering] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileHeader, setIsMobileHeader] = useState(loadIsMobileHeader);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [isChangelogLoading, setIsChangelogLoading] = useState(false);
  const [changelogEntries, setChangelogEntries] = useState<ChangelogEntry[]>([]);
  const [changelogError, setChangelogError] = useState<string | null>(null);
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
  const settingsDialogRef = useRef<HTMLDivElement | null>(null);
  const isChangelogRequestInFlightRef = useRef(false);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }

    window.localStorage.setItem(
      PROVIDER_SETTINGS_STORAGE_KEY,
      JSON.stringify(providerSettings),
    );
    window.localStorage.removeItem(LEGACY_OPENAI_STORAGE_KEY);
  }, [providerSettings]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }

    window.localStorage.setItem(ONBOARDING_STATE_STORAGE_KEY, onboardingState);
  }, [onboardingState]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 920px)");
    const syncHeaderMode = (event: MediaQueryList | MediaQueryListEvent) => {
      setIsMobileHeader(event.matches);
    };

    syncHeaderMode(mediaQuery);
    mediaQuery.addEventListener("change", syncHeaderMode);

    return () => {
      mediaQuery.removeEventListener("change", syncHeaderMode);
    };
  }, []);

  useEffect(() => {
    if (!isMobileHeader) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobileHeader]);

  useEffect(() => {
    if (!shareToastMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShareToastMessage(null);
    }, 2400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [shareToastMessage]);

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
      .catch(() => {
        if (!active) {
          return;
        }

        setRenderState({
          status: "error",
          error: getRenderErrorCopy(sourceOrigin),
          svg: "",
          metrics: null,
        });
        setIsRendering(false);
      });

    return () => {
      active = false;
    };
  }, [deferredSource, sourceOrigin]);

  useEffect(() => {
    if (!isSettingsOpen) {
      setSettingsDraft(providerSettings);
      setIsDraftKeyVisible(false);
    }
  }, [providerSettings, isSettingsOpen]);

  useEffect(() => {
    if (!isSettingsOpen) {
      return;
    }

    const handleSettingsEscape = (event: KeyboardEvent) => {
      if (isEscapeDismissalKey(event.key, event.code)) {
        setIsSettingsOpen(false);
      }
    };

    const focusTarget =
      settingsDialogRef.current?.querySelector<HTMLElement>("#provider-key") ??
      settingsDialogRef.current?.querySelector<HTMLElement>("button, input");

    focusTarget?.focus();

    document.addEventListener("keydown", handleSettingsEscape, true);

    return () => {
      document.removeEventListener("keydown", handleSettingsEscape, true);
    };
  }, [isSettingsOpen]);

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

  useEffect(() => {
    if (promptError) {
      return;
    }

    setIsPromptErrorOpen(false);
  }, [promptError]);

  const requestChangelogEntries = useEffectEvent(() => {
    if (
      changelogEntries.length > 0 ||
      isChangelogRequestInFlightRef.current
    ) {
      return;
    }

    isChangelogRequestInFlightRef.current = true;
    setIsChangelogLoading(true);
    setChangelogError(null);

    void loadChangelogEntries()
      .then((entries) => {
        setChangelogEntries(entries);
      })
      .catch(() => {
        setChangelogError("Unable to load changelog history right now.");
      })
      .finally(() => {
        isChangelogRequestInFlightRef.current = false;
        setIsChangelogLoading(false);
      });
  });

  useEffect(() => {
    requestChangelogEntries();
  }, []);

  useEffect(() => {
    if (!isChangelogOpen) {
      return;
    }

    requestChangelogEntries();
  }, [isChangelogOpen]);

  const canExport = renderState.status === "ready";
  const activeProvider = getProvider(providerSettings.activeProviderId);
  const activeProviderKey =
    providerSettings.providerKeys[providerSettings.activeProviderId].trim();
  const hasActiveProviderKey = activeProviderKey.length > 0;

  const previewTransform = useMemo(
    () =>
      `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
    [viewport],
  );

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const openSettings = () => {
    setHelpTopic(null);
    closeMobileMenu();
    setSettingsDraft(providerSettings);
    setIsDraftKeyVisible(false);
    setIsSettingsOpen(true);
  };

  const openExport = () => {
    closeMobileMenu();

    if (canExport) {
      setExportError(null);
      setHelpTopic(null);
      setIsExportOpen(true);
    }
  };

  const openChangelog = () => {
    closeMobileMenu();
    setIsSettingsOpen(false);
    setIsChangelogOpen(true);
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

    closeMobileMenu();
    setViewport(centerViewport(previewRef.current, renderState.metrics, 1));
  };

  const handleFit = () => {
    if (renderState.status !== "ready" || !previewRef.current) {
      return;
    }

    closeMobileMenu();
    setViewport(fitViewport(previewRef.current, renderState.metrics));
  };

  const handleTogglePreviewFocus = () => {
    closeMobileMenu();
    setHelpTopic(null);
    setIsPreviewFocused((current) => !current);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (
      renderState.status !== "ready" ||
      isInteractivePreviewTarget(event.target)
    ) {
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

  const handlePreviewWheel = useEffectEvent((event: WheelEvent) => {
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
  });

  useEffect(() => {
    const previewElement = previewRef.current;

    if (!previewElement) {
      return;
    }

    const onWheel = (event: WheelEvent) => {
      handlePreviewWheel(event);
    };

    previewElement.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      previewElement.removeEventListener("wheel", onWheel);
    };
  }, []);

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

  const handleCopyShareLink = async () => {
    if (
      typeof window === "undefined" ||
      typeof navigator === "undefined" ||
      typeof navigator.clipboard?.writeText !== "function"
    ) {
      setExportError("Clipboard access is unavailable for share links.");
      return;
    }

    setIsShareLinkCopying(true);
    setExportError(null);

    try {
      const shareUrl = buildSharedMermaidUrl(source, window.location);
      await navigator.clipboard.writeText(shareUrl);
      setShareToastMessage("Share link copied to clipboard.");
    } catch {
      setExportError("Unable to copy the share link right now.");
    } finally {
      setIsShareLinkCopying(false);
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

      const preparedSource = await prepareGeneratedMermaidSource(nextSource);

      if (!preparedSource.ok) {
        setPromptError(preparedSource.error);
        return;
      }

      setIsRendering(true);
      setSourceOrigin("generated");
      setSource(preparedSource.source);
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

  const handleSettingsEscapeDismiss = (
    event: Pick<ReactKeyboardEvent<HTMLElement>, "key" | "code">,
  ) => {
    if (isEscapeDismissalKey(event.key, event.code)) {
      setIsSettingsOpen(false);
    }
  };

  return (
    <div className={`app-shell${isPreviewFocused ? " is-preview-focused" : ""}`}>
      <AppHeader
        isPreviewFocused={isPreviewFocused}
        isMobileHeader={isMobileHeader}
        isMobileMenuOpen={isMobileMenuOpen}
        canExport={canExport}
        onOpenSettings={openSettings}
        onOpenExport={openExport}
        onOpenChangelog={openChangelog}
        onTogglePreviewFocus={handleTogglePreviewFocus}
        onToggleMobileMenu={() => {
          setIsMobileMenuOpen((current) => !current);
        }}
        onCloseMobileMenu={closeMobileMenu}
        onResetPreview={handleReset}
        onFitPreview={handleFit}
      />

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
                  <div className="prompt-indicators">
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
                      <div className="prompt-warning-wrap">
                        <button
                          type="button"
                          className="warning-trigger warning-trigger-error"
                          aria-label="Show prompt generation error"
                          aria-expanded={isPromptErrorOpen}
                          onClick={() => {
                            setIsPromptErrorOpen((current) => !current);
                          }}
                        >
                          !
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
                {promptError && isPromptErrorOpen ? (
                  <div
                    className="warning-popover error-popover prompt-error-popover"
                    role="alert"
                  >
                    {promptError}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="prompt-locked">
                Add a {activeProvider.label} API key in Settings to unlock
                prompt-based generation on this device.
                <div className="prompt-locked-actions">
                  <button type="button" onClick={openSettings}>
                    Configure provider
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <PreviewPanel
          isPreviewFocused={isPreviewFocused}
          isPreviewHelpOpen={helpTopic === "preview"}
          previewHelp={HELP_COPY.preview}
          renderState={renderState}
          isRendering={isRendering}
          previewRef={previewRef}
          previewTransform={previewTransform}
          canExport={canExport}
          onTogglePreviewHelp={() => {
            setHelpTopic((current) => (current === "preview" ? null : "preview"));
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onZoomIn={() => {
            handleZoom(0.1);
          }}
          onZoomOut={() => {
            handleZoom(-0.1);
          }}
        />
      </main>

      <footer className="app-footer">
        <a
          className="footer-link"
          href="https://github.com/AlexAgo83/mermaid-gen"
          target="_blank"
          rel="noreferrer"
        >
          Mermaid Generator v{__APP_VERSION__} © 2026
        </a>
      </footer>

      <Suspense fallback={null}>
        <SettingsModal
          isOpen={isSettingsOpen}
          dialogRef={settingsDialogRef}
          settingsDraft={settingsDraft}
          isDraftKeyVisible={isDraftKeyVisible}
          onClose={() => {
            setIsSettingsOpen(false);
          }}
          onSave={handleSaveSettings}
          onReopenOnboarding={() => {
            setIsSettingsOpen(false);
            setOnboardingStep(0);
            setIsOnboardingOpen(true);
          }}
          onToggleKeyVisibility={() => {
            setIsDraftKeyVisible((current) => !current);
          }}
          onDismissEscape={handleSettingsEscapeDismiss}
          onSelectProvider={(providerId) => {
            setSettingsDraft((current) => ({
              ...current,
              activeProviderId: providerId,
            }));
            setIsDraftKeyVisible(false);
          }}
          onChangeProviderKey={(providerId, value) => {
            setSettingsDraft((current) => ({
              ...current,
              providerKeys: {
                ...current.providerKeys,
                [providerId]: value,
              },
            }));
          }}
          onRemoveProviderKey={(providerId) => {
            setSettingsDraft((current) => ({
              ...current,
              providerKeys: {
                ...current.providerKeys,
                [providerId]: "",
              },
            }));
          }}
        />
      </Suspense>

      <Suspense fallback={null}>
        <ExportModal
          isOpen={isExportOpen}
          exportFormat={exportFormat}
          exportScale={exportScale}
          exportError={exportError}
          isExporting={isExporting}
          isShareLinkCopying={isShareLinkCopying}
          renderState={renderState}
          onClose={() => {
            setIsExportOpen(false);
          }}
          onSubmit={handleExport}
          onCopyShareLink={() => {
            void handleCopyShareLink();
          }}
          onSelectFormat={setExportFormat}
          onSelectScale={setExportScale}
        />
      </Suspense>

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onboardingStep={onboardingStep}
        onSkip={() => {
          setOnboardingState("dismissed");
          setIsOnboardingOpen(false);
        }}
        onBack={() => {
          setOnboardingStep((current) => current - 1);
        }}
        onNext={() => {
          setOnboardingStep((current) => current + 1);
        }}
        onFinish={() => {
          setOnboardingState("completed");
          setIsOnboardingOpen(false);
        }}
      />

      <Suspense fallback={null}>
        <ChangelogModal
          isOpen={isChangelogOpen}
          entries={changelogEntries}
          isLoading={isChangelogLoading}
          error={changelogError}
          onClose={() => {
            setIsChangelogOpen(false);
          }}
        />
      </Suspense>

      {shareToastMessage ? (
        <div className="app-toast" role="status" aria-live="polite">
          {shareToastMessage}
        </div>
      ) : null}
    </div>
  );
}

export default App;
