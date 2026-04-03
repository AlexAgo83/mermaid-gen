import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

export async function assertNoSeriousA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .options({
      resultTypes: ["violations"],
    })
    .analyze();

  const violations = results.violations.filter((violation) =>
    ["serious", "critical"].includes(violation.impact ?? ""),
  );

  if (violations.length === 0) {
    return;
  }

  const summary = violations
    .map(
      (violation) =>
        `${violation.id}: ${violation.nodes
          .map((node) => node.target.join(" "))
          .join(", ")}`,
    )
    .join("\n");

  throw new Error(`Accessibility violations detected:\n${summary}`);
}
