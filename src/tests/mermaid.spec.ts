import { describe, expect, it, vi } from "vitest";
import {
  GENERATED_MERMAID_VALIDATION_ERROR,
  normalizeGeneratedMermaid,
  prepareGeneratedMermaidSource,
  renderMermaidDiagram,
  sanitizeRenderedSvg,
} from "../lib/mermaid";

type SvgElementWithMeasurementShims = SVGElement & {
  getBBox?: () => { x: number; y: number; width: number; height: number };
  getComputedTextLength?: () => number;
};

describe("normalizeGeneratedMermaid", () => {
  it("normalizes invalid subgraph identifiers and matching style targets", () => {
    const input = `flowchart LR
    A[Début] --> B[Collecte des données]

    subgraph Cycle de données
        B
    end

    style Cycle de données fill:#f9f,stroke:#333,stroke-width:2px`;

    const output = normalizeGeneratedMermaid(input);

    expect(output).toContain(
      'subgraph Cycle_de_donnees["Cycle de données"]',
    );
    expect(output).toContain(
      "style Cycle_de_donnees fill:#f9f,stroke:#333,stroke-width:2px",
    );
  });
});

describe("prepareGeneratedMermaidSource", () => {
  it("returns normalized Mermaid when validation succeeds", async () => {
    const validator = vi.fn().mockResolvedValue(undefined);
    const input = `flowchart LR
    subgraph Cycle de données
        A[Step]
    end

    style Cycle de données fill:#f9f`;

    const result = await prepareGeneratedMermaidSource(input, validator);

    expect(result).toEqual({
      ok: true,
      source: `flowchart LR
    subgraph Cycle_de_donnees["Cycle de données"]
        A[Step]
    end

    style Cycle_de_donnees fill:#f9f`,
    });
    expect(validator).toHaveBeenCalledWith(result.source);
  });

  it("returns an app-owned error when validation fails", async () => {
    const validator = vi.fn().mockRejectedValue(new Error("Syntax error in text"));

    const result = await prepareGeneratedMermaidSource("flowchart LR\nA -->", validator);

    expect(result).toEqual({
      ok: false,
      source: "flowchart LR\nA -->",
      error: GENERATED_MERMAID_VALIDATION_ERROR,
    });
  });

  it("rejects invalid Mermaid instead of returning Mermaid error svg markup", async () => {
    await expect(renderMermaidDiagram("flowchart LR\nA -->")).rejects.toThrow();
  });

  it("renders visible flowchart labels in the sanitized svg output", async () => {
    const svgPrototype = SVGElement.prototype as SvgElementWithMeasurementShims;
    const originalGetBBox = svgPrototype.getBBox;
    const originalGetComputedTextLength = svgPrototype.getComputedTextLength;

    Object.defineProperty(svgPrototype, "getBBox", {
      configurable: true,
      value: () => ({
        x: 0,
        y: 0,
        width: 120,
        height: 24,
      }),
    });
    Object.defineProperty(svgPrototype, "getComputedTextLength", {
      configurable: true,
      value: () => 120,
    });

    try {
      const svg = await renderMermaidDiagram(
        "flowchart LR\nA[Visible label] --> B[Still visible]",
      );

      expect(svg).toContain("Visible label");
      expect(svg).toContain("Still visible");
      expect(svg).toContain("foreignObject");
    } finally {
      if (originalGetBBox) {
        Object.defineProperty(svgPrototype, "getBBox", {
          configurable: true,
          value: originalGetBBox,
        });
      } else {
        delete svgPrototype.getBBox;
      }

      if (originalGetComputedTextLength) {
        Object.defineProperty(svgPrototype, "getComputedTextLength", {
          configurable: true,
          value: originalGetComputedTextLength,
        });
      } else {
        delete svgPrototype.getComputedTextLength;
      }
    }
  });

  it("sanitizes unsafe SVG content before preview injection", () => {
    const unsafeSvg = `<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)">
      <script>alert(1)</script>
      <a href="javascript:alert(2)">x</a>
      <foreignObject><div>bad</div></foreignObject>
      <g onclick="alert(3)"><text>safe</text></g>
    </svg>`;

    const sanitized = sanitizeRenderedSvg(unsafeSvg);

    expect(sanitized).toContain("<svg");
    expect(sanitized).not.toContain("script");
    expect(sanitized).not.toContain("javascript:");
    expect(sanitized).not.toContain("onclick=");
    expect(sanitized).not.toContain("onload=");
    expect(sanitized).toContain("foreignObject");
  });
});
