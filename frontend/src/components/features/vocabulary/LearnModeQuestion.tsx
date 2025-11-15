// frontend/src/components/features/vocabulary/LearnModeQuestion.tsx
"use client";

import { LearnModeQuestion } from "@/features/vocabulary/types/vocabulary.types";
import { Check, X } from "lucide-react";

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
      <div className="w-full max-w-2xl mx-auto">
        <div className="rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-8 shadow-sm">
          {/* Question */}
          <div className="mb-8">
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">
              Trắc nghiệm
            </p>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
              {question.question}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {question.options?.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isCorrectOption = option === question.correctAnswer;

              let buttonClass =
                "w-full text-left px-6 py-4 rounded-lg border-2 transition-all font-semibold ";

              if (showResult) {
                if (isCorrectOption) {
                  buttonClass +=
                    "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300";
                } else if (isSelected && !isCorrect) {
                  buttonClass +=
                    "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300";
                } else {
                  buttonClass +=
                    "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400";
                }
              } else {
                if (isSelected) {
                  buttonClass +=
                    "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-700 text-zinc-900 dark:text-white";
                } else {
                  buttonClass +=
                    "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-700 dark:text-zinc-300";
                }
              }

              return (
                <button
                  key={index}
                  onClick={() => !showResult && onSelectAnswer(option)}
                  disabled={showResult}
                  className={buttonClass}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {showResult && isCorrectOption && (
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Action button */}
          {!showResult ? (
            <button
              onClick={onSubmit}
              disabled={!selectedAnswer}
              className="w-full px-6 py-3 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Nộp câu trả lời
            </button>
          ) : (
            <div>
              {/* Result message */}
              <div
                className={`mb-4 p-4 rounded-lg ${
                  isCorrect
                    ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                }`}
              >
                <p
                  className={`font-semibold ${
                    isCorrect
                      ? "text-green-800 dark:text-green-300"
                      : "text-red-800 dark:text-red-300"
                  }`}
                >
                  {isCorrect ? "✓ Đúng!" : "✗ Sai"}
                </p>
                {!isCorrect && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    Đáp án đúng là: <strong>{question.correctAnswer}</strong>
                  </p>
                )}
              </div>

              <button
                onClick={onNext}
                className="w-full px-6 py-3 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold hover:shadow-md transition-all"
              >
                Câu hỏi tiếp theo
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fill in the blank
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-8 shadow-sm">
        {/* Question */}
        <div className="mb-8">
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">
              Điền vào chỗ trống
            </p>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
            {question.question}
          </h2>
        </div>

        {/* Input */}
        <div className="mb-8">
          <input
            type="text"
            value={selectedAnswer || ""}
            onChange={(e) => !showResult && onSelectAnswer(e.target.value)}
            disabled={showResult}
            placeholder="Nhập câu trả lời của bạn..."
            className="w-full px-6 py-4 rounded-lg border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder-zinc-400 focus:ring-2 focus:ring-zinc-500 focus:border-zinc-500 outline-none disabled:opacity-50 transition-all"
          />
        </div>

        {/* Action button */}
        {!showResult ? (
          <button
            onClick={onSubmit}
            disabled={!selectedAnswer || selectedAnswer.trim() === ""}
            className="w-full px-6 py-3 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Answer
          </button>
        ) : (
          <div>
            {/* Result message */}
            <div
              className={`mb-4 p-4 rounded-lg ${
                isCorrect
                  ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
              }`}
            >
              <p
                className={`font-semibold ${
                  isCorrect
                    ? "text-green-800 dark:text-green-300"
                    : "text-red-800 dark:text-red-300"
                }`}
              >
                {isCorrect ? "✓ Correct!" : "✗ Incorrect"}
              </p>
              {!isCorrect && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  The correct answer is: <strong>{question.correctAnswer}</strong>
                </p>
              )}
            </div>

            <button
              onClick={onNext}
              className="w-full px-6 py-3 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold hover:shadow-md transition-all"
            >
              Next Question
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
