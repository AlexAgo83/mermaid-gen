import type { SvgMetrics } from "./mermaid";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function downloadDiagramAsSvg(svgMarkup: string, filename: string) {
  const blob = new Blob([svgMarkup], {
    type: "image/svg+xml;charset=utf-8",
  });
  downloadBlob(blob, `${filename}.svg`);
}

export async function downloadDiagramAsPng(
  svgMarkup: string,
  metrics: SvgMetrics,
  filename: string,
) {
  const blob = new Blob([svgMarkup], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const image = new Image();
  image.decoding = "async";

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("PNG export failed to load SVG."));
    image.src = url;
  });

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(metrics.width * 2);
  canvas.height = Math.round(metrics.height * 2);
  const context = canvas.getContext("2d");

  if (!context) {
    URL.revokeObjectURL(url);
    throw new Error("PNG export failed to create a canvas context.");
  }

  context.setTransform(2, 0, 0, 2, 0, 0);
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
