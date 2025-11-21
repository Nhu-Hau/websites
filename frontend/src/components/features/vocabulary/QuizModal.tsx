"use client";

import React from "react";
import { X } from "lucide-react";
import { VocabularySet } from "@/types/vocabulary.types";
import { useLearnMode } from "@/hooks/vocabulary/useLearnMode";
import { LearnModeQuestionComponent } from "./LearnModeQuestion";
import { CompletionScreen } from "./CompletionScreen";

interface QuizModalProps {
  open: boolean;
  set: VocabularySet | null;
  onClose: () => void;
  onRestart?: () => void;
  onSwitchToFlashcard?: () => void;
}

export function QuizModal({
  open,
  set,
  onClose,
  onRestart,
  onSwitchToFlashcard,
}: QuizModalProps) {
  const learn = useLearnMode({
    terms: set?.terms ?? [],
  });
  const setId = set?._id;

  React.useEffect(() => {
    if (open) {
      learn.resetProgress();
    }
  }, [open, setId, learn.resetProgress]);

  if (!open || !set) return null;

  const completionScore =
    learn.totalQuestions > 0
      ? Math.round((learn.correctAnswers / learn.totalQuestions) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center px-3 py-6 md:px-8">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-[36px] border border-zinc-200/80 bg-gradient-to-br from-zinc-50 via-white to-amber-50 shadow-2xl shadow-black/30 dark:border-zinc-800/80 dark:from-zinc-950 dark:via-zinc-900 dark:to-amber-950/40">
        <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
              Quick quiz
            </p>
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              {set.title}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {learn.currentQuestionIndex + 1}/{learn.totalQuestions} câu hỏi
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onSwitchToFlashcard && (
              <button
                onClick={onSwitchToFlashcard}
                className="rounded-2xl border border-zinc-200/70 px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:border-sky-200 hover:text-sky-600 dark:border-zinc-700 dark:text-zinc-200"
              >
                Luyện flashcard
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
          {learn.completed ? (
            <div className="px-6 py-10">
              <CompletionScreen
                remembered={learn.correctAnswers}
                notYet={learn.incorrectAnswers}
                total={learn.totalQuestions}
                mode="learn"
                score={completionScore}
                onRestart={() => {
                  learn.resetProgress();
                  onRestart?.();
                }}
                onReviewWeak={() => {
                  learn.resetProgress();
                }}
                onLearnMode={() => {
                  learn.resetProgress();
                }}
              />
            </div>
          ) : (
            <div className="px-6 py-8">
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                  <span>
                    Câu hỏi {learn.currentQuestionIndex + 1} / {learn.totalQuestions}
                  </span>
                  <span>
                    Điểm: {learn.correctAnswers} /{" "}
                    {learn.currentQuestionIndex + (learn.showResult ? 1 : 0)}
                  </span>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-200/80 dark:bg-zinc-800/80">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 transition-all"
                    style={{ width: `${learn.progress}%` }}
                  />
                </div>
              </div>

              {learn.currentQuestion && (
                <LearnModeQuestionComponent
                  question={learn.currentQuestion}
                  selectedAnswer={learn.selectedAnswer}
                  showResult={learn.showResult}
                  isCorrect={learn.isCorrect}
                  onSelectAnswer={learn.handleSelectAnswer}
                  onSubmit={learn.handleSubmitAnswer}
                  onNext={learn.handleNextQuestion}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

