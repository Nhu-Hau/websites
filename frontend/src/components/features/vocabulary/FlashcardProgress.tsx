// frontend/src/components/features/vocabulary/FlashcardProgress.tsx
"use client";

interface FlashcardProgressProps {
  current: number;
  total: number;
  progress: number;
  remembered: number;
  notYet: number;
}

export function FlashcardProgress({
  current,
  total,
  progress,
  remembered,
  notYet,
}: FlashcardProgressProps) {
  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            {current} / {total}
          </span>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            Remembered: <span className="font-semibold">{remembered}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            Not yet: <span className="font-semibold">{notYet}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
