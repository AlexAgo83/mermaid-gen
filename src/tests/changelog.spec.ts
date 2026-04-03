import { describe, expect, it } from "vitest";
import {
  loadChangelogEntries,
  normalizeChangelogEntry,
} from "../lib/changelog";

describe("changelog loader", () => {
  it("loads the available changelog history from the curated changelog files", async () => {
    const entries = await loadChangelogEntries();

    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0]?.version).toBe("0.2.0");
    expect(entries.map((entry) => entry.version)).toEqual(["0.2.0", "0.1.0"]);
    expect(entries[0]?.body).toContain("Major Highlights");
    expect(entries[0]?.sections.map((section) => section.title)).toContain(
      "Major Highlights",
    );
    expect(entries[0]?.sections[0]?.blocks[0]).toMatchObject({
      type: "list",
    });
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
