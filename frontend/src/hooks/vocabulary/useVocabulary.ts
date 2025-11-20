// frontend/src/features/vocabulary/hooks/useVocabulary.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { vocabularyService } from "@/utils/vocabulary.service";
import {
  VocabularySet,
  CreateVocabularySetDTO,
  UpdateVocabularySetDTO,
  AddTermDTO,
  UpdateTermDTO,
} from "@/types/vocabulary.types";

export function useVocabulary() {
  const [sets, setSets] = useState<VocabularySet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await vocabularyService.getVocabularySets();
      setSets(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch vocabulary sets"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSets();
  }, [fetchSets]);

  const createSet = async (data: CreateVocabularySetDTO) => {
    try {
      const newSet = await vocabularyService.createVocabularySet(data);
      setSets((prev) => [newSet, ...prev]);
      return newSet;
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to create vocabulary set"
      );
      throw err;
    }
  };

  const updateSet = async (setId: string, data: UpdateVocabularySetDTO) => {
    try {
      const updated = await vocabularyService.updateVocabularySet(setId, data);
      setSets((prev) =>
        prev.map((set) => (set._id === setId ? updated : set))
      );
      return updated;
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to update vocabulary set"
      );
      throw err;
    }
  };

  const deleteSet = async (setId: string) => {
    try {
      await vocabularyService.deleteVocabularySet(setId);
      setSets((prev) => prev.filter((set) => set._id !== setId));
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to delete vocabulary set"
      );
      throw err;
    }
  };

  const refreshSet = async (setId: string) => {
    try {
      const latest = await vocabularyService.getVocabularySetById(setId);
      setSets((prev) => {
        const exists = prev.some((set) => set._id === setId);
        return exists ? prev.map((set) => (set._id === setId ? latest : set)) : [latest, ...prev];
      });
      return latest;
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to refresh vocabulary set"
      );
      throw err;
    }
  };

  const addTerm = async (setId: string, term: AddTermDTO) => {
    try {
      const updated = await vocabularyService.addTerm(setId, term);
      setSets((prev) =>
        prev.map((set) => (set._id === setId ? updated : set))
      );
      return updated;
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to add vocabulary term"
      );
      throw err;
    }
  };

  const updateTerm = async (
    setId: string,
    termId: string,
    data: UpdateTermDTO
  ) => {
    try {
      const updated = await vocabularyService.updateTerm(setId, termId, data);
      setSets((prev) =>
        prev.map((set) => (set._id === setId ? updated : set))
      );
      return updated;
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to update vocabulary term"
      );
      throw err;
    }
  };

  const deleteTerm = async (setId: string, termId: string) => {
    try {
      const updated = await vocabularyService.deleteTerm(setId, termId);
      setSets((prev) =>
        prev.map((set) => (set._id === setId ? updated : set))
      );
      return updated;
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to delete vocabulary term"
      );
      throw err;
    }
  };

  return {
    sets,
    loading,
    error,
    fetchSets,
    createSet,
    updateSet,
    deleteSet,
    refreshSet,
    addTerm,
    updateTerm,
    deleteTerm,
  };
}
