import type {
  PointerEvent as ReactPointerEvent,
  RefObject,
} from "react";
import type { RenderState } from "@/lib/app-types";
import { MinusIcon, PlusIcon } from "@/components/icons";

type PreviewPanelProps = {
  isPreviewFocused: boolean;
  isPreviewHelpOpen: boolean;
  previewHelp: string;
  renderState: RenderState;
  isRendering: boolean;
  previewRef: RefObject<HTMLDivElement | null>;
  previewTransform: string;
  canExport: boolean;
  onTogglePreviewHelp: () => void;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
};

export function PreviewPanel({
  isPreviewFocused,
  isPreviewHelpOpen,
  previewHelp,
  renderState,
  isRendering,
  previewRef,
  previewTransform,
  canExport,
  onTogglePreviewHelp,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onZoomIn,
  onZoomOut,
}: PreviewPanelProps) {
  return (
    <section className="panel panel-preview">
      {!isPreviewFocused ? (
        <div className="panel-header preview-header">
          <div className="panel-heading-group">
            <div className="title-row">
              <h2>Preview</h2>
              <button
                type="button"
                className="help-trigger"
                aria-label="Show preview help"
                aria-expanded={isPreviewHelpOpen}
                onClick={onTogglePreviewHelp}
              >
                i
              </button>
            </div>
            {isPreviewHelpOpen ? (
              <div className="help-popover" role="note">
                {previewHelp}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div
        ref={previewRef}
        className={`preview-stage${
          renderState.status === "ready" ? " is-draggable" : ""
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {isRendering ? (
          <div className="preview-message">Rendering Mermaid preview…</div>
        ) : null}

        {renderState.status === "error" && !isRendering ? (
          <div className="preview-message preview-error">
            <h3>{renderState.error.title}</h3>
            <p>{renderState.error.message}</p>
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
            // Mermaid output is sanitized before it reaches the preview boundary.
            dangerouslySetInnerHTML={{ __html: renderState.svg }}
          />
        ) : null}

        <div className="preview-stage-controls" aria-label="Preview zoom controls">
          <button
            type="button"
            className="preview-stage-control"
            aria-label="Zoom out"
            onClick={onZoomOut}
            disabled={!canExport}
          >
            <MinusIcon />
          </button>
          <button
            type="button"
            className="preview-stage-control"
            aria-label="Zoom in"
            onClick={onZoomIn}
            disabled={!canExport}
          >
            <PlusIcon />
          </button>
        </div>
      </div>
    </section>
  );
}
