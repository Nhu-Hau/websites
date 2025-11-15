// frontend/src/features/vocabulary/hooks/useVocabulary.ts
"use client";

import { useState, useEffect } from "react";
import { vocabularyService } from "../services/vocabulary.service";
import { VocabularySet } from "../types/vocabulary.types";

export function useVocabulary() {
  const [sets, setSets] = useState<VocabularySet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await vocabularyService.getVocabularySets();
      setSets(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch vocabulary sets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSets();
  }, []);

  const createSet = async (data: any) => {
    try {
      const newSet = await vocabularyService.createVocabularySet(data);
      setSets((prev) => [newSet, ...prev]);
      return newSet;
    } catch (err: any) {
      setError(err.message || "Failed to create vocabulary set");
      throw err;
    }
  };

  const deleteSet = async (setId: string) => {
    try {
      await vocabularyService.deleteVocabularySet(setId);
      setSets((prev) => prev.filter((set) => set._id !== setId));
    } catch (err: any) {
      setError(err.message || "Failed to delete vocabulary set");
      throw err;
    }
  };

  return {
    sets,
    loading,
    error,
    fetchSets,
    createSet,
    deleteSet,
  };
}



