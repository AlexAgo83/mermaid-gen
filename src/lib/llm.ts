export const PROVIDER_IDS = [
  "openai",
  "openrouter",
  "anthropic",
  "grok",
  "mistral",
] as const;

export type ProviderId = (typeof PROVIDER_IDS)[number];

export type ProviderDefinition = {
  id: ProviderId;
  label: string;
  description: string;
  keyLabel: string;
  keyPlaceholder: string;
  model: string;
};

export const PROVIDERS: ProviderDefinition[] = [
  {
    id: "openai",
    label: "OpenAI",
    description: "Direct OpenAI browser-side BYOK flow.",
    keyLabel: "OpenAI API key",
    keyPlaceholder: "sk-...",
    model: "gpt-4o-mini",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    description: "One gateway with an OpenAI-compatible chat API.",
    keyLabel: "OpenRouter API key",
    keyPlaceholder: "sk-or-...",
    model: "openai/gpt-4o-mini",
  },
  {
    id: "anthropic",
    label: "Anthropic",
    description: "Claude-based text generation through the Messages API.",
    keyLabel: "Anthropic API key",
    keyPlaceholder: "sk-ant-...",
    model: "claude-3-7-sonnet-20250219",
  },
  {
    id: "grok",
    label: "Grok",
    description: "Direct xAI chat generation without an OpenRouter indirection.",
    keyLabel: "xAI API key",
    keyPlaceholder: "Paste your xAI API key",
    model: "grok-4",
  },
  {
    id: "mistral",
    label: "Mistral",
    description: "Direct Mistral chat generation through La Plateforme.",
    keyLabel: "Mistral API key",
    keyPlaceholder: "Paste your Mistral API key",
    model: "mistral-medium-latest",
  },
];

type GenerateRequest = {
  providerId: ProviderId;
  apiKey: string;
  prompt: string;
};

const SYSTEM_PROMPT =
  "Return only Mermaid code with no markdown fence. Favor flowchart LR unless another Mermaid diagram type is clearly more appropriate. Keep labels concise and readable. Prefer balanced diagrams with grouped stages, avoid extremely wide chains or unusually tall single-column layouts, and keep the output comfortable to review and export in a standard document.";

function getProvider(providerId: ProviderId) {
  const provider = PROVIDERS.find((candidate) => candidate.id === providerId);

  if (!provider) {
    throw new Error(`Unsupported provider: ${providerId}`);
  }

  return provider;
}

function stripCodeFence(content: string) {
  return content
    .replace(/^```(?:mermaid)?/i, "")
    .replace(/```$/i, "")
    .trim();
}

async function readError(response: Response) {
  const body = await response.text();
  return body.slice(0, 200);
}

function extractAssistantText(
  content:
    | string
    | Array<{
        type?: string;
        text?: string;
      }>
    | null
    | undefined,
) {
  if (typeof content === "string") {
    return content.trim();
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .filter((entry) => entry.type === "text" && entry.text)
    .map((entry) => entry.text)
    .join("\n")
    .trim();
}

async function generateWithOpenAiCompatibleApi({
  apiKey,
  prompt,
  endpoint,
  model,
  extraHeaders,
  providerLabel,
}: {
  apiKey: string;
  prompt: string;
  endpoint: string;
  model: string;
  extraHeaders?: Record<string, string>;
  providerLabel: string;
}) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(
      `${providerLabel} request failed (${response.status}). ${await readError(response)}`,
    );
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?:
          | string
          | Array<{
              type?: string;
              text?: string;
            }>;
      };
    }>;
  };

  const content = extractAssistantText(payload.choices?.[0]?.message?.content);

  if (!content) {
    throw new Error(`${providerLabel} returned an empty response.`);
  }

  return stripCodeFence(content);
}

async function generateWithAnthropic({
  apiKey,
  prompt,
  model,
}: {
  apiKey: string;
  prompt: string;
  model: string;
}) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Anthropic request failed (${response.status}). ${await readError(response)}`,
    );
  }

  const payload = (await response.json()) as {
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  };

  const content = payload.content
    ?.filter((entry) => entry.type === "text" && entry.text)
    .map((entry) => entry.text)
    .join("\n")
    .trim();

  if (!content) {
    throw new Error("Anthropic returned an empty response.");
  }

  return stripCodeFence(content);
}

export async function generateMermaidFromPrompt({
  providerId,
  apiKey,
  prompt,
}: GenerateRequest) {
  const provider = getProvider(providerId);

  switch (providerId) {
    case "openai":
      return generateWithOpenAiCompatibleApi({
        apiKey,
        prompt,
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: provider.model,
        providerLabel: provider.label,
      });
    case "openrouter":
      return generateWithOpenAiCompatibleApi({
        apiKey,
        prompt,
        endpoint: "https://openrouter.ai/api/v1/chat/completions",
        model: provider.model,
        providerLabel: provider.label,
        extraHeaders: {
          "X-Title": "Mermaid Generator",
        },
      });
    case "anthropic":
      return generateWithAnthropic({
        apiKey,
        prompt,
        model: provider.model,
      });
    case "grok":
      return generateWithOpenAiCompatibleApi({
        apiKey,
        prompt,
        endpoint: "https://api.x.ai/v1/chat/completions",
        model: provider.model,
        providerLabel: provider.label,
      });
    case "mistral":
      return generateWithOpenAiCompatibleApi({
        apiKey,
        prompt,
        endpoint: "https://api.mistral.ai/v1/chat/completions",
        model: provider.model,
        providerLabel: provider.label,
      });
    default:
      throw new Error(`Unsupported provider: ${providerId satisfies never}`);
  }
}
