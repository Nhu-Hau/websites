// frontend/src/components/features/vocabulary/VocabularySetSkeleton.tsx
"use client";

export function VocabularySetSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-6 animate-pulse"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
            <div className="flex-1 min-w-0 space-y-3">
              <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-full" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
