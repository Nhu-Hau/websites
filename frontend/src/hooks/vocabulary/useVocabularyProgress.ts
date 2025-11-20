"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "tp:vocabulary-progress";

type StoredProgress = Record<
  string,
  {
    mastered: string[];
    difficult: string[];
    updatedAt: string;
    sessions: number;
  }
>;

export function useVocabularyProgress() {
  const [progressMap, setProgressMap] = useState<StoredProgress>({});
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage once on client
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredProgress;
        setProgressMap(parsed);
      }
    } catch (error) {
      console.warn("[useVocabularyProgress] unable to parse progress", error);
    } finally {
      setHydrated(true);
    }
  }, []);

  // Persist changes
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progressMap));
    } catch (error) {
      console.warn("[useVocabularyProgress] unable to store progress", error);
    }
  }, [progressMap, hydrated]);

  const upsertProgress = useCallback(
    (
      setId: string,
      updater: (current: StoredProgress[string]) => StoredProgress[string]
    ) => {
      setProgressMap((prev) => {
        const current = prev[setId] || {
          mastered: [],
          difficult: [],
          updatedAt: new Date().toISOString(),
          sessions: 0,
        };
        return {
          ...prev,
          [setId]: updater(current),
        };
      });
    },
    []
  );

  const markRemembered = useCallback(
    (setId: string, termId: string) => {
      if (!termId) return;
      upsertProgress(setId, (current) => {
        const mastered = Array.from(new Set([...current.mastered, termId]));
        const difficult = current.difficult.filter((id) => id !== termId);
        return {
          ...current,
          mastered,
          difficult,
          updatedAt: new Date().toISOString(),
          sessions: current.sessions + 1,
        };
      });
    },
    [upsertProgress]
  );

  const markDifficult = useCallback(
    (setId: string, termId: string) => {
      if (!termId) return;
      upsertProgress(setId, (current) => {
        const difficult = Array.from(new Set([...current.difficult, termId]));
        const mastered = current.mastered.filter((id) => id !== termId);
        return {
          ...current,
          mastered,
          difficult,
          updatedAt: new Date().toISOString(),
          sessions: current.sessions + 1,
        };
      });
    },
    [upsertProgress]
  );

  const resetSetProgress = useCallback((setId: string) => {
    setProgressMap((prev) => {
      const next = { ...prev };
      delete next[setId];
      return next;
    });
  }, []);

  const getProgressForSet = useCallback(
    (setId: string, totalTerms: number) => {
      const data = progressMap[setId];
      const masteredCount = data?.mastered.length ?? 0;
      const difficultCount = data?.difficult.length ?? 0;
      const percent =
        totalTerms > 0
          ? Math.min(100, Math.round((masteredCount / totalTerms) * 100))
          : 0;

      return {
        masteredCount,
        difficultCount,
        percent,
        lastStudied: data?.updatedAt ?? null,
        sessions: data?.sessions ?? 0,
      };
    },
    [progressMap]
  );

  return {
    hydrated,
    progressMap,
    getProgressForSet,
    markRemembered,
    markDifficult,
    resetSetProgress,
  };
}

