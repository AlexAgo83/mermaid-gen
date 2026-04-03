import { describe, expect, it } from "vitest";
import { loadChangelogEntries } from "../lib/changelog";

describe("changelog loader", () => {
  it("loads the available changelog history from the curated changelog files", async () => {
    const entries = await loadChangelogEntries();

    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0]?.version).toBe("0.1.0");
    expect(entries[0]?.body).toContain("Major Highlights");
  });
});
