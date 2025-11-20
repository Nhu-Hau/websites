// frontend/src/components/features/vocabulary/VocabularySetSkeleton.tsx
"use client";

export function VocabularySetSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-[32px] border border-zinc-200/80 bg-white/90 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/80"
        >
          <div className="space-y-4">
            <div className="h-5 w-32 rounded-full bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-6 w-4/5 rounded-full bg-zinc-200/80 dark:bg-zinc-700" />
            <div className="h-4 w-full rounded-full bg-zinc-200/60 dark:bg-zinc-800/70" />
            <div className="h-4 w-3/5 rounded-full bg-zinc-200/60 dark:bg-zinc-800/70" />
            <div className="h-24 rounded-3xl border border-dashed border-zinc-200/80 bg-zinc-50/70 dark:border-zinc-800/60 dark:bg-zinc-900/60" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-11 rounded-2xl bg-zinc-200/80 dark:bg-zinc-800/80" />
              <div className="h-11 rounded-2xl bg-zinc-100/80 dark:bg-zinc-800/60" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
