import { PROVIDER_IDS, type ProviderId } from "./llm";
import type { ProviderKeyStore, ProviderSettings } from "./app-types";

export const PROVIDER_SETTINGS_STORAGE_KEY = "mermaid-gen.provider-settings";
export const LEGACY_OPENAI_STORAGE_KEY = "mermaid-gen.openai-key";

export function createEmptyProviderKeys(): ProviderKeyStore {
  return Object.fromEntries(
    PROVIDER_IDS.map((providerId) => [providerId, ""]),
  ) as ProviderKeyStore;
}

export function normalizeProviderSettings(
  value: Partial<ProviderSettings> | null | undefined,
): ProviderSettings {
  const providerKeys = createEmptyProviderKeys();

  for (const providerId of PROVIDER_IDS) {
    const candidate = value?.providerKeys?.[providerId];
    providerKeys[providerId] = typeof candidate === "string" ? candidate : "";
  }

  const activeProviderId = PROVIDER_IDS.includes(
    value?.activeProviderId as ProviderId,
  )
    ? (value?.activeProviderId as ProviderId)
    : "openai";

  return {
    activeProviderId,
    providerKeys,
  };
}

export function loadProviderSettings() {
  if (typeof window === "undefined") {
    return normalizeProviderSettings(null);
  }

  const storedSettings = window.localStorage.getItem(
    PROVIDER_SETTINGS_STORAGE_KEY,
  );

  if (storedSettings) {
    try {
      return normalizeProviderSettings(
        JSON.parse(storedSettings) as Partial<ProviderSettings>,
      );
    } catch {
      window.localStorage.removeItem(PROVIDER_SETTINGS_STORAGE_KEY);
    }
  }

  const legacyOpenAiKey =
    window.localStorage.getItem(LEGACY_OPENAI_STORAGE_KEY) ?? "";

  return normalizeProviderSettings({
    activeProviderId: "openai",
    providerKeys: {
      ...createEmptyProviderKeys(),
      openai: legacyOpenAiKey,
    },
  });
}
