import { describe, expect, it } from "vitest";
import { normalizeGeneratedMermaid } from "../lib/mermaid";

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
