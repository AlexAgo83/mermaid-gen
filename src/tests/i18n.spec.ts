import { describe, expect, it } from "vitest";
import { t } from "@/i18n";

describe("i18n catalog", () => {
  it("renders named placeholders without changing runtime data", () => {
    const provider = "Configured Provider";

    expect(t("prompt.generateWith", { provider })).toBe(
      "Generate with Configured Provider",
    );
    expect(provider).toBe("Configured Provider");
  });

  it("makes missing keys visible during development", () => {
    expect(t("missing.key")).toContain("missing.key");
  });
});
