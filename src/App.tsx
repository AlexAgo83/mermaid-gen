import {
  lazy,
  Suspense,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from "react";
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import "@/styles/header.css";
import "@/styles/modals.css";
import "@/App.css";
import { OnboardingModal } from "@/components/modals/OnboardingModal";
import { AppHeader } from "@/components/shell/AppHeader";
import { PreviewPanel } from "@/components/workspace/PreviewPanel";
import { useChangelog } from "@/hooks/useChangelog";
import { useExport } from "@/hooks/useExport";
import { usePreviewInteraction } from "@/hooks/usePreviewInteraction";
import type {
  OnboardingState,
  ProviderSettings,
  RenderErrorCopy,
  RenderState,
  SourceOrigin,
} from "@/lib/app-types";
import {
  PROVIDERS,
  generateMermaidFromPrompt,
  type ProviderId,
} from "@/lib/llm";
import {
  DEFAULT_MERMAID_SOURCE,
  extractSvgMetrics,
  prepareGeneratedMermaidSource,
  renderMermaidDiagram,
  type SvgMetrics,
} from "@/lib/mermaid";
import {
  ONBOARDING_STATE_STORAGE_KEY,
  loadIsMobileHeader,
  loadOnboardingState,
} from "@/lib/onboarding";
import {
  LEGACY_OPENAI_STORAGE_KEY,
  PROVIDER_SETTINGS_STORAGE_KEY,
  loadProviderSettings,
  normalizeProviderSettings,
} from "@/lib/provider-settings";
import { loadSharedMermaidSourceFromLocation } from "@/lib/share";

const SettingsModal = lazy(async () => {
  const module = await import("@/components/modals/SettingsModal");
  return { default: module.SettingsModal };
});

const ExportModal = lazy(async () => {
  const module = await import("@/components/modals/ExportModal");
  return { default: module.ExportModal };
});

const ChangelogModal = lazy(async () => {
  const module = await import("@/components/modals/ChangelogModal");
  return { default: module.ChangelogModal };
});

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

function App() {
  const [source, setSource] = useState(loadInitialSource);
  const [prompt, setPrompt] = useState("");
  const [isPreviewFocused, setIsPreviewFocused] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsDraft, setSettingsDraft] =
    useState<ProviderSettings>(loadProviderSettings);
  const [providerSettings, setProviderSettings] =
    useState<ProviderSettings>(loadProviderSettings);
  const [isDraftKeyVisible, setIsDraftKeyVisible] = useState(false);
  const [onboardingState, setOnboardingState] =
    useState<OnboardingState>(loadOnboardingState);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(
    () =>
      loadOnboardingState() === "pending" &&
      !hasSharedMermaidSourceInLocation(),
  );
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [helpTopic, setHelpTopic] = useState<
    "source" | "prompt" | "preview" | null
  >(null);
  const [isGenerationWarningOpen, setIsGenerationWarningOpen] = useState(false);
  const [isPromptErrorOpen, setIsPromptErrorOpen] = useState(false);
  const [isRendering, setIsRendering] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileHeader, setIsMobileHeader] = useState(loadIsMobileHeader);
  const [sourceOrigin, setSourceOrigin] = useState<SourceOrigin>("manual");
  const [renderState, setRenderState] = useState<RenderState>({
    status: "loading",
    error: null,
    svg: "",
    metrics: null,
  });

  const deferredSource = useDeferredValue(source);
  const settingsDialogRef = useRef<HTMLDivElement | null>(null);
  const previewInteraction = usePreviewInteraction(renderState);
  const exportState = useExport(renderState, source);
  const changelogState = useChangelog();

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

  const canExport = renderState.status === "ready";
  const activeProvider = getProvider(providerSettings.activeProviderId);
  const activeProviderKey =
    providerSettings.providerKeys[providerSettings.activeProviderId].trim();
  const hasActiveProviderKey = activeProviderKey.length > 0;

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
    setHelpTopic(null);
    exportState.openExport();
  };

  const openChangelog = () => {
    closeMobileMenu();
    setIsSettingsOpen(false);
    changelogState.openChangelog();
  };

  const handleTogglePreviewFocus = () => {
    closeMobileMenu();
    setHelpTopic(null);
    setIsPreviewFocused((current) => !current);
  };

  const handleSaveSettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProviderSettings(normalizeProviderSettings(settingsDraft));
    setIsSettingsOpen(false);
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
    <div
      className={`app-shell${isPreviewFocused ? " is-preview-focused" : ""}`}
    >
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
        onResetPreview={() => {
          closeMobileMenu();
          previewInteraction.resetPreview();
        }}
        onFitPreview={() => {
          closeMobileMenu();
          previewInteraction.fitPreview();
        }}
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
          previewRef={previewInteraction.previewRef}
          previewTransform={previewInteraction.previewTransform}
          canExport={canExport}
          onTogglePreviewHelp={() => {
            setHelpTopic((current) =>
              current === "preview" ? null : "preview",
            );
          }}
          onPointerDown={previewInteraction.handlePointerDown}
          onPointerMove={previewInteraction.handlePointerMove}
          onPointerUp={previewInteraction.handlePointerUp}
          onZoomIn={() => {
            previewInteraction.zoomPreview(0.1);
          }}
          onZoomOut={() => {
            previewInteraction.zoomPreview(-0.1);
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
          isOpen={exportState.isExportOpen}
          exportFormat={exportState.exportFormat}
          exportScale={exportState.exportScale}
          exportError={exportState.exportError}
          isExporting={exportState.isExporting}
          isShareLinkCopying={exportState.isShareLinkCopying}
          renderState={renderState}
          onClose={exportState.closeExport}
          onSubmit={exportState.handleExport}
          onCopyShareLink={() => {
            void exportState.handleCopyShareLink();
          }}
          onSelectFormat={exportState.setExportFormat}
          onSelectScale={exportState.setExportScale}
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
          isOpen={changelogState.isChangelogOpen}
          entries={changelogState.changelogEntries}
          isLoading={changelogState.isChangelogLoading}
          error={changelogState.changelogError}
          onClose={changelogState.closeChangelog}
        />
      </Suspense>

      {exportState.shareToastMessage ? (
        <div className="app-toast" role="status" aria-live="polite">
          {exportState.shareToastMessage}
        </div>
      ) : null}
    </div>
  );
}

export default App;
