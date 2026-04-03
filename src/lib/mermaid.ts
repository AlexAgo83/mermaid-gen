export type SvgMetrics = {
  width: number;
  height: number;
};

type MermaidValidator = (source: string) => Promise<unknown>;

export type GeneratedMermaidValidationResult =
  | {
      ok: true;
      source: string;
    }
  | {
      ok: false;
      source: string;
      error: string;
    };

export const GENERATED_MERMAID_VALIDATION_ERROR =
  "The generated Mermaid could not be validated. Your current diagram was kept unchanged. Refine the prompt and try again.";

const UNSAFE_SVG_TAGS = [
  "script",
  "iframe",
  "object",
  "embed",
  "audio",
  "video",
  "canvas",
  "form",
  "input",
  "textarea",
  "select",
] as const;

const URL_ATTRS = ["href", "xlink:href"] as const;
const EVENT_HANDLER_ATTR_PATTERN = /^on/i;
const JAVASCRIPT_PROTOCOL_PATTERN = /^\s*javascript:/i;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sanitizeMermaidIdentifier(value: string) {
  const asciiValue = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");

  if (!asciiValue) {
    return "group";
  }

  if (/^[0-9]/.test(asciiValue)) {
    return `group_${asciiValue}`;
  }

  return asciiValue;
}

function ensureUniqueIdentifier(
  candidate: string,
  usedIdentifiers: Set<string>,
  fallbackIndex: number,
) {
  let nextCandidate = candidate || `group_${fallbackIndex}`;
  let suffix = 2;

  while (usedIdentifiers.has(nextCandidate)) {
    nextCandidate = `${candidate}_${suffix}`;
    suffix += 1;
  }

  usedIdentifiers.add(nextCandidate);
  return nextCandidate;
}

export function normalizeGeneratedMermaid(source: string) {
  const lines = source.split("\n");
  const replacements = new Map<string, string>();
  const usedIdentifiers = new Set<string>();
  let fallbackIndex = 1;

  const normalizedLines = lines.map((line) => {
    const subgraphMatch = line.match(/^(\s*)subgraph\s+(.+?)\s*$/);

    if (!subgraphMatch) {
      return line;
    }

    const indent = subgraphMatch[1];
    const definition = subgraphMatch[2].trim();

    if (!definition) {
      return line;
    }

    const explicitIdMatch = definition.match(/^([^\s[]+)\s*(\[.*\])$/);

    if (explicitIdMatch) {
      const originalId = explicitIdMatch[1];
      const labelExpression = explicitIdMatch[2];
      const safeId = ensureUniqueIdentifier(
        sanitizeMermaidIdentifier(originalId),
        usedIdentifiers,
        fallbackIndex,
      );

      if (safeId !== originalId) {
        replacements.set(originalId, safeId);
      }

      fallbackIndex += 1;
      return `${indent}subgraph ${safeId}${labelExpression}`;
    }

    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(definition)) {
      usedIdentifiers.add(definition);
      return line;
    }

    const safeId = ensureUniqueIdentifier(
      sanitizeMermaidIdentifier(definition),
      usedIdentifiers,
      fallbackIndex,
    );

    replacements.set(definition, safeId);
    fallbackIndex += 1;

    return `${indent}subgraph ${safeId}["${definition.replace(/"/g, '\\"')}"]`;
  });

  let normalizedSource = normalizedLines.join("\n");

  for (const [originalValue, safeValue] of replacements) {
    const escapedOriginalValue = escapeRegExp(originalValue);
    normalizedSource = normalizedSource.replace(
      new RegExp(
        `^(\\s*(?:style|class|click)\\s+)${escapedOriginalValue}(?=(?:\\s|$))`,
        "gm",
      ),
      `$1${safeValue}`,
    );
  }

  return normalizedSource;
}

export async function prepareGeneratedMermaidSource(
  source: string,
  validator: MermaidValidator = renderMermaidDiagram,
): Promise<GeneratedMermaidValidationResult> {
  const normalizedSource = normalizeGeneratedMermaid(source);

  try {
    await validator(normalizedSource);
    return {
      ok: true,
      source: normalizedSource,
    };
  } catch {
    return {
      ok: false,
      source: normalizedSource,
      error: GENERATED_MERMAID_VALIDATION_ERROR,
    };
  }
}

let mermaidReady = false;
let mermaidModulePromise: Promise<
  (typeof import("mermaid"))["default"]
> | null = null;

export const DEFAULT_MERMAID_SOURCE = `flowchart LR
    Idea[Prompt or code input] --> Draft[Editable Mermaid source]
    Draft --> Preview[Live diagram preview]
    Preview --> Export[SVG and PNG export]
    Export --> Share[Docs reviews and handoff]`;

export function sanitizeRenderedSvg(svgMarkup: string) {
  const parser = new DOMParser();
  const document = parser.parseFromString(svgMarkup, "image/svg+xml");
  const parserError = document.querySelector("parsererror");

  if (parserError) {
    throw new Error("Rendered Mermaid output could not be parsed as SVG.");
  }

  const svg = document.querySelector("svg");

  if (!svg) {
    throw new Error("Rendered Mermaid output did not contain an SVG root.");
  }

  for (const selector of UNSAFE_SVG_TAGS) {
    for (const element of Array.from(document.querySelectorAll(selector))) {
      element.remove();
    }
  }

  for (const element of Array.from(document.querySelectorAll("*"))) {
    for (const attribute of Array.from(element.attributes)) {
      const attributeName = attribute.name;
      const attributeValue = attribute.value;

      if (EVENT_HANDLER_ATTR_PATTERN.test(attributeName)) {
        element.removeAttribute(attributeName);
        continue;
      }

      if (
        URL_ATTRS.includes(attributeName as (typeof URL_ATTRS)[number]) &&
        JAVASCRIPT_PROTOCOL_PATTERN.test(attributeValue)
      ) {
        element.removeAttribute(attributeName);
      }
    }
  }

  svg.setAttribute("focusable", "false");
  return svg.outerHTML;
}

async function getMermaid() {
  if (!mermaidModulePromise) {
    mermaidModulePromise = import("mermaid").then(({ default: mermaid }) => {
      if (!mermaidReady) {
        // Keep Mermaid in strict mode and sanitize its SVG output again before
        // it crosses the preview injection boundary.
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
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

  await mermaid.parse(source);

  const id = `mermaid-${crypto.randomUUID()}`;
  const { svg } = await mermaid.render(id, source);
  return sanitizeRenderedSvg(svg);
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
