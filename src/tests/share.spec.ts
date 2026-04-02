import { describe, expect, it } from "vitest";
import {
  buildSharedMermaidUrl,
  decodeSharedMermaidSource,
  encodeSharedMermaidSource,
  loadSharedMermaidSourceFromSearch,
} from "../lib/share";

describe("shared Mermaid URL helpers", () => {
  it("round-trips Mermaid source through the shared encoding", () => {
    const source = "flowchart LR\nA[Share] --> B[Preview]";
    const encoded = encodeSharedMermaidSource(source);

    expect(decodeSharedMermaidSource(encoded)).toBe(source);
  });

  it("loads Mermaid source from the URL search string", () => {
    const source = "flowchart TD\nStart --> Done";
    const encoded = encodeSharedMermaidSource(source);

    expect(loadSharedMermaidSourceFromSearch(`?m=${encoded}`)).toBe(source);
  });

  it("returns null for invalid shared Mermaid payloads", () => {
    expect(loadSharedMermaidSourceFromSearch("?m=not.valid")).toBeNull();
  });

  it("returns null when the shared payload decodes to invalid utf-8", () => {
    expect(loadSharedMermaidSourceFromSearch("?m=_____")).toBeNull();
  });

  it("builds a share URL that preserves the current path", () => {
    const source = "flowchart TD\nShare --> Link";
    const url = buildSharedMermaidUrl(
      source,
      new URL("https://example.com/workspace?view=preview"),
    );

    expect(url).toContain("https://example.com/workspace?");
    expect(loadSharedMermaidSourceFromSearch(new URL(url).search)).toBe(source);
    expect(new URL(url).searchParams.get("view")).toBe("preview");
  });
});
