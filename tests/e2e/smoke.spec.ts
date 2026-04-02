import { expect, test } from "@playwright/test";

test("loads the foundation shell", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Mermaid Generator" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Preview" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Settings", exact: true }),
  ).toBeVisible();
});
