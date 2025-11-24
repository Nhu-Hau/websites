"use client";

import React from "react";
import { VocabularySet, VocabularyTerm } from "@/types/vocabulary.types";
import { useFlashcardMode } from "./useFlashcardMode";

interface UseStudyModalProps {
  open: boolean;
  set: VocabularySet | null;
  onTermRemembered?: (term: VocabularyTerm) => void;
  onTermForgotten?: (term: VocabularyTerm) => void;
  onReviewWeak?: () => void;
}

export function useStudyModal({
  open,
  set,
  onTermRemembered,
  onTermForgotten,
  onReviewWeak,
}: UseStudyModalProps) {
  const flashcard = useFlashcardMode({
    terms: set?.terms ?? [],
  });
  const setId = set?._id;

  React.useEffect(() => {
    if (open) {
      flashcard.resetProgress();
    }
  }, [open, setId, flashcard.resetProgress]);

  const handleRemember = React.useCallback(() => {
    if (flashcard.currentTerm) {
      onTermRemembered?.(flashcard.currentTerm);
    }
    flashcard.handleRemember();
  }, [flashcard, onTermRemembered]);

  const handleNotYet = React.useCallback(() => {
    if (flashcard.currentTerm) {
      onTermForgotten?.(flashcard.currentTerm);
    }
    flashcard.handleNotYet();
  }, [flashcard, onTermForgotten]);

  const handleReviewWeak = React.useCallback(() => {
    flashcard.startReviewMode();
    onReviewWeak?.();
  }, [flashcard, onReviewWeak]);

  return {
    flashcard,
    handleRemember,
    handleNotYet,
    handleReviewWeak,
  };
}








