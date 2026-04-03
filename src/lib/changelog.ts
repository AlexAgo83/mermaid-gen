export type ChangelogEntry = {
  version: string;
  slug: string;
  title: string;
  body: string;
  intro: ChangelogContentBlock[];
  sections: ChangelogSection[];
};

export type ChangelogSection = {
  title: string;
  blocks: ChangelogContentBlock[];
};

export type ChangelogContentBlock =
  | {
      type: "paragraph";
      text: string;
    }
  | {
      type: "list";
      items: string[];
    };

const CHANGELOG_MODULES = import.meta.glob("../../changelogs/CHANGELOGS_*.md", {
  query: "?raw",
  import: "default",
});

function parseVersionSegment(path: string) {
  const match = path.match(/CHANGELOGS_(\d+(?:_\d+)*)\.md$/);

  if (!match) {
    return null;
  }

  return match[1];
}

function normalizeVersion(versionSegment: string) {
  return versionSegment.split("_").join(".");
}

function compareVersionsDesc(left: string, right: string) {
  const leftParts = left.split(".").map((value) => Number.parseInt(value, 10));
  const rightParts = right
    .split(".")
    .map((value) => Number.parseInt(value, 10));
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

function normalizeMarkdownLine(line: string) {
  return line.replace(/\r/g, "").trimEnd();
}

function pushParagraph(target: ChangelogContentBlock[], lines: string[]) {
  const text = lines.join(" ").trim();

  if (!text) {
    return;
  }

  target.push({ type: "paragraph", text });
}

function pushList(target: ChangelogContentBlock[], items: string[]) {
  const normalizedItems = items.map((item) => item.trim()).filter(Boolean);

  if (normalizedItems.length === 0) {
    return;
  }

  target.push({ type: "list", items: normalizedItems });
}

function flushPendingBlocks(
  target: ChangelogContentBlock[],
  paragraphLines: string[],
  listItems: string[],
) {
  if (paragraphLines.length > 0) {
    pushParagraph(target, paragraphLines);
    paragraphLines.length = 0;
  }

  if (listItems.length > 0) {
    pushList(target, listItems);
    listItems.length = 0;
  }
}

function parseChangelogBody(markdown: string) {
  const intro: ChangelogContentBlock[] = [];
  const sections: ChangelogSection[] = [];
  const paragraphLines: string[] = [];
  const listItems: string[] = [];
  let activeSection: ChangelogSection | null = null;

  const getActiveTarget = () => activeSection?.blocks ?? intro;
  const flush = () =>
    flushPendingBlocks(getActiveTarget(), paragraphLines, listItems);

  for (const rawLine of markdown.split("\n")) {
    const line = normalizeMarkdownLine(rawLine);

    if (!line.trim()) {
      flush();
      continue;
    }

    if (line.startsWith("# ")) {
      flush();
      continue;
    }

    if (line.startsWith("## ")) {
      flush();
      activeSection = {
        title: line.slice(3).trim(),
        blocks: [],
      };
      sections.push(activeSection);
      continue;
    }

    if (line.startsWith("- ")) {
      if (paragraphLines.length > 0) {
        pushParagraph(getActiveTarget(), paragraphLines);
        paragraphLines.length = 0;
      }

      listItems.push(line.slice(2).trim());
      continue;
    }

    if (/^\s{2,}\S/.test(rawLine) && listItems.length > 0) {
      const continuation = rawLine.trim();
      const lastIndex = listItems.length - 1;

      listItems[lastIndex] = `${listItems[lastIndex]} ${continuation}`.trim();
      continue;
    }

    if (listItems.length > 0) {
      pushList(getActiveTarget(), listItems);
      listItems.length = 0;
    }

    paragraphLines.push(line.trim());
  }

  flush();

  return { intro, sections };
}

export function normalizeChangelogEntry(
  entry: Pick<ChangelogEntry, "version" | "slug" | "title" | "body"> &
    Partial<Pick<ChangelogEntry, "intro" | "sections">>,
): ChangelogEntry {
  if (Array.isArray(entry.intro) && Array.isArray(entry.sections)) {
    return entry as ChangelogEntry;
  }

  const parsedBody = parseChangelogBody(entry.body);

  return {
    ...entry,
    intro: parsedBody.intro,
    sections: parsedBody.sections,
  };
}

export async function loadChangelogEntries() {
  const entries = await Promise.all(
    Object.entries(CHANGELOG_MODULES).map(async ([path, loadModule]) => {
      const versionSegment = parseVersionSegment(path);

      if (!versionSegment) {
        return null;
      }

      const version = normalizeVersion(versionSegment);
      const body = (await loadModule()) as string;

      return normalizeChangelogEntry({
        version,
        slug: `v${version}`,
        title: `Version ${version}`,
        body,
      });
    }),
  );

  return entries
    .filter((entry): entry is ChangelogEntry => entry !== null)
    .sort((left, right) => compareVersionsDesc(left.version, right.version));
}
