// frontend/src/features/vocabulary/hooks/useFlashcardMode.ts
"use client";

import { useState, useCallback, useEffect } from "react";
import { VocabularyTerm, FlashcardProgress } from "../types/vocabulary.types";

interface UseFlashcardModeProps {
  terms: VocabularyTerm[];
  onComplete?: (progress: FlashcardProgress) => void;
}

export function useFlashcardMode({ terms, onComplete }: UseFlashcardModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [remembered, setRemembered] = useState<string[]>([]);
  const [notYet, setNotYet] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewTerms, setReviewTerms] = useState<VocabularyTerm[]>([]);

  const currentTerm = reviewMode ? reviewTerms[currentIndex] : terms[currentIndex];
  const totalTerms = reviewMode ? reviewTerms.length : terms.length;
  const progress = ((currentIndex + 1) / totalTerms) * 100;

  useEffect(() => {
    // Check if we've gone through all terms
    if (currentIndex >= totalTerms && totalTerms > 0 && !completed) {
      setCompleted(true);
      const progressData: FlashcardProgress = {
        currentIndex,
        remembered,
        notYet,
        completed: true,
      };
      onComplete?.(progressData);
    }
  }, [currentIndex, totalTerms, completed, remembered, notYet, onComplete]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleRemember = useCallback(() => {
    if (!currentTerm?._id) return;

    setRemembered((prev) => [...prev, currentTerm._id!]);
    setIsFlipped(false);
    
    if (currentIndex < totalTerms - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(totalTerms);
    }
  }, [currentTerm, currentIndex, totalTerms]);

  const handleNotYet = useCallback(() => {
    if (!currentTerm?._id) return;

    setNotYet((prev) => [...prev, currentTerm._id!]);
    setIsFlipped(false);
    
    if (currentIndex < totalTerms - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(totalTerms);
    }
  }, [currentTerm, currentIndex, totalTerms]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < totalTerms - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  }, [currentIndex, totalTerms]);

  const startReviewMode = useCallback(() => {
    const termsToReview = terms.filter((term) => notYet.includes(term._id!));
    setReviewTerms(termsToReview);
    setReviewMode(true);
    setCurrentIndex(0);
    setRemembered([]);
    setNotYet([]);
    setCompleted(false);
    setIsFlipped(false);
  }, [terms, notYet]);

  const resetProgress = useCallback(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setRemembered([]);
    setNotYet([]);
    setCompleted(false);
    setReviewMode(false);
    setReviewTerms([]);
  }, []);

  const exitReviewMode = useCallback(() => {
    setReviewMode(false);
    setReviewTerms([]);
    setCurrentIndex(0);
    setRemembered([]);
    setNotYet([]);
    setCompleted(false);
    setIsFlipped(false);
  }, []);

  return {
    currentTerm,
    currentIndex,
    totalTerms,
    progress,
    isFlipped,
    remembered,
    notYet,
    completed,
    reviewMode,
    handleFlip,
    handleRemember,
    handleNotYet,
    handlePrevious,
    handleNext,
    startReviewMode,
    resetProgress,
    exitReviewMode,
  };
}


