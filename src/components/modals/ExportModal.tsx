import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import "./modal-shared.css";
import "./ExportModal.css";
import type { ExportFormat, RenderState } from "@/lib/app-types";
import { getNextWrappedRadioValue } from "@/lib/radio-group";

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
  const exportFormats: ExportFormat[] = ["svg", "png"];
  const exportScales = [1, 2, 3] as const;

  const handleFormatKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    format: ExportFormat,
  ) => {
    const nextFormat = getNextWrappedRadioValue(
      exportFormats,
      format,
      event.key,
    );

    if (!nextFormat) {
      return;
    }

    event.preventDefault();
    onSelectFormat(nextFormat);
    event.currentTarget
      .closest('[role="radiogroup"]')
      ?.querySelector<HTMLButtonElement>(
        `[data-radio-value="${String(nextFormat)}"]`,
      )
      ?.focus();
  };

  const handleScaleKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    scale: number,
  ) => {
    const nextScale = getNextWrappedRadioValue(exportScales, scale, event.key);

    if (!nextScale) {
      return;
    }

    event.preventDefault();
    onSelectScale(nextScale);
    event.currentTarget
      .closest('[role="radiogroup"]')
      ?.querySelector<HTMLButtonElement>(
        `[data-radio-value="${String(nextScale)}"]`,
      )
      ?.focus();
  };

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
            <div
              className="export-options"
              role="radiogroup"
              aria-label="Export format"
            >
              <button
                type="button"
                data-radio-value="svg"
                className={`provider-card${exportFormat === "svg" ? " is-active" : ""}`}
                role="radio"
                aria-checked={exportFormat === "svg"}
                tabIndex={exportFormat === "svg" ? 0 : -1}
                onClick={() => {
                  onSelectFormat("svg");
                }}
                onKeyDown={(event) => {
                  handleFormatKeyDown(event, "svg");
                }}
              >
                <span className="provider-card-label">SVG</span>
                <span className="provider-card-copy">
                  Vector export for docs and further editing.
                </span>
              </button>
              <button
                type="button"
                data-radio-value="png"
                className={`provider-card${exportFormat === "png" ? " is-active" : ""}`}
                role="radio"
                aria-checked={exportFormat === "png"}
                tabIndex={exportFormat === "png" ? 0 : -1}
                onClick={() => {
                  onSelectFormat("png");
                }}
                onKeyDown={(event) => {
                  handleFormatKeyDown(event, "png");
                }}
              >
                <span className="provider-card-label">PNG</span>
                <span className="provider-card-copy">
                  Raster export with selectable output scale.
                </span>
              </button>
            </div>

            {exportFormat === "png" ? (
              <div
                className="scale-picker"
                role="radiogroup"
                aria-label="PNG scale"
              >
                {exportScales.map((scale) => (
                  <button
                    key={scale}
                    type="button"
                    data-radio-value={scale}
                    className={`scale-chip${exportScale === scale ? " is-active" : ""}`}
                    role="radio"
                    aria-checked={exportScale === scale}
                    tabIndex={exportScale === scale ? 0 : -1}
                    onClick={() => {
                      onSelectScale(scale);
                    }}
                    onKeyDown={(event) => {
                      handleScaleKeyDown(event, scale);
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
                <button
                  className="button-primary"
                  type="submit"
                  disabled={isExporting}
                >
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
