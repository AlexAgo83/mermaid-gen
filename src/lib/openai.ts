const DEFAULT_MODEL = "gpt-4o-mini";

type GenerateRequest = {
  apiKey: string;
  prompt: string;
};

function stripCodeFence(content: string) {
  return content
    .replace(/^```(?:mermaid)?/i, "")
    .replace(/```$/i, "")
    .trim();
}

export async function generateMermaidFromPrompt({
  apiKey,
  prompt,
}: GenerateRequest) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "Return only Mermaid code with no markdown fence. Favor flowchart LR unless another Mermaid diagram type is clearly more appropriate. Keep labels concise and readable.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `OpenAI request failed (${response.status}). ${errorBody.slice(0, 160)}`,
    );
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("OpenAI returned an empty response.");
  }

  return stripCodeFence(content);
}
