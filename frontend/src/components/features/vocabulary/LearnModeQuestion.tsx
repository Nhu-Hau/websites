// frontend/src/components/features/vocabulary/LearnModeQuestion.tsx
"use client";

import { LearnModeQuestion } from "@/types/vocabulary.types";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface LearnModeQuestionProps {
  question: LearnModeQuestion;
  selectedAnswer: string | null;
  showResult: boolean;
  isCorrect: boolean;
  onSelectAnswer: (answer: string) => void;
  onSubmit: () => void;
  onNext: () => void;
}

export function LearnModeQuestionComponent({
  question,
  selectedAnswer,
  showResult,
  isCorrect,
  onSelectAnswer,
  onSubmit,
  onNext,
}: LearnModeQuestionProps) {
  if (question.type === "multiple-choice") {
    return (
      <div className="rounded-[28px] border border-zinc-200/80 bg-white/95 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/80">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-400">
            Trắc nghiệm
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {question.question}
          </h3>
        </header>
        <div className="space-y-3">
          {question.options?.map((option) => {
            const selected = selectedAnswer === option;
            const correct = option === question.correctAnswer;
            const tone = getOptionTone({ showResult, selected, correct, isCorrect });
            return (
              <button
                key={option}
                disabled={showResult}
                onClick={() => onSelectAnswer(option)}
                className={cn(
                  "w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition",
                  tone.base,
                  tone.hover,
                  showResult && tone.result
                )}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {showResult && correct && <Check className="h-4 w-4 text-emerald-500" />}
                  {showResult && selected && !isCorrect && (
                    <X className="h-4 w-4 text-rose-500" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {!showResult ? (
          <button
            onClick={onSubmit}
            disabled={!selectedAnswer}
            className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900"
          >
            Nộp câu trả lời
          </button>
        ) : (
          <ResultPanel
            isCorrect={isCorrect}
            correctAnswer={question.correctAnswer}
            onNext={onNext}
          />
        )}
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-zinc-200/80 bg-white/95 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/80">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-400">
          Điền từ
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {question.question}
        </h3>
      </header>
      <input
        type="text"
        value={selectedAnswer ?? ""}
        onChange={(event) => !showResult && onSelectAnswer(event.target.value)}
        disabled={showResult}
        placeholder="Nhập đáp án..."
        className="w-full rounded-2xl border border-zinc-200/80 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      />
      {!showResult ? (
        <button
          onClick={onSubmit}
          disabled={!selectedAnswer?.trim()}
          className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900"
        >
          Nộp câu trả lời
        </button>
      ) : (
        <ResultPanel
          isCorrect={isCorrect}
          correctAnswer={question.correctAnswer}
          onNext={onNext}
        />
      )}
    </div>
  );
}

function getOptionTone({
  showResult,
  selected,
  correct,
  isCorrect,
}: {
  showResult: boolean;
  selected: boolean;
  correct: boolean;
  isCorrect: boolean;
}) {
  if (!showResult) {
    return {
      base: selected
        ? "border-zinc-900 bg-zinc-900/5 text-zinc-900 dark:border-white dark:text-white"
        : "border-zinc-200 text-zinc-700 dark:border-zinc-700 dark:text-zinc-200",
      hover: "hover:-translate-y-0.5 hover:border-sky-200",
      result: "",
    };
  }
  if (correct) {
    return {
      base: "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300",
      hover: "",
      result: "",
    };
  }
  if (selected && !isCorrect) {
    return {
      base: "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300",
      hover: "",
      result: "",
    };
  }
  return {
    base: "border-zinc-200 text-zinc-400 dark:border-zinc-700 dark:text-zinc-500",
    hover: "",
    result: "",
  };
}

function ResultPanel({
  isCorrect,
  correctAnswer,
  onNext,
}: {
  isCorrect: boolean;
  correctAnswer: string;
  onNext: () => void;
}) {
  return (
    <div className="mt-5 space-y-4">
      <div
        className={cn(
          "rounded-2xl border px-4 py-3 text-sm font-semibold",
          isCorrect
            ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300"
            : "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300"
        )}
      >
        {isCorrect ? "Chính xác! 🎯" : `Đáp án đúng: ${correctAnswer}`}
      </div>
      <button
        onClick={onNext}
        className="inline-flex w-full items-center justify-center rounded-2xl border border-zinc-200/80 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:-translate-y-0.5 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      >
        Câu tiếp theo
      </button>
    </div>
  );
}
