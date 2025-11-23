"use client";

import React from "react";
import { VocabularyTerm } from "@/types/vocabulary.types";
import { Flashcard } from "./Flashcard";
import { FlashcardProgress } from "./FlashcardProgress";
import { FlashcardControls, FlashcardActionButtons } from "./FlashcardControls";
import { CompletionScreen } from "./CompletionScreen";

interface StudyPageContentProps {
  completed: boolean;
  currentTerm: VocabularyTerm | undefined;
  currentIndex: number;
  totalTerms: number;
  progress: number;
  remembered: number;
  notYet: number;
  isFlipped: boolean;
  onFlip: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onRemember: () => void;
  onNotYet: () => void;
  onRestart: () => void;
  onReviewWeak: () => void;
  onLearnMode?: () => void;
}

export function StudyPageContent({
  completed,
  currentTerm,
  currentIndex,
  totalTerms,
  progress,
  remembered,
  notYet,
  isFlipped,
  onFlip,
  onPrevious,
  onNext,
  onRemember,
  onNotYet,
  onRestart,
  onReviewWeak,
  onLearnMode,
}: StudyPageContentProps) {
  // Mặc định ưu tiên chuyển sang quiz nếu có, nếu không thì review weak, cuối cùng mới restart
  const handleLearnMode = onLearnMode || onReviewWeak || onRestart;

  if (completed) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-stretch">
        <CompletionScreen
          remembered={remembered}
          notYet={notYet}
          total={totalTerms}
          onRestart={onRestart}
          onReviewWeak={onReviewWeak}
          onLearnMode={handleLearnMode}
          mode="flashcard"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 xs:gap-5 sm:gap-6 lg:flex-row lg:items-start">
      {/* CỘT TRÁI: Flashcard + Controls + Nút "Chưa nhớ" / "Đã nhớ" */}
      <div className="flex-1">
        {currentTerm && (
          <div className="relative flex items-center justify-center w-full">
            {/* Container cho flashcard với controls */}
            <div className="relative w-full max-w-2xl md:max-w-3xl lg:max-w-4xl">
              <FlashcardControls
                onPrevious={onPrevious}
                onNext={onNext}
                onRemember={onRemember}
                onNotYet={onNotYet}
                canGoPrevious={currentIndex > 0}
                canGoNext={currentIndex < totalTerms - 1}
                isFlipped={isFlipped}
              />

              <FlashcardActionButtons
                onRemember={onRemember}
                onNotYet={onNotYet}
                isFlipped={isFlipped}
              />

              <Flashcard
                term={currentTerm}
                isFlipped={isFlipped}
                onFlip={onFlip}
              />
            </div>
          </div>
        )}
      </div>

      {/* CỘT PHẢI: Progress nhỏ gọn */}
      <div className="mt-1 md:mt-0 lg:w-72 md:shrink-0 relative w-full max-w-2xl md:max-w-3xl lg:max-w-none mx-auto">
        <FlashcardProgress
          current={currentIndex + 1}
          total={totalTerms}
          progress={progress}
          remembered={remembered}
          notYet={notYet}
        />
      </div>
    </div>
  );
}
