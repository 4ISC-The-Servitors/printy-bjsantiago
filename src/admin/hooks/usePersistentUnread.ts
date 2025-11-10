import { useCallback, useEffect, useMemo, useState } from 'react';

type PersistentUnreadOptions = {
  storageKey: string;
  maxEntries?: number;
};

type ViewedRecord = Record<string, string>;

const LEGACY_FLAG = '__legacy__';

/**
 * usePersistentUnread
 *
 * Stores the last seen version (typically an updated_at timestamp) for each id
 * in localStorage so the admin UI can treat status changes as unread until
 * explicitly viewed again.
 */
export function usePersistentUnread({
  storageKey,
  maxEntries = 500,
}: PersistentUnreadOptions) {
  const [viewedMap, setViewedMap] = useState<ViewedRecord>({});
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on first render
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = window.localStorage.getItem(storageKey);
      if (!stored) {
        setIsHydrated(true);
        return;
      }

      const parsed: unknown = JSON.parse(stored);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const candidate = parsed as ViewedRecord;
        setViewedMap(
          Object.keys(candidate).reduce<ViewedRecord>((accum, key) => {
            const value = candidate[key];
            if (typeof value === 'string') {
              accum[key] = value;
            }
            return accum;
          }, {})
        );
      } else if (Array.isArray(parsed)) {
        // Legacy format: treat ids as viewed without version comparison
        const legacyEntries = (parsed as unknown[])
          .filter((entry): entry is string => typeof entry === 'string')
          .slice(-maxEntries);
        setViewedMap(
          legacyEntries.reduce<ViewedRecord>((accum, id) => {
            accum[id] = LEGACY_FLAG;
            return accum;
          }, {})
        );
      }
    } catch (error) {
      console.error(
        `[usePersistentUnread] Failed to parse storage for ${storageKey}:`,
        error
      );
      setViewedMap({});
    } finally {
      setIsHydrated(true);
    }
  }, [maxEntries, storageKey]);

  // Persist whenever the viewed map changes
  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;

    try {
      const orderedEntries = Object.entries(viewedMap)
        .slice(-maxEntries)
        .reduce<ViewedRecord>((accum, [id, version]) => {
          accum[id] = version;
          return accum;
        }, {});
      window.localStorage.setItem(storageKey, JSON.stringify(orderedEntries));
    } catch (error) {
      console.error(
        `[usePersistentUnread] Failed to persist storage for ${storageKey}:`,
        error
      );
    }
  }, [isHydrated, maxEntries, storageKey, viewedMap]);

  const markAsViewed = useCallback(
    (id: string | null | undefined, version: string | null | undefined) => {
      if (!id) return;
      const safeVersion = version ?? LEGACY_FLAG;
      setViewedMap(prev => {
        const current = prev[id];
        if (current === safeVersion) return prev;
        return { ...prev, [id]: safeVersion };
      });
    },
    []
  );

  const markManyAsViewed = useCallback(
    (
      entries: Array<{ id: string | null | undefined; version?: string | null }>
    ) => {
      if (!entries || entries.length === 0) return;

      setViewedMap(prev => {
        let mutated = false;
        const next: ViewedRecord = { ...prev };

        for (const entry of entries) {
          if (!entry?.id) continue;
          const safeVersion = entry.version ?? LEGACY_FLAG;
          if (next[entry.id] !== safeVersion) {
            mutated = true;
            next[entry.id] = safeVersion;
          }
        }

        return mutated ? next : prev;
      });
    },
    []
  );

  const resetViewed = useCallback(() => {
    setViewedMap({});
  }, []);

  const hasViewed = useCallback(
    (id: string | null | undefined, version: string | null | undefined) => {
      if (!id) return false;
      const storedVersion = viewedMap[id];
      if (!storedVersion) return false;
      if (storedVersion === LEGACY_FLAG || !version) return true;
      return storedVersion === version;
    },
    [viewedMap]
  );

  return useMemo(
    () => ({
      isHydrated,
      hasViewed,
      markAsViewed,
      markManyAsViewed,
      resetViewed,
      viewedCount: Object.keys(viewedMap).length,
    }),
    [
      hasViewed,
      isHydrated,
      markAsViewed,
      markManyAsViewed,
      resetViewed,
      viewedMap,
    ]
  );
}

export default usePersistentUnread;
