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
    <div className="w-full max-w-2xl mx-auto">
      {/* Main action buttons - Remember / Not Yet */}
      {isFlipped && (
        <div className="flex items-center justify-center gap-3 mb-6">
          <button
            onClick={onNotYet}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-all shadow-sm hover:shadow-md"
          >
            <X className="w-5 h-5" />
            <span>Chưa nhớ</span>
          </button>
          <button
            onClick={onRemember}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold transition-all shadow-sm hover:shadow-md"
          >
            <Check className="w-5 h-5" />
            <span>Đã nhớ</span>
          </button>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Trước</span>
        </button>

        <button
          onClick={onNext}
          disabled={!canGoNext}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Sau</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="mt-6 text-center">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Mẹo: Nhấn <kbd className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-700 text-xs">Space</kbd> để lật,{" "}
          <kbd className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-700 text-xs">←</kbd> Trước,{" "}
          <kbd className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-700 text-xs">→</kbd> Sau
        </p>
      </div>
    </div>
  );
}
