// frontend/src/components/features/vocabulary/VocabularySetSkeleton.tsx
"use client";

export function VocabularySetSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div
          key={item}
          className="animate-pulse rounded-2xl border border-white/80 bg-white/90 p-3 shadow-sm xs:rounded-3xl xs:p-4 dark:border-zinc-800/60 dark:bg-zinc-900/90"
        >
          <div className="space-y-3">
            <div className="h-5 w-32 rounded-full bg-slate-100 dark:bg-zinc-800" />
            <div className="h-6 w-4/5 rounded-full bg-slate-200/80 dark:bg-zinc-700" />
            <div className="h-4 w-full rounded-full bg-slate-200/60 dark:bg-zinc-800/70" />
            <div className="h-4 w-3/5 rounded-full bg-slate-200/60 dark:bg-zinc-800/70" />
            <div className="h-20 rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/70 dark:border-zinc-800/60 dark:bg-zinc-900/60" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-8 rounded-2xl bg-slate-200/80 dark:bg-zinc-800/80" />
              <div className="h-8 rounded-2xl bg-slate-100/80 dark:bg-zinc-800/60" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
