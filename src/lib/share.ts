const SHARED_MERMAID_QUERY_KEY = "m";
const SHARED_MERMAID_DECODER = new TextDecoder("utf-8", { fatal: true });

function toBase64Url(bytes: Uint8Array) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding =
    normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const binary = atob(`${normalized}${padding}`);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

export function encodeSharedMermaidSource(source: string) {
  return toBase64Url(new TextEncoder().encode(source));
}

export function decodeSharedMermaidSource(value: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    return null;
  }

  try {
    const bytes = fromBase64Url(value);

    if (toBase64Url(bytes) !== value) {
      return null;
    }

    return SHARED_MERMAID_DECODER.decode(bytes);
  } catch {
    return null;
  }
}

export function loadSharedMermaidSourceFromSearch(search: string) {
  const params = new URLSearchParams(search);
  const encodedSource = params.get(SHARED_MERMAID_QUERY_KEY);

  if (!encodedSource) {
    return null;
  }

  return decodeSharedMermaidSource(encodedSource);
}

export function loadSharedMermaidSourceFromLocation() {
  if (typeof window === "undefined") {
    return null;
  }

  return loadSharedMermaidSourceFromSearch(window.location.search);
}

export function buildSharedMermaidUrl(
  source: string,
  location: { href: string },
) {
  const url = new URL(location.href);
  url.searchParams.set(
    SHARED_MERMAID_QUERY_KEY,
    encodeSharedMermaidSource(source),
  );

  return url.toString();
}
