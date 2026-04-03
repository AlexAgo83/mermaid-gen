import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { ExportFormat, RenderState } from "@/lib/app-types";
import { downloadDiagramAsPng, downloadDiagramAsSvg } from "@/lib/exporters";
import { buildSharedMermaidUrl } from "@/lib/share";

export function useExport(renderState: RenderState, source: string) {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");
  const [exportScale, setExportScale] = useState(2);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isShareLinkCopying, setIsShareLinkCopying] = useState(false);
  const [shareToastMessage, setShareToastMessage] = useState<string | null>(null);

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

  const openExport = () => {
    if (renderState.status !== "ready") {
      return;
    }

    setExportError(null);
    setIsExportOpen(true);
  };

  const closeExport = () => {
    setIsExportOpen(false);
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
        downloadDiagramAsSvg(renderState.svg, "mermaid-diagram");
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

  return {
    isExportOpen,
    exportFormat,
    exportScale,
    exportError,
    isExporting,
    isShareLinkCopying,
    shareToastMessage,
    openExport,
    closeExport,
    handleExport,
    handleCopyShareLink,
    setExportFormat,
    setExportScale,
  };
}
