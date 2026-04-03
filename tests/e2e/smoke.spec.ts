import { expect, test } from "@playwright/test";
import { encodeSharedMermaidSource } from "../../src/lib/share";

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
  const navigationMenu = page.getByRole("dialog", { name: "Navigation menu" });
  await expect(navigationMenu).toBeVisible();
  await expect(
    navigationMenu.evaluate(
      (element) =>
        element.getBoundingClientRect().top === 0 &&
        element.getBoundingClientRect().bottom === window.innerHeight,
    ),
  ).resolves.toBe(true);
  await expect(page.getByRole("button", { name: "Open settings" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open export dialog" })).toBeVisible();
  await navigationMenu.getByRole("button", { name: "Close navigation menu" }).click();
  await expect(page.getByRole("heading", { name: "Mermaid source" })).toBeVisible();

  const previewHeading = page.getByRole("heading", { name: "Preview" });
  const previewStage = page.locator(".preview-stage");
  await previewHeading.scrollIntoViewIfNeeded();
  await expect(previewHeading).toBeVisible();
  await expect(
    previewStage.getByRole("button", { name: "Zoom out" }),
  ).toBeVisible();
  await expect(
    previewStage.getByRole("button", { name: "Zoom in" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Show preview help" }).click();
  await expect(page.getByRole("note")).toContainText(
    /Hold Shift while scrolling to zoom/i,
  );
});

test("requires Shift for wheel-based preview zoom", async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

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
  expect(
    consoleErrors.filter((message) =>
      message.includes(
        "Unable to preventDefault inside passive event listener invocation.",
      ),
    ),
  ).toHaveLength(0);
});

test("lets preview zoom buttons update the viewport", async ({ page }) => {
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

  await previewStage.getByRole("button", { name: "Zoom in" }).click();
  await expect.poll(getTransform).not.toBe(before);

  const afterZoomIn = await getTransform();

  await previewStage.getByRole("button", { name: "Zoom out" }).click();
  await expect.poll(getTransform).not.toBe(afterZoomIn);
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
  await expect(page.getByText(/Mermaid Generator v0\.1\.0 © 2026/i)).toBeHidden();
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

test("keeps modal content reachable on a short mobile viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 480 });
  await page.goto("/");

  const onboardingDialog = page.getByRole("dialog", { name: "Welcome" });
  const onboardingScroll = page.locator(".onboarding-modal .modal-scroll-content");
  await expect(onboardingDialog).toBeVisible();
  await expect(onboardingScroll).toBeVisible();
  await expect(
    onboardingDialog.evaluate(
      (element) => element.getBoundingClientRect().bottom <= window.innerHeight,
    ),
  ).resolves.toBe(true);
  await page.getByRole("button", { name: "Skip" }).click();

  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await page.getByRole("button", { name: "Open settings" }).click();
  const settingsDialog = page.getByRole("dialog", { name: "Settings" });
  const settingsScroll = settingsDialog.locator(".modal-scroll-content");
  await expect(settingsDialog).toBeVisible();
  await expect(settingsScroll).toBeVisible();
  await expect(
    settingsDialog.evaluate(
      (element) => element.getBoundingClientRect().bottom <= window.innerHeight,
    ),
  ).resolves.toBe(true);
  await expect(
    settingsScroll.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
      return element.scrollTop > 0;
    }),
  ).resolves.toBe(true);
  await settingsDialog.getByRole("button", { name: "Close" }).click();

  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await page.getByRole("button", { name: "Open export dialog" }).click();
  const exportDialog = page.getByRole("dialog", { name: "Export diagram" });
  const exportScroll = exportDialog.locator(".modal-scroll-content");
  await expect(exportDialog).toBeVisible();
  await expect(exportScroll).toBeVisible();
  await expect(
    exportDialog.evaluate(
      (element) => element.getBoundingClientRect().bottom <= window.innerHeight,
    ),
  ).resolves.toBe(true);
});

test("keeps modal overlay coverage responsive across desktop and mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 980 });
  await page.goto("/");
  await page.getByRole("button", { name: "Skip" }).click();
  await page.getByRole("button", { name: "Open settings" }).click();

  await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible();
  await expect(
    page.evaluate(
      () => !!document.elementFromPoint(window.innerWidth / 2, 10)?.closest(".topbar"),
    ),
  ).resolves.toBe(true);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    window.localStorage.clear();
  });
  await page.goto("/");

  const mobileBackdrop = page.locator(".modal-backdrop");
  await expect(page.getByRole("dialog", { name: "Welcome" })).toBeVisible();
  await expect(
    mobileBackdrop.evaluate(
      (element) => element.getBoundingClientRect().top === 0,
    ),
  ).resolves.toBe(true);
  await expect(
    page.evaluate(
      () =>
        !!document
          .elementFromPoint(window.innerWidth / 2, 10)
          ?.closest(".modal-backdrop"),
    ),
  ).resolves.toBe(true);
});

