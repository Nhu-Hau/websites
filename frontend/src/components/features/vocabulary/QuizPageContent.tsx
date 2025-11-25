"use client";

import React from "react";
import { VocabularySet } from "@/types/vocabulary.types";
import { useLearnMode } from "@/hooks/vocabulary/useLearnMode";
import { LearnModeQuestionComponent } from "./LearnModeQuestion";
import { CompletionScreen } from "./CompletionScreen";
import { useTranslations } from "next-intl";

interface QuizPageContentProps {
  set: VocabularySet;
}

export function QuizPageContent({ set }: QuizPageContentProps) {
  const t = useTranslations("vocabularyComponents.quiz");
  const learn = useLearnMode({
    terms: set.terms ?? [],
  });

  const completionScore =
    learn.totalQuestions > 0
      ? Math.round((learn.correctAnswers / learn.totalQuestions) * 100)
      : 0;

  return (
    <div className="mx-auto max-w-3xl">
      {learn.completed ? (
        <CompletionScreen
          remembered={learn.correctAnswers}
          notYet={learn.incorrectAnswers}
          total={learn.totalQuestions}
          mode="learn"
          score={completionScore}
          onRestart={() => {
            learn.resetProgress();
          }}
          onReviewWeak={() => {
            learn.resetProgress();
          }}
          onLearnMode={() => {
            learn.resetProgress();
          }}
        />
      ) : (
        <div className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl xs:p-5 dark:border-zinc-800/60 dark:bg-zinc-900/90">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-zinc-400 xs:text-sm">
              <span>
                {t("question")} {learn.currentQuestionIndex + 1} / {learn.totalQuestions}
              </span>
              <span>
                {t("complete.score")}: {learn.correctAnswers} /{" "}
                {learn.currentQuestionIndex + (learn.showResult ? 1 : 0)}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-zinc-800/80 xs:mt-3 xs:h-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#4063bb] via-sky-500 to-emerald-500 transition-all"
                style={{ width: `${learn.progress}%` }}
              />
            </div>
          </div>

          {/* Question */}
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
  );
}

