import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { ChangelogEntry } from "@/lib/changelog";
import { loadChangelogEntries } from "@/lib/changelog";

export function useChangelog() {
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [isChangelogLoading, setIsChangelogLoading] = useState(false);
  const [changelogEntries, setChangelogEntries] = useState<ChangelogEntry[]>([]);
  const [changelogError, setChangelogError] = useState<string | null>(null);
  const isRequestInFlightRef = useRef(false);

  const requestChangelogEntries = useEffectEvent(() => {
    if (changelogEntries.length > 0 || isRequestInFlightRef.current) {
      return;
    }

    isRequestInFlightRef.current = true;
    setIsChangelogLoading(true);
    setChangelogError(null);

    void loadChangelogEntries()
      .then((entries) => {
        setChangelogEntries(entries);
      })
      .catch(() => {
        setChangelogError("Unable to load changelog history right now.");
      })
      .finally(() => {
        isRequestInFlightRef.current = false;
        setIsChangelogLoading(false);
      });
  });

  useEffect(() => {
    requestChangelogEntries();
  }, []);

  useEffect(() => {
    if (!isChangelogOpen) {
      return;
    }

    requestChangelogEntries();
  }, [isChangelogOpen]);

  return {
    isChangelogOpen,
    isChangelogLoading,
    changelogEntries,
    changelogError,
    openChangelog: () => {
      setIsChangelogOpen(true);
    },
    closeChangelog: () => {
      setIsChangelogOpen(false);
    },
  };
}
