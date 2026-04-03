export type ChangelogEntry = {
  version: string;
  slug: string;
  title: string;
  body: string;
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

export async function loadChangelogEntries() {
  const entries = await Promise.all(
    Object.entries(CHANGELOG_MODULES).map(async ([path, loadModule]) => {
      const versionSegment = parseVersionSegment(path);

      if (!versionSegment) {
        return null;
      }

      const version = normalizeVersion(versionSegment);
      const body = (await loadModule()) as string;

      return {
        version,
        slug: `v${version}`,
        title: `Version ${version}`,
        body,
      } satisfies ChangelogEntry;
    }),
  );

  return entries
    .filter((entry): entry is ChangelogEntry => entry !== null)
    .sort((left, right) => compareVersionsDesc(left.version, right.version));
}
