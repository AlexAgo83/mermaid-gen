export type SvgMetrics = {
  width: number;
  height: number;
};

let mermaidReady = false;
let mermaidModulePromise: Promise<typeof import("mermaid")["default"]> | null =
  null;

export const DEFAULT_MERMAID_SOURCE = `flowchart LR
    Idea[Prompt or code input] --> Draft[Editable Mermaid source]
    Draft --> Preview[Live diagram preview]
    Preview --> Export[SVG and PNG export]
    Export --> Share[Docs reviews and handoff]`;

async function getMermaid() {
  if (!mermaidModulePromise) {
    mermaidModulePromise = import("mermaid").then(({ default: mermaid }) => {
      if (!mermaidReady) {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: "base",
          themeVariables: {
            fontFamily: "IBM Plex Sans, Segoe UI, sans-serif",
            primaryColor: "#dff3ee",
            primaryBorderColor: "#7fa89e",
            primaryTextColor: "#173039",
            lineColor: "#4c6d67",
            secondaryColor: "#ffffff",
            secondaryBorderColor: "#9cbab1",
            secondaryTextColor: "#173039",
            tertiaryColor: "#f6fbfa",
            tertiaryBorderColor: "#c9ddd7",
            clusterBkg: "#f6fbfa",
            clusterBorder: "#c9ddd7",
            edgeLabelBackground: "#ffffff",
            mainBkg: "#ffffff",
            nodeBorder: "#7fa89e",
          },
        });
        mermaidReady = true;
      }

      return mermaid;
    });
  }

  return mermaidModulePromise;
}

export async function renderMermaidDiagram(source: string) {
  const mermaid = await getMermaid();

  const id = `mermaid-${crypto.randomUUID()}`;
  const { svg } = await mermaid.render(id, source);
  return svg;
}

export function extractSvgMetrics(svgMarkup: string): SvgMetrics {
  const parser = new DOMParser();
  const document = parser.parseFromString(svgMarkup, "image/svg+xml");
  const svg = document.querySelector("svg");

  if (!svg) {
    return { width: 960, height: 640 };
  }

  const viewBox = svg.getAttribute("viewBox");
  if (viewBox) {
    const numbers = viewBox
      .split(/[ ,]+/)
      .map((value) => Number.parseFloat(value))
      .filter((value) => Number.isFinite(value));

    if (numbers.length === 4) {
      const [, , width, height] = numbers;
      return { width, height };
    }
  }

  const width = Number.parseFloat(svg.getAttribute("width") || "960");
  const height = Number.parseFloat(svg.getAttribute("height") || "640");

  return {
    width: Number.isFinite(width) ? width : 960,
    height: Number.isFinite(height) ? height : 640,
  };
}
