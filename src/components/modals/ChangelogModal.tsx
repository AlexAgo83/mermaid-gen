import type { ChangelogEntry } from "../../lib/changelog";

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

          {!isLoading && !error && entries.length > 0 ? (
            <div className="changelog-list" aria-live="polite">
              {entries.map((entry) => (
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
                  <pre className="changelog-entry-body">{entry.body}</pre>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
