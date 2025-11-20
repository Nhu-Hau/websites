"use client";

import React from "react";
import { X } from "lucide-react";
import { VocabularySet, VocabularyTerm } from "@/types/vocabulary.types";
import { useFlashcardMode } from "@/hooks/vocabulary/useFlashcardMode";
import { Flashcard } from "./Flashcard";
import { FlashcardProgress } from "./FlashcardProgress";
import { FlashcardControls } from "./FlashcardControls";
import { CompletionScreen } from "./CompletionScreen";

interface StudyModalProps {
  open: boolean;
  set: VocabularySet | null;
  onClose: () => void;
  onReviewWeak?: () => void;
  onSwitchToQuiz?: () => void;
  onTermRemembered?: (term: VocabularyTerm) => void;
  onTermForgotten?: (term: VocabularyTerm) => void;
}

export function StudyModal({
  open,
  set,
  onClose,
  onReviewWeak,
  onSwitchToQuiz,
  onTermRemembered,
  onTermForgotten,
}: StudyModalProps) {
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

  if (!open || !set) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center px-3 py-6 md:px-8">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div className="relative flex w-full max-w-6xl flex-col overflow-hidden rounded-[40px] border border-zinc-200/80 bg-gradient-to-br from-slate-50 via-white to-sky-50 shadow-2xl shadow-black/30 dark:border-zinc-800/80 dark:from-zinc-950 dark:via-zinc-900 dark:to-sky-950/30">
        <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
              Flashcard session
            </p>
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              {set.title}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {flashcard.reviewMode
                ? "Đang ôn các từ chưa nhớ"
                : `${set.terms.length} thuật ngữ`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onSwitchToQuiz && (
              <button
                onClick={onSwitchToQuiz}
                className="rounded-2xl border border-zinc-200/70 px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:border-sky-200 hover:text-sky-600 dark:border-zinc-700 dark:text-zinc-200"
              >
                Chuyển sang Quiz
              </button>
            )}
            <button
              onClick={onClose}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200/70 text-zinc-500 transition hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300"
              aria-label="Đóng"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800/60">
          {flashcard.completed ? (
            <div className="px-6 py-10">
              <CompletionScreen
                remembered={flashcard.remembered.length}
                notYet={flashcard.notYet.length}
                total={flashcard.totalTerms}
                onRestart={flashcard.resetProgress}
                onReviewWeak={() => {
                  flashcard.startReviewMode();
                  onReviewWeak?.();
                }}
                onLearnMode={onSwitchToQuiz || flashcard.resetProgress}
                mode="flashcard"
              />
            </div>
          ) : (
            <div className="px-6 py-8">
              <FlashcardProgress
                current={flashcard.currentIndex + 1}
                total={flashcard.totalTerms}
                progress={flashcard.progress}
                remembered={flashcard.remembered.length}
                notYet={flashcard.notYet.length}
              />

              {flashcard.currentTerm && (
                <>
                  <Flashcard
                    term={flashcard.currentTerm}
                    isFlipped={flashcard.isFlipped}
                    onFlip={flashcard.handleFlip}
                  />
                  <FlashcardControls
                    onPrevious={flashcard.handlePrevious}
                    onNext={flashcard.handleNext}
                    onRemember={handleRemember}
                    onNotYet={handleNotYet}
                    canGoPrevious={flashcard.currentIndex > 0}
                    canGoNext={flashcard.currentIndex < flashcard.totalTerms - 1}
                    isFlipped={flashcard.isFlipped}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

