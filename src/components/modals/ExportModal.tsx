import type { FormEvent } from "react";
import type { ExportFormat, RenderState } from "@/lib/app-types";

type ExportModalProps = {
  isOpen: boolean;
  exportFormat: ExportFormat;
  exportScale: number;
  exportError: string | null;
  isExporting: boolean;
  isShareLinkCopying: boolean;
  renderState: RenderState;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCopyShareLink: () => void;
  onSelectFormat: (format: ExportFormat) => void;
  onSelectScale: (scale: number) => void;
};

export function ExportModal({
  isOpen,
  exportFormat,
  exportScale,
  exportError,
  isExporting,
  isShareLinkCopying,
  renderState,
  onClose,
  onSubmit,
  onCopyShareLink,
  onSelectFormat,
  onSelectScale,
}: ExportModalProps) {
  if (!isOpen) {
    return null;
  }

  const exportSize =
    renderState.status === "ready"
      ? {
          width: Math.round(renderState.metrics.width * exportScale),
          height: Math.round(renderState.metrics.height * exportScale),
        }
      : null;

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className="settings-modal export-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
      >
        <div className="modal-scroll-content">
          <div className="panel-header">
            <div>
              <h2 id="export-title">Export diagram</h2>
              <p className="panel-subtitle">
                Choose the output format and raster scale before downloading.
              </p>
            </div>
          </div>

          <form className="settings-form" onSubmit={onSubmit}>
            <div className="export-options" role="radiogroup" aria-label="Export format">
              <button
                type="button"
                className={`provider-card${exportFormat === "svg" ? " is-active" : ""}`}
                role="radio"
                aria-checked={exportFormat === "svg"}
                onClick={() => {
                  onSelectFormat("svg");
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
                  onSelectFormat("png");
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
                      onSelectScale(scale);
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

            <p className="settings-help export-share-copy">
              Copy a share link when you want this Mermaid source to reopen with
              the editor prefilled and the preview already in sync.
            </p>

            {exportError ? <p className="prompt-error">{exportError}</p> : null}

            <div className="settings-actions">
              <div className="settings-actions-left">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={onCopyShareLink}
                  disabled={isShareLinkCopying}
                >
                  {isShareLinkCopying ? "Copying link…" : "Copy share link"}
                </button>
              </div>
              <div className="settings-actions-right">
                <button type="button" onClick={onClose}>
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
    </div>
  );
}
