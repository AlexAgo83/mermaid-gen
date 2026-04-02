import { expect, test } from "@playwright/test";

test("loads the foundation shell", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Mermaid Generator" }),
  ).toBeVisible();
  await expect(page.getByText("Preview workspace")).toBeVisible();
});
