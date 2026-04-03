import type { SvgMetrics } from "@/lib/mermaid";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadDiagramAsSvg(svgMarkup: string, filename: string) {
  const blob = new Blob([svgMarkup], {
    type: "image/svg+xml;charset=utf-8",
  });
  downloadBlob(blob, `${filename}.svg`);
}

export async function downloadDiagramAsPng(
  svgMarkup: string,
  metrics: SvgMetrics,
  filename: string,
  options?: {
    scale?: number;
  },
) {
  const scale = Math.max(1, Math.min(4, options?.scale ?? 2));
  const blob = new Blob([svgMarkup], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const image = new Image();
  image.decoding = "async";

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("PNG export failed to load SVG."));
    };
    image.src = url;
  });

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(metrics.width * scale);
  canvas.height = Math.round(metrics.height * scale);
  const context = canvas.getContext("2d");

  if (!context) {
    URL.revokeObjectURL(url);
    throw new Error("PNG export failed to create a canvas context.");
  }

  context.setTransform(scale, 0, 0, scale, 0, 0);
  context.drawImage(image, 0, 0, metrics.width, metrics.height);

  const pngBlob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), "image/png");
  });

  URL.revokeObjectURL(url);

  if (!pngBlob) {
    throw new Error("PNG export failed to create an image blob.");
  }

  downloadBlob(pngBlob, `${filename}.png`);
}