test("closes settings with Escape", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Skip" }).click();
  await page.getByRole("button", { name: "Open settings" }).click();

  await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible();
  await page.locator("#provider-key").press("Escape");
  await expect(page.getByRole("dialog", { name: "Settings" })).toBeHidden();
});

test("hydrates shared Mermaid from the URL on load", async ({ page }) => {
  const source = "flowchart LR\nA[Shared] --> B[Preview]";
  const encoded = encodeSharedMermaidSource(source);

  await page.goto(`/?m=${encoded}`);

  await expect(page.getByRole("dialog", { name: "Welcome" })).toBeHidden();
  await expect(page.locator(".editor-textarea")).toHaveValue(source);
  await expect(page.locator(".preview-diagram")).toBeVisible();
});

test("shows app-owned preview copy for invalid Mermaid source", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Skip" }).click();

  await page.locator(".editor-textarea").fill("flowchart LR\nA -->");

  await expect(
    page.getByRole("heading", { name: "Preview unavailable" }),
  ).toBeVisible();
  await expect(
    page.getByText(/This Mermaid source could not be rendered/i),
  ).toBeVisible();
  await expect(page.getByText(/Syntax error in text/i)).toBeHidden();
});

test("copies a shared Mermaid URL from export and restores it on open", async ({
  page,
}) => {
  const source = "flowchart LR\nIdea[Shared link] --> Preview[Ready on load]";

  await page.addInitScript(() => {
    let clipboardText = "";

    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          clipboardText = value;
        },
        readText: async () => clipboardText,
      },
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Skip" }).click();
  await page.locator(".editor-textarea").fill(source);
  await expect(page.locator(".preview-diagram")).toBeVisible();
  await expect(page.getByRole("button", { name: "Open export dialog" })).toBeEnabled();

  await page.getByRole("button", { name: "Open export dialog" }).click();
  await page.getByRole("button", { name: "Copy share link" }).click();

  await expect(page.getByRole("status")).toContainText(
    "Share link copied to clipboard.",
  );

  const shareUrl = await page.evaluate(async () => navigator.clipboard.readText());

  expect(shareUrl).toContain("?m=");

  await page.goto(shareUrl);

  await expect(page.getByRole("dialog", { name: "Welcome" })).toBeHidden();
  await expect(page.locator(".editor-textarea")).toHaveValue(source);
  await expect(page.locator(".preview-diagram")).toBeVisible();
});

test("lets the user reopen onboarding from settings", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Skip" }).click();

  await page.getByRole("button", { name: "Open settings" }).click();
  await page.getByRole("button", { name: "Reopen onboarding" }).click();

  await expect(page.getByRole("dialog", { name: "Welcome" })).toBeVisible();
});

test("exposes changelog history from the header and the mobile navigation menu", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Skip" }).click();
  await page.getByRole("button", { name: "Open changelog history" }).click();

  const changelogDialog = page.getByRole("dialog", { name: "Changelog history" });
  await expect(changelogDialog).toBeVisible();
  await expect(
    changelogDialog.getByRole("heading", { name: "Version 0.1.0" }),
  ).toBeVisible({ timeout: 15_000 });
  await changelogDialog.getByRole("button", { name: "Close" }).click();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await page.getByRole("button", { name: "Open changelog history" }).click();

  await expect(page.getByRole("dialog", { name: "Changelog history" })).toBeVisible();
});

test("shows the expanded provider catalog in settings", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Skip" }).click();
  await page.getByRole("button", { name: "Open settings" }).click();

  await expect(page.getByRole("radio", { name: /OpenAI/i })).toBeVisible();
  await expect(page.getByRole("radio", { name: /Anthropic/i })).toBeVisible();
  await expect(page.getByRole("radio", { name: /Grok/i })).toBeVisible();
  await expect(page.getByRole("radio", { name: /Mistral/i })).toBeVisible();
});
