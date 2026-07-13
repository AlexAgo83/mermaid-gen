import { t } from "@/i18n";

export const ONBOARDING_STATE_STORAGE_KEY = "mermaid-gen.onboarding-state";

export const ONBOARDING_STEPS = [
  {
    title: t("onboarding.welcome.title"),
    body: t("onboarding.welcome.body"),
    detail: t("onboarding.welcome.detail"),
  },
  {
    title: t("onboarding.editor.title"),
    body: t("onboarding.editor.body"),
    detail: t("onboarding.editor.detail"),
  },
  {
    title: t("onboarding.prompt.title"),
    body: t("onboarding.prompt.body"),
    detail: t("onboarding.prompt.detail"),
  },
  {
    title: t("onboarding.preview.title"),
    body: t("onboarding.preview.body"),
    detail: t("onboarding.preview.detail"),
  },
  {
    title: t("onboarding.export.title"),
    body: t("onboarding.export.body"),
    detail: t("onboarding.export.detail"),
  },
] as const;

export function loadOnboardingState() {
  if (typeof window === "undefined") {
    return "pending" as const;
  }

  const storedValue = window.localStorage.getItem(ONBOARDING_STATE_STORAGE_KEY);

  if (
    storedValue === "dismissed" ||
    storedValue === "completed" ||
    storedValue === "pending"
  ) {
    return storedValue;
  }

  return "pending" as const;
}

export function loadIsMobileHeader() {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }

  return window.matchMedia("(max-width: 920px)").matches;
}
