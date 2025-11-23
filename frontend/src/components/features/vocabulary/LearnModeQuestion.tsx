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
      <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-900/90 xs:rounded-3xl xs:p-5">
        <header className="mb-4 xs:mb-5">
          <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-zinc-400 xs:text-[10px]">
            Trắc nghiệm
          </p>
          <h3 className="mt-1.5 text-lg font-semibold text-zinc-900 xs:mt-2 xs:text-xl dark:text-zinc-50">
            {question.question}
          </h3>
        </header>
        <div className="space-y-2 xs:space-y-2.5">
          {question.options?.map((option) => {
            const selected = selectedAnswer === option;
            const correct = option === question.correctAnswer;
            const tone = getOptionTone({
              showResult,
              selected,
              correct,
              isCorrect,
            });
            return (
              <button
                key={option}
                disabled={showResult}
                onClick={() => onSelectAnswer(option)}
                className={cn(
                  "w-full rounded-2xl border px-3 py-2.5 text-left text-xs font-semibold shadow-sm transition xs:rounded-3xl xs:px-4 xs:py-3 xs:text-sm",
                  tone.base,
                  tone.hover,
                  showResult && tone.result
                )}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {showResult && correct && (
                    <Check className="h-3.5 w-3.5 text-emerald-500 xs:h-4 xs:w-4" />
                  )}
                  {showResult && selected && !isCorrect && (
                    <X className="h-3.5 w-3.5 text-rose-500 xs:h-4 xs:w-4" />
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
            className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#4063bb] to-[#2d4c9b] px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-[#2d4c9b33] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 xs:mt-5 xs:px-5 xs:py-3 xs:text-sm"
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
    <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-900/90 xs:rounded-3xl xs:p-5">
      <header className="mb-4 xs:mb-5">
        <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-zinc-400 xs:text-[10px]">
          Điền từ
        </p>
        <h3 className="mt-1.5 text-lg font-semibold text-zinc-900 xs:mt-2 xs:text-xl dark:text-zinc-50">
          {question.question}
        </h3>
      </header>
      <input
        type="text"
        value={selectedAnswer ?? ""}
        onChange={(event) => !showResult && onSelectAnswer(event.target.value)}
        disabled={showResult}
        placeholder="Nhập đáp án..."
        className="
    w-full 
    rounded-2xl 
    border border-slate-200/70 
    bg-white 
    px-3.5 
    py-2.5 
    text-[13px] 
    text-slate-900 
    outline-none 
    transition 

    placeholder:text-[12px] 
    placeholder:text-slate-400

    focus:border-[#4063bb] 
    focus:ring-2 
    focus:ring-[#4063bb1f] 

    disabled:opacity-60

    xs:rounded-3xl 
    xs:px-4 
    xs:py-3 
    xs:text-sm 
    dark:border-zinc-700 
    dark:bg-zinc-900 
    dark:text-zinc-50 
    dark:placeholder:text-zinc-500
  "
      />
      {!showResult ? (
        <button
          onClick={onSubmit}
          disabled={!selectedAnswer?.trim()}
          className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#4063bb] to-[#2d4c9b] px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-[#2d4c9b33] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 xs:mt-5 xs:px-5 xs:py-3 xs:text-sm"
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
        ? "border-[#4063bb] bg-[#4063bb]/10 text-[#4063bb] dark:border-sky-400 dark:bg-sky-500/10 dark:text-sky-300"
        : "border-slate-200/80 bg-white text-slate-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200",
      hover: "hover:-translate-y-0.5 hover:border-[#4063bb]",
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
    base: "border-slate-200/80 bg-white/50 text-slate-400 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-500",
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
    <div className="mt-4 space-y-3 xs:mt-5 xs:space-y-4">
      <div
        className={cn(
          "rounded-2xl border px-3 py-2.5 text-xs font-semibold xs:rounded-3xl xs:px-4 xs:py-3 xs:text-sm",
          isCorrect
            ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300"
            : "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300"
        )}
      >
        {isCorrect ? "Chính xác!" : `Đáp án đúng: ${correctAnswer}`}
      </div>
      <button
        onClick={onNext}
        className="inline-flex w-full items-center justify-center rounded-2xl border border-[#4063bb]/30 bg-gradient-to-r from-[#4063bb] to-[#2d4c9b] px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-[#2d4c9b33] transition hover:brightness-110 xs:px-4 xs:py-3 xs:text-sm"
      >
        Câu tiếp theo
      </button>
    </div>
  );
}
