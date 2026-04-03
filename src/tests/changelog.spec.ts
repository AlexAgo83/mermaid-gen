import { describe, expect, it } from "vitest";
import {
  loadChangelogEntries,
  normalizeChangelogEntry,
} from "@/lib/changelog";

function compareVersionsDesc(left: string, right: string) {
  const leftParts = left.split(".").map((value) => Number.parseInt(value, 10));
  const rightParts = right.split(".").map((value) => Number.parseInt(value, 10));
  const maxLength = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftValue = leftParts[index] ?? 0;
    const rightValue = rightParts[index] ?? 0;

    if (leftValue !== rightValue) {
      return rightValue - leftValue;
    }
  }

  return 0;
}

describe("changelog loader", () => {
  it("loads the available changelog history from the curated changelog files", async () => {
    const entries = await loadChangelogEntries();
    const versions = entries.map((entry) => entry.version);
    const sortedVersions = [...versions].sort(compareVersionsDesc);

    expect(entries.length).toBeGreaterThan(0);
    expect(versions).toEqual(sortedVersions);

    for (const entry of entries) {
      expect(entry.slug).toBe(`v${entry.version}`);
      expect(entry.title).toBe(`Version ${entry.version}`);
      expect(entry.body.trim().length).toBeGreaterThan(0);
      expect(entry.sections.length).toBeGreaterThan(0);
      expect(entry.sections.some((section) => section.title.length > 0)).toBe(true);
      expect(
        entry.sections.some((section) =>
          section.blocks.some((block) => block.type === "list"),
        ),
      ).toBe(true);
    }
  });

  it("backfills parsed changelog sections for legacy entry shapes", () => {
    const entry = normalizeChangelogEntry({
      version: "0.1.0",
      slug: "v0.1.0",
      title: "Version 0.1.0",
      body: "# Changelog\n\n## Major Highlights\n\n- Initial release",
    });

    expect(entry.intro).toEqual([]);
    expect(entry.sections.map((section) => section.title)).toEqual([
      "Major Highlights",
    ]);
    expect(entry.sections[0]?.blocks[0]).toMatchObject({
      type: "list",
      items: ["Initial release"],
    });
  });
});
