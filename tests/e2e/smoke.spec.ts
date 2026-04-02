import { expect, test } from "@playwright/test";

test("loads the foundation shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("dialog", { name: "Welcome" })).toBeVisible();
  await page.getByRole("button", { name: "Skip" }).click();

  await expect(
    page.getByRole("heading", { name: "Mermaid Generator" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Preview" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open settings" })).toBeVisible();
});

test("keeps the workspace usable on a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Skip" }).click();

  await expect(
    page.getByRole("button", { name: "Open navigation menu" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await expect(page.getByRole("dialog", { name: "Navigation menu" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open settings" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open export dialog" })).toBeVisible();
  await page
    .getByRole("banner")
    .getByRole("button", { name: "Close navigation menu" })
    .click();
  await expect(page.getByRole("heading", { name: "Mermaid source" })).toBeVisible();

  const previewHeading = page.getByRole("heading", { name: "Preview" });
  await previewHeading.scrollIntoViewIfNeeded();
  await expect(previewHeading).toBeVisible();
  await page.getByRole("button", { name: "Show preview help" }).click();
  await expect(page.getByRole("note")).toContainText(
    /Hold Shift while scrolling to zoom/i,
  );
});

test("requires Shift for wheel-based preview zoom", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 980 });
  await page.goto("/");
  await page.getByRole("button", { name: "Skip" }).click();

  const previewStage = page.locator(".preview-stage");
  const previewDiagram = page.locator(".preview-diagram");
  await expect(previewStage).toBeVisible();
  await expect(previewDiagram).toBeVisible();

  const getTransform = async () =>
    previewDiagram.evaluate((element) => (element as HTMLElement).style.transform);

  const before = await getTransform();
  const bounds = await previewStage.boundingBox();

  if (!bounds) {
    throw new Error("Preview stage bounds were not available.");
  }

  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.wheel(0, -240);
  await expect.poll(getTransform).toBe(before);

  await page.keyboard.down("Shift");
  await page.mouse.wheel(0, -240);
  await page.keyboard.up("Shift");

  await expect.poll(getTransform).not.toBe(before);
});

test("focus mode keeps the header and removes local preview chrome", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 980 });
  await page.goto("/");
  await page.getByRole("button", { name: "Skip" }).click();

  await page.getByRole("button", { name: "Focus preview" }).click();

  await expect(page.getByRole("heading", { name: "Mermaid Generator" })).toBeVisible();
  await expect(page.locator(".preview-stage")).toBeVisible();
  await expect(page.getByText("Mermaid Generator © 2026")).toBeHidden();
  await expect(page.getByRole("heading", { name: "Preview" })).toBeHidden();
  await expect(page.getByRole("heading", { name: "Mermaid source" })).toBeHidden();
  await expect(page.getByRole("heading", { name: "Prompt draft" })).toBeHidden();
});

test("opens the export modal from a single entry point", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Skip" }).click();

  await page.getByRole("button", { name: "Open export dialog" }).click();

  await expect(page.getByRole("dialog", { name: "Export diagram" })).toBeVisible();
  await expect(page.getByText(/Choose the output format/i)).toBeVisible();
});

test("lets the user reopen onboarding from settings", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Skip" }).click();

  await page.getByRole("button", { name: "Open settings" }).click();
  await page.getByRole("button", { name: "Reopen onboarding" }).click();

  await expect(page.getByRole("dialog", { name: "Welcome" })).toBeVisible();
});
