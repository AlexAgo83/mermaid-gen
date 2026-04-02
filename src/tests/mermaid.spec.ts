import { describe, expect, it, vi } from "vitest";
import {
  GENERATED_MERMAID_VALIDATION_ERROR,
  normalizeGeneratedMermaid,
  prepareGeneratedMermaidSource,
} from "../lib/mermaid";

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
});
