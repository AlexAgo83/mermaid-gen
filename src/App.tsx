import {
  startTransition,
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
import { generateMermaidFromPrompt } from "./lib/openai";
import { useLocalStorageState } from "./lib/useLocalStorageState";
import {
  DEFAULT_MERMAID_SOURCE,
  extractSvgMetrics,
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

const MIN_SCALE = 0.35;
const MAX_SCALE = 2.4;

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

function maskApiKey(value: string) {
  if (value.length < 10) {
    return "Saved locally";
  }

  return `${value.slice(0, 7)}…${value.slice(-4)}`;
}

function App() {
  const [source, setSource] = useState(DEFAULT_MERMAID_SOURCE);
  const [prompt, setPrompt] = useState("");
  const [isPreviewFocused, setIsPreviewFocused] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState("");
  const [isRendering, setIsRendering] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
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
  const [apiKey, setApiKey] = useLocalStorageState("mermaid-gen.openai-key", "");
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
      setSettingsDraft(apiKey);
    }
  }, [apiKey, isSettingsOpen]);

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

  const canExport = renderState.status === "ready";
  const hasApiKey = apiKey.trim().length > 0;

  const previewTransform = useMemo(
    () =>
      `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
    [viewport],
  );

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
    if (renderState.status !== "ready" || !previewRef.current) {
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
    setApiKey(settingsDraft.trim());
    setIsSettingsOpen(false);
  };

  const handleGenerate = async () => {
    if (!hasApiKey || prompt.trim().length === 0) {
      return;
    }

    setIsGenerating(true);
    setPromptError(null);

    try {
      const nextSource = await generateMermaidFromPrompt({
        apiKey,
        prompt,
      });

      startTransition(() => {
        setIsRendering(true);
        setSource(nextSource);
      });
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
            <p>Focused Mermaid authoring, preview, generation, and export.</p>
          </div>
        </div>
        <div className="topbar-actions">
          <div className="settings-status">
            {hasApiKey ? `OpenAI key: ${maskApiKey(apiKey)}` : "Prompt locked"}
          </div>
          <button
            type="button"
            onClick={() => {
              setSettingsDraft(apiKey);
              setIsSettingsOpen(true);
            }}
          >
            Settings
          </button>
        </div>
      </header>

      <main className="workspace-layout">
        <section className="left-rail">
          <div className="panel panel-editor">
            <div className="panel-header">
              <div>
                <h2>Mermaid source</h2>
                <p className="panel-subtitle">
                  Paste or refine diagram code directly.
                </p>
              </div>
              <span>{source.split("\n").length} lines</span>
            </div>
            <div className="editor-surface">
              <textarea
                className="editor-textarea"
                value={source}
                spellCheck="false"
                onChange={(event) => {
                  startTransition(() => {
                    setIsRendering(true);
                    setSource(event.target.value);
                  });
                }}
              />
            </div>
          </div>

          <div className="panel panel-prompt">
            <div className="panel-header">
              <div>
                <h2>Prompt draft</h2>
                <p className="panel-subtitle">
                  Generate Mermaid from context once your local OpenAI key is
                  saved.
                </p>
              </div>
              <span>{hasApiKey ? "Ready" : "Locked"}</span>
            </div>
            <textarea
              className="prompt-textarea"
              value={prompt}
              onChange={(event) => {
                setPrompt(event.target.value);
              }}
              placeholder="Describe a system, process, or architecture to generate Mermaid from text."
              disabled={!hasApiKey || isGenerating}
            />
            {hasApiKey ? (
              <div className="prompt-actions">
                <button
                  type="button"
                  onClick={() => {
                    void handleGenerate();
                  }}
                  disabled={prompt.trim().length === 0 || isGenerating}
                >
                  {isGenerating ? "Generating…" : "Generate Mermaid"}
                </button>
                {promptError ? (
                  <p className="prompt-error">{promptError}</p>
                ) : null}
              </div>
            ) : (
              <div className="prompt-locked">
                Configure an OpenAI API key in Settings to unlock prompt-based
                generation on this device.
                <div className="prompt-locked-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsDraft(apiKey);
                      setIsSettingsOpen(true);
                    }}
                  >
                    Open Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="panel panel-preview">
          <div className="preview-header">
            <div>
              <h2>Preview</h2>
              <p className="panel-subtitle">
                Preview stays primary. Drag to pan and use the toolbar to zoom.
              </p>
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
                setIsPreviewFocused((current) => !current);
              }}
            >
              {isPreviewFocused ? "Exit focus" : "Focus preview"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (renderState.status === "ready") {
                  void downloadDiagramAsSvg(renderState.svg, "mermaid-diagram");
                }
              }}
              disabled={!canExport}
            >
              Export SVG
            </button>
            <button
              type="button"
              onClick={() => {
                if (renderState.status === "ready") {
                  void downloadDiagramAsPng(
                    renderState.svg,
                    renderState.metrics,
                    "mermaid-diagram",
                  );
                }
              }}
              disabled={!canExport}
            >
              Export PNG
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
                  The MVP stores your OpenAI key locally on this device.
                </p>
              </div>
            </div>

            <form className="settings-form" onSubmit={handleSaveSettings}>
              <label className="settings-field" htmlFor="openai-key">
                OpenAI API key
              </label>
              <input
                id="openai-key"
                className="settings-input"
                type="password"
                value={settingsDraft}
                onChange={(event) => {
                  setSettingsDraft(event.target.value);
                }}
                placeholder="sk-..."
                autoComplete="off"
              />
              <p className="settings-help">
                This key is not sent to project-managed storage. It is kept in
                local browser storage for this MVP.
              </p>
              <div className="settings-actions">
                <button
                  type="button"
                  onClick={() => {
                    setApiKey("");
                    setSettingsDraft("");
                    setIsSettingsOpen(false);
                  }}
                >
                  Clear key
                </button>
                <div className="settings-actions-right">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingsOpen(false);
                    }}
                  >
                    Close
                  </button>
                  <button type="submit">Save settings</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
