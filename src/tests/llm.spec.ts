import { describe, expect, it } from "vitest";
import { PROVIDER_IDS, PROVIDERS } from "../lib/llm";

describe("provider catalog", () => {
  it("includes Grok and Mistral in the normalized provider layer", () => {
    expect(PROVIDER_IDS).toContain("grok");
    expect(PROVIDER_IDS).toContain("mistral");
    expect(PROVIDERS.map((provider) => provider.id)).toEqual(PROVIDER_IDS);
  });

  it("keeps direct provider metadata for Grok and Mistral", () => {
    const grok = PROVIDERS.find((provider) => provider.id === "grok");
    const mistral = PROVIDERS.find((provider) => provider.id === "mistral");

    expect(grok?.label).toBe("Grok");
    expect(grok?.description).toMatch(/xAI/i);
    expect(mistral?.label).toBe("Mistral");
    expect(mistral?.description).toMatch(/direct/i);
  });
});
