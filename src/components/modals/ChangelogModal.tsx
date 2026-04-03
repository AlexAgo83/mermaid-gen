import type {
  ChangelogContentBlock,
  ChangelogEntry,
} from "../../lib/changelog";
import { normalizeChangelogEntry } from "../../lib/changelog";

function renderInlineMarkdown(text: string) {
  const fragments = text.split(/(`[^`]+`)/g).filter(Boolean);

  return fragments.map((fragment, index) => {
    if (fragment.startsWith("`") && fragment.endsWith("`")) {
      return <code key={`${fragment}-${index}`}>{fragment.slice(1, -1)}</code>;
    }

    return <span key={`${fragment}-${index}`}>{fragment}</span>;
  });
}

function renderBlocks(blocks: ChangelogContentBlock[]) {
  return blocks.map((block, index) => {
    if (block.type === "list") {
      return (
        <ul key={`list-${index}`} className="changelog-block-list">
          {block.items.map((item, itemIndex) => (
            <li key={`${item}-${itemIndex}`}>{renderInlineMarkdown(item)}</li>
          ))}
        </ul>
      );
    }

    return (
      <p key={`paragraph-${index}`} className="changelog-block-paragraph">
        {renderInlineMarkdown(block.text)}
      </p>
    );
  });
}

type ChangelogModalProps = {
  isOpen: boolean;
  entries: ChangelogEntry[];
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
};

export function ChangelogModal({
  isOpen,
  entries,
  isLoading,
  error,
  onClose,
}: ChangelogModalProps) {
  if (!isOpen) {
    return null;
  }

  const normalizedEntries = entries.map((entry) => normalizeChangelogEntry(entry));

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className="settings-modal changelog-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="changelog-title"
      >
        <div className="modal-scroll-content">
          <div className="panel-header">
            <div>
              <h2 id="changelog-title">Changelog history</h2>
              <p className="panel-subtitle">
                Review shipped releases without leaving the workspace.
              </p>
            </div>
            <button type="button" onClick={onClose}>
              Close
            </button>
          </div>

          {isLoading ? (
            <p className="settings-help">Loading changelog history…</p>
          ) : null}
          {error ? <p className="prompt-error">{error}</p> : null}

          {!isLoading && !error && normalizedEntries.length > 0 ? (
            <div className="changelog-list" aria-live="polite">
              {normalizedEntries.map((entry) => (
                <article
                  key={entry.version}
                  className="changelog-entry"
                  aria-label={entry.slug}
                >
                  <header className="changelog-entry-header">
                    <div>
                      <h3>{entry.title}</h3>
                      <p className="changelog-entry-kicker">{entry.slug}</p>
                    </div>
                  </header>
                      <div className="changelog-entry-body">
                        {entry.intro.length > 0 ? (
                          <div className="changelog-entry-intro">
                            {renderBlocks(entry.intro)}
                          </div>
                        ) : null}
                        <div className="changelog-sections">
                          {entry.sections.map((section) => (
                            <details
                              key={`${entry.version}-${section.title}`}
                              className="changelog-section"
                              open={section.title === "Major Highlights"}
                            >
                              <summary>{section.title}</summary>
                              <div className="changelog-section-body">
                                {renderBlocks(section.blocks)}
                              </div>
                        </details>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
