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

test("keeps the workspace usable on a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(
    page.getByRole("button", { name: "Settings", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mermaid source" })).toBeVisible();

  const previewHeading = page.getByRole("heading", { name: "Preview" });
  await previewHeading.scrollIntoViewIfNeeded();
  await expect(previewHeading).toBeVisible();
  await expect(page.getByText(/Wheel zoom: hold Shift while scrolling/i)).toBeVisible();
});

test("requires Shift for wheel-based preview zoom", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 980 });
  await page.goto("/");

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
