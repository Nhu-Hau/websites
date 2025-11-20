// frontend/src/components/features/vocabulary/FlashcardControls.tsx
"use client";

import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";

interface FlashcardControlsProps {
  onPrevious: () => void;
  onNext: () => void;
  onRemember: () => void;
  onNotYet: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  isFlipped: boolean;
}

export function FlashcardControls({
  onPrevious,
  onNext,
  onRemember,
  onNotYet,
  canGoPrevious,
  canGoNext,
  isFlipped,
}: FlashcardControlsProps) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200/80 px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:-translate-y-0.5 hover:border-zinc-300 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200"
          >
            <ChevronLeft className="h-4 w-4" />
            Trước
          </button>
          <button
            onClick={onNext}
            disabled={!canGoNext}
            className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200/80 px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:-translate-y-0.5 hover:border-zinc-300 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200"
          >
            Sau
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={onNotYet}
            disabled={!isFlipped}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-200/80 bg-amber-50/80 px-5 py-3 text-sm font-semibold text-amber-700 transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300 sm:w-auto"
          >
            <X className="h-4 w-4" />
            Chưa nhớ
          </button>
          <button
            onClick={onRemember}
            disabled={!isFlipped}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-400 dark:text-emerald-950 sm:w-auto"
          >
            <Check className="h-4 w-4" />
            Đã nhớ
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-xs uppercase tracking-[0.4em] text-zinc-400">
        Phím tắt: Space để lật, ← / → để di chuyển
      </p>
    </div>
  );
}
