import { afterEach, describe, expect, it, vi } from "vitest";
import {
  generateMermaidFromPrompt,
  PROVIDER_IDS,
  PROVIDERS,
} from "../lib/llm";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("provider catalog", () => {
  it("includes Grok, Mistral, and Gemini in the normalized provider layer", () => {
    expect(PROVIDER_IDS).toContain("grok");
    expect(PROVIDER_IDS).toContain("mistral");
    expect(PROVIDER_IDS).toContain("gemini");
    expect(PROVIDERS.map((provider) => provider.id)).toEqual(PROVIDER_IDS);
  });

  it("keeps direct provider metadata for Grok, Mistral, and Gemini", () => {
    const grok = PROVIDERS.find((provider) => provider.id === "grok");
    const mistral = PROVIDERS.find((provider) => provider.id === "mistral");
    const gemini = PROVIDERS.find((provider) => provider.id === "gemini");

    expect(grok?.label).toBe("Grok");
    expect(grok?.description).toMatch(/xAI/i);
    expect(mistral?.label).toBe("Mistral");
    expect(mistral?.description).toMatch(/direct/i);
    expect(gemini?.label).toBe("Gemini");
    expect(gemini?.description).toMatch(/OpenAI-compatible/i);
    expect(gemini?.model).toBe("gemini-2.5-flash");
  });

  it("uses the Gemini OpenAI-compatible endpoint and normalizes the response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: "```mermaid\nflowchart LR\nA-->B\n```",
            },
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateMermaidFromPrompt({
      providerId: "gemini",
      apiKey: "gemini-key",
      prompt: "Generate a simple flow.",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer gemini-key",
          "Content-Type": "application/json",
        }),
      }),
    );
    expect(result).toBe("flowchart LR\nA-->B");
  });

  it("surfaces Gemini provider failures through the normalized provider error copy", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => '{"error":"forbidden"}',
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      generateMermaidFromPrompt({
        providerId: "gemini",
        apiKey: "gemini-key",
        prompt: "Generate a simple flow.",
      }),
    ).rejects.toThrow(/Gemini request failed \(403\)/i);
  });
});
